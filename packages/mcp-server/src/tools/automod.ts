import { z } from "zod";
import { Routes } from "discord-api-types/v10";
import type { APIAutoModerationRule } from "discord-api-types/v10";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRest } from "../discord.js";
import { addTool } from "../register.js";

export function registerAutoMod(server: McpServer): void {
  addTool(
    server,
    "discord_list_automod_rules",
    "List AutoMod rules for a guild (REST GET /guilds/{id}/auto-moderation/rules).",
    {
      guild_id: z.string(),
    },
    async (args) => {
      const rules = (await getRest().get(
        Routes.guildAutoModerationRules(String(args.guild_id)),
      )) as APIAutoModerationRule[];
      return rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        event_type: rule.event_type,
        trigger_type: rule.trigger_type,
        enabled: rule.enabled,
        creator_id: rule.creator_id,
        actions: rule.actions,
        exempt_roles: rule.exempt_roles,
        exempt_channels: rule.exempt_channels,
      }));
    },
  );
}
