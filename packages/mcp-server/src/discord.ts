import { REST } from "@discordjs/rest";
import {
  Routes,
  type RESTGetAPIOAuth2CurrentApplicationResult,
} from "discord-api-types/v10";

let rest: REST | undefined;
let applicationId: string | undefined;

/** Read an env var, treating empty or unexpanded "${VAR}" placeholders as unset. */
function envToken(name: string): string | undefined {
  const v = process.env[name]?.trim();
  if (!v || v.startsWith("${")) return undefined;
  return v;
}

/** Require DISCORD_TOKEN from env only. Never log the value. Throws only on first tool use that needs it (MCP server starts without token). */
export function requireToken(): string {
  const fromEnv = envToken("DISCORD_TOKEN");
  if (!fromEnv) {
    throw new Error(
      "DISCORD_TOKEN is missing. Provide via Cursor plugin variables (Plugins > Configure) or DISCORD_TOKEN environment variable. Tokens are never logged or echoed in output.",
    );
  }
  return fromEnv;
}

/** Process-lifetime REST client. No Gateway login. */
export function getRest(): REST {
  if (!rest) {
    rest = new REST({ version: "10" }).setToken(requireToken());
  }
  return rest;
}

export async function getApplicationId(): Promise<string> {
  if (applicationId) return applicationId;
  const app = (await getRest().get(
    Routes.oauth2CurrentApplication(),
  )) as RESTGetAPIOAuth2CurrentApplicationResult;
  applicationId = app.id;
  return applicationId;
}

// DM tools prefer DISCORD_DM_TOKEN; fall back to DISCORD_TOKEN or throw clear error. No file-based loading.
let dmRest: REST | undefined;

function requireDmToken(): string {
  const dmEnv = envToken("DISCORD_DM_TOKEN");
  if (dmEnv) return dmEnv;
  const mainEnv = envToken("DISCORD_TOKEN");
  if (mainEnv) return mainEnv;
  throw new Error(
    "No Discord token for DMs. Set DISCORD_DM_TOKEN (or DISCORD_TOKEN as fallback) via Cursor plugin variables or env. Never paste tokens into chat.",
  );
}

/** REST client for DM tools (uses DM token or falls back to main DISCORD_TOKEN). */
export function getDmRest(): REST {
  if (!dmRest) {
    dmRest = new REST({ version: "10" }).setToken(requireDmToken());
  }
  return dmRest;
}
