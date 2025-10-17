import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  status: string;
  description: string | null;
  imagePath: string | null;
  colors: string[];
  sizes: string[];
  onHand: number;
  reserved: number;
  safetyStock: number;
  reorderPoint: number;
};

type FormState = {
  name: string;
  sku: string;
  price: string;
  currency: string;
  description: string;
  onHand: string;
  safetyStock: string;
  reorderPoint: string;
  imageAlt: string;
  colors: string;
  sizes: string;
  file?: File;
};

const initialFormState: FormState = {
  name: "",
  sku: "",
  price: "",
  currency: "INR",
  description: "",
  onHand: "0",
  safetyStock: "",
  reorderPoint: "",
  imageAlt: "",
  colors: "",
  sizes: ""
};

const ProductAdminPage = () => {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"superadmin" | "viewer" | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [superPassword, setSuperPassword] = useState("");
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessSubmitting, setAccessSubmitting] = useState(false);
  const navigate = useNavigate();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        let detail = "Unable to load products";
        try {
          const payload = (await response.json()) as { message?: string };
          detail = payload.message ?? detail;
        } catch {
          // ignore JSON errors
        }
        throw new Error(detail);
      }
      const data = (await response.json()) as ProductRow[];
      setProducts(data);
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
    void loadProducts();
  }, [loadProducts, navigate]);

  const isSuperAdmin = role === "superadmin";

  const inventoryHealth = useMemo(() => {
    if (!products.length) {
      return null;
    }

    const totalActive = products.length;
    const totalStock = products.reduce((sum, product) => sum + (product.onHand ?? 0), 0);
    const belowReorder = products.filter(
      (product) => product.onHand !== null && product.onHand <= product.reorderPoint
    ).length;

    return { totalActive, totalStock, belowReorder };
  }, [products]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    const { name, value } = target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    const [file] = target.files ?? [];
    setForm((prev) => ({
      ...prev,
      file
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setMessage("Product saved");
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    navigate("/admin/login");
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    if (!isSuperAdmin) {
      setSubmitting(false);
      setError("Superadmin privileges are required to create products.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("sku", form.sku);
      formData.append("price", form.price);
      formData.append("currency", form.currency);
      formData.append("description", form.description);
      formData.append("inventoryOnHand", form.onHand);
      if (form.safetyStock) {
        formData.append("safetyStock", form.safetyStock);
      }
      if (form.reorderPoint) {
        formData.append("reorderPoint", form.reorderPoint);
      }
      if (form.imageAlt) {
        formData.append("imageAlt", form.imageAlt);
      }
      if (form.colors) {
        formData.append("colors", form.colors);
      }
      if (form.sizes) {
        formData.append("sizes", form.sizes);
      }
      if (form.file) {
        formData.append("image", form.file);
      }

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
        headers: {
          "X-Admin-Role": role ?? ""
        }
      });

      if (!response.ok) {
        let reason = "Unable to save product";
        try {
          const payload = (await response.json()) as { message?: string };
          reason = payload.message ?? reason;
        } catch {
          // ignore
        }
        throw new Error(reason);
      }

      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = useCallback(
    async (productId: string, productName: string) => {
      if (!isSuperAdmin) {
        setError("Superadmin privileges are required to delete products.");
        return;
      }

      const confirmed = window.confirm(`Delete ${productName}? This will remove associated inventory data.`);
      if (!confirmed) {
        return;
      }

      try {
        setError(null);
        setMessage(null);
        const response = await fetch(`/api/products/${productId}`, {
          method: "DELETE",
          headers: {
            "X-Admin-Role": role ?? ""
          }
        });
        if (!response.ok) {
          let detail = "Unable to delete product";
          try {
            const payload = (await response.json()) as { message?: string };
            detail = payload.message ?? detail;
          } catch {
            // ignore JSON parsing errors
          }
          throw new Error(detail);
        }

        setMessage(`${productName} removed from the catalog.`);
        await loadProducts();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    },
    [isSuperAdmin, loadProducts, role]
  );

  return (
    <main className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <h1>Product Workbench</h1>
          <p>Upload new imagery, track stock thresholds, and keep SKUs aligned with inventory.</p>
        </div>
        <button className="button button--ghost" type="button" onClick={handleLogout}>
          Log out
        </button>
        {inventoryHealth ? (
          <div className="admin-shell__summary">
            <div>
              <span className="admin-shell__summary-label">Active SKUs</span>
              <strong>{inventoryHealth.totalActive}</strong>
            </div>
            <div>
              <span className="admin-shell__summary-label">Units On Hand</span>
              <strong>{inventoryHealth.totalStock}</strong>
            </div>
            <div>
              <span className="admin-shell__summary-label">Below Reorder</span>
              <strong>{inventoryHealth.belowReorder}</strong>
            </div>
          </div>
        ) : null}
      </header>

      {message ? <div className="admin-alert admin-alert--success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}

      <section className="admin-grid">
        <form className="admin-card admin-form" onSubmit={handleSubmit}>
          <h2>Catalog Uploader</h2>
          <div className="admin-form__row">
            <label htmlFor="name">Product name</label>
            <input id="name" name="name" required value={form.name} onChange={handleInputChange} />
          </div>
          <div className="admin-form__row">
            <label htmlFor="sku">SKU</label>
            <input id="sku" name="sku" required value={form.sku} onChange={handleInputChange} />
          </div>
          <div className="admin-form__grid">
            <div className="admin-form__row">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                name="price"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleInputChange}
              />
            </div>
            <div className="admin-form__row">
              <label htmlFor="currency">Currency</label>
              <input id="currency" name="currency" value={form.currency} onChange={handleInputChange} />
            </div>
            <div className="admin-form__row">
              <label htmlFor="onHand">Starting stock</label>
              <input
                id="onHand"
                name="onHand"
                type="number"
                min="0"
                value={form.onHand}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="admin-form__grid">
            <div className="admin-form__row">
              <label htmlFor="safetyStock">Safety stock</label>
              <input
                id="safetyStock"
                name="safetyStock"
                type="number"
                min="0"
                value={form.safetyStock}
                onChange={handleInputChange}
              />
            </div>
            <div className="admin-form__row">
              <label htmlFor="reorderPoint">Reorder point</label>
              <input
                id="reorderPoint"
                name="reorderPoint"
                type="number"
                min="0"
                value={form.reorderPoint}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="admin-form__row">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="image">Product image</label>
            <input id="image" name="image" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="admin-form__row">
            <label htmlFor="imageAlt">Image alt text</label>
            <input id="imageAlt" name="imageAlt" value={form.imageAlt} onChange={handleInputChange} />
          </div>
          <div className="admin-form__grid">
            <div className="admin-form__row">
              <label htmlFor="colors">Colorways (comma separated)</label>
              <input
                id="colors"
                name="colors"
                placeholder="e.g. Midnight Black, Desert Sand"
                value={form.colors}
                onChange={handleInputChange}
              />
            </div>
            <div className="admin-form__row">
              <label htmlFor="sizes">Sizes (comma separated)</label>
              <input
                id="sizes"
                name="sizes"
                placeholder="e.g. 6, 7, 8, 9, 10"
                value={form.sizes}
                onChange={handleInputChange}
              />
            </div>
            <div className="admin-form__row" />
          </div>
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save product"}
          </button>
        </form>
        <div className="admin-card admin-inventory">
          <div className="admin-inventory__head">
            <h2>Live Catalog</h2>
            <button className="button button--ghost" type="button" onClick={() => void loadProducts()}>
              Refresh
            </button>
          </div>
          {loading ? (
            <p>Loading products…</p>
          ) : products.length ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Pricing</th>
                  <th>Attributes</th>
                  <th>Inventory</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-table__primary">
                        <strong>{product.sku}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="admin-table__primary">
                        <strong>{product.name}</strong>
                        {product.description ? (
                          <span className="admin-table__muted">{product.description}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="admin-table__primary">
                        <strong>{formatCurrency(product.price, product.currency)}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="admin-table__primary">
                        <span className="admin-table__muted">
                          Colors: {product.colors?.length ? product.colors.join(", ") : "—"}
                        </span>
                        <span className="admin-table__muted">
                          Sizes: {product.sizes?.length ? product.sizes.join(", ") : "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-table__primary">
                        <strong>{product.onHand ?? 0}</strong>
                        <span className="admin-table__muted">
                          Reserved: {product.reserved ?? 0} • Reorder at {product.reorderPoint ?? 0}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status admin-status--${product.status}`}>{product.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No products recorded yet.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default ProductAdminPage;
