
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, fileUrl } from "@/lib/api";
import { docLabel } from "@/lib/site";

type GalleryItem = {
  id: number;
  title: string;
  caption: string;
  image: string | null;
  event_year: number | null;
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/admin/gallery");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setItems(data.gallery || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditId(null);
    setTitle("");
    setCaption("");
    setYear("");
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function edit(item: GalleryItem) {
    setEditId(item.id);
    setTitle(item.title);
    setCaption(item.caption);
    setYear(item.event_year ? String(item.event_year) : "");
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
      if (!f.type.startsWith("image/")) {
        setError("Please choose an image file.");
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
      fd.append("caption", caption);
      fd.append("event_year", year);
      const file = fileRef.current?.files?.[0];
      if (file) fd.append("image", file);
      if (!editId && !file) throw new Error("Please choose an image to upload.");
      const res = await fetch(editId ? `/api/admin/gallery/${editId}` : "/api/admin/gallery", {
        method: editId ? "PUT" : "POST",
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setFlash(editId ? "Gallery item updated." : "Image added to the gallery.");
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function remove(item: GalleryItem) {
    if (!confirm(`Delete "${item.title}" from the gallery?`)) return;
    await apiFetch(`/api/admin/gallery/${item.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Gallery & Events</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload photos from events, reunions and the life of the association.
        </p>
      </div>

      <form onSubmit={save} className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">
          {editId ? "Edit Gallery Item" : "Add Photo / Event"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr]">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="label">Caption</label>
            <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div>
            <label className="label">Event Year</label>
            <input
              type="number"
              className="input"
              min={1990}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2025"
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
          {preview && <img src={preview} alt="Preview" className="h-20 w-32 rounded-lg object-cover" />}
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {flash && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash}</p>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-navy" disabled={saving}>
            {saving ? "Uploading..." : editId ? "Update Item" : "Upload Image"}
          </button>
          {editId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No images in the gallery yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => (
            <div key={g.id} className="card overflow-hidden">
              {g.image && (
                <img src={fileUrl(g.image)} alt={g.title} className="h-36 w-full object-cover" />
              )}
              <div className="space-y-2 p-4">
                <p className="text-sm font-bold text-navy-900">{g.title}</p>
                <p className="text-xs text-slate-500">{g.caption}</p>
                {g.event_year && (
                  <span className="badge border-gold-300 bg-gold-50 text-gold-700">{g.event_year}</span>
                )}
                <div className="flex gap-3 pt-1">
                  <button className="text-xs font-bold text-navy-700 underline" onClick={() => edit(g)}>
                    Edit
                  </button>
                  <button className="text-xs font-bold text-red-600 underline" onClick={() => remove(g)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
