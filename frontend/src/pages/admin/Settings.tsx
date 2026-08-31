
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    contact_email: "",
    contact_phone: "",
    contact_address: ""
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pmsg, setPmsg] = useState("");
  const [perr, setPerr] = useState("");
  const [psaving, setPsaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSettings({ ...settings, ...d.settings }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: string, v: string) => setSettings((s) => ({ ...s, [k]: v }));

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMsg("Contact settings saved.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to save");
    }
    setSaving(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setPerr("The new passwords do not match.");
      return;
    }
    setPsaving(true);
    setPerr("");
    setPmsg("");
    try {
      const res = await apiFetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setPmsg("Password changed successfully.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e2) {
      setPerr(e2 instanceof Error ? e2.message : "Failed to change password");
    }
    setPsaving(false);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Public contact details and administrator security.
        </p>
      </div>

      <form onSubmit={saveSettings} className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Public Contact Details</h2>
        <div>
          <label className="label">Association Email</label>
          <input className="input" value={settings.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
        </div>
        <div>
          <label className="label">Association Phone</label>
          <input className="input" value={settings.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Address</label>
          <textarea className="input" value={settings.contact_address} onChange={(e) => set("contact_address", e.target.value)} />
        </div>
        {msg && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</p>
        )}
        {err && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>
        )}
        <button type="submit" className="btn btn-navy" disabled={saving}>
          {saving ? "Saving..." : "Save Contact Details"}
        </button>
      </form>

      <form onSubmit={savePassword} className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Change Password</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        <p className="text-xs text-slate-400">Minimum 8 characters.</p>
        {pmsg && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{pmsg}</p>
        )}
        {perr && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{perr}</p>
        )}
        <button type="submit" className="btn btn-navy" disabled={psaving}>
          {psaving ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
