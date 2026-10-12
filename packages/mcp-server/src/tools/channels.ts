import { z } from "zod";
import { ChannelType, Routes } from "discord-api-types/v10";
import type { APIChannel } from "discord-api-types/v10";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRest } from "../discord.js";
import { addTool, preview } from "../register.js";
import { isDryRun } from "../util.js";

const KIND_TO_TYPE = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  category: ChannelType.GuildCategory,
} as const;

export function registerChannels(server: McpServer): void {
  addTool(
    server,
    "discord_create_channel",
    "Create a text, voice, or category channel in a guild.",
    {
      guild_id: z.string(),
      name: z.string().describe("Channel name"),
      type: z.enum(["text", "voice", "category"]).describe("Channel kind"),
      parent_id: z.string().optional().describe("Category id for text/voice"),
      topic: z.string().optional(),
    },
    async (args) => {
      const type = KIND_TO_TYPE[args.type as keyof typeof KIND_TO_TYPE];
      const body: Record<string, unknown> = {
        name: String(args.name),
        type,
      };
      if (args.parent_id) body.parent_id = args.parent_id;
      if (args.topic) body.topic = args.topic;
      const channel = (await getRest().post(Routes.guildChannels(String(args.guild_id)), {
        body,
      })) as APIChannel;
      return {
        id: channel.id,
        name: "name" in channel ? channel.name : null,
        type: channel.type,
        parent_id: "parent_id" in channel ? (channel.parent_id ?? null) : null,
      };
    },
  );

  addTool(
    server,
    "discord_edit_channel",
    "Edit a channel name, topic, nsfw, slowmode, or parent category.",
    {
      channel_id: z.string(),
      name: z.string().optional(),
      topic: z.string().optional(),
      nsfw: z.boolean().optional(),
      rate_limit_per_user: z.number().int().min(0).max(21600).optional(),
      parent_id: z.string().nullable().optional(),
    },
    async (args) => {
      const body: Record<string, unknown> = {};
      if (args.name !== undefined) body.name = args.name;
      if (args.topic !== undefined) body.topic = args.topic;
      if (args.nsfw !== undefined) body.nsfw = args.nsfw;
      if (args.rate_limit_per_user !== undefined) {
        body.rate_limit_per_user = args.rate_limit_per_user;
      }
      if (args.parent_id !== undefined) body.parent_id = args.parent_id;
      const channel = (await getRest().patch(Routes.channel(String(args.channel_id)), {
        body,
      })) as APIChannel;
      return {
        id: channel.id,
        name: "name" in channel ? channel.name : null,
        type: channel.type,
        topic: "topic" in channel ? (channel.topic ?? null) : null,
      };
    },
  );

  addTool(
    server,
    "discord_delete_channel",
    "Delete a channel. dry_run defaults to true; set dry_run:false only to apply.",
    {
      channel_id: z.string(),
      dry_run: z.boolean().optional().describe("Default true"),
    },
    async (args) => {
      const channelId = String(args.channel_id);
      if (isDryRun(args.dry_run as boolean | undefined)) {
        return preview("DELETE /channels/{channel.id}", { channel_id: channelId });
      }
      const channel = (await getRest().delete(Routes.channel(channelId))) as APIChannel;
      return { deleted: true, id: channel.id, name: "name" in channel ? channel.name : null };
    },
  );
}
