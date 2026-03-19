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

function findTask(tasks: Task[], query: string): Task | undefined {
  // Try matching by #number first
  const numMatch = query.match(/^#?(\d+)$/);
  if (numMatch) {
    return tasks.find((t) => t.id === numMatch[1]);
  }
  // Fall back to title match
  return tasks.find((t) => t.title.toLowerCase().includes(query.toLowerCase()));
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [nextId, setNextId] = useState(7);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const { agent } = useAgent();

  // Action: Add a task
  useFrontendTool({
    name: "addTask",
    description: "Add a new task to the kanban board. Returns the assigned task number.",
    parameters: z.object({
      title: z.string().describe("The task title"),
      priority: z.enum(["low", "medium", "high"]).describe("Task priority"),
      column: z.enum(["backlog", "todo", "in-progress", "done"]).optional().describe("Column to add to, defaults to todo"),
    }),
    handler: async ({ title, priority, column }) => {
      const id = String(nextId);
      const newTask: Task = {
        id,
        title,
        priority: priority || "medium",
        column: column || "todo",
      };
      setTasks((prev) => [...prev, newTask]);
      setNextId((prev) => prev + 1);
      return `Added #${id} "${title}" to ${column || "todo"}`;
    },
  });

  // Action: Move a task
  useFrontendTool({
    name: "moveTask",
    description: "Move a task to a different column. Use #number (e.g. #2) or partial title to identify the task.",
    parameters: z.object({
      task: z.string().describe("Task number like #2 or partial title"),
      toColumn: z.enum(["backlog", "todo", "in-progress", "done"]).describe("Target column"),
    }),
    handler: async ({ task: query, toColumn }) => {
      const target = findTask(tasks, query);
      if (!target) return `Task "${query}" not found`;
      setTasks((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, column: toColumn } : t))
      );
      return `Moved #${target.id} "${target.title}" to ${toColumn}`;
    },
  });

  // Action: Delete a task
  useFrontendTool({
    name: "deleteTask",
    description: "Delete a task. Use #number (e.g. #3) or partial title to identify the task.",
    parameters: z.object({
      task: z.string().describe("Task number like #3 or partial title"),
    }),
    handler: async ({ task: query }) => {
      const target = findTask(tasks, query);
      if (!target) return `Task "${query}" not found`;
      setTasks((prev) => prev.filter((t) => t.id !== target.id));
      return `Deleted #${target.id} "${target.title}"`;
    },
  });

  // Action: Update priority
  useFrontendTool({
    name: "updatePriority",
    description: "Change task priority. Use #number (e.g. #1) or partial title to identify the task.",
    parameters: z.object({
      task: z.string().describe("Task number like #1 or partial title"),
      priority: z.enum(["low", "medium", "high"]).describe("New priority level"),
    }),
    handler: async ({ task: query, priority }) => {
      const target = findTask(tasks, query);
      if (!target) return `Task "${query}" not found`;
      setTasks((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, priority } : t))
      );
      return `Updated #${target.id} "${target.title}" to ${priority}`;
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
    <div className="min-h-screen p-6">
      {/* NES Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-[var(--nes-dark)] p-4 border-4 border-[var(--nes-blue)]" style={{ boxShadow: "6px 6px 0px rgba(0,0,0,0.5)" }}>
          <div className="text-center">
            <h1 className="text-xl tracking-[8px] text-[var(--nes-gold)]">KANBAN QUEST</h1>
            <div className="flex justify-center gap-8 mt-3 text-xs text-[var(--nes-sky)]">
              <span>LV.{totalCount}</span>
              <span>HP {doneCount}/{totalCount}</span>
              <span>{agent.isRunning ? "⚡THINKING" : "◆ READY"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="max-w-7xl mx-auto gb-screen p-4">
        {/* HP Bar */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center gap-3 text-xs text-[var(--nes-white)]">
            <span>PROGRESS</span>
            <div className="flex-1 h-5 bg-[var(--nes-dark)] border-3 border-[var(--nes-blue)]">
              <div
                className="h-full bg-[var(--nes-green)] transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[var(--nes-gold)]">{doneCount}/{totalCount}</span>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.column === col.id);
            return (
              <div
                key={col.id}
                className="bg-[var(--nes-dark)] border-4 border-[var(--nes-blue)] min-h-[350px] flex flex-col"
                style={{ boxShadow: "4px 4px 0px rgba(0,0,0,0.4)" }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
              >
                {/* Column header */}
                <div className="gb-column-header p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {col.icon} {col.label}
                    </span>
                    <span className="bg-[var(--nes-dark)] text-[var(--nes-gold)] px-3 py-1 text-xs border-2 border-[var(--nes-blue)]">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-2 flex-1 flex flex-col gap-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className={`p-3 cursor-grab active:cursor-grabbing gb-card ${
                        task.priority === "high"
                          ? "gb-card-high"
                          : task.priority === "low"
                          ? "gb-card-low"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] flex-shrink-0 text-[var(--nes-gold)] font-bold">
                          #{task.id}
                        </span>
                        <span className="text-base flex-shrink-0">
                          {PRIORITY_SPRITES[task.priority]}
                        </span>
                        <span className="text-xs leading-relaxed break-words">
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-[var(--nes-gray)] opacity-50">
                        DROP HERE
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-[var(--nes-gray)] relative z-10">
          ════════════════════════════════════════
        </div>
      </div>

      {/* Bottom */}
      <div className="max-w-7xl mx-auto mt-4 text-center">
        <div className="text-xs text-[var(--nes-gray)] tracking-[4px]">
          ● AG-UI + AGENTCORE + COPILOTKIT ●
        </div>
      </div>
    </div>
  );
}
