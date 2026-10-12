import { z } from "zod";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Routes } from "discord-api-types/v10";
import type { APIApplicationCommand, APIApplicationCommandOption } from "discord-api-types/v10";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getApplicationId, getRest } from "../discord.js";
import { addTool, preview } from "../register.js";
import { isDryRun, parseJsonValue } from "../util.js";

function commandRoute(applicationId: string, guildId?: string) {
  return guildId
    ? Routes.applicationGuildCommands(applicationId, guildId)
    : Routes.applicationCommands(applicationId);
}

function commandItemRoute(applicationId: string, commandId: string, guildId?: string) {
  return guildId
    ? Routes.applicationGuildCommand(applicationId, guildId, commandId)
    : Routes.applicationCommand(applicationId, commandId);
}

export function registerCommands(server: McpServer): void {
  addTool(
    server,
    "discord_list_commands",
    "List application slash commands (guild if guild_id is set, otherwise global).",
    {
      guild_id: z.string().optional().describe("Omit for global commands"),
    },
    async (args) => {
      const applicationId = await getApplicationId();
      const guildId = typeof args.guild_id === "string" ? args.guild_id : undefined;
      const commands = (await getRest().get(
        commandRoute(applicationId, guildId),
      )) as APIApplicationCommand[];
      return {
        scope: guildId ? "guild" : "global",
        guild_id: guildId ?? null,
        commands: commands.map((cmd) => ({
          id: cmd.id,
          name: cmd.name,
          description: cmd.description,
          type: cmd.type,
          options: cmd.options ?? [],
        })),
      };
    },
  );

  addTool(
    server,
    "discord_register_command",
    "Register or update a slash command via SlashCommandBuilder. Guild register is instant; global can take up to an hour.",
    {
      name: z.string().describe("Command name (lowercase)"),
      description: z.string(),
      guild_id: z.string().optional().describe("Guild id for guild command; omit for global"),
      options: z
        .union([z.string(), z.array(z.record(z.unknown()))])
        .optional()
        .describe("Discord API options array, or JSON string of that array"),
    },
    async (args) => {
      const builder = new SlashCommandBuilder()
        .setName(String(args.name))
        .setDescription(String(args.description));
      const body = builder.toJSON() as {
        name: string;
        description: string;
        options?: APIApplicationCommandOption[];
      };
      if (args.options !== undefined) {
        body.options = parseJsonValue(
          args.options as APIApplicationCommandOption[] | string,
        ) as APIApplicationCommandOption[];
      }
      const applicationId = await getApplicationId();
      const guildId = typeof args.guild_id === "string" ? args.guild_id : undefined;
      const created = (await getRest().post(commandRoute(applicationId, guildId), {
        body,
      })) as APIApplicationCommand;
      return {
        id: created.id,
        name: created.name,
        description: created.description,
        scope: guildId ? "guild" : "global",
        guild_id: guildId ?? null,
        options: created.options ?? [],
      };
    },
  );

  addTool(
    server,
    "discord_delete_command",
    "Delete an application command. dry_run defaults to true.",
    {
      command_id: z.string(),
      guild_id: z.string().optional(),
      dry_run: z.boolean().optional().describe("Default true"),
    },
    async (args) => {
      const applicationId = await getApplicationId();
      const guildId = typeof args.guild_id === "string" ? args.guild_id : undefined;
      const payload = {
        command_id: String(args.command_id),
        guild_id: guildId ?? null,
        scope: guildId ? "guild" : "global",
      };
      if (isDryRun(args.dry_run as boolean | undefined)) {
        return preview("DELETE application command", payload);
      }
      await getRest().delete(commandItemRoute(applicationId, payload.command_id, guildId));
      return { deleted: true, ...payload };
    },
  );
}
