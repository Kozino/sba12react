import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { naira, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ---------------- Types ---------------- */

type AccountYear = {
  year: number;
  opening_balance: number;
  financial_secretary: string;
  report_note: string;
};

type AccountEntry = {
  id: number;
  year: number;
  kind: "income" | "expense";
  name: string;
  amount: number;
  entry_date: string; // YYYY-MM-DD
  note: string;
  updated_at?: string;
};

type AccountTotals = {
  income: number;
  expense: number;
  net: number;
  opening: number;
  closing: number;
};

/* ---------------- Formatting helpers ---------------- */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

/** "2026-03-15" -> "15 Mar 2026" */
function fmtDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Long date for the report signature block, e.g. "24 September 2026". */
function longDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Classic accounting amount: "NGN 1,234.56" (negative shown as (NGN 1,234.56)). */
function ngn(n: number): string {
  const v = Number(n) || 0;
  const abs = Math.abs(v).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return v < 0 ? `(NGN ${abs})` : `NGN ${abs}`;
}

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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () => reject(new Error("Could not read image"));
    r.readAsDataURL(blob);
  });
}

function sortEntries(entries: AccountEntry[]): AccountEntry[] {
  return [...entries].sort(
    (a, b) => a.entry_date.localeCompare(b.entry_date) || a.id - b.id
  );
}

const reportName = (year: number, ext: string) => `sba12-financial-report-${year}.${ext}`;

/* ---------------- Excel export (SheetJS/ExcelJS) ---------------- */

