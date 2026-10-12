import { z } from "zod";
import { Routes } from "discord-api-types/v10";
import type { APIMessage } from "discord-api-types/v10";
import { time, TimestampStyles, userMention } from "@discordjs/formatters";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRest } from "../discord.js";
import { addTool, preview } from "../register.js";
import { buildEmbed, isDryRun, loadFiles, type EmbedInput } from "../util.js";

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

function summarizeMessage(message: APIMessage) {
  const created = Math.floor(Number(BigInt(message.id) >> 22n) + 1420070400000) / 1000;
  return {
    id: message.id,
    channel_id: message.channel_id,
    author: message.author
      ? {
          id: message.author.id,
          username: message.author.username,
          mention: userMention(message.author.id),
        }
      : null,
    timestamp: time(Math.floor(created), TimestampStyles.ShortDateTime),
    text: message.content,
    embeds: message.embeds?.length ?? 0,
    attachments: (message.attachments ?? []).map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url,
    })),
  };
}

function embedsFrom(raw: unknown): ReturnType<typeof buildEmbed>[] | undefined {
  if (!raw) return undefined;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((item) => buildEmbed(item as EmbedInput));
}

export function registerMessages(server: McpServer): void {
  addTool(
    server,
    "discord_read_messages",
    "Read recent messages in a channel (REST). Requires Message Content intent in the portal to see others' content.",
    {
      channel_id: z.string().describe("Channel snowflake"),
      limit: z.number().int().min(1).max(100).optional().describe("1-100, default 50"),
      before: z.string().optional().describe("Read before this message id"),
      after: z.string().optional().describe("Read after this message id"),
    },
    async (args) => {
      const query = new URLSearchParams({
        limit: String(typeof args.limit === "number" ? args.limit : 50),
      });
      if (typeof args.before === "string") query.set("before", args.before);
      if (typeof args.after === "string") query.set("after", args.after);
      const messages = (await getRest().get(Routes.channelMessages(String(args.channel_id)), {
        query,
      })) as APIMessage[];
      return messages.map(summarizeMessage);
    },
  );

  addTool(
    server,
    "discord_send_message",
    "Post a message. Optional embeds and file attachments.",
    {
      channel_id: z.string().describe("Channel snowflake"),
      content: z.string().optional().describe("Message text"),
      embeds: z.array(embedInput).optional().describe("Embed payloads built with EmbedBuilder"),
      files: z.array(z.string()).optional().describe("Local file paths to attach"),
    },
    async (args) => {
      const files = await loadFiles(args.files as string[] | undefined);
      const embeds = embedsFrom(args.embeds);
      if (!args.content && !embeds?.length && !files?.length) {
        throw new Error("Provide content, embeds, and/or files");
      }
      const message = (await getRest().post(Routes.channelMessages(String(args.channel_id)), {
        body: {
          content: args.content ?? undefined,
          embeds,
        },
        files,
      })) as APIMessage;
      return summarizeMessage(message);
    },
  );

  addTool(
    server,
    "discord_reply_message",
    "Reply to a message in a channel, with optional file attachments.",
    {
      channel_id: z.string(),
      message_id: z.string(),
      content: z.string().optional(),
      embeds: z.array(embedInput).optional(),
      files: z.array(z.string()).optional().describe("Local file paths to attach"),
    },
    async (args) => {
      const files = await loadFiles(args.files as string[] | undefined);
      const embeds = embedsFrom(args.embeds);
      if (!args.content && !embeds?.length && !files?.length) {
        throw new Error("Provide content, embeds, and/or files");
      }
      const message = (await getRest().post(Routes.channelMessages(String(args.channel_id)), {
        body: {
          content: args.content ?? undefined,
          embeds,
          message_reference: {
            message_id: String(args.message_id),
            fail_if_not_exists: false,
          },
        },
        files,
      })) as APIMessage;
      return summarizeMessage(message);
    },
  );

  addTool(
    server,
    "discord_edit_message",
    "Edit a message previously sent by the bot.",
    {
      channel_id: z.string(),
      message_id: z.string(),
      content: z.string().optional(),
      embeds: z.array(embedInput).optional(),
    },
    async (args) => {
      const body: Record<string, unknown> = {};
      if (args.content !== undefined) body.content = args.content;
      if (args.embeds !== undefined) body.embeds = embedsFrom(args.embeds);
      const message = (await getRest().patch(
        Routes.channelMessage(String(args.channel_id), String(args.message_id)),
        { body },
      )) as APIMessage;
      return summarizeMessage(message);
    },
  );

  addTool(
    server,
    "discord_delete_message",
    "Delete a message. dry_run defaults to true; set dry_run:false only to apply.",
    {
      channel_id: z.string(),
      message_id: z.string(),
      dry_run: z.boolean().optional().describe("Default true"),
    },
    async (args) => {
      const payload = {
        channel_id: String(args.channel_id),
        message_id: String(args.message_id),
      };
      if (isDryRun(args.dry_run as boolean | undefined)) {
        return preview("DELETE /channels/{channel.id}/messages/{message.id}", payload);
      }
      await getRest().delete(Routes.channelMessage(payload.channel_id, payload.message_id));
      return { deleted: true, ...payload };
    },
  );

  addTool(
    server,
    "discord_send_embed",
    "Post a rich embed. Optional text content above it.",
    {
      channel_id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      color: z.union([z.string(), z.number()]).optional().describe("Hex string or integer"),
      fields: z.array(embedField).optional(),
      footer: z
        .union([z.string(), z.object({ text: z.string(), icon_url: z.string().optional() })])
        .optional(),
      content: z.string().optional().describe("Optional text above the embed"),
    },
    async (args) => {
      const embed = buildEmbed({
        title: args.title as string | undefined,
        description: args.description as string | undefined,
        color: args.color as string | number | undefined,
        fields: args.fields as EmbedInput["fields"],
        footer: args.footer as EmbedInput["footer"],
      });
      const message = (await getRest().post(Routes.channelMessages(String(args.channel_id)), {
        body: {
          content: args.content ?? undefined,
          embeds: [embed],
        },
      })) as APIMessage;
      return summarizeMessage(message);
    },
  );
}
