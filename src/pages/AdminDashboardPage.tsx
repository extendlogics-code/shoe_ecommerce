import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAdminSession, getAdminSession } from "../utils/adminSession";

const AdminDashboardPage = () => {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"superadmin" | "viewer" | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      navigate("/admin/login");
      return;
    }
    setRole(session.role);
    setAdminEmail(session.email);
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  const roleResolved = role !== null;
  const isSuperAdmin = role === "superadmin";

  return (
    <main className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <h1>Admin Control Lounge</h1>
          <p>Pick a workspace to keep orders flowing and the product line shining.</p>
        </div>
        <div className="admin-shell__user">
          <div>
            <span className="admin-shell__user-label">Signed in as</span>
            <strong>{roleResolved ? adminEmail ?? "Viewer access" : "Verifying…"}</strong>
            <span className="admin-shell__user-role">
              {roleResolved ? (isSuperAdmin ? "Superadmin" : "Viewer") : "Checking"}
            </span>
          </div>
          <button className="button button--ghost" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {!isSuperAdmin && roleResolved ? (
        <div className="admin-alert admin-alert--info">
          You&apos;re browsing with view-only access. Superadmins can elevate permissions from the catalog workspace.
        </div>
      ) : null}

      <section className="admin-grid admin-hub">
        <article className="admin-card admin-hub__card">
          <span className="admin-hub__badge">Operations</span>
          <h2>Orders Dashboard</h2>
          <p>
            Monitor payments, inventory allocations, and invoice timelines. Generate fresh invoices with a single click.
          </p>
          <Link className="button button--primary" to="/admin/orders">
            Enter orders tower
          </Link>
        </article>

        <article className="admin-card admin-hub__card">
          <span className="admin-hub__badge">Merchandising</span>
          <h2>Product Workbench</h2>
          <p>
            Upload new imagery, refresh stock thresholds, and mint viewer passes for the team. Editing requires superadmin
            status.
          </p>
          <Link className="button button--primary" to="/admin/catalog">
            {isSuperAdmin ? "Open catalog tools" : "Browse catalog"}
          </Link>
        </article>
      </section>
    </main>
  );
};

export default AdminDashboardPage;
