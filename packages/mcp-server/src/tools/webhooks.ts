import { z } from "zod";
import { Routes } from "discord-api-types/v10";
import type { APIMessage, APIWebhook } from "discord-api-types/v10";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRest } from "../discord.js";
import { addTool } from "../register.js";
import { buildEmbed, loadFiles, type EmbedInput } from "../util.js";

const embedInput = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.union([z.string(), z.number()]).optional(),
  fields: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        inline: z.boolean().optional(),
      }),
    )
    .optional(),
  footer: z
    .union([z.string(), z.object({ text: z.string(), icon_url: z.string().optional() })])
    .optional(),
  url: z.string().optional(),
});

function publicWebhook(hook: APIWebhook) {
  return {
    id: hook.id,
    name: hook.name,
    channel_id: hook.channel_id,
    guild_id: hook.guild_id ?? null,
    application_id: hook.application_id,
    type: hook.type,
  };
}

function parseWebhookRef(args: Record<string, unknown>): { id: string; token?: string } {
  if (typeof args.webhook_url === "string") {
    const match = args.webhook_url.match(/webhooks\/(\d+)\/([^/?]+)/);
    if (!match) throw new Error("Invalid webhook_url");
    return { id: match[1], token: match[2] };
  }
  if (typeof args.webhook_id === "string") {
    return {
      id: args.webhook_id,
      token: typeof args.webhook_token === "string" ? args.webhook_token : undefined,
    };
  }
  throw new Error("Provide webhook_id or webhook_url");
}

async function resolveWebhookToken(id: string, token?: string): Promise<string> {
  if (token) return token;
  const hook = (await getRest().get(Routes.webhook(id))) as APIWebhook;
  if (!hook.token) {
    throw new Error("Webhook token is not available to this bot (need Manage Webhooks).");
  }
  return hook.token;
}

export function registerWebhooks(server: McpServer): void {
  addTool(
    server,
    "discord_list_webhooks",
    "List webhooks for a guild or channel. Tokens are omitted.",
    {
      guild_id: z.string().optional(),
      channel_id: z.string().optional(),
    },
    async (args) => {
      if (args.channel_id) {
        const hooks = (await getRest().get(
          Routes.channelWebhooks(String(args.channel_id)),
        )) as APIWebhook[];
        return hooks.map(publicWebhook);
      }
      if (args.guild_id) {
        const hooks = (await getRest().get(
          Routes.guildWebhooks(String(args.guild_id)),
        )) as APIWebhook[];
        return hooks.map(publicWebhook);
      }
      throw new Error("Provide guild_id or channel_id");
    },
  );

  addTool(
    server,
    "discord_create_webhook",
    "Create a webhook on a channel. Token is not returned; send via discord_send_webhook with webhook_id.",
    {
      channel_id: z.string(),
      name: z.string().describe("Webhook display name"),
    },
    async (args) => {
      const hook = (await getRest().post(Routes.channelWebhooks(String(args.channel_id)), {
        body: { name: String(args.name) },
      })) as APIWebhook;
      return publicWebhook(hook);
    },
  );

  addTool(
    server,
    "discord_send_webhook",
    "Post via webhook (content / embeds / files).",
    {
      webhook_id: z.string().optional(),
      webhook_token: z.string().optional().describe("Optional; fetched via bot auth if omitted"),
      webhook_url: z.string().optional(),
      content: z.string().optional(),
      username: z.string().optional(),
      avatar_url: z.string().optional(),
      embeds: z.array(embedInput).optional(),
      files: z.array(z.string()).optional(),
    },
    async (args) => {
      const ref = parseWebhookRef(args);
      const token = await resolveWebhookToken(ref.id, ref.token);
      const files = await loadFiles(args.files as string[] | undefined);
      const embeds = Array.isArray(args.embeds)
        ? (args.embeds as EmbedInput[]).map((e) => buildEmbed(e))
        : undefined;
      if (!args.content && !embeds?.length && !files?.length) {
        throw new Error("Provide content, embeds, and/or files");
      }
      const message = (await getRest().post(Routes.webhook(ref.id, token), {
        body: {
          content: args.content ?? undefined,
          username: args.username ?? undefined,
          avatar_url: args.avatar_url ?? undefined,
          embeds,
        },
        files,
        auth: false,
        query: new URLSearchParams({ wait: "true" }),
      })) as APIMessage;
      return {
        id: message.id,
        channel_id: message.channel_id,
        content: message.content,
        webhook_id: ref.id,
      };
    },
  );
}
