# discord-mcp

Cursor plugin providing a Discord MCP server. Use MCP tools from Cursor to post/edit/reply to messages (with embeds/files), manage channels, roles, webhooks, slash commands, read guilds and more.

MCP uses REST only (no persistent Gateway login in the server process).

## Stack

- MCP: `@modelcontextprotocol/sdk` (stdio)
- Discord REST: `@discordjs/rest` + `discord-api-types` v10
- Builders: `@discordjs/builders` (Embed / Slash Command)
- Formatters: `@discordjs/formatters`
- Validation: zod

## Features / Tools

Discovery: `discord_list_guilds`, `discord_get_guild`, `discord_list_channels`, `discord_find_channel`

Messages: `discord_read_messages`, `discord_send_message`, `discord_reply_message`, `discord_edit_message`, `discord_delete_message`, `discord_send_embed`

Channels: `discord_create_channel`, `discord_edit_channel`, `discord_delete_channel`

Roles: `discord_list_roles`, `discord_create_role`, `discord_add_role`, `discord_remove_role`

Webhooks: `discord_list_webhooks`, `discord_create_webhook`, `discord_send_webhook`

Commands: `discord_list_commands`, `discord_register_command`, `discord_delete_command`

Emoji: `discord_list_emojis`, `discord_create_emoji`

AutoMod: `discord_list_automod_rules`

Guild: `discord_edit_guild`

DM tools: `discord_open_dm`, `discord_send_dm`, `discord_send_dm_embed`, `discord_read_dms` (use DM token or fallback)

Destructive tools default to dry_run. Follow your safety rules for applying changes.

## Installation

In Cursor: install the plugin. Configure tokens via Plugins > Configure (see below).

From source (after clone):

```
cd packages/mcp-server
npm ci
npm run build
```

## Configuration

Tokens are provided via Cursor plugin variables (never paste into chat):

- `DISCORD_TOKEN` (required): main bot token.
- `DISCORD_DM_TOKEN` (optional): separate token for DM tools; falls back to DISCORD_TOKEN.

Set in the plugin settings secret fields. For local/standalone runs use environment variables.

mcp.json uses `${CURSOR_PLUGIN_ROOT}` and the variables (expanded by Cursor).

Local standalone (after build):
```
DISCORD_TOKEN=... node packages/mcp-server/dist/index.js
```

## Bot permissions and intents

In Discord Developer Portal:

- Enable Message Content Intent (required to read message bodies for other users via REST).
- Also Guilds + Guild Messages as needed.
- Invite with minimal scopes: `bot` + `applications.commands`.
- Grant least-privilege permissions: Send Messages, Read Message History, Manage Messages/Channels/Roles/Webhooks as needed for your use. Avoid Administrator on the bot.

## Security notes

- Never log, echo, or commit DISCORD_TOKEN or webhook tokens.
- Tokens must only be configured via Cursor plugin variables or env. See rules/token-safety.mdc.
- The MCP server does not start a Gateway connection.
- For production use least privilege and review all tool calls.

## Development

```
cd packages/mcp-server
npm ci
npm run typecheck
npm run build
npm test
```

## 日本語 (Japanese)

discord-mcp は Cursor 向け Discord MCP プラグインです。MCP ツール経由でメッセージの送受信・編集、チャンネル/ロール/コマンド管理などを行えます。トークンはプラグイン変数から設定してください。詳細は上記の英語セクションを参照。

---

See LICENSE and rules/ for more.
