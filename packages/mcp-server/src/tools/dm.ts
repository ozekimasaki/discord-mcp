import { z } from "zod";
import { Routes } from "discord-api-types/v10";
import type { APIChannel, APIMessage } from "discord-api-types/v10";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDmRest as getRest } from "../discord.js";
import { addTool } from "../register.js";
import { buildEmbed, loadFiles, type EmbedInput } from "../util.js";

const embedField = z.object({
  name: z.string(),
  value: z.string(),
  inline: z.boolean().optional(),
});

const embedInput = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.union([z.string(), z.number()]).optional(),
  fields: z.array(embedField).optional(),
  footer: z
    .union([z.string(), z.object({ text: z.string(), icon_url: z.string().optional() })])
    .optional(),
  url: z.string().optional(),
});

function embedsFrom(raw: unknown): ReturnType<typeof buildEmbed>[] | undefined {
  if (!raw) return undefined;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((item) => buildEmbed(item as EmbedInput));
}

async function openDm(userId: string): Promise<APIChannel> {
  return (await getRest().post(Routes.userChannels(), {
    body: { recipient_id: userId },
  })) as APIChannel;
}

export function registerDm(server: McpServer): void {
  addTool(
    server,
    "discord_open_dm",
    "Open (or fetch) a DM channel with a user. Bots can only DM users who share a server, or who already messaged the bot.",
    {
      user_id: z.string().describe("Recipient user snowflake"),
    },
    async (args) => {
      const channel = await openDm(String(args.user_id));
      return { channel_id: channel.id, type: channel.type, recipient_id: String(args.user_id) };
    },
  );

  addTool(
    server,
    "discord_send_dm",
    "Send a DM to a user (opens the DM channel first). Optional embeds and file attachments.",
    {
      user_id: z.string().describe("Recipient user snowflake"),
      content: z.string().optional().describe("Message text"),
      embeds: z.array(embedInput).optional(),
      files: z.array(z.string()).optional().describe("Local file paths to attach"),
    },
    async (args) => {
      const files = await loadFiles(args.files as string[] | undefined);
      const embeds = embedsFrom(args.embeds);
      if (!args.content && !embeds?.length && !files?.length) {
        throw new Error("Provide content, embeds, and/or files");
      }
      const channel = await openDm(String(args.user_id));
      const message = (await getRest().post(Routes.channelMessages(channel.id), {
        body: {
          content: args.content ?? undefined,
          embeds,
        },
        files,
      })) as APIMessage;
      return {
        channel_id: channel.id,
        message_id: message.id,
        recipient_id: String(args.user_id),
        text: message.content,
      };
    },
  );

  addTool(
    server,
    "discord_send_dm_embed",
    "Send a rich embed DM to a user.",
    {
      user_id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      color: z.union([z.string(), z.number()]).optional(),
      fields: z.array(embedField).optional(),
      footer: z
        .union([z.string(), z.object({ text: z.string(), icon_url: z.string().optional() })])
        .optional(),
      content: z.string().optional(),
    },
    async (args) => {
      const embed = buildEmbed({
        title: args.title as string | undefined,
        description: args.description as string | undefined,
        color: args.color as string | number | undefined,
        fields: args.fields as EmbedInput["fields"],
        footer: args.footer as EmbedInput["footer"],
      });
      const channel = await openDm(String(args.user_id));
      const message = (await getRest().post(Routes.channelMessages(channel.id), {
        body: {
          content: args.content ?? undefined,
          embeds: [embed],
        },
      })) as APIMessage;
      return {
        channel_id: channel.id,
        message_id: message.id,
        recipient_id: String(args.user_id),
      };
    },
  );

  addTool(
    server,
    "discord_read_dms",
    "Read recent messages in a DM. Pass user_id (opens/fetches the DM) or channel_id. Optional after = message id to return only newer messages. Newest first.",
    {
      user_id: z.string().optional(),
      channel_id: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
      after: z.string().optional().describe("Only messages newer than this message id"),
    },
    async (args) => {
      let channelId = args.channel_id ? String(args.channel_id) : undefined;
      if (!channelId && args.user_id) {
        const channel = await openDm(String(args.user_id));
        channelId = channel.id;
      }
      if (!channelId) throw new Error("Provide user_id or channel_id");
      const query = new URLSearchParams({
        limit: String(typeof args.limit === "number" ? args.limit : 50),
      });
      if (args.after) query.set("after", String(args.after));
      const messages = (await getRest().get(Routes.channelMessages(channelId), {
        query,
      })) as APIMessage[];
      return messages.map((message) => ({
        id: message.id,
        author_id: message.author?.id,
        timestamp: message.timestamp,
        content: message.content,
        attachments: (message.attachments ?? []).map((a) => ({
          filename: a.filename,
          url: a.url,
          content_type: a.content_type,
        })),
      }));
    },
  );
}
