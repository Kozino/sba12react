import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "@/lib/api";
import ActiveLink from "@/components/admin/ActiveLink";
import LogoutButton from "@/components/admin/LogoutButton";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { href: "/admin/payments", label: "Payments", icon: "M3 6h18v12H3zM3 10h18" },
  { href: "/admin/account", label: "Account", icon: "M4 4h16v16H4zM8 4v16M12 9h5M12 13h5" },
  { href: "/admin/content/news", label: "News", icon: "M4 5h16v14H4zM8 9h8M8 13h8" },
  { href: "/admin/content/blogs", label: "Blogs", icon: "M4 5h16v14H4zM8 9h5M8 13h8" },
  { href: "/admin/content/gallery", label: "Gallery", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4" },
  { href: "/admin/executives", label: "Executives", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c1.5-4 5-6 8-6s6.5 2 8 6" },
  { href: "/admin/documents", label: "Documents", icon: "M7 3h8l4 4v14H7zM15 3v4h4" },
  { href: "/admin/messages", label: "Messages", icon: "M4 5h16v12H8l-4 4z" },
  { href: "/admin/settings", label: "Settings", icon: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3" }
];

export default function AdminLayout() {
  const location = useLocation();
  const token = getToken();

  // Only the login route may be shown without a token
  const isLogin = location.pathname === "/admin" || location.pathname === "/admin/login";

  if (!token && !isLogin) {
    return <Navigate to="/admin" replace />;
  }
  if (token && location.pathname === "/admin/login") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col bg-navy-950 text-white md:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <img src="/logo.png" alt="" className="h-10 w-10" />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold">SBA 2012</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-400">
              Admin Panel
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((n) => (
            <ActiveLink key={n.href} href={n.href} label={n.label} icon={n.icon} />
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 px-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" />
            </svg>
            View Public Site
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-navy-950 text-white md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="h-8 w-8" />
              <span className="font-display text-sm font-bold">SBA 2012 Admin</span>
            </div>
            <LogoutButton small />
          </div>
          <div className="flex gap-1 overflow-x-auto px-2 pb-2">
            {nav.map((n) => (
              <Link
                key={n.href}
                to={n.href}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  location.pathname === n.href
                    ? "border-gold-500 bg-gold-500 text-navy-950"
                    : "border-white/20 text-slate-200"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="sticky top-0 z-20 hidden items-center justify-between border-b border-slate-200 bg-white/95 px-8 py-3 backdrop-blur md:flex">
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-semibold text-slate-800">Administrator</span>
          </p>
          <Link
            to="/"
            className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-navy-700"
          >
            View site ↗
          </Link>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
