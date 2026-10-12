import { DiscordAPIError, HTTPError, RateLimitError } from "@discordjs/rest";

const WEBHOOK_TOKEN = /\/webhooks\/\d+\/[A-Za-z0-9._-]+/g;
const BOT_TOKEN_LIKE = /[\w-]{24,}\.[\w-]{6}\.[\w-]{20,}/g;

export function redactSecrets(text: string): string {
  return text
    .replace(WEBHOOK_TOKEN, "/webhooks/<id>/<redacted>")
    .replace(BOT_TOKEN_LIKE, "<redacted-token>");
}

export function formatDiscordError(error: unknown): string {
  if (error instanceof DiscordAPIError) {
    const parts = [
      `Discord API error ${String(error.code)} (HTTP ${error.status}): ${error.message}`,
    ];
    if (error.code === 50013 || error.code === 50001) {
      parts.push(
        "Missing permissions or access. Check the bot role, channel overwrites, and invite scopes.",
      );
    }
    const raw = error.rawError as { errors?: unknown };
    if (raw?.errors) {
      parts.push(`Details: ${JSON.stringify(raw.errors)}`);
    }
    return redactSecrets(parts.join(" "));
  }
  if (error instanceof RateLimitError) {
    return `Discord rate limited. Retry after ${String(error.retryAfter)} ms.`;
  }
  if (error instanceof HTTPError) {
    return redactSecrets(`HTTP ${error.status}: ${error.message}`);
  }
  if (error instanceof Error) {
    return redactSecrets(error.message);
  }
  return "Unknown error";
}
