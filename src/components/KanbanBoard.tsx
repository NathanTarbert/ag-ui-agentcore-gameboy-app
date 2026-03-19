"use client";

import { useState } from "react";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  column: "backlog" | "todo" | "in-progress" | "done";
}

const COLUMNS = [
  { id: "backlog" as const, label: "BACKLOG", emoji: "📋" },
  { id: "todo" as const, label: "TO DO", emoji: "📌" },
  { id: "in-progress" as const, label: "IN PROGRESS", emoji: "⚡" },
  { id: "done" as const, label: "DONE", emoji: "✅" },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "border-[var(--pixel-blue)] bg-[var(--pixel-blue)]/10",
  medium: "border-[var(--pixel-yellow)] bg-[var(--pixel-yellow)]/10",
  high: "border-[var(--pixel-accent)] bg-[var(--pixel-accent)]/10",
};

const PRIORITY_DOTS: Record<TaskPriority, string> = {
  low: "bg-[var(--pixel-blue)]",
  medium: "bg-[var(--pixel-yellow)]",
  high: "bg-[var(--pixel-accent)]",
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

  // Make board state readable to the copilot
  useCopilotReadable({
    description: "The current kanban board state with all tasks, their columns, and priorities",
    value: JSON.stringify(tasks),
  });

  // Action: Add a task
  useCopilotAction({
    name: "addTask",
    description: "Add a new task to the kanban board",
    parameters: [
      { name: "title", type: "string", description: "The task title", required: true },
      { name: "priority", type: "string", description: "Priority: low, medium, or high", required: true },
      { name: "column", type: "string", description: "Column: backlog, todo, in-progress, or done", required: false },
    ],
    handler: ({ title, priority, column }) => {
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        priority: (priority as TaskPriority) || "medium",
        column: (column as Task["column"]) || "todo",
      };
      setTasks((prev) => [...prev, newTask]);
      return `Added task "${title}" to ${column || "todo"}`;
    },
  });

  // Action: Move a task
  useCopilotAction({
    name: "moveTask",
    description: "Move a task to a different column on the kanban board",
    parameters: [
      { name: "taskTitle", type: "string", description: "The title (or partial title) of the task to move", required: true },
      { name: "toColumn", type: "string", description: "Target column: backlog, todo, in-progress, or done", required: true },
    ],
    handler: ({ taskTitle, toColumn }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.title.toLowerCase().includes(taskTitle.toLowerCase())
            ? { ...t, column: toColumn as Task["column"] }
            : t
        )
      );
      return `Moved "${taskTitle}" to ${toColumn}`;
    },
  });

  // Action: Delete a task
  useCopilotAction({
    name: "deleteTask",
    description: "Delete a task from the kanban board",
    parameters: [
      { name: "taskTitle", type: "string", description: "The title (or partial title) of the task to delete", required: true },
    ],
    handler: ({ taskTitle }) => {
      setTasks((prev) =>
        prev.filter((t) => !t.title.toLowerCase().includes(taskTitle.toLowerCase()))
      );
      return `Deleted task "${taskTitle}"`;
    },
  });

  // Action: Update priority
  useCopilotAction({
    name: "updatePriority",
    description: "Change the priority of a task",
    parameters: [
      { name: "taskTitle", type: "string", description: "The title (or partial title) of the task", required: true },
      { name: "priority", type: "string", description: "New priority: low, medium, or high", required: true },
    ],
    handler: ({ taskTitle, priority }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.title.toLowerCase().includes(taskTitle.toLowerCase())
            ? { ...t, priority: priority as TaskPriority }
            : t
        )
      );
      return `Updated "${taskTitle}" priority to ${priority}`;
    },
  });

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: Task["column"]) => {
    if (!draggedTask) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTask ? { ...t, column: columnId } : t))
    );
    setDraggedTask(null);
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl text-[var(--pixel-accent)] mb-2 tracking-wider">
          ◆ PIXEL KANBAN ◆
        </h1>
        <p className="text-[10px] text-[var(--pixel-muted)]">
          Powered by AG-UI + Amazon Bedrock AgentCore + CopilotKit
        </p>
        <div className="flex justify-center gap-6 mt-4 text-[8px] text-[var(--pixel-muted)]">
          <span className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 ${PRIORITY_DOTS.low}`}></span> LOW
          </span>
          <span className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 ${PRIORITY_DOTS.medium}`}></span> MEDIUM
          </span>
          <span className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 ${PRIORITY_DOTS.high}`}></span> HIGH
          </span>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.column === col.id);
          return (
            <div
              key={col.id}
              className="pixel-border bg-[var(--pixel-surface)] min-h-[400px] flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column header */}
              <div className="p-3 border-b-4 border-[var(--pixel-border)] bg-[var(--pixel-bg)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-widest">
                    {col.emoji} {col.label}
                  </span>
                  <span className="text-[8px] text-[var(--pixel-muted)] pixel-border px-2 py-1 bg-[var(--pixel-surface)]">
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
                    className={`p-3 border-2 cursor-grab active:cursor-grabbing transition-all hover:translate-x-[2px] hover:translate-y-[2px] ${PRIORITY_COLORS[task.priority]}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`inline-block w-2 h-2 mt-1 flex-shrink-0 ${PRIORITY_DOTS[task.priority]}`}></span>
                      <span className="text-[9px] leading-relaxed break-words">
                        {task.title}
                      </span>
                    </div>
                    <div className="mt-2 text-[7px] text-[var(--pixel-muted)] uppercase">
                      {task.priority} priority
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-[8px] text-[var(--pixel-muted)] opacity-50">
                      DROP HERE
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="text-center mt-8 text-[8px] text-[var(--pixel-muted)]">
        <span>TASKS: {tasks.length}</span>
        <span className="mx-4">|</span>
        <span>DONE: {tasks.filter((t) => t.column === "done").length}</span>
        <span className="mx-4">|</span>
        <span>IN PROGRESS: {tasks.filter((t) => t.column === "in-progress").length}</span>
      </div>
    </div>
  );
}
