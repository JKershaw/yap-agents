#!/usr/bin/env node
// echo — the simplest yap agent.
//
// Joins a channel, waits to be tagged, repeats back what it heard.
// No LLM, no deps, no config file. The point is to be short enough
// to read in one sitting and fork into something real.

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

const SERVER = args.server ?? process.env.YAP_SERVER ?? "http://localhost:3000";
const NICK = args.nick ?? process.env.YAP_NICK ?? "echo";
const CHANNEL = args.channel ?? process.env.YAP_CHANNEL ?? "#lobby";
const PASSWORD = args.password ?? process.env.YAP_PASSWORD;
const CHANNEL_PASSWORD = args["channel-password"] ?? process.env.YAP_CHANNEL_PASSWORD;

const controller = new AbortController();
process.on("SIGINT", () => {
  process.stderr.write("\nleaving...\n");
  controller.abort();
});
process.on("SIGTERM", () => controller.abort());

async function api(path, body) {
  const headers = { "content-type": "application/json" };
  if (PASSWORD) headers["authorization"] = `Bearer ${PASSWORD}`;
  const res = await fetch(`${SERVER}/api/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function run() {
  process.stderr.write(`echo: joining ${CHANNEL} as ${NICK} on ${SERVER}\n`);
  let cursor = 0;
  const joined = await api("join", {
    channel: CHANNEL,
    nick: NICK,
    password: CHANNEL_PASSWORD,
  });
  cursor = joined.cursor ?? 0;

  while (!controller.signal.aborted) {
    let r;
    try {
      r = await api("listen", {
        channel: CHANNEL,
        nick: NICK,
        mention: NICK,
        since_id: cursor,
        wait: 30,
      });
    } catch (err) {
      if (controller.signal.aborted) break;
      process.stderr.write(`echo: listen failed (${err.message}), retrying in 2s\n`);
      await sleep(2000);
      continue;
    }
    cursor = r.cursor ?? cursor;
    for (const msg of r.mentions ?? []) {
      const reply = `heard you: "${msg.text}"`;
      try {
        await api("say", { channel: CHANNEL, nick: NICK, message: reply });
      } catch (err) {
        if (err.message?.includes("429")) {
          process.stderr.write("echo: rate limited, backing off 5s\n");
          await sleep(5000);
        } else {
          process.stderr.write(`echo: say failed (${err.message})\n`);
        }
      }
    }
  }

  try {
    await api("leave", { channel: CHANNEL, nick: NICK });
  } catch {
    // best-effort; we're exiting anyway
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      out.help = true;
    } else if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = val;
        i++;
      }
    }
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function printHelp() {
  process.stdout.write(
    [
      "echo — a minimal yap agent that repeats messages that tag it",
      "",
      "usage:",
      "  node index.js [flags]",
      "",
      "flags (also available as YAP_* env vars):",
      "  --server URL            yap server base URL (default: http://localhost:3000)",
      "  --nick NAME             this agent's nick (default: echo)",
      "  --channel NAME          channel to join (default: #lobby)",
      "  --password PASS         server password if the server is gated",
      "  --channel-password PASS channel password if the channel is gated",
      "  --help                  this message",
      "",
    ].join("\n"),
  );
}

run().catch((err) => {
  if (controller.signal.aborted) process.exit(0);
  process.stderr.write(`echo: fatal: ${err.message}\n`);
  process.exit(1);
});
