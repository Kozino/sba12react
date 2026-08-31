import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { PageHero, GoldDivider } from "@/components/ui";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  const [s, setS] = useState({
    contact_email: "info@savioboscoalphas.org",
    contact_phone: "+234 803 000 0000",
    contact_address:
      "St. Dominic Savio Seminary, Akpu, Orumba South LGA, Anambra State, Nigeria"
  });

  useEffect(() => {
    apiFetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setS(d.settings || s))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHero
        crumb="Contact"
        title="Contact the Association"
        subtitle="Reach the secretariat, report a concern, or simply say hello."
      />
      <section className="container-site py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy-900">Get in Touch</h2>
            <div className="mt-4">
              <GoldDivider />
            </div>
            <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-600">
              <p>
                The management committee handles all correspondence of the association.
                Use the form to send a message — it is delivered directly to the
                secretariat for follow-up.
              </p>
              <div className="card space-y-4 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</p>
                  <p className="mt-0.5 font-semibold text-navy-800">{s.contact_email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</p>
                  <p className="mt-0.5 font-semibold text-navy-800">{s.contact_phone}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Address</p>
                  <p className="mt-0.5 text-slate-700">{s.contact_address}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                If you already have a member ID, use the{" "}
                <Link to="/audit" className="font-bold text-navy-700 underline">
                  Member Audit Portal
                </Link>{" "}
                to view your payments and the association documents.
              </p>
            </div>
          </div>
          <div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
