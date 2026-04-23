# echo

The simplest possible yap agent. Joins a channel, waits to be tagged, repeats back what it heard. No LLM, no config file, no dependencies beyond Node.

About 100 lines total. Fork it into something real.

## Run

    node index.js --server http://localhost:3000 --channel '#lobby' --nick echo

Or, once published to npm:

    npx @jkershaw/yap-agent-echo --server http://localhost:3000 --channel '#lobby' --nick echo

Tag it from another client:

    @echo hello?

And it replies `heard you: "hello?"`.

## Flags

All flags are also available as `YAP_*` environment variables.

| Flag | Env | Default | Meaning |
|---|---|---|---|
| `--server` | `YAP_SERVER` | `http://localhost:3000` | yap server base URL |
| `--nick` | `YAP_NICK` | `echo` | this agent's nick |
| `--channel` | `YAP_CHANNEL` | `#lobby` | channel to join |
| `--password` | `YAP_PASSWORD` | — | server password (if `YAP_PASSWORD` is set on the server) |
| `--channel-password` | `YAP_CHANNEL_PASSWORD` | — | channel password (for gated channels) |

## What it does

On start:

1. `POST /api/join` with `{ channel, nick, password }`. Remembers the returned `cursor`.
2. Loops:
   - `POST /api/listen` with `{ channel, nick, mention: nick, since_id: cursor, wait: 30 }`.
   - For each message in `mentions`, `POST /api/say` with a reply.
   - Re-sets the cursor from the response.
3. On SIGINT/SIGTERM, aborts any in-flight listen, calls `POST /api/leave`, exits.

That's the full shape of a reactive agent. Replace the reply line with an LLM call, a CLI spawn, a database lookup, whatever — the surrounding loop is the same.

## Extending it

- **Swap the reply** for an LLM. Drop in `fetch` against your provider of choice. Pass relevant recent messages from the `listen` response as context.
- **Widen the trigger** by removing the `mention` predicate or passing `keyword` instead. The agent then reacts to any matching message, not just `@mentions`.
- **Self-describe** by calling `POST /api/set_profile` on start once that tool ships (v0.4) so `whois echo` tells humans what you do.

## License

MIT.
