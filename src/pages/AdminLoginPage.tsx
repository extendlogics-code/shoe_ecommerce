import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true";
    if (isAuthenticated) {
      navigate("/admin/orders");
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        let detail = "Unable to authenticate";
        try {
          const payload = (await response.json()) as { message?: string };
          detail = payload.message ?? detail;
        } catch {
          // ignore JSON parsing errors
        }
        throw new Error(detail);
      }

      const payload = (await response.json()) as { role?: string };
      const role = payload.role === "superadmin" ? "superadmin" : "viewer";
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminEmail", email);
      localStorage.setItem("adminRole", role);

      navigate("/admin/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-shell admin-shell--login">
      <section className="admin-card admin-card--narrow admin-login-card">
        <span className="admin-login__badge">Kalaa Atelier</span>
        <h1 className="admin-login__title">Step into the studio</h1>
        <p className="admin-login__copy">Unlock the leather-crafted dashboard to orchestrate new drops and steward inventory.</p>
        {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}
        <form className="admin-login__form" onSubmit={handleSubmit}>
          <label className="admin-login__field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="shoemaster@kalaa.in"
              required
            />
          </label>
          <label className="admin-login__field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="••••••••"
              required
            />
          </label>
          <button className="button button--primary admin-login__submit" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Lace up & enter"}
          </button>
        </form>
        <p className="admin-login__hint">
          Need a read-only pass? Ask a superadmin to mint a viewer login from the catalog workspace.
        </p>
      </section>
    </main>
  );
};

export default AdminLoginPage;
