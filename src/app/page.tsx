"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotSidebar
        defaultOpen={true}
        labels={{
          title: "⚔️ KANBAN COPILOT",
          initial:
            "Hey! I can help manage your board. Try: 'Add a high priority task called Ship demo to in-progress' or 'Move streaming tests to done'",
        }}
      >
        <KanbanBoard />
      </CopilotSidebar>
    </CopilotKit>
  );
}