async function exportExcel(yearRow: AccountYear, entries: AccountEntry[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Savio Bosco Alphas 2012";
  wb.created = new Date();

  const income = sortEntries(entries.filter((e) => e.kind === "income"));
  const expense = sortEntries(entries.filter((e) => e.kind === "expense"));
  const totals = {
    income: income.reduce((s, e) => s + e.amount, 0),
    expense: expense.reduce((s, e) => s + e.amount, 0)
  };
  const opening = Number(yearRow.opening_balance) || 0;
  const net = totals.income - totals.expense;
  const closing = opening + net;

  const NAVY = "FF001D69";
  const thin = { style: "thin" as const, color: { argb: "FF999999" } };
  const allBorder = { top: thin, bottom: thin, left: thin, right: thin };
  const money = (cell: any) => {
    cell.numFmt = "#,##0.00";
    cell.alignment = { horizontal: "right" };
    cell.border = allBorder;
  };

  // ---- Summary sheet ----
  const s = wb.addWorksheet("Summary");
  s.columns = [{ width: 52 }, { width: 26 }];
  s.mergeCells("A1:B1");
  s.getCell("A1").value = "SAVIOBOSCO ALPHAS 2012";
  s.getCell("A1").font = { bold: true, size: 16, color: { argb: NAVY } };
  s.getCell("A1").alignment = { horizontal: "center" };
  s.mergeCells("A2:B2");
  s.getCell("A2").value = "FINANCIAL REPORT";
  s.getCell("A2").font = { bold: true, size: 13 };
  s.getCell("A2").alignment = { horizontal: "center" };
  s.mergeCells("A3:B3");
  s.getCell("A3").value = `Income and Expenditure Statement for the Year ${yearRow.year}`;
  s.getCell("A3").font = { italic: true, size: 11, color: { argb: "FF555555" } };
  s.getCell("A3").alignment = { horizontal: "center" };

  const sumHeader = s.addRow(["Particulars", "Amount (NGN)"]);
  sumHeader.height = 20;
  sumHeader.eachCell({ includeEmpty: true }, (c: any) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.border = allBorder;
    c.alignment = { horizontal: c.col === 2 ? "right" : "left", vertical: "middle" };
  });

  const sumRows: [string, number, boolean][] = [
    ["Balance Brought Forward", opening, false],
    ["Total Income", totals.income, false],
    ["Total Expenditure", totals.expense, false],
    ["Net Surplus / (Deficit)", net, true],
    ["Balance Carried Forward", closing, true]
  ];
  for (const [label, value, bold] of sumRows) {
    const r = s.addRow([label, value]);
    r.getCell(1).border = allBorder;
    r.getCell(1).font = { bold };
    money(r.getCell(2));
    r.getCell(2).font = { bold };
  }
  const lastRow = s.getCell(s.rowCount, 1);
  lastRow.border = {
    ...allBorder,
    bottom: { style: "double", color: { argb: "FF000000" } }
  };
  s.getCell(s.rowCount, 2).border = {
    ...allBorder,
    bottom: { style: "double", color: { argb: "FF000000" } }
  };

  s.addRow([]);
  const noteTextX = String(yearRow.report_note ?? "").trim();
  if (noteTextX) {
    const nr = s.addRow([`Note: ${noteTextX}`, ""]);
    s.mergeCells(nr.number, 1, nr.number, 2);
    const nc = nr.getCell(1);
    nc.value = `Note: ${noteTextX}`;
    nc.font = { bold: true, italic: true };
    nc.alignment = { wrapText: true, vertical: "top" };
    nr.height = Math.max(20, 16 * (1 + Math.floor(noteTextX.length / 90)));
    s.addRow([]);
  }
  const meta: [string, string][] = [
    ["Prepared by", yearRow.financial_secretary || "Financial Secretary"],
    ["Position", "Financial Secretary, Savio Bosco Alphas 2012"],
    ["Date prepared", longDate(new Date())]
  ];
  for (const [k, v] of meta) {
    const r = s.addRow([k, v]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).font = { italic: true };
  }

  // ---- Detail sheets ----
  const detail = (title: string, rows: AccountEntry[], total: number) => {
    const ws = wb.addWorksheet(title);
    ws.columns = [{ width: 18 }, { width: 60 }, { width: 22 }];
    ws.views = [{ state: "frozen", ySplit: 1 }];
    const h = ws.addRow(["Date", "Particulars", "Amount (NGN)"]);
    h.height = 20;
    h.eachCell({ includeEmpty: true }, (c: any) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.border = allBorder;
      c.alignment = { horizontal: c.col === 3 ? "right" : "left", vertical: "middle" };
    });
    for (const e of rows) {
      const r = ws.addRow([fmtDateShort(e.entry_date), e.note ? `${e.name} (${e.note})` : e.name, e.amount]);
      r.getCell(1).border = allBorder;
      r.getCell(2).border = allBorder;
      money(r.getCell(3));
    }
    const t = ws.addRow([`Total ${title}`, "", total]);
    t.getCell(1).font = { bold: true };
    t.getCell(1).border = { top: { style: "thin" }, bottom: { style: "double" } };
    t.getCell(2).border = { top: { style: "thin" }, bottom: { style: "double" } };
    t.getCell(3).numFmt = "#,##0.00";
    t.getCell(3).font = { bold: true };
    t.getCell(3).alignment = { horizontal: "right" };
    t.getCell(3).border = { top: { style: "thin" }, bottom: { style: "double" } };
  };
  detail("Income", income, totals.income);
  detail("Expenditure", expense, totals.expense);

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf as unknown as ArrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    reportName(yearRow.year, "xlsx")
  );
}

/* ---------------- PDF export (letterhead) ---------------- */

const A4W = 595.28;
const A4H = 841.89;
const MARGIN = 48;
const RIGHT = A4W - MARGIN;
const LETTERHEAD_RATIO = 342 / 2550; // letterhead.png aspect (height / width)

