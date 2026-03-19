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
    if (m.role === "user" && typeof m.content === "string" && m.content.trim())
      return true;
    if (
      m.role === "assistant" &&
      typeof m.content === "string" &&
      m.content.trim()
    )
      return true;
    return false;
  });

  return (
    <>
      {/* Toggle button — Game Boy A/B button style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-[var(--gb-dark)] border-4 border-[var(--gb-darkest)] text-[var(--gb-lightest)] text-[8px] font-[inherit] cursor-pointer hover:bg-[var(--gb-darkest)] active:translate-y-[2px]"
        style={{ boxShadow: "3px 3px 0px var(--gb-shadow)" }}
      >
        {isOpen ? "B" : "A"}
      </button>

      {/* Chat panel — Game Boy screen */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 h-[420px] gb-screen flex flex-col">
          {/* Header */}
          <div className="gb-column-header p-2 text-center text-[8px] relative z-10 flex items-center justify-between">
            <span className="opacity-60">◄</span>
            <span>═ COPILOT ═</span>
            <span className="opacity-60">►</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 relative z-10">
            {visibleMessages.length === 0 && (
              <div className="text-center text-[7px] text-[var(--gb-dark)] mt-6 leading-loose px-2">
                <pre className="text-[6px] leading-tight mb-3">
{`  ┌─────────────┐
  │  ◆ READY ◆  │
  └─────────────┘`}
                </pre>
                <p className="mt-2">▶ ADD TASK...</p>
                <p className="mt-1">▶ MOVE ... TO DONE</p>
                <p className="mt-1">▶ DELETE ...</p>
                <p className="mt-3">
                  <span className="gb-blink">▌</span>
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
                    className={`max-w-[85%] p-2 text-[8px] leading-relaxed break-words ${
                      isUser ? "gb-chat-bubble-user" : "gb-chat-bubble-ai"
                    }`}
                  >
                    <div className="text-[6px] mb-1 opacity-60 tracking-widest">
                      {isUser ? "► P1" : "► CPU"}
                    </div>
                    {content}
                  </div>
                </div>
              );
            })}

            {agent.isRunning && (
              <div className="flex justify-start">
                <div className="gb-chat-bubble-ai p-2 text-[8px]">
                  <span className="gb-blink">● ● ●</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t-3 border-[var(--gb-darkest)] bg-[var(--gb-light)] relative z-10">
            <div className="flex gap-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="TYPE CMD..."
                disabled={agent.isRunning}
                className="flex-1 bg-[var(--gb-lightest)] text-[var(--gb-darkest)] text-[8px] p-2 border-2 border-[var(--gb-darkest)] outline-none placeholder-[var(--gb-dark)] font-[inherit] disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={agent.isRunning || !input.trim()}
                className="gb-btn text-[8px] px-3 disabled:opacity-50"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
