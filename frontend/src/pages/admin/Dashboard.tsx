
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";
import { naira, formatDate, paymentStatus } from "@/lib/format";
import { StatusBadge, EmptyState } from "@/components/ui";

type MemberRow = {
  id: number;
  unique_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  hometown: string;
  hometown_parish: string;
  residential_address: string;
  permanent_address: string;
  status: "pending" | "active" | "rejected";
  registered_at: string;
  total_paid: number;
  total_owing: number;
};

type PaymentRow = {
  id: number;
  type: string;
  year: number;
  expected: number;
  paid: number;
  note: string;
  updated_at: string;
};

const statusBadge = (s: MemberRow["status"]) =>
  s === "active" ? (
    <StatusBadge tone="green" label="Active" />
  ) : s === "pending" ? (
    <StatusBadge tone="amber" label="Pending Approval" />
  ) : (
    <StatusBadge tone="red" label="Rejected" />
  );

export default function DashboardPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "rejected">("all");
  const [selected, setSelected] = useState<MemberRow | null>(null);
  const [detail, setDetail] = useState<{ payments: PaymentRow[] } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await apiFetch("/api/admin/members");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setMembers(data.members || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    filter === "all" ? members : members.filter((m) => m.status === filter);

  const counts = {
    all: members.length,
    pending: members.filter((m) => m.status === "pending").length,
    active: members.filter((m) => m.status === "active").length,
    rejected: members.filter((m) => m.status === "rejected").length
  };

  async function openMember(m: MemberRow) {
    setSelected(m);
    setDetail(null);
    setError("");
    const res = await apiFetch(`/api/admin/members/${m.id}`);
    if (res.ok) {
      const data = await res.json();
      setDetail({ payments: data.payments || [] });
    } else {
      setError("Could not load member details.");
    }
  }

  async function setStatus(m: MemberRow, status: "active" | "rejected") {
    if (
      status === "rejected" &&
      !confirm(
        `Reject the registration of ${m.first_name} ${m.last_name} (${m.unique_id})? They will not be able to use their member ID.`
      )
    )
      return;
    const res = await apiFetch(`/api/admin/members/${m.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const data = await res.json();
      setMembers((list) =>
        list.map((x) => (x.id === m.id ? { ...x, status: data.member.status } : x))
      );
      if (selected?.id === m.id) {
        setSelected((s) => (s ? { ...s, status: data.member.status } : s));
      }
    }
  }

  async function removeMember() {
    if (!selected) return;
    if (!confirm(`Delete member ${selected.first_name} ${selected.last_name} (${selected.unique_id}) and all their payment records? This cannot be undone.`)) return;
    setDeleting(true);
    await apiFetch(`/api/admin/members/${selected.id}`, { method: "DELETE" });
    setDeleting(false);
    setSelected(null);
    setDetail(null);
    load();
  }

  const totalCollected = members.reduce((s, m) => s + (m.total_paid || 0), 0);
  const totalOwing = members.reduce((s, m) => s + (m.total_owing || 0), 0);

  const filters: [typeof filter, string][] = [
    ["all", "All"],
    ["pending", "Pending"],
    ["active", "Active"],
    ["rejected", "Rejected"]
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Approve new registrations, review members and association finances.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/payments" className="btn btn-navy btn-sm">
            Record Payment
          </Link>
          <Link to="/admin/content/news" className="btn btn-outline btn-sm">
            Publish Content
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered Members"
          value={String(counts.all)}
          sub="Total in the association roll"
        />
        <StatCard
          label="Pending Approvals"
          value={String(counts.pending)}
          sub="Awaiting your decision"
          accent={counts.pending > 0 ? "amber" : undefined}
        />
        <StatCard label="Funds Collected" value={naira(totalCollected)} sub="All recorded payments" accent="green" />
        <StatCard label="Funds Owing" value={naira(totalOwing)} sub="Expected but not yet paid" accent="red" />
      </div>

      <div className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-navy-900">Members</h2>
          <div className="flex flex-wrap gap-1.5">
            {filters.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                  filter === key
                    ? "border-navy-700 bg-navy-700 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-navy-400"
                }`}
              >
                {label} ({counts[key]})
              </button>
            ))}
          </div>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Member</th>
              <th>Member ID</th>
              <th>Status</th>
              <th>Hometown</th>
              <th>Registered</th>
              <th className="text-right">Collected</th>
              <th className="text-right">Owing</th>
              <th className="text-right">Approve / Reject</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="py-6">
                    <EmptyState
                      message={
                        filter === "pending"
                          ? "No pending registrations. All caught up!"
                          : "No members in this view. New registrations appear here automatically."
                      }
                    />
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="cursor-pointer" onClick={() => openMember(m)}>
                  <td>
                    <p className="font-semibold text-navy-900">
                      {m.first_name} {m.middle_name} {m.last_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {m.email} · {m.phone || "no phone"}
                    </p>
                  </td>
                  <td className="font-mono text-xs font-bold text-navy-700">{m.unique_id}</td>
                  <td>{statusBadge(m.status)}</td>
                  <td>{m.hometown || "—"}</td>
                  <td className="whitespace-nowrap">{formatDate(m.registered_at)}</td>
                  <td className="text-right font-medium">{naira(m.total_paid)}</td>
                  <td className="text-right">
                    {m.total_owing > 0 ? (
                      <span className="badge border-red-200 bg-red-100 text-red-700">
                        {naira(m.total_owing)}
                      </span>
                    ) : (
                      <span className="badge border-emerald-200 bg-emerald-100 text-emerald-800">
                        Up to date
                      </span>
                    )}
                  </td>
                  <td
                    className="whitespace-nowrap text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {m.status !== "active" && (
                      <button
                        className="mr-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                        onClick={() => setStatus(m, "active")}
                      >
                        ✓ Approve
                      </button>
                    )}
                    {m.status !== "rejected" && (
                      <button
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200"
                        onClick={() => setStatus(m, "rejected")}
                      >
                        ✕ Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Member detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="card my-8 w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 rounded-t-xl bg-gradient-to-r from-navy-950 to-navy-800 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">
                    Member Profile
                  </p>
                  {statusBadge(selected.status)}
                </div>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  {selected.first_name} {selected.middle_name} {selected.last_name}
                </h3>
                <p className="mt-1 font-mono text-sm font-bold tracking-widest text-gold-300">
                  {selected.unique_id}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full border border-white/30 p-1.5 text-white hover:bg-white/10"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registered Details
                </h4>
                <dl className="mt-3 space-y-2 text-sm">
                  {[
                    ["Email", selected.email],
                    ["Phone", selected.phone],
                    ["Hometown", selected.hometown],
                    ["Hometown Parish", selected.hometown_parish],
                    ["Residential Address", selected.residential_address],
                    ["Permanent Address", selected.permanent_address],
                    ["Registered", formatDate(selected.registered_at)]
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                      <dt className="shrink-0 font-semibold text-slate-500">{k}</dt>
                      <dd className="text-right text-slate-800">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Payment Summary
                </h4>
                {!detail ? (
                  <p className="mt-4 text-sm text-slate-400">Loading…</p>
                ) : detail.payments.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No payment records yet.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Year</th>
                          <th className="text-right">Paid</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.payments.map((p) => {
                          const st = paymentStatus(p.expected, p.paid);
                          return (
                            <tr key={p.id}>
                              <td className="capitalize">{p.type.replaceAll("_", " ")}</td>
                              <td>{p.year}</td>
                              <td className="text-right">{naira(p.paid)}</td>
                              <td>
                                <StatusBadge tone={st.tone} label={st.label} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {error && <p className="px-6 pb-2 text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {selected.status === "active" && (
                  <Link
                    to={`/admin/payments?member=${selected.unique_id}`}
                    className="btn btn-gold btn-sm"
                  >
                    Record / Update Payment
                  </Link>
                )}
                {selected.status !== "active" && (
                  <button
                    className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-500"
                    onClick={() => setStatus(selected, "active")}
                  >
                    ✓ Approve Registration
                  </button>
                )}
                {selected.status !== "rejected" && (
                  <button
                    className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200"
                    onClick={() => setStatus(selected, "rejected")}
                  >
                    ✕ Reject
                  </button>
                )}
              </div>
              <button
                onClick={removeMember}
                disabled={deleting}
                className="btn btn-danger btn-sm"
              >
                {deleting ? "Deleting..." : "Delete Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "green" | "red" | "amber";
}) {
  const cls =
    accent === "green"
      ? "text-emerald-700"
      : accent === "red"
        ? "text-red-600"
        : accent === "amber"
          ? "text-amber-600"
          : "text-navy-800";
  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold ${cls}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