async function exportPdf(yearRow: AccountYear, entries: AccountEntry[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const income = sortEntries(entries.filter((e) => e.kind === "income"));
  const expense = sortEntries(entries.filter((e) => e.kind === "expense"));
  const totals = {
    income: income.reduce((s, e) => s + e.amount, 0),
    expense: expense.reduce((s, e) => s + e.amount, 0)
  };
  const opening = Number(yearRow.opening_balance) || 0;
  const net = totals.income - totals.expense;
  const closing = opening + net;

  // ---- Letterhead (page 1) ----
  let y = 0;
  try {
    const res = await fetch("/letterhead.png");
    if (res.ok) {
      const b64 = await blobToBase64(await res.blob());
      const h = A4W * LETTERHEAD_RATIO;
      doc.addImage(b64, "PNG", 0, 0, A4W, h);
      y = h;
    }
  } catch {
    /* fall back to text header below */
  }

  const pageHeader = () => {
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 29, 105);
    doc.text("SAVIOBOSCO ALPHAS 2012 — Financial Report", MARGIN, 34);
    doc.setDrawColor(253, 191, 46);
    doc.setLineWidth(1.4);
    doc.line(MARGIN, 40, RIGHT, 40);
  };

  const newPage = () => {
    doc.addPage();
    pageHeader();
    y = 58;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > A4H - 60) newPage();
  };

  // ---- Title ----
  if (y === 0) {
    // no letterhead image — draw a simple text header
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 29, 105);
    doc.text("SAVIOBOSCO ALPHAS 2012", A4W / 2, 48, { align: "center" });
    y = 70;
  }
  y += 42;
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(25, 25, 25);
  doc.text("FINANCIAL REPORT", A4W / 2, y, { align: "center" });
  y += 17;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Income and Expenditure Statement for the Year ${yearRow.year}`, A4W / 2, y, {
    align: "center"
  });
  y += 28;

  // ---- Summary block (classic ledger style) ----
  const sumRows: [string, string, boolean][] = [
    ["Balance Brought Forward", ngn(opening), false],
    ["Add: Total Income", ngn(totals.income), false],
    ["Less: Total Expenditure", ngn(-totals.expense), false],
    ["Net Surplus / (Deficit)", ngn(net), false],
    ["Balance Carried Forward", ngn(closing), true]
  ];
  doc.setFontSize(11);
  const rowH = 20;
  // single rule before the net row
  for (let i = 0; i < sumRows.length; i++) {
    const [label, amount, bold] = sumRows[i];
    ensureSpace(rowH + 10);
    doc.setFont("times", bold ? "bold" : "normal");
    doc.setTextColor(bold ? 0 : 30, bold ? 29 : 30, bold ? 105 : 30);
    doc.text(label, MARGIN, y);
    doc.text(amount, RIGHT, y, { align: "right" });
    y += rowH;
    if (i === 2) {
      // single rule above "Net Surplus"
      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.7);
      doc.line(MARGIN, y - 6, RIGHT, y - 6);
    }
  }
  // double rule under "Balance Carried Forward"
  doc.setDrawColor(25, 25, 25);
  doc.setLineWidth(0.9);
  doc.line(MARGIN, y - 14, RIGHT, y - 14);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y - 10, RIGHT, y - 10);
  y += 14;

  // ---- Detail sections ----
  const section = (title: string, rows: AccountEntry[], total: number) => {
    ensureSpace(120);
    y += 18;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 29, 105);
    doc.text(title, MARGIN, y);
    doc.setDrawColor(0, 29, 105);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, y + 5, RIGHT, y + 5);
    y += 14;

    if (rows.length === 0) {
      doc.setFont("times", "italic");
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text("No records for this year.", MARGIN, y);
      y += 26;
      return;
    }

    autoTable(doc, {
      startY: y,
      head: [["Date", "Particulars", "Amount (NGN)"]],
      body: rows.map((e) => [
        fmtDateShort(e.entry_date),
        e.note ? `${e.name} (${e.note})` : e.name,
        ngn(e.amount)
      ]),
      foot: [["Total", "", ngn(total)]],
      margin: { left: MARGIN, right: MARGIN, top: 60 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          const d = data.doc;
          d.setFont("times", "bold");
          d.setFontSize(9);
          d.setTextColor(0, 29, 105);
          d.text("SAVIOBOSCO ALPHAS 2012 — Financial Report", MARGIN, 34);
          d.setDrawColor(253, 191, 46);
          d.setLineWidth(1.4);
          d.line(MARGIN, 40, RIGHT, 40);
        }
      },
      styles: {
        font: "times",
        fontSize: 10,
        cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
        lineColor: [180, 180, 180],
        lineWidth: 0.4
      },
      headStyles: {
        fillColor: [0, 29, 105],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      footStyles: {
        fontStyle: "bold",
        fillColor: [240, 242, 248],
        textColor: [30, 30, 30],
        lineColor: [0, 29, 105]
      },
      columnStyles: {
        0: { cellWidth: 80 },
        2: { halign: "right", cellWidth: 110 }
      },
      alternateRowStyles: { fillColor: [249, 250, 253] }
    });
    // @ts-ignore lastAutoTable is added by jspdf-autotable
    y = (doc as any).lastAutoTable.finalY + 8;
  };

  section(`INCOME FOR THE YEAR ${yearRow.year}`, income, totals.income);
  section(`EXPENDITURE FOR THE YEAR ${yearRow.year}`, expense, totals.expense);

  // ---- Note (bold + italic) then signature block ----
  // The note and the signature stay on the current page whenever they fit,
  // so a one-page report stays one page; they flow to a new page only when
  // the report genuinely cannot fit on one page.
  const noteText = String(yearRow.report_note ?? "").trim();
  doc.setFont("times", "bolditalic");
  doc.setFontSize(11);
  const noteLines = noteText
    ? (doc.splitTextToSize(`Note: ${noteText}`, RIGHT - MARGIN) as string[])
    : [];
  const SIG_H = 120;
  const noteH = noteLines.length ? 22 + noteLines.length * 15 + 10 : 0;
  ensureSpace(noteH + SIG_H);

  if (noteLines.length) {
    y += 22;
    doc.setFont("times", "bolditalic");
    doc.setTextColor(25, 25, 25);
    for (const line of noteLines) {
      ensureSpace(18);
      doc.text(line, MARGIN, y);
      y += 15;
    }
    y += 10;
  }

  // ---- Signature block ----
  ensureSpace(SIG_H);
  y += 34;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("Prepared and submitted by:", MARGIN, y);
  y += 34;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y, MARGIN + 170, y);
  y += 16;
  doc.setFont("times", "bold");
  doc.text(yearRow.financial_secretary || "_________________________", MARGIN, y);
  y += 15;
  doc.setFont("times", "normal");
  doc.text("Financial Secretary, Savio Bosco Alphas 2012", MARGIN, y);
  y += 15;
  doc.text(`Date: ${longDate(new Date())}`, MARGIN, y);

  // ---- Footer on every page (gold strip + page number) ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(253, 191, 46);
    doc.rect(0, A4H - 5, A4W, 5, "F");
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} of ${pages}`, RIGHT, A4H - 14, { align: "right" });
    if (i === 1) {
      doc.text("Savio Bosco Alphas 2012", MARGIN, A4H - 14);
    }
  }

  doc.save(reportName(yearRow.year, "pdf"));
}

