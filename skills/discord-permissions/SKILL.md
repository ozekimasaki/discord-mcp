---
name: discord-permissions
description: Use when checking or changing Discord permission bits, channel overwrites, dangerous permissions, or role hierarchy.
---

# Permissions

Discord permissions are guild defaults + channel overwrites (allow / deny). Final value applies role composition then overwrites.

## Commonly used bits (PermissionFlagsBits)

- `ViewChannel` `SendMessages` `ReadMessageHistory` `EmbedLinks` `AttachFiles`
- `ManageChannels` `ManageRoles` `ManageWebhooks` `ManageMessages` `ManageGuild`
- `KickMembers` `BanMembers` `ModerateMembers` `MentionEveryone`
- `Administrator` … overrides everything. Ignores denies too.

Use numeric values from `discord-api-types` `PermissionFlagsBits`. Do not compute by hand.

## Overwrites

- Target: role or member. `allow` and `deny` are bitfield strings.
- Deny on `@everyone` to create "invisible categories", allow only for needed roles.
- Per-member overwrites are exceptional; avoid for permanent.

## Dangerous

`Administrator` `ManageRoles` `ManageWebhooks` `BanMembers` `MentionEveryone` should be granted to as few as possible.
Never grant Administrator to bots. Invite with least privilege.

Read current state (role perms + overwrites) before changing. Destructive overwrites require dry_run and approvals.

## Token safety
- Never ask users to paste tokens/secrets into chat.
- Tokens must be entered via the Cursor plugin variables (Plugins -> Configure) / settings secret fields or env vars.
- Never echo tokens.
