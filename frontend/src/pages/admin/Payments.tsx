import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { naira, formatDate, paymentStatus } from "@/lib/format";
import { PAYMENT_TYPES, payLabel } from "@/lib/site";
import { StatusBadge, EmptyState } from "@/components/ui";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Member = {
  id: number;
  unique_id: string;
  first_name: string;
  last_name: string;
};

type Payment = {
  id: number;
  member_id: number;
  unique_id: string;
  first_name: string;
  last_name: string;
  type: string;
  year: number;
  expected: number;
  paid: number;
  note: string;
  updated_at: string;
};

const STATUS_OPTIONS = ["Paid", "Partially Paid", "Owing", "Contribution", "No Record"];

/* ---------------- Export helpers ---------------- */

function downloadBlob(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportCsv(rows: Payment[]) {
  const header = [
    "Member ID",
    "Member Name",
    "Payment Type",
    "Year",
    "Expected (NGN)",
    "Paid (NGN)",
    "Balance (NGN)",
    "Status",
    "Note",
    "Updated"
  ];
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((p) => {
    const st = paymentStatus(p.expected, p.paid);
    return [
      p.unique_id,
      `${p.first_name} ${p.last_name}`.trim(),
      payLabel(p.type),
      p.year,
      p.expected,
      p.paid,
      Math.max(0, p.expected - p.paid),
      st.label,
      p.note || "",
      formatDate(p.updated_at)
    ]
      .map(esc)
      .join(",");
  });
  const csv = [header.map(esc).join(","), ...lines].join("\r\n");
  downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), exportFileName(rows, "csv"));
}

