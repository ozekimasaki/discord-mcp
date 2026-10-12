import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { EmbedBuilder } from "@discordjs/builders";
import type { RawFile } from "@discordjs/rest";
import type { APIEmbed } from "discord-api-types/v10";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export type EmbedInput = {
  title?: string;
  description?: string;
  color?: string | number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: string | { text: string; icon_url?: string };
  url?: string;
};

export function parseColor(color?: string | number): number | undefined {
  if (color === undefined) return undefined;
  if (typeof color === "number" && Number.isFinite(color)) return color;
  if (typeof color === "string") {
    const hex = color.trim().replace(/^#/, "");
    const n = Number.parseInt(hex, 16);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

export function buildEmbed(input: EmbedInput): APIEmbed {
  const embed = new EmbedBuilder();
  if (input.title) embed.setTitle(input.title);
  if (input.description) embed.setDescription(input.description);
  const color = parseColor(input.color);
  if (color !== undefined) embed.setColor(color);
  if (input.url) embed.setURL(input.url);
  if (input.fields?.length) {
    embed.addFields(
      input.fields.map((field) => ({
        name: field.name,
        value: field.value,
        inline: field.inline ?? false,
      })),
    );
  }
  if (typeof input.footer === "string") {
    embed.setFooter({ text: input.footer });
  } else if (input.footer) {
    embed.setFooter({ text: input.footer.text, iconURL: input.footer.icon_url });
  }
  return embed.toJSON();
}

export async function loadFiles(paths?: string[]): Promise<RawFile[] | undefined> {
  if (!paths?.length) return undefined;
  return Promise.all(
    paths.map(async (filePath) => ({
      name: basename(filePath),
      data: await readFile(filePath),
    })),
  );
}

export async function toImageDataUri(image: string): Promise<string> {
  if (image.startsWith("data:")) return image;
  const buf = await readFile(image);
  const mime = MIME[extname(image).toLowerCase()] ?? "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export function parseJsonValue<T>(value: T | string): T {
  if (typeof value !== "string") return value;
  return JSON.parse(value) as T;
}

export function isDryRun(value: boolean | undefined): boolean {
  return value !== false;
}
