
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

export default function ActiveLink({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const pathname = useLocation().pathname;
  const active = pathname === href;
  return (
    <Link
      to={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-gold-500 text-navy-950"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
      {label}
    </Link>
  );
}
