
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, fileUrl } from "@/lib/api";
import { DOC_TYPES, docLabel } from "@/lib/site";

type DocItem = {
  id: number;
  type: string;
  year: number | null;
  title: string;
  filename: string | null;
  text: string;
};

export default function AdminDocumentsPage() {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<string>(DOC_TYPES[1].key);
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/admin/documents");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setItems(data.documents || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : "");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("year", year);
      fd.append("title", title);
      fd.append("text", text);
      const file = fileRef.current?.files?.[0];
      if (file) {
        if (file.size > 15 * 1024 * 1024) throw new Error("File must be under 15 MB.");
        fd.append("file", file);
      }
      const res = await apiFetch("/api/admin/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setFlash(`Uploaded to “${docLabel(type)}”.`);
      setTitle("");
      setText("");
      setYear("");
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function remove(item: DocItem) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await apiFetch(`/api/admin/documents/${item.id}`, { method: "DELETE" });
    load();
  }

  const grouped = DOC_TYPES.map((t) => ({
    ...t,
    docs: items.filter((d) => d.type === t.key)
  })).filter((g) => g.docs.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload the financial reports, minutes of meetings, attendance and financial
          presence records for each year. Members can view them on the Audit Portal.
        </p>
      </div>

      <form onSubmit={save} className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Upload a Document</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Document Type *</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {DOC_TYPES.filter((d) => d.key !== "constitution").map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year *</label>
            <input
              type="number"
              className="input"
              min={1990}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. ${docLabel(type)} — ${year || "2026"}`}
              required
            />
          </div>
        </div>
        <div>
          <label className="label">
            File (PDF, Word, Excel or image) <span className="font-normal text-slate-400">— or paste the text below</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
            onChange={onFile}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-700 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-navy-600"
          />
          {fileName && <p className="mt-1 text-xs text-slate-500">Selected: {fileName}</p>}
        </div>
        <div>
          <label className="label">Document Text (optional)</label>
          <textarea
            className="input min-h-32"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full text here so members can read it directly on the Audit Portal..."
          />
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {flash && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash}</p>
        )}
        <button type="submit" className="btn btn-navy" disabled={saving}>
          {saving ? "Uploading..." : "Upload Document"}
        </button>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : grouped.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-5">
          {grouped.map((g) => (
            <div key={g.key} className="card overflow-x-auto">
              <div className="border-b border-slate-200 px-5 py-3.5">
                <h2 className="font-display text-base font-bold text-navy-900">{g.label}</h2>
              </div>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Year</th>
                    <th>Format</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {g.docs.map((d) => (
                    <tr key={d.id}>
                      <td className="font-medium text-slate-800">{d.title}</td>
                      <td>{d.year ?? "—"}</td>
                      <td>
                        <span className="badge border-navy-200 bg-navy-50 text-navy-700">
                          {d.filename ? "File" : "Text"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        {d.filename && (
                          <a
                            href={fileUrl(d.filename)}
                            className="mr-3 text-xs font-bold text-navy-700 underline"
                            download
                          >
                            Download
                          </a>
                        )}
                        <button className="text-xs font-bold text-red-600 underline" onClick={() => remove(d)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
