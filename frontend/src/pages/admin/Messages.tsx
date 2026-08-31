
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

type Message = {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  created_at: string;
};

export default function AdminMessagesPage() {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/admin/messages");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setItems(data.messages || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(m: Message) {
    if (!confirm(`Delete the message from ${m.name}?`)) return;
    await apiFetch(`/api/admin/messages/${m.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">
          Messages sent through the public Contact page.
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          No messages yet.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-navy-900">{m.subject}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    From <span className="font-semibold text-slate-700">{m.name}</span> ·{" "}
                    <a href={`mailto:${m.email}`} className="text-navy-700 underline">{m.email}</a>
                    {m.phone && <> · {m.phone}</>} · {formatDate(m.created_at)}
                  </p>
                </div>
                <button
                  className="text-xs font-bold text-red-600 underline"
                  onClick={() => remove(m)}
                >
                  Delete
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {m.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
