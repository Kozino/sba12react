
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "sent") {
    return (
      <div className="card border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          ✓
        </div>
        <h3 className="mt-4 font-display text-xl font-bold text-navy-900">
          Message sent
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Thank you for reaching out. The association will get back to you as soon as
          possible.
        </p>
        <button className="btn btn-outline mt-6" onClick={() => setStatus("idle")}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">Full Name *</label>
          <input
            id="c-name"
            className="input"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. John Obi"
          />
        </div>
        <div>
          <label className="label" htmlFor="c-email">Email Address *</label>
          <input
            id="c-email"
            type="email"
            className="input"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="c-phone">Phone Number</label>
          <input
            id="c-phone"
            className="input"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+234 ..."
          />
        </div>
        <div>
          <label className="label" htmlFor="c-subject">Subject *</label>
          <input
            id="c-subject"
            className="input"
            required
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            placeholder="What is this about?"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-message">Message *</label>
        <textarea
          id="c-message"
          className="input min-h-36"
          required
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Write your message..."
        />
      </div>
      {status === "error" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-navy" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
