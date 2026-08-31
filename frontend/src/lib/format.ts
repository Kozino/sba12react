export function naira(n: number | null | undefined): string {
  const value = Number(n) || 0;
  return (
    "₦" +
    value.toLocaleString("en-NG", { maximumFractionDigits: 0 })
  );
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(String(iso).includes("T") ? iso : iso + "T00:00:00");
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export type StatusTone = "green" | "amber" | "red" | "slate";

export function paymentStatus(
  expected: number,
  paid: number
): { label: string; tone: StatusTone } {
  if (expected > 0 && paid >= expected) return { label: "Paid", tone: "green" };
  if (expected > 0 && paid > 0)
    return { label: "Partially Paid", tone: "amber" };
  if (expected > 0) return { label: "Owing", tone: "red" };
  if (paid > 0) return { label: "Contribution", tone: "green" };
  return { label: "No Record", tone: "slate" };
}

export const toneClasses: Record<StatusTone, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  red: "bg-red-100 text-red-700 border-red-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200"
};
