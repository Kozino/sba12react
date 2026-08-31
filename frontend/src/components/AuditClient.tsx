
import { Suspense, useEffect, useMemo, useState } from "react";
import { apiFetch, fileUrl } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { naira, formatDate, paymentStatus } from "@/lib/format";
import { payLabel, docLabel } from "@/lib/site";
import { StatusBadge, EmptyState } from "@/components/ui";

type AuditData = {
  ok: boolean;
  member: {
    unique_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    hometown: string;
    hometown_parish: string;
    registered_at: string;
  };
  payments: {
    id: number;
    type: string;
    year: number;
    expected: number;
    paid: number;
    note: string;
    updated_at: string;
  }[];
  totals: { expected: number; paid: number; owing: number };
  documents: {
    id: number;
    type: string;
    year: number | null;
    title: string;
    filename: string | null;
    text: string;
  }[];
};

function AuditBody() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get("id");

  const [idInput, setIdInput] = useState(initial ?? "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AuditData | null | undefined>(initial ? null : undefined);
  const [tab, setTab] = useState("payments");

  const dataLoaded = data !== undefined;

  async function runCheck(value: string) {
    const id = value.trim().toUpperCase();
    if (!id) {
      setError("Please enter your unique member ID.");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/audit?id=${encodeURIComponent(id)}`);
      const body = await res.json();
      if (!res.ok) {
        setData(null);
        setError(
          body.error ||
            "No member was found with that ID. Please check your member ID and try again."
        );
      } else {
        setData(body);
        setTab("payments");
      }
    } catch {
      setData(null);
      setError("A network error occurred. Please try again.");
    }
    setChecking(false);
  }

  useEffect(() => {
    if (initial) runCheck(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const docGroups = useMemo(() => {
    if (!data) return {};
    const groups: Record<string, AuditData["documents"]> = {};
    for (const d of data.documents) {
      (groups[d.type] ??= []).push(d);
    }
    return groups;
  }, [data]);

  const [docYear, setDocYear] = useState<Record<string, string>>({});

  const tabs = [
    ["payments", "My Payments"],
    ["constitution", "Constitution"],
    ["minutes", "Minutes of Meeting"],
    ["financial_report", "Financial Reports"],
    ["attendance", "Attendance"]
  ] as const;

  /* ---------------- Locked state ---------------- */
  if (!dataLoaded && data === null && !error) {
    return (
      <LockedView
        idInput={idInput}
        setIdInput={setIdInput}
        checking={checking}
        onSubmit={() => runCheck(idInput)}
      />
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-xl text-white">
            !
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-navy-900">
            Access not granted
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-red-700">{error}</p>
        </div>
        <LockedView
          compact
          idInput={idInput}
          setIdInput={setIdInput}
          checking={checking}
          onSubmit={() => runCheck(idInput)}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <LockedView
        idInput={idInput}
        setIdInput={setIdInput}
        checking={checking}
        onSubmit={() => runCheck(idInput)}
      />
    );
  }

  /* ---------------- Authenticated view ---------------- */
  const memberName = [
    data.member.first_name,
    data.member.middle_name,
    data.member.last_name
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto max-w-5xl">
      {/* Member header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700">
        <div className="flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-400">
              Member Audit Portal
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
              {memberName}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {[data.member.hometown, data.member.hometown_parish]
                .filter(Boolean)
                .join(" · ") || "Member of the association"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Member since {formatDate(data.member.registered_at)}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Unique Member ID
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-[0.15em] text-gold-400">
              {data.member.unique_id}
            </p>
            <button
              onClick={() => navigate("/audit")}
              className="mt-3 text-xs font-semibold text-slate-300 underline hover:text-white"
            >
              Use a different ID
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-white/10 px-4">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors ${
                tab === key
                  ? "border-b-2 border-gold-400 text-gold-300"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {tab === "payments" && (
          <PaymentsView data={data} />
        )}
        {tab === "constitution" && (
          <ConstitutionView docs={docGroups["constitution"] ?? []} />
        )}
        {tab === "minutes" && (
          <DocsView
            label="Minutes of Meeting"
            docs={docGroups["minutes"] ?? []}
            selectedYear={docYear["minutes"]}
            onYear={(y) => setDocYear((s) => ({ ...s, minutes: y }))}
          />
        )}
        {tab === "financial_report" && (
          <DocsView
            label="Financial Reports"
            docs={docGroups["financial_report"] ?? []}
            selectedYear={docYear["financial_report"]}
            onYear={(y) => setDocYear((s) => ({ ...s, financial_report: y }))}
          />
        )}
        {tab === "attendance" && (
          <AttendanceView
            docs={docGroups["attendance"] ?? []}
            presenceDocs={docGroups["financial_presence"] ?? []}
            selectedYear={docYear["attendance"]}
            onYear={(y) => setDocYear((s) => ({ ...s, attendance: y }))}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- Payments tab ---------------- */

function PaymentsView({ data }: { data: AuditData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Total Expected" value={naira(data.totals.expected)} tone="navy" />
        <Tile label="Total Paid" value={naira(data.totals.paid)} tone="green" />
        <Tile label="Total Owing" value={naira(data.totals.owing)} tone="red" />
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Year</th>
              <th className="text-right">Expected</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Balance</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">
                  No payment records have been made for you yet.
                </td>
              </tr>
            ) : (
              data.payments.map((p) => {
                const st = paymentStatus(p.expected, p.paid);
                const balance = Math.max(0, p.expected - p.paid);
                return (
                  <tr key={p.id}>
                    <td className="font-semibold text-navy-900">{payLabel(p.type)}</td>
                    <td>{p.year}</td>
                    <td className="text-right">{naira(p.expected)}</td>
                    <td className="text-right">{naira(p.paid)}</td>
                    <td className={`text-right font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {naira(balance)}
                    </td>
                    <td>
                      <StatusBadge tone={st.tone} label={st.label} />
                    </td>
                    <td className="text-xs text-slate-500">
                      {p.note || "—"}
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        Updated {formatDate(p.updated_at)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Amounts are recorded and updated by the association&rsquo;s executives. If you
        believe any figure is incorrect, please contact the association and quote your
        member ID.
      </p>
    </div>
  );
}

function Tile({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "navy" | "green" | "red";
}) {
  const cls =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "red"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-navy-200 bg-navy-50 text-navy-800";
  return (
    <div className={`rounded-xl border p-5 ${cls}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

/* ---------------- Constitution tab ---------------- */

function ConstitutionView({ docs }: { docs: AuditData["documents"] }) {
  const doc = docs[0];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          The full constitution of the association, adopted at an Annual General
          Meeting.
        </p>
        {doc?.filename && (
          <a
            href={fileUrl(doc.filename)}
            download
            className="btn btn-navy btn-sm"
          >
            ⬇ Download PDF
          </a>
        )}
      </div>
      {doc ? (
        <div className="card max-h-[32rem] overflow-y-auto p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
            {doc.text || "The text of the constitution is available in the PDF download above."}
          </pre>
        </div>
      ) : (
        <EmptyState message="The constitution has not been published yet." />
      )}
    </div>
  );
}

/* ---------------- Yearly documents tabs ---------------- */

function DocsView({
  label,
  docs,
  selectedYear,
  onYear
}: {
  label: string;
  docs: AuditData["documents"];
  selectedYear: string | undefined;
  onYear: (y: string) => void;
}) {
  const years = Array.from(
    new Set(docs.map((d) => d.year).filter((y): y is number => y != null))
  ).sort((a, b) => b - a);
  const year = selectedYear ?? (years[0] != null ? String(years[0]) : "");
  const active = docs.find((d) => (d.year != null && String(d.year) === year) || docs.length === 1);

  return (
    <div className="space-y-5">
      {years.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => onYear(String(y))}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
                String(y) === year
                  ? "border-navy-700 bg-navy-700 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-navy-400"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
      {active ? (
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-navy-900">
                {active.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
            {active.filename && (
              <a
                href={fileUrl(active.filename)}
                download
                className="btn btn-navy btn-sm"
              >
                ⬇ Download File
              </a>
            )}
          </div>
          {active.text ? (
            <pre className="mt-5 max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-5 font-sans text-sm leading-relaxed text-slate-700">
              {active.text}
            </pre>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              This document is available for download.
            </p>
          )}
        </div>
      ) : (
        <EmptyState message={`No ${label.toLowerCase()} is available for the selected year yet.`} />
      )}
    </div>
  );
}

function AttendanceView({
  docs,
  presenceDocs,
  selectedYear,
  onYear
}: {
  docs: AuditData["documents"];
  presenceDocs: AuditData["documents"];
  selectedYear: string | undefined;
  onYear: (y: string) => void;
}) {
  const years = Array.from(
    new Set([...docs, ...presenceDocs].map((d) => d.year).filter((y): y is number => y != null))
  ).sort((a, b) => b - a);
  const year = selectedYear ?? (years[0] != null ? String(years[0]) : "");

  return (
    <div className="space-y-6">
      {years.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => onYear(String(y))}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
                String(y) === year
                  ? "border-navy-700 bg-navy-700 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-navy-400"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
      {[
        ["attendance", "Member Attendance", docs],
        ["financial_presence", "Financial Presence", presenceDocs]
      ].map(([key, label, list]) => {
        const active = (list as AuditData["documents"]).find(
          (d) => d.year != null && String(d.year) === year
        );
        return (
          <div key={String(key)} className="card p-6">
            <h3 className="font-display text-lg font-bold text-navy-900">
              {String(label)} {year && <span className="text-gold-600">— {year}</span>}
            </h3>
            {active ? (
              <>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">{docLabel(String(key))}</p>
                  {active.filename && (
                    <a
                      href={fileUrl(active.filename)}
                      download
                      className="btn btn-navy btn-sm"
                    >
                      ⬇ Download File
                    </a>
                  )}
                </div>
                {active.text && (
                  <pre className="mt-4 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-5 font-sans text-sm leading-relaxed text-slate-700">
                    {active.text}
                  </pre>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No {String(label).toLowerCase()} record is available for this year yet.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Locked view ---------------- */

function LockedView({
  idInput,
  setIdInput,
  checking,
  onSubmit,
  compact
}: {
  idInput: string;
  setIdInput: (v: string) => void;
  checking: boolean;
  onSubmit: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`mx-auto max-w-xl ${compact ? "mt-6" : ""}`}>
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-400 bg-gold-400/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FDBF2E" strokeWidth="2" strokeLinecap="round">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-white">
            Member Audit Portal
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-300">
            This area is reserved for registered members. Enter your unique member ID
            to view your payments, the constitution, the minutes of meetings and the
            financial reports.
          </p>
        </div>
        <form
          className="space-y-4 px-6 py-7"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div>
            <label className="label" htmlFor="audit-id">Your Unique Member ID</label>
            <input
              id="audit-id"
              className="input text-center font-mono text-lg font-bold uppercase tracking-[0.2em]"
              placeholder="SBA12..."
              value={idInput}
              onChange={(e) => setIdInput(e.target.value.toUpperCase())}
              maxLength={8}
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              An 8-character ID starting with{" "}
              <span className="font-mono font-bold">SBA12</span>, given to you when you
              registered with the association.
            </p>
          </div>
          <button type="submit" className="btn btn-gold w-full" disabled={checking}>
            {checking ? "Checking..." : "Unlock My Records"}
          </button>
          <p className="text-center text-xs text-slate-400">
            New here?{" "}
            <Link to="/register" className="font-semibold text-navy-700 underline">
              Register first
            </Link>{" "}
            to receive your member ID.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AuditClient() {
  return (
    <Suspense
      fallback={
        <div className="container-site py-20 text-center text-sm text-slate-500">
          Loading...
        </div>
      }
    >
      <AuditBody />
    </Suspense>
  );
}
