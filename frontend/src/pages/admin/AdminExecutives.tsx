import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, fileUrl } from "@/lib/api";

type Executive = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  sort_order: number;
};

export default function AdminExecutivesPage() {
  const [items, setItems] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/admin/executives");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setItems(data.executives || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditId(null);
    setName("");
    setPosition("");
    setSortOrder("0");
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function edit(item: Executive) {
    setEditId(item.id);
    setName(item.name);
    setPosition(item.position);
    setSortOrder(String(item.sort_order ?? 0));
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
      fd.append("name", name);
      fd.append("position", position);
      fd.append("sort_order", sortOrder);
      const file = fileRef.current?.files?.[0];
      if (file) fd.append("image", file);
      const res = await apiFetch(
        editId ? `/api/admin/executives/${editId}` : "/api/admin/executives",
        { method: editId ? "PUT" : "POST", body: fd }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setFlash(editId ? "Executive updated." : "Executive added.");
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function remove(item: Executive) {
    if (!confirm(`Remove "${item.name}" from the executives list?`)) return;
    await apiFetch(`/api/admin/executives/${item.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Executives</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the leadership shown on the public Executives page. Update this whenever
          there's a change in government.
        </p>
      </div>

      <form onSubmit={save} className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">
          {editId ? "Edit Executive" : "Add Executive"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Position *</label>
            <input
              className="input"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. President"
              required
            />
          </div>
          <div>
            <label className="label">Display Order</label>
            <input
              type="number"
              className="input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-700 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-navy-600"
          />
          {preview && <img src={preview} alt="Preview" className="h-16 w-16 rounded-full object-cover" />}
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {flash && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash}</p>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-navy" disabled={saving}>
            {saving ? "Saving..." : editId ? "Update Executive" : "Add Executive"}
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
              <th className="w-20">Photo</th>
              <th>Name</th>
              <th>Position</th>
              <th>Order</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-500">No executives yet.</td></tr>
            ) : (
              items.map((ex) => (
                <tr key={ex.id}>
                  <td>
                    {ex.image ? (
                      <img src={fileUrl(ex.image)} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-navy-100" />
                    )}
                  </td>
                  <td className="font-semibold text-navy-900">{ex.name}</td>
                  <td>{ex.position}</td>
                  <td>{ex.sort_order}</td>
                  <td className="whitespace-nowrap text-right">
                    <button className="mr-3 text-xs font-bold text-navy-700 underline" onClick={() => edit(ex)}>
                      Edit
                    </button>
                    <button className="text-xs font-bold text-red-600 underline" onClick={() => remove(ex)}>
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