/* ---------------- Page ---------------- */

function AccountBody() {
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [yearRow, setYearRow] = useState<AccountYear | null>(null);
  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [totals, setTotals] = useState<AccountTotals>({
    income: 0,
    expense: 0,
    net: 0,
    opening: 0,
    closing: 0
  });
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<"" | "xlsx" | "pdf">("");

  // Year settings form
  const [opening, setOpening] = useState("0");
  const [secretary, setSecretary] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [newYear, setNewYear] = useState("");

  // Entry form
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  });
  const [note, setNote] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const loadYears = useCallback(async () => {
    const res = await apiFetch("/api/admin/account/years");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (res.ok) {
      const data = await res.json();
      const list = (data.years || []).map((y: { year: number }) => y.year);
      setYears(list);
    }
  }, []);

  const loadAccount = useCallback(async (y: number) => {
    const res = await apiFetch(`/api/admin/account?year=${y}`);
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to load account data");
    }
    const data = await res.json();
    setYearRow(data.year);
    setEntries(data.entries || []);
    setTotals(data.totals || { income: 0, expense: 0, net: 0, opening: 0, closing: 0 });
    setOpening(String(Number(data.year.opening_balance) || 0));
    setSecretary(data.year.financial_secretary || "");
    setReportNote(data.year.report_note || "");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadYears();
        await loadAccount(year);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load account data");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectYear = (y: number) => {
    setYear(y);
    setEditId(null);
    setName("");
    setAmount("");
    setNote("");
    setError("");
    setFlash("");
    setLoading(true);
    loadAccount(y)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  const yearOptions = useMemo(() => {
    const set = new Set<number>([...years, year, new Date().getFullYear()]);
    return [...set].sort((a, b) => b - a);
  }, [years, year]);

  const income = useMemo(() => sortEntries(entries.filter((e) => e.kind === "income")), [entries]);
  const expense = useMemo(() => sortEntries(entries.filter((e) => e.kind === "expense")), [entries]);

  async function saveYear(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/account/year", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          opening_balance: Number(opening) || 0,
          financial_secretary: secretary,
          report_note: reportNote
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setFlash(`Details for ${year} saved. You can close the browser and continue later — everything is stored.`);
      await Promise.all([loadYears(), loadAccount(year)]);
      setOpening(String(Number(data.year.opening_balance) || 0));
      setSecretary(data.year.financial_secretary || "");
      setReportNote(data.year.report_note || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function addYear(e: React.FormEvent) {
    e.preventDefault();
    const y = Number(newYear);
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
      setError("Please enter a valid year (e.g. 2026).");
      return;
    }
    setError("");
    const res = await apiFetch("/api/admin/account/year", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: y, opening_balance: 0, financial_secretary: "" })
    });
    if (res.ok) {
      setFlash(`Year ${y} created.`);
      setNewYear("");
      await loadYears();
      selectYear(y);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create year");
    }
  }

  async function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the name of the item (e.g. Membership dues).");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Please enter a positive amount in naira.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(
        editId ? `/api/admin/account/entries/${editId}` : "/api/admin/account/entries",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            kind,
            name: name.trim(),
            amount: amt,
            entry_date: entryDate,
            note: note.trim()
          })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save entry");
      setFlash(editId ? "Entry updated." : `${kind === "income" ? "Income" : "Expense"} of ${naira(amt)} recorded for ${year}.`);
      setEditId(null);
      setName("");
      setAmount("");
      setNote("");
      setEntryDate(
        new Date().toISOString().slice(0, 10)
      );
      await loadAccount(year);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    }
    setSaving(false);
  }

  function editEntry(p: AccountEntry) {
    setEditId(p.id);
    setKind(p.kind);
    setName(p.name);
    setAmount(String(p.amount));
    setEntryDate(p.entry_date);
    setNote(p.note || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeEntry(p: AccountEntry) {
    if (!confirm(`Delete "${p.name}" (${naira(p.amount)})?`)) return;
    await apiFetch(`/api/admin/account/entries/${p.id}`, { method: "DELETE" });
    if (editId === p.id) {
      setEditId(null);
      setName("");
      setAmount("");
      setNote("");
    }
    await loadAccount(year);
  }

  async function doExport(type: "xlsx" | "pdf") {
    setExporting(type);
    setError("");
    try {
      const yr =
        yearRow && yearRow.year === year
          ? yearRow
          : {
              year,
              opening_balance: Number(opening) || 0,
              financial_secretary: secretary,
              report_note: reportNote
            };
      if (type === "xlsx") await exportExcel(yr, entries);
      else await exportPdf(yr, entries);
      setFlash("Financial report downloaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate the report");
    }
    setExporting("");
  }

  const today = longDate(new Date());

  const tiles = [
    { label: "Balance Brought Forward", value: naira(totals.opening), cls: "text-slate-700" },
    { label: "Total Income", value: naira(totals.income), cls: "text-emerald-700" },
    { label: "Total Expenditure", value: naira(totals.expense), cls: "text-red-600" },
    {
      label: totals.net >= 0 ? "Net Surplus" : "Net Deficit",
      value: naira(Math.abs(totals.net)),
      cls: totals.net >= 0 ? "text-emerald-700" : "text-red-600"
    },
    { label: "Balance Carried Forward", value: naira(totals.closing), cls: "text-navy-800" }
  ];

  const EntryTable = ({
    title,
    rows,
    total
  }: {
    title: string;
    rows: AccountEntry[];
    total: number;
  }) => (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="font-display text-lg font-bold text-navy-900">
          {title}
          <span className="ml-2 text-xs font-semibold text-slate-400">{rows.length} record(s)</span>
        </h2>
        <p className="text-sm font-bold text-navy-800">{naira(total)}</p>
      </div>
      <table className="table-base">
        <thead>
          <tr>
            <th>Date</th>
            <th>Particulars</th>
            <th className="text-right">Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <div className="py-4">
                  <EmptyState message={`No ${title.toLowerCase()} records for ${year} yet.`} />
                </div>
              </td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap">{formatDate(p.entry_date)}</td>
                <td>
                  <p className="font-semibold text-navy-900">{p.name}</p>
                  {p.note && <p className="text-[11px] text-slate-400">{p.note}</p>}
                </td>
                <td className={`text-right font-semibold ${title === "Income" ? "text-emerald-700" : "text-red-600"}`}>
                  {naira(p.amount)}
                </td>
                <td className="whitespace-nowrap">
                  <button
                    className="mr-3 text-xs font-bold text-navy-700 underline"
                    onClick={() => editEntry(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs font-bold text-red-600 underline"
                    onClick={() => removeEntry(p)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-navy-800">
              <td colSpan={2} className="py-2.5 font-bold text-navy-900">
                Total {title}
              </td>
              <td className="py-2.5 text-right font-bold text-navy-900">{naira(total)}</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Record the association's income and expenses as they happen, then generate the annual
          financial report in Excel or PDF.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {flash && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {flash}
        </p>
      )}

      {/* Year settings */}
      <form onSubmit={saveYear} className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy-900">Year Settings</h2>
          <div className="flex items-end gap-2">
            <div>
              <label className="label">New year</label>
              <input
                type="number"
                className="input w-28"
                min={2000}
                max={2100}
                placeholder="e.g. 2027"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-outline" onClick={addYear}>
              + Add
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Year *</label>
            <select className="input" value={year} onChange={(e) => selectYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Balance Brought Forward (₦)</label>
            <input
              type="number"
              className="input"
              min={0}
              step="0.01"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Balance from the previous year/meeting.
            </p>
          </div>
          <div>
            <label className="label">Financial Secretary</label>
            <input
              className="input"
              value={secretary}
              onChange={(e) => setSecretary(e.target.value)}
              placeholder="Name printed on the report"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-navy" disabled={saving}>
              {saving ? "Saving..." : "Save Year Details"}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <textarea
            className="input min-h-[72px] w-full"
            rows={3}
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Anything the Financial Secretary wants explained at the end of the report — printed bold & italic just before the signature block."
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Appears at the end of the Excel and PDF reports, before “Prepared and submitted by”.
          </p>
        </div>
      </form>

      {/* Auto-calculated summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.label}</p>
            <p className={`mt-1 font-display text-xl font-bold ${t.cls}`}>{t.value}</p>
          </div>
        ))}
      </div>

      {/* Entry form */}
      <form onSubmit={saveEntry} className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy-900">
            {editId ? "Edit Entry" : "Record Income / Expense"}
          </h2>
          {editId && (
            <button
              type="button"
              className="text-xs font-bold text-slate-500 underline"
              onClick={() => {
                setEditId(null);
                setName("");
                setAmount("");
                setNote("");
              }}
            >
              Cancel editing
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(["income", "expense"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-lg border px-4 py-2 text-sm font-bold ${
                kind === k
                  ? k === "income"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-red-600 bg-red-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
              }`}
            >
              {k === "income" ? "↑ Income" : "↓ Expense"}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Name / Particulars *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "income" ? "e.g. Membership dues" : "e.g. Hall rental for AGM"}
            />
          </div>
          <div>
            <label className="label">Amount (₦) *</label>
            <input
              type="number"
              className="input"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              className="input"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Note</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional detail, e.g. AGM 31 Dec 2025"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-navy" disabled={saving}>
            {saving ? "Saving..." : editId ? "Update Entry" : "Save Entry"}
          </button>
          <p className="text-xs text-slate-400">
            Entries are saved instantly — you can record one at a time and continue later; the
            totals and report always reflect what has been saved.
          </p>
        </div>
      </form>

      {/* Income */}
      <EntryTable title="Income" rows={income} total={totals.income} />

      {/* Expenditure */}
      <EntryTable title="Expenditure" rows={expense} total={totals.expense} />

      {/* Report export */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">
              Financial Report — {year}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Classic income &amp; expenditure statement on the association's letterhead, with the
              financial secretary's signature block. Uses the figures and entries saved above.
              As at {today}.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline"
              onClick={() => doExport("xlsx")}
              disabled={exporting !== "" || loading}
            >
              {exporting === "xlsx" ? "Preparing..." : "⬇ Export Excel"}
            </button>
            <button
              className="btn btn-navy"
              onClick={() => doExport("pdf")}
              disabled={exporting !== "" || loading}
            >
              {exporting === "pdf" ? "Preparing..." : "⬇ Export PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Loading…</div>}>
      <AccountBody />
    </Suspense>
  );
}