function exportPdf(rows: Payment[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.setTextColor(0, 29, 105);
  doc.text("Savio Bosco Alphas 2012 — Payment Records", 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(100);
  const totals = rows.reduce(
    (t, p) => ({
      expected: t.expected + (Number(p.expected) || 0),
      paid: t.paid + (Number(p.paid) || 0)
    }),
    { expected: 0, paid: 0 }
  );
  doc.text(
    `Generated ${new Date().toLocaleString()}  ·  ${rows.length} record(s)  ·  Expected ${naira(totals.expected)}  ·  Paid ${naira(totals.paid)}`,
    40,
    56
  );
  autoTable(doc, {
    startY: 70,
    head: [
      ["Member ID", "Member", "Payment", "Year", "Expected", "Paid", "Balance", "Status", "Note", "Updated"]
    ],
    body: rows.map((p) => {
      const st = paymentStatus(p.expected, p.paid);
      return [
        p.unique_id,
        `${p.first_name} ${p.last_name}`.trim(),
        payLabel(p.type),
        String(p.year),
        naira(p.expected),
        naira(p.paid),
        naira(Math.max(0, p.expected - p.paid)),
        st.label,
        p.note || "—",
        formatDate(p.updated_at)
      ];
    }),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [0, 29, 105], textColor: [253, 191, 46] },
    alternateRowStyles: { fillColor: [243, 245, 252] }
  });
  doc.save(exportFileName(rows, "pdf"));
}

function exportFileName(rows: Payment[], ext: string) {
  const parts: string[] = ["sba12-payments"];
  const years = [...new Set(rows.map((r) => r.year))];
  if (years.length === 1) parts.push(String(years[0]));
  const types = [...new Set(rows.map((r) => r.type))];
  if (types.length === 1) parts.push(types[0].replace(/_/g, "-"));
  const ids = [...new Set(rows.map((r) => r.unique_id))];
  if (ids.length === 1) parts.push(ids[0].toLowerCase());
  return `${parts.join("-")}.${ext}`;
}

/* ---------------- Page ---------------- */

function PaymentsBody() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const memberFilter = params.get("member") || "";

  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Entry form state
  const [memberId, setMemberId] = useState<number | "">("");
  const [type, setType] = useState<string>(PAYMENT_TYPES[0].key);
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [expected, setExpected] = useState<string>("0");
  const [paid, setPaid] = useState<string>("0");
  const [note, setNote] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // Table filter state
  const [fYear, setFYear] = useState<string>("all");
  const [fType, setFType] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fMember, setFMember] = useState<string>("");
  const [fNote, setFNote] = useState<string>("");

  const load = useCallback(async () => {
    const [mRes, pRes] = await Promise.all([
      apiFetch("/api/admin/members"),
      apiFetch("/api/admin/payments")
    ]);
    if (mRes.status === 401 || pRes.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const mData = await mRes.json();
    const pData = await pRes.json();
    // Only approved (active) members can have payments recorded
    setMembers((mData.members || []).filter((m: Member & { status: string }) => m.status === "active"));
    setPayments((pData.payments || []) as Payment[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (memberFilter && members.length > 0) {
      const m = members.find((x) => x.unique_id === memberFilter);
      if (m) setMemberId(m.id);
    }
  }, [memberFilter, members]);

  // Base list = all payments, or just this member's (from the ?member= link)
  const baseList = useMemo(() => {
    if (!memberFilter || members.length === 0) return payments;
    const m = members.find((x) => x.unique_id === memberFilter);
    return m ? payments.filter((p) => p.member_id === m.id) : payments;
  }, [payments, memberFilter, members]);

  const distinctYears = useMemo(
    () => [...new Set(baseList.map((p) => p.year))].sort((a, b) => b - a),
    [baseList]
  );

  // Apply the UI filters
  const filtered = useMemo(() => {
    const memberQ = fMember.trim().toLowerCase();
    const noteQ = fNote.trim().toLowerCase();
    return baseList.filter((p) => {
      if (fYear !== "all" && String(p.year) !== fYear) return false;
      if (fType !== "all" && p.type !== fType) return false;
      if (fStatus !== "all" && paymentStatus(p.expected, p.paid).label !== fStatus) return false;
      if (memberQ) {
        const hay = `${p.first_name} ${p.last_name} ${p.unique_id}`.toLowerCase();
        if (!hay.includes(memberQ)) return false;
      }
      if (noteQ && !String(p.note || "").toLowerCase().includes(noteQ)) return false;
      return true;
    });
  }, [baseList, fYear, fType, fStatus, fMember, fNote]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (t, p) => ({
          expected: t.expected + (Number(p.expected) || 0),
          paid: t.paid + (Number(p.paid) || 0)
        }),
        { expected: 0, paid: 0 }
      ),
    [filtered]
  );

  const hasFilters =
    fYear !== "all" || fType !== "all" || fStatus !== "all" || fMember !== "" || fNote !== "";

  function clearFilters() {
    setFYear("all");
    setFType("all");
    setFStatus("all");
    setFMember("");
    setFNote("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (memberId === "") {
      setError("Please select a member.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: Number(memberId),
          type,
          year: Number(year),
          expected: Number(expected) || 0,
          paid: Number(paid) || 0,
          note
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save payment");
      setFlash(
        editId
          ? "Payment record updated."
          : `Payment recorded for ${new Date().getFullYear()} ${payLabel(type).toLowerCase()}.`
      );
      setNote("");
      setEditId(null);
      setExpected("0");
      setPaid("0");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment");
    }
    setSaving(false);
  }

  function editPayment(p: Payment) {
    setEditId(p.id);
    setMemberId(p.member_id);
    setType(p.type);
    setYear(String(p.year));
    setExpected(String(p.expected));
    setPaid(String(p.paid));
    setNote(p.note || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removePayment(p: Payment) {
    if (!confirm(`Delete the ${payLabel(p.type).toLowerCase()} record for ${p.year}?`)) return;
    await apiFetch(`/api/admin/payments/${p.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Record the dues, presence fees and contributions of every member.
        </p>
      </div>

      {memberFilter && (
        <div className="flex items-center justify-between rounded-lg border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-slate-700">
          <span>
            Showing payments for member ID{" "}
            <span className="font-mono font-bold text-navy-800">{memberFilter}</span>
          </span>
          <button
            className="text-xs font-bold text-navy-700 underline"
            onClick={() => navigate("/admin/payments")}
          >
            Show all members
          </button>
        </div>
      )}

      {/* Entry form */}
      <form onSubmit={save} className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy-900">
            {editId ? "Edit Payment Record" : "Record a Payment"}
          </h2>
          {editId && (
            <button
              type="button"
              className="text-xs font-bold text-slate-500 underline"
              onClick={() => {
                setEditId(null);
                setNote("");
              }}
            >
              Cancel editing
            </button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Member *</label>
            <select className="input" value={memberId} onChange={(e) => setMemberId(Number(e.target.value) || "")}>
              <option value="">— Select a member —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name} ({m.unique_id})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Only approved (active) members are listed.
            </p>
          </div>
          <div>
            <label className="label">Payment Type *</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {PAYMENT_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">
              {PAYMENT_TYPES.find((t) => t.key === type)?.description}
            </p>
          </div>
          <div>
            <label className="label">Year *</label>
            <input
              type="number"
              className="input"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Expected / Owed (₦)</label>
            <input
              type="number"
              className="input"
              min={0}
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-400">What this member owes for this item.</p>
          </div>
          <div>
            <label className="label">Amount Paid (₦)</label>
            <input
              type="number"
              className="input"
              min={0}
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-400">What this member has contributed.</p>
          </div>
          <div>
            <label className="label">Note</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. AGM 31 Dec 2025"
            />
          </div>
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {flash && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flash}
          </p>
        )}
        <button type="submit" className="btn btn-navy" disabled={saving}>
          {saving ? "Saving..." : editId ? "Update Payment Record" : "Save Payment"}
        </button>
      </form>

      {/* All payments */}
      <div className="card overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-navy-900">
              All Payment Records
              <span className="ml-2 text-xs font-semibold text-slate-400">
                {filtered.length} of {baseList.length}
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => exportCsv(filtered)}
                disabled={filtered.length === 0}
              >
                ⬇ Export CSV
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => exportPdf(filtered)}
                disabled={filtered.length === 0}
              >
                ⬇ Export PDF
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="label text-[11px] uppercase tracking-wider text-slate-400">Year</label>
              <select className="input" value={fYear} onChange={(e) => setFYear(e.target.value)}>
                <option value="all">All years</option>
                {distinctYears.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-[11px] uppercase tracking-wider text-slate-400">Payment type</label>
              <select className="input" value={fType} onChange={(e) => setFType(e.target.value)}>
                <option value="all">All types</option>
                {PAYMENT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-[11px] uppercase tracking-wider text-slate-400">Status</label>
              <select className="input" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-[11px] uppercase tracking-wider text-slate-400">Member (name or ID)</label>
              <input
                className="input"
                placeholder="e.g. Okoyeocha or SBA12P47"
                value={fMember}
                onChange={(e) => setFMember(e.target.value)}
              />
            </div>
            <div>
              <label className="label text-[11px] uppercase tracking-wider text-slate-400">Note / keyword</label>
              <input
                className="input"
                placeholder="e.g. AGM, wedding"
                value={fNote}
                onChange={(e) => setFNote(e.target.value)}
              />
            </div>
          </div>
          {hasFilters && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Filtered totals — Expected{" "}
                <strong className="text-navy-800">{naira(totals.expected)}</strong> · Paid{" "}
                <strong className="text-navy-800">{naira(totals.paid)}</strong> · Balance{" "}
                <strong className="text-red-600">{naira(Math.max(0, totals.expected - totals.paid))}</strong>
              </span>
              <button className="font-bold text-navy-700 underline" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Member</th>
              <th>Payment</th>
              <th>Year</th>
              <th className="text-right">Expected</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="py-6">
                    <EmptyState
                      message={
                        hasFilters
                          ? "No records match the current filters. Clear the filters to see everything."
                          : "No payment records yet. Use the form above to record the first one."
                      }
                    />
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const st = paymentStatus(p.expected, p.paid);
                const balance = Math.max(0, p.expected - p.paid);
                return (
                  <tr key={p.id}>
                    <td>
                      <p className="font-semibold text-navy-900">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400">{p.unique_id}</p>
                    </td>
                    <td>{payLabel(p.type)}</td>
                    <td>{p.year}</td>
                    <td className="text-right">{naira(p.expected)}</td>
                    <td className="text-right">{naira(p.paid)}</td>
                    <td className={`text-right font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {naira(balance)}
                    </td>
                    <td>
                      <StatusBadge tone={st.tone} label={st.label} />
                      <p className="mt-1 text-[10px] text-slate-400">
                        {p.note ? `${p.note} · ` : ""}
                        {formatDate(p.updated_at)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap">
                      <button
                        className="mr-3 text-xs font-bold text-navy-700 underline"
                        onClick={() => editPayment(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs font-bold text-red-600 underline"
                        onClick={() => removePayment(p)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-slate-500">Loading…</div>
      }
    >
      <PaymentsBody />
    </Suspense>
  );
}
