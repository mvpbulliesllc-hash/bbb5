# Composio Agent (Claude Agent SDK)

A minimal TypeScript agent built on the [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk) with [Composio](https://docs.composio.dev) tools exposed through an in-process MCP server (tool router session).

This workspace is self-contained — it is not part of the .NET solution or the Vite clients.

## Setup

```bash
cd agents/composio-agent
npm install
cp .env.example .env   # fill in COMPOSIO_API_KEY (and ANTHROPIC_API_KEY if not logged in via the Claude CLI)
```

## Run

```bash
npm start                          # default prompt: star the composiohq/composio repo
npm start -- "List my GitHub repos"  # custom prompt
```

## How it works

1. `Composio` (with `ClaudeAgentSDKProvider`) creates a **tool router session** for the configured user id.
2. `session.tools()` returns the user's connected Composio tools in Claude Agent SDK format.
3. `createSdkMcpServer` wraps them as an in-process MCP server passed to the SDK's `query()` loop.
4. `query()` runs the full Claude Code agent loop; assistant messages are printed to stdout.

> `permissionMode: "bypassPermissions"` auto-approves all tool calls — fine for local experiments, review before using anywhere shared.

Docs: [Tool Router](https://docs.composio.dev/tool-router/overview) · [Managing multiple accounts](https://docs.composio.dev/tool-router/managing-multiple-accounts)
