import { PageHero } from "@/components/ui";
import RegisterForm from "@/components/RegisterForm";


export default function RegisterPage() {
  return (
    <>
      <PageHero
        crumb="Membership"
        title="Member Registration"
        subtitle="Join the records of the association and receive your unique member ID."
      />
      <section className="container-site py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy-900">
              Why Register?
            </h2>
            <div className="mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                <span>
                  <strong className="text-navy-800">Identity.</strong> The constitution
                  gives identity to every member. Registering places you in the official
                  roll of the association.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                <span>
                  <strong className="text-navy-800">Your Member ID.</strong> You receive
                  a unique 8-character ID starting with <span className="font-mono font-bold">SBA12</span>.
                  It is your key to the Audit Portal.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                <span>
                  <strong className="text-navy-800">Benefits.</strong> Members who are
                  financially up to date may vote, be voted for, and receive the
                  association&rsquo;s benevolent support.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                <span>
                  <strong className="text-navy-800">Transparency.</strong> Through the
                  Audit Portal you can see your own payments, what you are owing, the
                  constitution, the minutes and the financial reports.
                </span>
              </li>
            </ul>
          </div>
          <RegisterForm />
        </div>
      </section>
    </>
  );
}
