import { Link } from "react-router-dom";
import { PageHero, GoldDivider, CtaBand } from "@/components/ui";
import { EXECUTIVES } from "@/lib/site";


export default function ExecutivesPage() {
  return (
    <>
      <PageHero
        crumb="Leadership"
        title="Our Executives"
        subtitle="The management committee that administers the association, in accordance with our constitution."
      />

      <section className="container-site py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            By the constitution, the association is administered by a management
            committee of <strong className="text-navy-800">not less than three (3) and not
            more than fifteen (15) persons</strong>, who must be{" "}
            <strong className="text-navy-800">financially up to date</strong> before their
            election. The executives are elected for a{" "}
            <strong className="text-navy-800">two (2) year term</strong> and may be
            re-elected at the association&rsquo;s Annual General Meeting. Their powers
            reside with the general assembly — the members — to whom they are answerable.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EXECUTIVES.map((ex, i) => (
            <div key={ex.name} className="card flex flex-col p-6 transition-shadow hover:shadow-card-hover">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-700 font-display text-sm font-bold text-gold-400">
                  {i + 1}
                </span>
                <span className="badge border-gold-300 bg-gold-50 text-gold-700">
                  Executive Office
                </span>
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-navy-900">
                {ex.name}
              </h2>
              <div className="mt-2">
                <GoldDivider />
              </div>
              <p className="mt-3 text-xs italic leading-relaxed text-slate-500">{ex.short}</p>
              <ul className="mt-3 flex-1 space-y-2">
                {ex.duties.map((d, j) => (
                  <li key={j} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold-500" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-gold-300 bg-gold-50 p-6 text-sm leading-relaxed text-slate-700">
          <p className="font-bold text-navy-900">How the executives are chosen</p>
          <p className="mt-2">
            The power of the association resides primarily with the general assembly — the
            members. The executives are <strong>elected from, and are answerable to, the
            members</strong> at the Annual General Meeting held on 31 December each year,
            with at least fourteen (14) days&rsquo; notice to all members. All members
            are entitled to vote by show of hands, and the President&rsquo;s vote decides
            a tie. The full constitution — including the detailed functions of each
            office — is available on the{" "}
            <Link to="/audit" className="font-bold text-navy-700 underline">
              Member Audit Portal
            </Link>
            .
          </p>
        </div>
      </section>

      <CtaBand
        title="Part of the family?"
        text="Register your details to appear in the association roll. Once the executives approve your registration, your unique member ID unlocks the Audit Portal."
        href="/register"
        ctaLabel="Register Now"
      />
    </>
  );
}
