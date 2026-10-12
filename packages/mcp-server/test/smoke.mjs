#!/usr/bin/env node
import { spawn } from "node:child_process";
import { once } from "node:events";

const token = "dummy";
const server = spawn(process.execPath, ["dist/index.js"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, DISCORD_TOKEN: token, DISCORD_DM_TOKEN: "" },
  stdio: ["pipe", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";
server.stdout.on("data", (d) => { stdout += d; });
server.stderr.on("data", (d) => { stderr += d; });

function send(msg) {
  const line = JSON.stringify(msg) + "\n";
  server.stdin.write(line);
}

const init = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", clientInfo: { name: "smoke", version: "0" }, capabilities: {} } };
const toolsList = { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} };

let toolsCount = 0;
let sawTools = false;

server.stdout.on("data", (chunk) => {
  const lines = (chunk.toString()).split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.id === 2 && obj.result && Array.isArray(obj.result.tools)) {
        toolsCount = obj.result.tools.length;
        sawTools = true;
        console.error(`[smoke] received ${toolsCount} tools`);
      }
    } catch {}
  }
});

async function run() {
  send(init);
  await new Promise(r => setTimeout(r, 200));
  send(toolsList);

  await new Promise(r => setTimeout(r, 800));

  server.stdin.end();

  const [code] = await once(server, "close");

  if (!sawTools || toolsCount < 1) {
    console.error("[smoke] FAIL: did not receive >=1 tools. stderr:", stderr.slice(-500));
    process.exit(1);
  }
  if (code !== 0 && code != null) {
    console.error("[smoke] FAIL: non-zero exit", code);
    process.exit(code || 1);
  }
  console.error("[smoke] OK: >0 tools, exit 0");
  process.exit(0);
}

run().catch((e) => {
  console.error("[smoke] error", e, "stderr:", stderr);
  process.exit(1);
});
