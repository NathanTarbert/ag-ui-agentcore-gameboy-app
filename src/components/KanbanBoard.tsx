"use client";

import { useState } from "react";
import { useFrontendTool, useAgent } from "@copilotkit/react-core/v2";
import { z } from "zod";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  column: "backlog" | "todo" | "in-progress" | "done";
}

const COLUMNS = [
  { id: "backlog" as const, label: "BKLOG", icon: "░" },
  { id: "todo" as const, label: "TODO", icon: "▪" },
  { id: "in-progress" as const, label: "WIP", icon: "▶" },
  { id: "done" as const, label: "DONE", icon: "★" },
];

const PRIORITY_SPRITES: Record<TaskPriority, string> = {
  low: "♟",
  medium: "♞",
  high: "♛",
};

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Deploy AG-UI server", priority: "high", column: "done" },
  { id: "2", title: "Connect CopilotKit frontend", priority: "high", column: "in-progress" },
  { id: "3", title: "Add Cognito auth", priority: "medium", column: "todo" },
  { id: "4", title: "Write streaming tests", priority: "low", column: "backlog" },
  { id: "5", title: "Build generative UI patterns", priority: "medium", column: "todo" },
  { id: "6", title: "Configure AgentCore scaling", priority: "low", column: "backlog" },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const { agent } = useAgent();

  // Action: Get board state
  useFrontendTool({
    name: "getBoardState",
    description: "Get the current kanban board state with all tasks, their columns, and priorities",
    parameters: z.object({}),
    handler: async () => {
      return JSON.stringify(tasks);
    },
  });

  // Action: Add a task
  useFrontendTool({
    name: "addTask",
    description: "Add a new task to the kanban board",
    parameters: z.object({
      title: z.string().describe("The task title"),
      priority: z.enum(["low", "medium", "high"]).describe("Task priority"),
      column: z.enum(["backlog", "todo", "in-progress", "done"]).optional().describe("Column to add to, defaults to todo"),
    }),
    handler: async ({ title, priority, column }) => {
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        priority: priority || "medium",
        column: column || "todo",
      };
      setTasks((prev) => [...prev, newTask]);
      return `Added task "${title}" to ${column || "todo"}`;
    },
  });

  // Action: Move a task
  useFrontendTool({
    name: "moveTask",
    description: "Move a task to a different column on the kanban board",
    parameters: z.object({
      taskTitle: z.string().describe("The title (or partial title) of the task to move"),
      toColumn: z.enum(["backlog", "todo", "in-progress", "done"]).describe("Target column"),
    }),
    handler: async ({ taskTitle, toColumn }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.title.toLowerCase().includes(taskTitle.toLowerCase())
            ? { ...t, column: toColumn }
            : t
        )
      );
      return `Moved "${taskTitle}" to ${toColumn}`;
    },
  });

  // Action: Delete a task
  useFrontendTool({
    name: "deleteTask",
    description: "Delete a task from the kanban board",
    parameters: z.object({
      taskTitle: z.string().describe("The title (or partial title) of the task to delete"),
    }),
    handler: async ({ taskTitle }) => {
      setTasks((prev) =>
        prev.filter((t) => !t.title.toLowerCase().includes(taskTitle.toLowerCase()))
      );
      return `Deleted task "${taskTitle}"`;
    },
  });

  // Action: Update priority
  useFrontendTool({
    name: "updatePriority",
    description: "Change the priority of a task",
    parameters: z.object({
      taskTitle: z.string().describe("The title (or partial title) of the task"),
      priority: z.enum(["low", "medium", "high"]).describe("New priority level"),
    }),
    handler: async ({ taskTitle, priority }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.title.toLowerCase().includes(taskTitle.toLowerCase())
            ? { ...t, priority }
            : t
        )
      );
      return `Updated "${taskTitle}" priority to ${priority}`;
    },
  });

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (columnId: Task["column"]) => {
    if (!draggedTask) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTask ? { ...t, column: columnId } : t))
    );
    setDraggedTask(null);
  };

  const doneCount = tasks.filter((t) => t.column === "done").length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen p-3">
      {/* Game Boy Shell Header */}
      <div className="max-w-6xl mx-auto mb-3">
        <div className="bg-[var(--gb-dark)] p-3 border-4 border-[var(--gb-darkest)]" style={{ boxShadow: "4px 4px 0px var(--gb-shadow)" }}>
          <div className="text-center text-[var(--gb-lightest)]">
            <h1 className="text-sm tracking-[6px]">KANBAN QUEST</h1>
            <div className="flex justify-center gap-6 mt-2 text-[7px] text-[var(--gb-light)]">
              <span>LV.{totalCount}</span>
              <span>HP {doneCount}/{totalCount}</span>
              <span>{agent.isRunning ? "⚡THINKING" : "◆ READY"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Board — "Game Boy Screen" */}
      <div className="max-w-6xl mx-auto gb-screen p-3">
        {/* HP Bar */}
        <div className="mb-3 relative z-10">
          <div className="flex items-center gap-2 text-[7px] text-[var(--gb-darkest)]">
            <span>PROGRESS</span>
            <div className="flex-1 h-3 bg-[var(--gb-light)] border-2 border-[var(--gb-darkest)]">
              <div
                className="h-full bg-[var(--gb-darkest)] transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            <span>{doneCount}/{totalCount}</span>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.column === col.id);
            return (
              <div
                key={col.id}
                className="bg-[var(--gb-light)] border-3 border-[var(--gb-darkest)] min-h-[300px] flex flex-col"
                style={{ boxShadow: "3px 3px 0px var(--gb-dark)" }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
              >
                {/* Column header */}
                <div className="gb-column-header p-2">
                  <div className="flex items-center justify-between text-[8px]">
                    <span>
                      {col.icon} {col.label}
                    </span>
                    <span className="bg-[var(--gb-darkest)] text-[var(--gb-lightest)] px-2 py-0.5 text-[7px]">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-1.5 flex-1 flex flex-col gap-1.5">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className={`p-2 cursor-grab active:cursor-grabbing gb-card ${
                        task.priority === "high"
                          ? "gb-card-high"
                          : task.priority === "low"
                          ? "gb-card-low"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="text-[10px] flex-shrink-0">
                          {PRIORITY_SPRITES[task.priority]}
                        </span>
                        <span className="text-[7px] leading-relaxed break-words text-[var(--gb-darkest)]">
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[7px] text-[var(--gb-dark)] opacity-40">
                        · · ·
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 text-center text-[6px] text-[var(--gb-dark)] relative z-10">
          ═══════════════════════════════════════
        </div>
      </div>

      {/* Game Boy shell bottom */}
      <div className="max-w-6xl mx-auto mt-3 text-center">
        <div className="text-[6px] text-[var(--gb-dark)] tracking-[4px]">
          ● AG-UI + AGENTCORE + COPILOTKIT ●
        </div>
      </div>
    </div>
  );
}
