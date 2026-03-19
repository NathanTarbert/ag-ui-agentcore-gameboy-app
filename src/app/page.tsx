"use client";

import { CopilotKit } from "@copilotkit/react-core";
import KanbanBoard from "@/components/KanbanBoard";
import GameBoyChat from "@/components/GameBoyChat";

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <KanbanBoard />
      <GameBoyChat />
    </CopilotKit>
  );
}
