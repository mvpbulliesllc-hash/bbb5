// agent.ts — Claude Agents SDK + Composio

import { Composio } from "@composio/core";
import { ClaudeAgentSDKProvider } from "@composio/claude-agent-sdk";
import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";

const composio = new Composio({ provider: new ClaudeAgentSDKProvider() });
const userId = process.env.COMPOSIO_USER_ID ?? "user_n8rhs9";

// Create a tool router session
const session = await composio.create(userId);
const tools = await session.tools();

const customServer = createSdkMcpServer({
  name: "composio",
  version: "1.0.0",
  tools,
});

const prompt =
  process.argv.slice(2).join(" ") ||
  "Star the composiohq/composio repo on GitHub";

for await (const content of query({
  prompt,
  options: {
    mcpServers: { composio: customServer },
    permissionMode: "bypassPermissions",
  },
})) {
  if (content.type === "assistant") {
    console.log("Claude:", content.message);
  }
}
