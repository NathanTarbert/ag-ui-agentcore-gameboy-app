# Pixel Kanban — AgentCore + CopilotKit

A retro NES-styled Kanban board with an AI copilot chat. Built with Next.js, CopilotKit, and the AG-UI protocol — ready to deploy to Amazon Bedrock AgentCore.

Talk to the copilot to manage your board: add tasks, move them between columns, delete them, or change priorities — all by chatting with the AI or by referencing task numbers (e.g. "#2 is done").

## Tech Stack

- **Next.js 16** — App Router with Turbopack
- **CopilotKit** — AI copilot framework with headless chat (v2 hooks)
- **AG-UI Protocol** — Agent-User Interaction protocol for real-time streaming
- **Anthropic Claude** — Powers the copilot (Claude Sonnet 4)
- **Tailwind CSS v4** — Styling
- **Zod** — Tool parameter validation

## Prerequisites

- **Node.js 18+**
- **pnpm** — Package manager (`npm install -g pnpm` if you don't have it)
- **Anthropic API Key** — Get one at [console.anthropic.com](https://console.anthropic.com/)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/NathanTarbert/pixel-kanban-agentcore.git
cd pixel-kanban-agentcore
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Use the copilot

Click the red **A** button in the bottom-right corner to open the chat. Try:

- `Add a high priority task called Ship demo`
- `Move #2 to done`
- `Delete #4`
- `Change #3 priority to high`

You can also drag and drop tasks between columns directly on the board.

## Project Structure

```
src/
├── app/
│   ├── api/copilotkit/route.ts   # CopilotKit runtime endpoint (Anthropic adapter)
│   ├── globals.css                # NES color palette + retro styles
│   ├── layout.tsx                 # Root layout with Press Start 2P font
│   └── page.tsx                   # Main page — CopilotKit provider + board + chat
├── components/
│   ├── KanbanBoard.tsx            # Board with drag-and-drop + frontend tools
│   └── GameBoyChat.tsx            # Headless chat UI (useAgent + useCopilotKit)
```

## How It Works

A single Next.js server handles everything:

```
Chat input → POST /api/copilotkit → CopilotKit Runtime → Anthropic API (Claude)
                                                              ↓
                                              Claude calls tools (addTask, moveTask, etc.)
                                                              ↓
                                              Runtime streams back → Frontend executes tool
                                                              ↓
                                              Board updates + Claude confirms in chat
```

**Frontend tools** are registered with `useFrontendTool` from `@copilotkit/react-core/v2`. When Claude decides to call a tool, the CopilotKit runtime coordinates the call back to the browser where the handler runs and updates React state.

## Deploying with Amazon Bedrock AgentCore

For production, you can swap the Anthropic adapter for an AG-UI agent deployed on AgentCore. In `route.ts`, uncomment the `HttpAgent` setup:

```typescript
import { HttpAgent } from "@ag-ui/client";

const agentCoreAgent = new HttpAgent({
  url: process.env.AGENTCORE_AGENT_URL!,
  headers: {
    Authorization: `Bearer ${process.env.AGENTCORE_BEARER_TOKEN}`,
  },
});

const runtime = new CopilotRuntime({
  agents: {
    default: agentCoreAgent,
  },
});
```

Then add to your `.env.local`:

```bash
AGENTCORE_AGENT_URL=https://bedrock-agentcore.us-west-2.amazonaws.com/runtimes/<encoded-arn>/invocations?qualifier=DEFAULT
AGENTCORE_BEARER_TOKEN=<your-cognito-bearer-token>
```

See the [AG-UI + AgentCore deployment guide](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-agui.html) for full setup instructions including Cognito authentication.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
