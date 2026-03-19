"use client";

import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useState, useRef, useEffect, useCallback } from "react";

export default function GameBoyChat() {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [agent.messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(
    (msg: string) => {
      if (!msg.trim() || agent.isRunning) return;
      agent.addMessage({
        role: "user",
        id: crypto.randomUUID(),
        content: msg.trim(),
      });
      copilotkit.runAgent({ agent }).catch((err: unknown) => {
        console.error("runAgent failed:", err);
      });
      setInput("");
      inputRef.current?.focus();
    },
    [agent, copilotkit]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const visibleMessages = agent.messages.filter((m) => {
    const content = typeof m.content === "string" ? m.content.trim() : "";
    if (!content) return false;
    // Skip tool-related messages (role: tool, or content that looks like JSON/tool output)
    if (m.role === "tool") return false;
    if (m.role !== "user" && m.role !== "assistant") return false;
    // Skip messages that are just JSON dumps (tool results leaking as text)
    if (content.startsWith("[{") || content.startsWith("{\"")) return false;
    // Skip assistant messages that contain tool call markers
    if ("toolCalls" in m && (m as Record<string, unknown>).toolCalls) return false;
    return true;
  });

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            width: 384,
            height: 460,
            marginBottom: 8,
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          className="gb-screen"
        >
          {/* Header */}
          <div className="gb-column-header p-3 text-center text-sm relative z-10 flex items-center justify-between">
            <span className="opacity-60">◄</span>
            <span>═ COPILOT ═</span>
            <span className="opacity-60">►</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 relative z-10">
            {visibleMessages.length === 0 && (
              <div className="text-center text-xs text-[var(--nes-gray)] mt-8 leading-loose px-3">
                <pre className="text-[10px] leading-tight mb-4 text-[var(--nes-sky)]">
{`  ┌──────────────────┐
  │    ◆ READY ◆     │
  └──────────────────┘`}
                </pre>
                <p className="mt-3 text-[var(--nes-cream)]">▶ ADD TASK...</p>
                <p className="mt-2 text-[var(--nes-cream)]">▶ MOVE ... TO DONE</p>
                <p className="mt-2 text-[var(--nes-cream)]">▶ DELETE ...</p>
                <p className="mt-4">
                  <span className="gb-blink text-[var(--nes-gold)]">▌</span>
                </p>
              </div>
            )}

            {visibleMessages.map((msg) => {
              const content =
                typeof msg.content === "string" ? msg.content : "";
              if (!content) return null;
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] p-4 text-[11px] break-words ${
                      isUser ? "gb-chat-bubble-user" : "gb-chat-bubble-ai"
                    }`}
                    style={{ lineHeight: "2.4", wordSpacing: "6px", letterSpacing: "1px" }}
                  >
                    <div className="text-[9px] mb-3 opacity-60 tracking-[3px]">
                      {isUser ? "► P1" : "► CPU"}
                    </div>
                    <div className="text-white">{content}</div>
                  </div>
                </div>
              );
            })}

            {agent.isRunning && (
              <div className="flex justify-start">
                <div className="gb-chat-bubble-ai p-3 text-xs">
                  <span className="gb-blink text-[var(--nes-sky)]">● ● ●</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t-4 border-[var(--nes-blue)] bg-[var(--nes-dark)] relative z-10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="TYPE CMD..."
                disabled={agent.isRunning}
                className="flex-1 bg-[var(--nes-black)] text-[var(--nes-white)] text-[11px] p-3 border-3 border-[var(--nes-blue)] outline-none placeholder-[var(--nes-gray)] font-[inherit] disabled:opacity-50 focus:border-[var(--nes-sky)]"
                style={{ letterSpacing: "1px" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={agent.isRunning || !input.trim()}
                className="gb-btn text-xs px-4 disabled:opacity-50"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ pointerEvents: "auto" }}
        className="w-16 h-16 rounded-full bg-[var(--nes-red)] border-4 border-[var(--nes-black)] text-[var(--nes-white)] text-sm font-[inherit] cursor-pointer hover:brightness-110 active:translate-y-[2px] ml-auto block"
      >
        {isOpen ? "B" : "A"}
      </button>
    </div>
  );
}
