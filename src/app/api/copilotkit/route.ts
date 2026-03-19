import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { createAnthropic } from "@ai-sdk/anthropic";
import { NextRequest } from "next/server";

// For production with AgentCore, use HttpAgent instead:
// import { HttpAgent } from "@ag-ui/client";
// const agentCoreAgent = new HttpAgent({
//   url: process.env.AGENTCORE_AGENT_URL!,
//   headers: { Authorization: `Bearer ${process.env.AGENTCORE_BEARER_TOKEN}` },
// });

class CustomAnthropicAdapter {
  private provider;
  private modelId: string;

  constructor({ apiKey, model }: { apiKey: string; model: string }) {
    this.provider = createAnthropic({ apiKey });
    this.modelId = model;
  }

  getLanguageModel() {
    return this.provider(this.modelId);
  }
}

export const POST = async (req: NextRequest) => {
  const serviceAdapter = new CustomAnthropicAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: "claude-sonnet-4-20250514",
  });

  const runtime = new CopilotRuntime({
    instructions:
      "You are a retro Kanban board assistant. Keep ALL responses to 1-2 short sentences max. Be terse and direct like an NES game. Never list out capabilities or board state unless the user specifically asks. Just confirm actions briefly. You MUST use the provided tools (addTask, moveTask, deleteTask, updatePriority) to make changes to the board. Never just say you did something without calling the tool first.",
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: serviceAdapter as Parameters<typeof copilotRuntimeNextJSAppRouterEndpoint>[0]["serviceAdapter"],
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
