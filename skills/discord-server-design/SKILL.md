---
name: discord-server-design
description: Use when designing channel/category/role layout, standing up a new server, or proposing cleanup of existing server.
---

# Server design

Decide category → channel → role order. Do not decide permissions first.

## Categories

- Public (announcements/chat), work (dev/review), staff (moderation) — three layers basic.
- Keep category names short; at most one emoji at start.
- Do not pack too many channels per category (guideline: 8 or fewer).

## Channels

- Text: one-line topic. Consider announcement for broadcasts, forum for discussion.
- Voice: keep permanent few; use temporary for events.
- Naming: kebab-case (`dev-general`). Avoid sequential numbers or dates.
- Separate bot-only post channels for easier auditing.

## Roles

- Hierarchy: `@everyone` < member < staff < admin. Bot roles just below staff.
- Color and hoist only for staff+. Mentionable limited to moderator/owner roles.
- Set visible ranges per role first, then apply overwrites (not per-channel).

When proposing designs, separate "add / merge / leave untouched".

## Token safety
- Never ask users to paste tokens/secrets into chat.
- Tokens must be entered via the Cursor plugin variables (Plugins -> Configure) / settings secret fields or env vars.
- Never echo tokens.
