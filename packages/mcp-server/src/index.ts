#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAutoMod } from "./tools/automod.js";
import { registerChannels } from "./tools/channels.js";
import { registerCommands } from "./tools/commands.js";
import { registerDiscovery } from "./tools/discovery.js";
import { registerDm } from "./tools/dm.js";
import { registerEmoji } from "./tools/emoji.js";
import { registerGuild } from "./tools/guild.js";
import { registerMessages } from "./tools/messages.js";
import { registerRoles } from "./tools/roles.js";
import { registerWebhooks } from "./tools/webhooks.js";

const server = new McpServer({
  name: "discord",
  version: "1.0.0",
});

registerDiscovery(server);
registerMessages(server);
registerChannels(server);
registerRoles(server);
registerWebhooks(server);
registerCommands(server);
registerEmoji(server);
registerAutoMod(server);
registerGuild(server);
registerDm(server);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("discord MCP server ready (stdio, REST only)");
