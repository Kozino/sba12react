import { Link } from "react-router-dom";
import { PageHero, SectionHead, GoldDivider } from "@/components/ui";
import { CtaBand } from "@/components/ui";


const objectives = [
  "To act as a medium through which good and cordial relationships are developed and maintained among members.",
  "To give identity to, and identify with, every member of the association always.",
  "To lend helping hands to members, financially and otherwise.",
  "To encourage the goodwill and active participation of all members.",
  "To act as a midwife for the all-round development of members as good citizens of Nigeria and ambassadors of the Church."
];

const executives = [
  ["President", "Leads the association, presides over all meetings, is the official representative and a bank signatory."],
  ["Vice President", "Acts in the place of the President in his absence; keeps current data of the executives."],
  ["Secretary", "Custodian of the records and minutes of all meetings; handles correspondence."],
  ["Assistant Secretary", "Keeps the roll of members present at meetings and stands in for the Secretary."],
  ["Financial Secretary", "Keeps accurate records of all financial transactions and issues receipts for dues."],
  ["Treasurer", "Keeps the cash assets of the association, makes approved expenses, and is a bank signatory."],
  ["Provost", "Maintains decorum at meetings, enforces fines, and is the returning officer in in-house votes."],
  ["Public Relations Officer", "Circulates notices within the association and is its liaison with agencies and the media."]
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumb="About"
        title="About the Association"
        subtitle="The story, the purpose and the governance of the Savio Bosco Alphas 2012 association."
      />

      {/* Our story */}
      <section className="container-site py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <SectionHead kicker="Our Story" title="From the Compound at Akpu to a Brotherhood for Life" />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              <p>
                It began in 2006, when a group of boys entered{" "}
                <strong className="text-navy-800">
                  St. Dominic Savio Seminary, Akpu
                </strong>{" "}
                — in Orumba South Local Government Area, Anambra State — as JSS 1
                students. Others joined the same set in the other classes, and so the
                class that would become one family took shape.
              </p>
              <p>
                The seminary gave us more than education. It gave us discipline, faith,
                and bonds forged in shared study, shared worship and shared labour. When
                the seminary years ended, the class did not scatter — it organised.
              </p>
              <p>
                The association was founded to keep the brotherhood alive and has been
                known ever since as the{" "}
                <strong className="text-navy-800">Savio Bosco Alphas 2012</strong>{" "}
                association. Our name speaks of who we are: the <em>Savio–Bosco</em>{" "}
                family, the <em>Alphas</em> — the first and the beginning — of the class
                of 2012.
              </p>
              <p>
                Today, scattered across parishes, cities and states, we remain what the
                seminary made us: brothers. We gather for our Annual General Meeting on
                31 December every year, we support one another in joy and in sorrow, and
                we serve the aims written into our constitution.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-navy-900">Our Vision</h3>
              <div className="mt-3">
                <GoldDivider />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                To be a model of Christian brotherhood — a united, disciplined and
                benevolent association whose members live as good citizens of Nigeria
                and faithful ambassadors of the Church.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-navy-900">Our Mission</h3>
              <div className="mt-3">
                <GoldDivider />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                To maintain cordial relationships among members, to give every member an
                identity, and to support members financially and practically through
                annual dues, benevolent visits, and the active participation of all.
              </p>
            </div>
            <div className="card border-gold-300 bg-gold-50 p-6">
              <h3 className="font-display text-lg font-bold text-navy-900">Our Motto</h3>
              <p className="mt-4 font-display text-lg italic leading-relaxed text-navy-800">
                &ldquo;Ecce quam bonum et quam iucundum habitare fratres in unum&rdquo;
              </p>
              <p className="mt-2 text-sm text-slate-600">
                “Behold, how good and pleasant it is when brothers dwell in unity.” —
                Psalm 133:1
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Aims & objectives */}
      <section className="bg-navy-50/60 py-16">
        <div className="container-site">
          <SectionHead
            kicker="From Our Constitution"
            title="Aims & Objectives"
            center
          />
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {objectives.map((o, i) => (
              <div key={i} className="card flex items-start gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-700 font-display text-sm font-bold text-gold-400">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-700 sm:text-base">{o}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership */}
      <section className="container-site py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHead kicker="Membership" title="Who Belongs to This Family?" />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              <p>
                By the constitution, membership is open to:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  <span>
                    Anyone who entered St. Dominic Savio Seminary, Akpu in <strong>2006 as
                    a freshman (JSS 1)</strong> and either continued with the set or left
                    the seminary without joining another set.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  <span>
                    Persons who <strong>joined the seminary debutants of 2006</strong>{" "}
                    thereafter, in the other classes.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  <span>
                    By virtue of association, the <strong>spouse</strong> of a member, in
                    the case of a marriage valid before the law and the Church.
                  </span>
                </li>
              </ul>
              <p>
                Membership may be suspended or terminated by resolution of the
                management committee, with the member&rsquo;s right to be heard before
                the general assembly, or may be resigned in writing to the Secretary.
              </p>
            </div>
          </div>

          <div>
            <SectionHead kicker="Governance" title="How the Association Is Run" />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  <span>
                    A <strong>management committee of 3–15 persons</strong>, elected for a{" "}
                    <strong>two-year term</strong>, who must be financially up to date
                    before election.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  <span>
                    An <strong>Annual General Meeting on 31 December</strong> each year,
                    with at least fourteen (14) days&rsquo; notice to all members.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  <span>
                    All members are entitled to vote at the AGM by show of hands; the
                    President&rsquo;s vote breaks a tie.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  <span>
                    A single bank account in the name of the association, signed for by
                    the <strong>President, Financial Secretary and Treasurer</strong>.
                  </span>
                </li>
              </ul>
              <p className="rounded-lg bg-navy-50 p-4 text-xs leading-relaxed text-slate-500">
                The constitution was adopted at an Annual General Meeting and signed by
                the President, the Secretary, and the members of the constitution
                committee. The full text is available on the{" "}
                <Link to="/audit" className="font-semibold text-navy-700 underline">
                  Member Audit Portal
                </Link>{" "}
                once you sign in with your member ID.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Executives */}
      <section className="bg-navy-50/60 py-16">
        <div className="container-site">
          <SectionHead kicker="Leadership" title="The Executive Offices" center />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {executives.map(([name, desc]) => (
              <div key={name} className="card p-5">
                <h3 className="font-display text-base font-bold text-navy-900">{name}</h3>
                <div className="mt-2 h-0.5 w-10 rounded-full bg-gold-500" />
                <p className="mt-3 text-xs leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Are you part of this family?"
        text="Register your details to receive your unique member ID, appear in the association records, and unlock the Audit Portal — your payments, the constitution, the minutes and the reports."
        href="/register"
        ctaLabel="Register Now"
      />
    </>
  );
}
