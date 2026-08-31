import { Link } from "react-router-dom";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-auto bg-navy-950 text-slate-300">
      <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />
      <div className="container-site grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Savio Bosco Alphas 2012" className="h-12 w-12" />
            <div className="leading-tight">
              <p className="font-display text-lg font-bold text-white">SAVIOBOSCO ALPHAS</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400">
                Alumni · Class of 2012
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            The association of students who entered St. Dominic Savio Seminary, Akpu in 2006
            (JSS 1) and all who joined them in other classes.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
            Pages
          </h3>
          <ul className="space-y-2 text-sm">
            {[
              ["/about", "About the Association"],
              ["/executives", "Executives & Leadership"],
              ["/news", "News"],
              ["/blogs", "Blogs"],
              ["/gallery", "Gallery & Events"],
              ["/register", "Member Registration"],
              ["/audit", "Member Audit Portal"],
              ["/contact", "Contact Us"]
            ].map(([href, label]) => (
              <li key={href}>
                <Link to={href} className="transition-colors hover:text-gold-300">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
            Good to Know
          </h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>Annual General Meeting: 31 December each year</li>
            <li>Annual due: payable before end of September</li>
            <li>14 days&rsquo; notice for every meeting</li>
            <li>
              Members in good standing enjoy voting rights &amp; benevolent
              benefits
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
            Reach Us
          </h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>{SITE.address}</li>
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-gold-300">
                {SITE.email}
              </a>
            </li>
            <li>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="hover:text-gold-300">
                {SITE.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p className="italic">
            &ldquo;{SITE.motto}&rdquo; — {SITE.mottoRef}
          </p>
        </div>
      </div>
    </footer>
  );
}
