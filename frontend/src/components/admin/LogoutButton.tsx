import { useState } from "react";
import { apiFetch, setToken } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export default function LogoutButton({ small }: { small?: boolean }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await apiFetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    setToken("");
    navigate("/admin");
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className={
        small
          ? "rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          : "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
      }
    >
      <svg width={small ? 14 : 16} height={small ? 14 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
      </svg>
      Sign Out
    </button>
  );
}
