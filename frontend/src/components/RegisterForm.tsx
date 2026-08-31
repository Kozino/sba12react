
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";

const initialForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  hometown: "",
  hometownParish: "",
  residentialAddress: "",
  permanentAddress: ""
};

export default function RegisterForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof initialForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await apiFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setResult({ id: data.uniqueId, name: data.fullName });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function copyId() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (status === "done" && result) {
    return (
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-2xl text-navy-950">
            ✓
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-white">
            Registration Received, {result.name.split(" ")[0]}!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            Welcome to the Savio Bosco Alphas 2012 association. Your unique member ID is
          </p>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="mx-auto inline-flex items-center gap-3 rounded-xl border-2 border-dashed border-gold-500 bg-gold-50 px-8 py-5">
            <span className="font-mono text-3xl font-bold tracking-[0.2em] text-navy-900 sm:text-4xl">
              {result.id}
            </span>
            <button
              onClick={copyId}
              className="rounded-lg bg-navy-700 px-3 py-2 text-xs font-bold text-white hover:bg-navy-600"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="mx-auto mt-5 max-w-md rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
            <strong>Awaiting approval.</strong> Your registration has been sent to the
            association&rsquo;s executives for review. Your member ID will become{" "}
            <strong>active on the Audit Portal</strong> as soon as it is approved.
          </div>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-slate-600">
            <strong className="text-red-600">Save this ID carefully.</strong> It is your
            only key into the{" "}
            <Link to="/audit" className="font-bold text-navy-700 underline">
              Member Audit Portal
            </Link>
            , where you can view your payments (what you have paid and what you are
            owing), the association constitution, the minutes of meetings and the
            financial reports — every year.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Our executives will review your details. If anything is incorrect, please{" "}
            <Link to="/contact" className="font-semibold text-navy-700 underline">
              contact the association
            </Link>{" "}
            and quote your member ID.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/audit" className="btn btn-gold">
              Go to Audit Portal
            </Link>
            <Link to="/" className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
      <p className="rounded-lg bg-navy-50 px-4 py-3 text-sm leading-relaxed text-navy-800">
        Fill in your details below. On submission, the association&rsquo;s records will
        receive your information and you will instantly receive your{" "}
        <strong>unique 8-character member ID</strong> (starting with{" "}
        <span className="font-mono font-bold">SBA12</span>).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="r-first">First Name *</label>
          <input id="r-first" className="input" required value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)} placeholder="First name" />
        </div>
        <div>
          <label className="label" htmlFor="r-middle">Middle Name</label>
          <input id="r-middle" className="input" value={form.middleName}
            onChange={(e) => set("middleName", e.target.value)} placeholder="Middle name" />
        </div>
        <div>
          <label className="label" htmlFor="r-last">Last Name *</label>
          <input id="r-last" className="input" required value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)} placeholder="Last name" />
        </div>
        <div>
          <label className="label" htmlFor="r-email">Email Address *</label>
          <input id="r-email" type="email" className="input" required value={form.email}
            onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="r-phone">Phone Number *</label>
          <input id="r-phone" className="input" required value={form.phone}
            onChange={(e) => set("phone", e.target.value)} placeholder="+234 ..." />
        </div>
        <div>
          <label className="label" htmlFor="r-hometown">Hometown *</label>
          <input id="r-hometown" className="input" required value={form.hometown}
            onChange={(e) => set("hometown", e.target.value)} placeholder="e.g. Nnewi" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="r-parish">Hometown Parish</label>
          <input id="r-parish" className="input" value={form.hometownParish}
            onChange={(e) => set("hometownParish", e.target.value)}
            placeholder="e.g. St. Mary's Cathedral, Nnewi" />
        </div>
        <div>
          <label className="label" htmlFor="r-residential">Residential Address</label>
          <input id="r-residential" className="input" value={form.residentialAddress}
            onChange={(e) => set("residentialAddress", e.target.value)}
            placeholder="Where you currently live" />
        </div>
        <div>
          <label className="label" htmlFor="r-permanent">Permanent Address</label>
          <input id="r-permanent" className="input" value={form.permanentAddress}
            onChange={(e) => set("permanentAddress", e.target.value)}
            placeholder="Your permanent home address" />
        </div>
      </div>

      {status === "error" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-gold w-full" disabled={status === "sending"}>
        {status === "sending" ? "Submitting..." : "Register & Get My Member ID"}
      </button>
      <p className="text-center text-xs text-slate-400">
        Your details are kept confidential by the association executives.
      </p>
    </form>
  );
}
