
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, fileUrl } from "@/lib/api";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/format";
import { Excerpt } from "@/components/ui";

type NewsItem = {
  id: number;
  title: string;
  body: string;
  image: string | null;
  date: string;
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [body, setBody] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/admin/news");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setItems(data.news || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditId(null);
    setTitle("");
    setDate("");
    setBody("");
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function edit(item: NewsItem) {
    setEditId(item.id);
    setTitle(item.title);
    setDate(item.date || "");
    setBody(item.body);
    setPreview(item.image ? fileUrl(item.image) : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 8 * 1024 * 1024) {
        setError("Image must be under 8 MB.");
        e.target.value = "";
        return;
      }
      setPreview(URL.createObjectURL(f));
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("date", date);
      fd.append("body", body);
      const file = fileRef.current?.files?.[0];
      if (file) fd.append("image", file);
      const res = await fetch(
        editId ? `/api/admin/news/${editId}` : "/api/admin/news",
        { method: editId ? "PUT" : "POST", body: fd }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setFlash(editId ? "News updated." : "News published.");
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function remove(item: NewsItem) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await apiFetch(`/api/admin/news/${item.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">News</h1>
        <p className="mt-1 text-sm text-slate-500">
          Publish association announcements. They appear on the homepage and the News page.
        </p>
      </div>

      <form onSubmit={save} className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">
          {editId ? "Edit News" : "Publish New News"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Body * (blank line between paragraphs)</label>
          <textarea
            className="input min-h-44"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-700 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-navy-600"
          />
          {preview && <img src={preview} alt="Preview" className="h-16 w-24 rounded-lg object-cover" />}
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {flash && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash}</p>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-navy" disabled={saving}>
            {saving ? "Saving..." : editId ? "Update News" : "Publish News"}
          </button>
          {editId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-24">Image</th>
              <th>Title</th>
              <th>Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-10 text-center text-slate-400">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="py-10 text-center text-slate-500">No news yet.</td></tr>
            ) : (
              items.map((n) => (
                <tr key={n.id}>
                  <td>
                    {n.image ? (
                      <img src={fileUrl(n.image)} alt="" className="h-12 w-20 rounded-lg object-cover" />
                    ) : (
                      <div className="h-12 w-20 rounded-lg bg-navy-100" />
                    )}
                  </td>
                  <td>
                    <p className="font-semibold text-navy-900">{n.title}</p>
                    <p className="mt-1 max-w-xl text-xs text-slate-500">
                      <Excerpt text={n.body} length={110} />
                    </p>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(n.date)}</td>
                  <td className="whitespace-nowrap text-right">
                    <Link to={`/news/${n.id}`} className="mr-3 text-xs font-bold text-slate-500 underline" target="_blank">
                      View
                    </Link>
                    <button className="mr-3 text-xs font-bold text-navy-700 underline" onClick={() => edit(n)}>
                      Edit
                    </button>
                    <button className="text-xs font-bold text-red-600 underline" onClick={() => remove(n)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
