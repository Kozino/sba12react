import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

type Msg = { role: "user" | "bot"; text: string };

const STARTER = "Hi! I can answer questions about the Bosco Class of 2012 constitution — dues, membership, executives, meetings, benefits, and more. What would you like to know?";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "bot", text: STARTER }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((m) => [...m, { role: "bot", text: data.answer || "Sorry, I couldn't find an answer." }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "bot", text: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      ]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Ask about the constitution"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-white shadow-lg transition hover:bg-navy-700 sm:h-16 sm:w-16"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 flex h-[70vh] max-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:w-96">
          <div className="flex items-center gap-3 bg-navy-950 px-4 py-3.5 text-white">
            <img src="/logo.png" alt="" className="h-8 w-8" />
            <div className="leading-tight">
              <p className="font-display text-sm font-bold">SBA 2012 Assistant</p>
              <p className="text-[11px] text-gold-400">Ask about the constitution</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto rounded-br-sm bg-navy-700 text-white"
                    : "mr-auto rounded-bl-sm bg-white text-slate-700 shadow-sm"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm text-slate-400 shadow-sm">
                Typing…
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. How much is the annual due?"
              className="input flex-1 text-sm"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-navy btn-sm shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
