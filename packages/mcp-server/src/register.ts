import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape } from "zod";
import { formatDiscordError } from "./errors.js";

export type TextResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

export function ok(data: unknown): TextResult {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }] };
}

export function fail(error: unknown): TextResult {
  return { content: [{ type: "text", text: formatDiscordError(error) }], isError: true };
}

export function preview(action: string, payload: unknown): TextResult {
  return ok({
    dry_run: true,
    action,
    payload,
    note: "Set dry_run:false to apply (after required approvals per your rules).",
  });
}

export function addTool(
  server: McpServer,
  name: string,
  description: string,
  schema: ZodRawShape,
  handler: (args: Record<string, unknown>) => Promise<unknown>,
): void {
  server.tool(name, description, schema, async (args) => {
    try {
      const result = await handler(args as Record<string, unknown>);
      if (
        result &&
        typeof result === "object" &&
        Array.isArray((result as TextResult).content)
      ) {
        return result as TextResult;
      }
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  });
}
