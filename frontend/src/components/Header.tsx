
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/executives", label: "Executives" },
  { href: "/news", label: "News" },
  { href: "/blogs", label: "Blogs" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/audit", label: "Audit" }
];

export default function Header() {
  const pathname = useLocation().pathname;
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/95 backdrop-blur">
      <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />
      <div className="container-site flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src="/logo.png"
            alt="Savio Bosco Alphas 2012 logo"
            className="h-11 w-11 shrink-0"
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-base font-bold tracking-wide text-navy-800 sm:text-lg">
              SAVIOBOSCO ALPHAS
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-gold-600">
              Alumni · Class of 2012
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`rounded-md px-2.5 py-2 text-[13px] font-semibold transition-colors ${
                active(l.href)
                  ? "text-navy-800 underline decoration-gold-500 decoration-2 underline-offset-8"
                  : "text-slate-600 hover:bg-navy-50 hover:text-navy-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/register"
            className="ml-2 rounded-lg bg-gold-500 px-4 py-2 text-[13px] font-bold text-navy-950 shadow-sm transition-colors hover:bg-gold-400"
          >
            Register
          </Link>
          <Link
            to="/admin"
            className="ml-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-navy-700"
            title="Administrator"
          >
            Admin
          </Link>
        </nav>

        <button
          className="rounded-lg border border-navy-200 p-2 text-navy-800 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-navy-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <div className="grid grid-cols-2 gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  active(l.href)
                    ? "bg-navy-50 text-navy-800"
                    : "text-slate-600 hover:bg-navy-50"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="col-span-2 mt-1 rounded-lg bg-gold-500 px-3 py-2.5 text-center text-sm font-bold text-navy-950"
            >
              Register as a Member
            </Link>
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Admin
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
