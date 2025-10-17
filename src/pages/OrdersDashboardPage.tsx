import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";

type OrderItem = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number | null;
  tax: number | null;
  imagePath: string | null;
  inventory: {
    onHand: number | null;
    reserved: number | null;
  };
};

type OrderInvoice = {
  id: string;
  invoiceNumber: string;
  pdfPath: string;
  generatedAt: string;
  totalAmount: number;
  currency: string;
};

type OrderCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
};

type OrderAddress = {
  id: string;
  label: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

type OrderEvent = {
  id: string;
  type: string;
  actor: string | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type OrderPayment = {
  id: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  method: string | null;
  processedAt: string;
};

type OrderRecord = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  transactionId: string;
  channel: string | null;
  note: string | null;
  placedAt: string;
  customer: OrderCustomer;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  items: OrderItem[];
  events: OrderEvent[];
  payment?: OrderPayment;
  invoice?: OrderInvoice;
};

const OrdersDashboardPage = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceInFlight, setInvoiceInFlight] = useState<string | null>(null);
  const [role, setRole] = useState<"superadmin" | "viewer" | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        let detail = "Unable to load orders";
        try {
          const payload = (await response.json()) as { message?: string };
          detail = payload.message ?? detail;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }
      const data = (await response.json()) as OrderRecord[];
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true";
    const storedRole = localStorage.getItem("adminRole");
    if (!isAuthenticated || !storedRole) {
      navigate("/admin/login");
      return;
    }

    const normalizedRole = storedRole === "superadmin" ? "superadmin" : "viewer";
    setRole(normalizedRole);
    setAdminEmail(localStorage.getItem("adminEmail"));
    void loadOrders();
  }, [loadOrders, navigate]);

  const isSuperAdmin = role === "superadmin";
  const roleResolved = role !== null;

  const metrics = useMemo(() => {
    if (!orders.length) {
      return null;
    }

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingCount = orders.filter((order) => order.status === "processing").length;

    return {
      totalRevenue,
      pendingCount,
      lastUpdated: new Date().toLocaleString()
    };
  }, [orders]);

  const handleGenerateInvoice = useCallback(
    async (orderId: string) => {
      if (!isSuperAdmin) {
        setError("Superadmin privileges are required to generate invoices.");
        return;
      }

      setInvoiceInFlight(orderId);
      setError(null);
      try {
        const response = await fetch(`/api/orders/${orderId}/invoices`, {
          method: "POST",
          headers: {
            "X-Admin-Role": role ?? ""
          }
        });
        if (!response.ok) {
          let detail = "Failed to generate invoice";
          try {
            const payload = (await response.json()) as { message?: string };
            detail = payload.message ?? detail;
          } catch {
            // ignore
          }
          throw new Error(detail);
        }
        await loadOrders();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setInvoiceInFlight(null);
      }
    },
    [isSuperAdmin, loadOrders, role]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    navigate("/admin/login");
  }, [navigate]);

  return (
    <main className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <h1>Order Control Tower</h1>
          <p>Monitor checkout orders, inventory impact, and invoice lifecycle in one place.</p>
        </div>
        <div className="admin-shell__user">
          <div>
            <span className="admin-shell__user-label">Signed in as</span>
            <strong>{roleResolved ? adminEmail ?? "Viewer access" : "Verifying…"}</strong>
            <span className="admin-shell__user-role">{roleResolved ? (isSuperAdmin ? "Superadmin" : "Viewer") : "Checking"}</span>
          </div>
          <button className="button button--ghost" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
        {metrics ? (
          <div className="admin-shell__summary">
            <div>
              <span className="admin-shell__summary-label">Total Revenue</span>
              <strong>{formatCurrency(metrics.totalRevenue, orders[0]?.currency ?? "INR")}</strong>
            </div>
            <div>
              <span className="admin-shell__summary-label">Orders Pending</span>
              <strong>{metrics.pendingCount}</strong>
            </div>
            <div>
              <span className="admin-shell__summary-label">Last Sync</span>
              <strong>{metrics.lastUpdated}</strong>
            </div>
          </div>
        ) : null}
        <Link className="button button--ghost" to="/admin">
          Back
        </Link>
      </header>

      {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}
      {roleResolved && !isSuperAdmin ? (
        <div className="admin-alert admin-alert--info">
          You&apos;re browsing with view-only access. Superadmins can elevate permissions from the catalog workspace.
        </div>
      ) : null}

      {loading ? (
        <div className="admin-card">Loading orders…</div>
      ) : (
        <section className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Line Items</th>
                <th>Totals</th>
                <th>Status</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const currency = order.currency ?? "INR";
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="admin-table__primary">
                        <strong>{order.orderNumber}</strong>
                        <span>{new Date(order.placedAt).toLocaleString()}</span>
                        <span className="admin-table__muted">Txn: {order.transactionId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-table__primary">
                        <strong>
                          {order.customer.firstName} {order.customer.lastName}
                        </strong>
                        <span>{order.customer.email}</span>
                        {order.shippingAddress ? (
                          <span className="admin-table__muted">
                            {order.shippingAddress.city}, {order.shippingAddress.country}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <details>
                        <summary>{order.items.length} items</summary>
                        <ul className="admin-line-items">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              <div>
                                <strong>{item.productName}</strong>
                                <span className="admin-table__muted">SKU {item.sku}</span>
                              </div>
                              <div>
                                <span>
                                  {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                                </span>
                                <span className="admin-table__muted">
                                  On hand: {item.inventory.onHand ?? "—"} / Reserved:{" "}
                                  {item.inventory.reserved ?? "—"}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </td>
                    <td>
                      <div className="admin-table__primary">
                        <strong>{formatCurrency(order.totalAmount, currency)}</strong>
                        {order.payment ? (
                          <span className="admin-table__muted">
                            Paid {new Date(order.payment.processedAt).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className={`admin-status admin-status--${order.status}`}>
                        <span>{order.status}</span>
                      </div>
                      {order.events.length ? (
                        <details className="admin-events">
                          <summary>Timeline</summary>
                          <ul>
                            {order.events.map((event) => (
                              <li key={event.id}>
                                <span>{event.type}</span>
                                <span className="admin-table__muted">
                                  {new Date(event.createdAt).toLocaleString()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        {order.invoice ? (
                          <>
                            <a className="button button--ghost" href={`/api/orders/${order.id}/invoice`} download>
                              Download
                            </a>
                            <span className="admin-table__muted">
                              {new Date(order.invoice.generatedAt).toLocaleString()}
                            </span>
                          </>
                        ) : null}
                        <button
                          className="button button--primary"
                          type="button"
                          disabled={!isSuperAdmin || invoiceInFlight === order.id}
                          onClick={() => {
                            void handleGenerateInvoice(order.id);
                          }}
                        >
                          {invoiceInFlight === order.id
                            ? "Generating…"
                            : isSuperAdmin
                            ? "Generate Invoice"
                            : "View only"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!orders.length ? <p>No orders captured yet.</p> : null}
        </section>
      )}
    </main>
  );
};

export default OrdersDashboardPage;
