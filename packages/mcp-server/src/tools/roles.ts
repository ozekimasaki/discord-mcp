import { z } from "zod";
import { Routes } from "discord-api-types/v10";
import type { APIRole } from "discord-api-types/v10";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRest } from "../discord.js";
import { addTool } from "../register.js";
import { parseColor } from "../util.js";

export function registerRoles(server: McpServer): void {
  addTool(
    server,
    "discord_list_roles",
    "List roles in a guild (name, id, color, permissions, position).",
    {
      guild_id: z.string(),
    },
    async (args) => {
      const roles = (await getRest().get(
        Routes.guildRoles(String(args.guild_id)),
      )) as APIRole[];
      return roles
        .slice()
        .sort((a, b) => b.position - a.position)
        .map((role) => ({
          id: role.id,
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          mentionable: role.mentionable,
          permissions: role.permissions,
          position: role.position,
          managed: role.managed,
        }));
    },
  );

  addTool(
    server,
    "discord_create_role",
    "Create a guild role.",
    {
      guild_id: z.string(),
      name: z.string(),
      color: z.union([z.string(), z.number()]).optional(),
      hoist: z.boolean().optional(),
      mentionable: z.boolean().optional(),
      permissions: z.string().optional().describe("Permission bitfield as decimal string"),
    },
    async (args) => {
      const body: Record<string, unknown> = { name: String(args.name) };
      const color = parseColor(args.color as string | number | undefined);
      if (color !== undefined) body.color = color;
      if (args.hoist !== undefined) body.hoist = args.hoist;
      if (args.mentionable !== undefined) body.mentionable = args.mentionable;
      if (args.permissions !== undefined) body.permissions = args.permissions;
      const role = (await getRest().post(Routes.guildRoles(String(args.guild_id)), {
        body,
      })) as APIRole;
      return {
        id: role.id,
        name: role.name,
        color: role.color,
        permissions: role.permissions,
      };
    },
  );

  addTool(
    server,
    "discord_add_role",
    "Add a role to a member.",
    {
      guild_id: z.string(),
      user_id: z.string(),
      role_id: z.string(),
    },
    async (args) => {
      await getRest().put(
        Routes.guildMemberRole(
          String(args.guild_id),
          String(args.user_id),
          String(args.role_id),
        ),
      );
      return {
        added: true,
        guild_id: args.guild_id,
        user_id: args.user_id,
        role_id: args.role_id,
      };
    },
  );

  addTool(
    server,
    "discord_remove_role",
    "Remove a role from a member.",
    {
      guild_id: z.string(),
      user_id: z.string(),
      role_id: z.string(),
    },
    async (args) => {
      await getRest().delete(
        Routes.guildMemberRole(
          String(args.guild_id),
          String(args.user_id),
          String(args.role_id),
        ),
      );
      return {
        removed: true,
        guild_id: args.guild_id,
        user_id: args.user_id,
        role_id: args.role_id,
      };
    },
  );
}
