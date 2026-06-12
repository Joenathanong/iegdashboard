import { useState, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_pass", password);
        router.push("/admin/dashboard");
      } else {
        setError("Password salah. Silakan coba lagi.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Admin Login — TV Slideshow</title></Head>
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <div className="icon">📺</div>
            <h1>TV Slideshow Admin</h1>
            <p>Masuk untuk mengelola slideshow</p>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Password Admin</label>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <span className="form-hint">Password default: admin123</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Memverifikasi..." : "🔐 Masuk"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link href="/" style={{ color: "var(--text-muted)", fontSize: "0.8rem", textDecoration: "none" }}>
              ← Kembali ke Slideshow
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
