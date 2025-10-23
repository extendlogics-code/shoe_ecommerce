import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminSession, setAdminSession } from "../utils/adminSession";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      navigate("/admin");
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
      setAdminSession({ email, role });
      setFailedAttempts(0);

      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setFailedAttempts((attempts) => attempts + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterSubmitting(true);
    setRegisterError(null);
    setRegisterMessage(null);

    if (registerPassword !== registerConfirm) {
      setRegisterSubmitting(false);
      setRegisterError("Passwords must match.");
      return;
    }

    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: registerEmail, password: registerPassword })
      });

      if (!response.ok) {
        let detail = "Unable to register";
        try {
          const payload = (await response.json()) as { message?: string };
          detail = payload.message ?? detail;
        } catch {
          // ignore JSON parsing errors
        }
        throw new Error(detail);
      }

      setRegisterMessage("Viewer account created. You can now sign in above.");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirm("");
      setFailedAttempts(0);
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const showRegistration = failedAttempts >= 3;

  return (
    <main className="admin-shell admin-shell--login">
      <section className="admin-card admin-card--narrow admin-login-card">
        <span className="admin-login__badge">Kalaa Crafts</span>
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
      {showRegistration ? (
        <section className="admin-card admin-card--narrow admin-register-card">
          <h2 className="admin-login__title">Register as a viewer</h2>
          <p className="admin-login__copy">
            Three missed steps? Lace up a fresh viewer pass to browse the showroom in read-only mode.
          </p>
          {registerError ? <div className="admin-alert admin-alert--error">{registerError}</div> : null}
          {registerMessage ? <div className="admin-alert admin-alert--success">{registerMessage}</div> : null}
          <form className="admin-login__form" onSubmit={handleRegister}>
            <label className="admin-login__field">
              <span>Email</span>
              <input
                type="email"
                name="registerEmail"
                autoComplete="username"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.currentTarget.value)}
                placeholder="viewer@kalaa.in"
                required
              />
            </label>
            <label className="admin-login__field">
              <span>Password</span>
              <input
                type="password"
                name="registerPassword"
                autoComplete="new-password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.currentTarget.value)}
                placeholder="Create a secure password"
                required
              />
            </label>
            <label className="admin-login__field">
              <span>Confirm password</span>
              <input
                type="password"
                name="registerConfirm"
                autoComplete="new-password"
                value={registerConfirm}
                onChange={(event) => setRegisterConfirm(event.currentTarget.value)}
                placeholder="Repeat password"
                required
              />
            </label>
            <button className="button button--ghost admin-login__submit" type="submit" disabled={registerSubmitting}>
              {registerSubmitting ? "Crafting access…" : "Register viewer access"}
            </button>
          </form>
          <p className="admin-login__hint">
            Already reset your stride? Sign in with your new credentials above to rejoin the control tower.
          </p>
        </section>
      ) : null}
    </main>
  );
};

export default AdminLoginPage;
