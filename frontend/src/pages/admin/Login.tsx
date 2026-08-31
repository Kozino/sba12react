import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, setToken, getToken } from "@/lib/api";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // If a token already exists, go straight to the dashboard
  useEffect(() => {
    if (getToken()) navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setToken(data.token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Savio Bosco Alphas 2012" className="mx-auto h-20 w-20" />
          <h1 className="mt-4 font-display text-2xl font-bold text-white">
            Administrator Sign In
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Savio Bosco Alphas 2012 · Management Area
          </p>
        </div>
        <form onSubmit={submit} className="card space-y-4 p-7">
          <div>
            <label className="label" htmlFor="a-user">Username</label>
            <input
              id="a-user"
              className="input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="a-pass">Password</label>
            <input
              id="a-pass"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-gold w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          After your first sign-in, change the password on the{" "}
          <Link to="/admin/settings" className="font-semibold text-navy-700 underline">
            Settings
          </Link>{" "}
          page.
        </p>
      </div>
    </div>
  );
}
