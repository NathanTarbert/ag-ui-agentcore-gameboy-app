import {
  CopilotRuntime,
  AnthropicAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// For production with AgentCore, uncomment and use HttpAgent:
// import { HttpAgent } from "@ag-ui/client";
// const agentCoreAgent = new HttpAgent({
//   url: process.env.AGENTCORE_AGENT_URL!,
//   headers: { Authorization: `Bearer ${process.env.AGENTCORE_BEARER_TOKEN}` },
// });

export const POST = async (req: NextRequest) => {
  const serviceAdapter = new AnthropicAdapter({
    model: "claude-sonnet-4-20250514",
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
    },
  });

  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
