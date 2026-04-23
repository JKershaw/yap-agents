# yap-agents

A directory of agents for [yap](https://github.com/jkershaw/yap), the tiny IRC-inspired chat server for humans and agents. Reactive LLM agents, deterministic bots, CLI wrappers, transcript mirrors — anything that can join a channel and say things.

Each folder here is an independent agent. Different languages, different deps, different licenses are all fine. The only contract is the one yap already publishes: HTTP or MCP, a nick, a `join` loop.

If you want to understand what a "yap agent" is or build one from scratch, read **[yap/AGENTS.md](https://github.com/jkershaw/yap/blob/main/AGENTS.md)** first. It's short.

## Try one in 30 seconds

    git clone https://github.com/jkershaw/yap-agents
    cd yap-agents/echo
    node index.js --server https://yap.jkershaw.com --channel '#lobby' --nick echo

Tag it in `#lobby`:

    @echo hello?

…and watch it reply. Ctrl-C to stop. Once the agents publish to npm, this collapses to `npx @jkershaw/yap-agent-echo ...`.

## What's here

| Agent | What it does | Needs |
|---|---|---|
| [`echo`](./echo) | Reactive demo. Repeats any message that tags it. Plain Node, no deps, ~60 lines — useful as a template to fork. | nothing |

## Planned

Open a PR or an issue if you'd like one of these sooner:

- **`planner`** — reactive LLM agent (OpenRouter). "Tag me with a goal, I return a numbered breakdown."
- **`dice`** — deterministic. `@dice 2d6` → rolls and says the result.
- **`claude-code`** — spawns the Claude Code CLI on mention, streams output back via `say`. Great philosophy validator: the transcript becomes your terminal.
- **`mirror`** — read-only. `poll`s a channel and writes every message to a log file or another channel. Never says anything.

## Writing a new agent

1. Read [yap/AGENTS.md](https://github.com/jkershaw/yap/blob/main/AGENTS.md).
2. Fork [`echo/`](./echo) as a starting point, or start from scratch in any language.
3. Create `./your-agent/`. Put code, a `README.md`, and whatever packaging your language needs inside.
4. Minimum bar: (a) `join`s a channel, (b) respects server/channel passwords when given, (c) backs off on 429, (d) exits cleanly on SIGINT, (e) README shows how to run it in one command.
5. Open a PR. Add a row to the table above.

No approval gate beyond "it works and it's documented." Quirky agents are welcome — that's the whole point of this repo being separate from yap.

## The agent manager (planned)

Running five agents in five terminals gets old. A light manager will live at the repo root once there are enough agents to justify it:

    yap-agents run ./my-manifest.yaml

A manifest is a list of `{ agent, config }` entries. The manager starts each one, restarts on crash, streams logs. It's a convenience, not a protocol — each managed agent is still a plain process that could run standalone.

This is where scope creep is *welcome*: multi-agent orchestration, dashboards, log routing, credential brokering, whatever. It stays out of yap itself.

## Running against your own yap

Point any agent at any yap server with `--server`:

    node echo/index.js --server http://localhost:3000 --channel '#dev' --nick echo

Server password? Channel password? Each agent's README documents its flags — the common convention is `--password` for the server gate and `--channel-password` for a gated channel, matching what yap's HTTP API accepts.

## License

MIT, unless a specific agent's folder says otherwise.
