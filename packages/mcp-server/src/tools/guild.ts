import { z } from "zod";
import { Routes } from "discord-api-types/v10";
import type { APIGuild } from "discord-api-types/v10";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRest } from "../discord.js";
import { addTool, preview } from "../register.js";
import { isDryRun, toImageDataUri } from "../util.js";

export function registerGuild(server: McpServer): void {
  addTool(
    server,
    "discord_edit_guild",
    "Edit guild name and optional icon. dry_run defaults to true.",
    {
      guild_id: z.string(),
      name: z.string().optional(),
      icon: z.string().optional().describe("Image file path or data URI"),
      dry_run: z.boolean().optional().describe("Default true"),
    },
    async (args) => {
      const body: Record<string, unknown> = {};
      if (args.name !== undefined) body.name = args.name;
      if (typeof args.icon === "string") {
        body.icon = await toImageDataUri(args.icon);
      }
      if (Object.keys(body).length === 0) {
        throw new Error("Provide name and/or icon");
      }
      const payload = {
        guild_id: String(args.guild_id),
        name: body.name ?? null,
        icon: typeof args.icon === "string" ? "(image provided, not echoed)" : null,
      };
      if (isDryRun(args.dry_run as boolean | undefined)) {
        return preview("PATCH /guilds/{guild.id}", payload);
      }
      const guild = (await getRest().patch(Routes.guild(String(args.guild_id)), {
        body,
      })) as APIGuild;
      return { id: guild.id, name: guild.name };
    },
  );
}
