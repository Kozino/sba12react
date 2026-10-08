import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, fileUrl } from "@/lib/api";

type Executive = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  sort_order: number;
  tenure_id: number | null;
};

type Tenure = {
  id: number;
  start_year: number;
  end_year: number;
  executives: Executive[];
};

export default function AdminExecutivesPage() {
  const [items, setItems] = useState<Executive[]>([]);
  const [tenures, setTenures] = useState<Tenure[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [tenureSel, setTenureSel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Tenure manager
  const [tStart, setTStart] = useState("");
  const [tEnd, setTEnd] = useState("");
  const [editTenureId, setEditTenureId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/admin/executives");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setItems(data.executives || []);
    const tRes = await apiFetch("/api/admin/executive-tenures");
    if (tRes.ok) {
      const tData = await tRes.json();
      setTenures(tData.tenures || []);
    }
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
    setTenureSel("");
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function edit(item: Executive) {
    setEditId(item.id);
    setName(item.name);
    setPosition(item.position);
    setSortOrder(String(item.sort_order ?? 0));
    setTenureSel(item.tenure_id ? String(item.tenure_id) : "");
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
      fd.append("tenure_id", tenureSel);
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

  async function saveTenure(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(
        editTenureId ? `/api/admin/executive-tenures/${editTenureId}` : "/api/admin/executive-tenures",
        {
          method: editTenureId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start_year: Number(tStart), end_year: Number(tEnd) })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save tenure");
      setFlash(editTenureId ? "Tenure updated." : "Tenure created. Now add its executives below or via the form above.");
      setTStart("");
      setTEnd("");
      setEditTenureId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tenure");
    }
    setSaving(false);
  }

  function editTenure(t: Tenure) {
    setEditTenureId(t.id);
    setTStart(String(t.start_year));
    setTEnd(String(t.end_year));
  }

  async function removeTenure(t: Tenure) {
    if (
      !confirm(
        `Delete the ${t.start_year} – ${t.end_year} tenure? Its ${t.executives.length} executive(s) will also be removed from the Past Executives section.`
      )
    )
      return;
    await apiFetch(`/api/admin/executive-tenures/${t.id}`, { method: "DELETE" });
    if (tenureSel === String(t.id)) setTenureSel("");
    load();
  }

  const tenureLabel = (id: number | null) => {
    if (!id) return "Current";
    const t = tenures.find((x) => x.id === id);
    return t ? `${t.start_year} – ${t.end_year}` : "Past";
  };

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div>
            <label className="label">Tenure</label>
            <select className="input" value={tenureSel} onChange={(e) => setTenureSel(e.target.value)}>
              <option value="">Current (in office)</option>
              {tenures.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  Past: {t.start_year} – {t.end_year}
                </option>
              ))}
            </select>
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
              <th>Tenure</th>
              <th>Order</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-slate-500">No executives yet.</td></tr>
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
                  <td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        ex.tenure_id ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {tenureLabel(ex.tenure_id)}
                    </span>
                  </td>
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

      {/* Past executives: tenures first, then their executives */}
      <div className="card space-y-5 p-6">
        <div>
          <h2 className="font-display text-lg font-bold text-navy-900">Past Executives — Tenures</h2>
          <p className="mt-1 text-sm text-slate-500">
            First create a tenure (start and end year), then add the executives who served in it
            using the <strong>Tenure</strong> selector in the form above.
          </p>
        </div>

        <form onSubmit={saveTenure} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Start year *</label>
            <input
              type="number"
              className="input w-28"
              min={1900}
              max={2200}
              placeholder="e.g. 2012"
              value={tStart}
              onChange={(e) => setTStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">End year *</label>
            <input
              type="number"
              className="input w-28"
              min={1900}
              max={2200}
              placeholder="e.g. 2015"
              value={tEnd}
              onChange={(e) => setTEnd(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-navy" disabled={saving}>
            {editTenureId ? "Update Tenure" : "+ Add Tenure"}
          </button>
          {editTenureId && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setEditTenureId(null);
                setTStart("");
                setTEnd("");
              }}
            >
              Cancel
            </button>
          )}
        </form>

        {tenures.length === 0 ? (
          <p className="text-sm text-slate-500">
            No past tenures yet. The public page shows only current executives until you add one.
          </p>
        ) : (
          <div className="space-y-6">
            {tenures.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-navy-800">
                    {t.start_year} – {t.end_year}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {t.executives.length} executive{t.executives.length === 1 ? "" : "s"}
                    </span>
                  </h3>
                  <div>
                    <button className="mr-3 text-xs font-bold text-navy-700 underline" onClick={() => editTenure(t)}>
                      Edit years
                    </button>
                    <button className="text-xs font-bold text-red-600 underline" onClick={() => removeTenure(t)}>
                      Delete tenure
                    </button>
                  </div>
                </div>
                {t.executives.length > 0 && (
                  <ul className="mt-3 divide-y divide-slate-100">
                    {t.executives.map((ex) => (
                      <li key={ex.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="flex items-center gap-3">
                          {ex.image ? (
                            <img src={fileUrl(ex.image)} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-navy-100" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-navy-900">{ex.name}</p>
                            <p className="text-xs text-slate-500">{ex.position}</p>
                          </div>
                        </div>
                        <div className="whitespace-nowrap">
                          <button className="mr-3 text-xs font-bold text-navy-700 underline" onClick={() => edit(ex)}>
                            Edit
                          </button>
                          <button className="text-xs font-bold text-red-600 underline" onClick={() => remove(ex)}>
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
