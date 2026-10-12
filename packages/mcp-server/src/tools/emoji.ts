import { z } from "zod";
import { Routes } from "discord-api-types/v10";
import type { APIEmoji } from "discord-api-types/v10";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRest } from "../discord.js";
import { addTool } from "../register.js";
import { toImageDataUri } from "../util.js";

function publicEmoji(emoji: APIEmoji) {
  return {
    id: emoji.id,
    name: emoji.name,
    animated: emoji.animated ?? false,
    available: emoji.available ?? true,
    managed: emoji.managed ?? false,
  };
}

export function registerEmoji(server: McpServer): void {
  addTool(
    server,
    "discord_list_emojis",
    "List custom emoji in a guild.",
    {
      guild_id: z.string(),
    },
    async (args) => {
      const emojis = (await getRest().get(
        Routes.guildEmojis(String(args.guild_id)),
      )) as APIEmoji[];
      return emojis.map(publicEmoji);
    },
  );

  addTool(
    server,
    "discord_create_emoji",
    "Create a guild emoji from a local image path or data URI (REST POST /guilds/{id}/emojis).",
    {
      guild_id: z.string(),
      name: z.string().describe("2-32 alphanumeric / underscore"),
      image: z.string().describe("File path or data:image/...;base64,... URI"),
    },
    async (args) => {
      const image = await toImageDataUri(String(args.image));
      const emoji = (await getRest().post(Routes.guildEmojis(String(args.guild_id)), {
        body: { name: String(args.name), image },
      })) as APIEmoji;
      return publicEmoji(emoji);
    },
  );
}
