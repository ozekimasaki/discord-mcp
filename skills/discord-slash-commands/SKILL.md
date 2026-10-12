---
name: discord-slash-commands
description: Use when defining Slash Commands with discord.js builders, registering guild/global, or deciding option design.
---

# Slash Command

Define with `@discordjs/builders` `SlashCommandBuilder`. (Interaction execution/response is not covered by this MCP; only registration via REST.)

## Definition

```ts
import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";

const ping = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Connectivity check")
  .addStringOption((o: SlashCommandStringOption) =>
    o.setName("text").setDescription("Optional").setRequired(false),
  );
```

- name: lowercase, 1–32 chars, regex `^[-_\\w\\p{L}\\p{N}\\p{sc=Deva}\\p{sc=Thai}]{1,32}$`
- description: required, 1–100 chars
- option types: STRING / INTEGER / NUMBER / BOOLEAN / USER / CHANNEL / ROLE / MENTIONABLE / ATTACHMENT
- choices: up to 25. Avoid complex input; use one STRING if possible.

`builder.toJSON()` produces the API body. This MCP's `discord_register_command` accepts name / description and options as JSON.

## Registration flow

1. Invite must include `applications.commands` scope
2. Guild register (`guild_id`) is immediate. Use for dev.
3. Global register takes ~1 hour. For production.
4. List with `discord_list_commands`, delete with `discord_delete_command` (dry_run default)

Posting same name updates. Use full PUT only when you want bulk replace (this MCP does single POST).

## Token safety
- Never ask users to paste tokens/secrets into chat.
- Tokens must be entered via the Cursor plugin variables (Plugins -> Configure) / settings secret fields or env vars.
- Never echo tokens.
