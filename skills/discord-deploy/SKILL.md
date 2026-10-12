---
name: discord-deploy
description: Use when creating a new Discord bot, deciding Intents or invite URL, or setting DISCORD_TOKEN for this MCP.
---

# Deploy

This plugin's MCP does not connect to the Discord Gateway. Tokens are used for REST only.

## Bot creation

1. https://discord.com/developers/applications → New Application
2. Bot tab: add Bot, Reset Token. Never paste the token into chat.
3. Privileged Gateway Intents:
   - Message Content Intent — ON if you need to read others' message bodies via REST
   - Server Members Intent — ON if member lists are needed
4. OAuth2 → URL Generator
   - Scopes: `bot` and `applications.commands`
   - Permissions: minimal (Send Messages, Read Message History, needed Manage* only)
5. Use generated URL to invite to server

## Token for this MCP

- Set in Cursor plugin variable `DISCORD_TOKEN`
- Standalone: `DISCORD_TOKEN=... node packages/mcp-server/dist/index.js`
- Never write tokens into README, logs, or commits

If a resident bot (event responder) is needed, run a separate discord.js / Sapphire process. MCP and bot can share the token, but do not mix Gateway and REST in same process.

## Token safety
- Never ask users to paste tokens/secrets into chat.
- Tokens must be entered via the Cursor plugin variables (Plugins -> Configure) / settings secret fields or env vars.
- Never echo tokens.
