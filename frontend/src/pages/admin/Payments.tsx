
import { Suspense, useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { naira, formatDate, paymentStatus } from "@/lib/format";
import { PAYMENT_TYPES, payLabel } from "@/lib/site";
import { StatusBadge, EmptyState } from "@/components/ui";

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

  const [memberId, setMemberId] = useState<number | "">("");
  const [type, setType] = useState<string>(PAYMENT_TYPES[0].key);
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [expected, setExpected] = useState<string>("0");
  const [paid, setPaid] = useState<string>("0");
  const [note, setNote] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

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

  const filtered =
    memberFilter && members.length > 0
      ? (() => {
          const m = members.find((x) => x.unique_id === memberFilter);
          return m ? payments.filter((p) => p.member_id === m.id) : payments;
        })()
      : payments;

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
          <h2 className="font-display text-lg font-bold text-navy-900">
            All Payment Records
          </h2>
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
                    <EmptyState message="No payment records yet. Use the form above to record the first one." />
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
