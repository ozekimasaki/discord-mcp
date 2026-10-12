import { z } from "zod";
import { Routes, ChannelType } from "discord-api-types/v10";
import type {
  APIChannel,
  APIGuild,
  RESTGetAPICurrentUserGuildsResult,
} from "discord-api-types/v10";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRest } from "../discord.js";
import { addTool } from "../register.js";

function channelKind(type: number): string {
  switch (type) {
    case ChannelType.GuildText:
      return "text";
    case ChannelType.GuildVoice:
      return "voice";
    case ChannelType.GuildCategory:
      return "category";
    case ChannelType.GuildAnnouncement:
      return "announcement";
    case ChannelType.GuildForum:
      return "forum";
    case ChannelType.GuildStageVoice:
      return "stage";
    default:
      return `type_${type}`;
  }
}

export function registerDiscovery(server: McpServer): void {
  addTool(
    server,
    "discord_list_guilds",
    "List Discord servers (guilds) the bot is in. No Gateway required.",
    {},
    async () => {
      const guilds = (await getRest().get(
        Routes.userGuilds(),
      )) as RESTGetAPICurrentUserGuildsResult;
      return guilds.map((g) => ({
        id: g.id,
        name: g.name,
        owner: g.owner,
        permissions: g.permissions,
      }));
    },
  );

  addTool(
    server,
    "discord_get_guild",
    "Get a guild by id (name, owner, features, counts when available).",
    {
      guild_id: z.string().describe("Guild snowflake"),
    },
    async (args) => {
      const guildId = String(args.guild_id);
      const guild = (await getRest().get(Routes.guild(guildId), {
        query: new URLSearchParams({ with_counts: "true" }),
      })) as APIGuild;
      return {
        id: guild.id,
        name: guild.name,
        owner_id: guild.owner_id,
        description: guild.description,
        preferred_locale: guild.preferred_locale,
        features: guild.features,
        approximate_member_count: guild.approximate_member_count,
        approximate_presence_count: guild.approximate_presence_count,
        premium_tier: guild.premium_tier,
        verification_level: guild.verification_level,
      };
    },
  );

  addTool(
    server,
    "discord_list_channels",
    "List channels in a guild, grouped by category.",
    {
      guild_id: z.string().describe("Guild snowflake"),
    },
    async (args) => {
      const guildId = String(args.guild_id);
      const channels = (await getRest().get(
        Routes.guildChannels(guildId),
      )) as APIChannel[];
      const summarized = channels.map((ch) => ({
        id: ch.id,
        name: "name" in ch ? ch.name : null,
        type: channelKind(ch.type),
        type_id: ch.type,
        parent_id: "parent_id" in ch ? (ch.parent_id ?? null) : null,
        position: "position" in ch ? (ch.position ?? null) : null,
        topic: "topic" in ch ? (ch.topic ?? null) : null,
      }));
      summarized.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      return summarized;
    },
  );

  addTool(
    server,
    "discord_find_channel",
    "Find channels in a guild by partial name (case-insensitive).",
    {
      guild_id: z.string().describe("Guild snowflake"),
      name: z.string().describe("Partial channel name"),
    },
    async (args) => {
      const guildId = String(args.guild_id);
      const needle = String(args.name).toLowerCase();
      const channels = (await getRest().get(
        Routes.guildChannels(guildId),
      )) as APIChannel[];
      return channels
        .filter((ch) => "name" in ch && ch.name?.toLowerCase().includes(needle))
        .map((ch) => ({
          id: ch.id,
          name: "name" in ch ? ch.name : null,
          type: channelKind(ch.type),
          parent_id: "parent_id" in ch ? (ch.parent_id ?? null) : null,
        }));
    },
  );
}
