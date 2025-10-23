import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CATEGORY_ORDER, WORKBENCH_CATEGORY_IDS, getCategoryMeta } from "../data/categoryMeta";
import { formatCurrency } from "../utils/currency";

const PLACEHOLDER_IMAGE = "https://dummyimage.com/640x800/e8dcd2/2e1b12&text=Kalaa+Product";

type ApiProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  status: string;
  description: string | null;
  imagePath: string | null;
  colors: string[];
  category: string | null;
};

type ViewProduct = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  badge?: string;
  colors: number;
  categoryLabel: string;
  categoryId: string;
};

type ViewCategory = {
  id: string;
  label: string;
  description: string;
  heroImage: string;
  count: number;
};

const resolveImagePath = (imagePath: string | null) => {
  if (!imagePath) {
    return PLACEHOLDER_IMAGE;
  }
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
};

const formatBadge = (status: string) => {
  if (!status) {
    return undefined;
  }
  if (status.toLowerCase() === "active") {
    return "New";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const mapProduct = (product: ApiProduct): ViewProduct => {
  const meta = getCategoryMeta(product.category);
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    currency: product.currency ?? "INR",
    image: resolveImagePath(product.imagePath),
    badge: formatBadge(product.status),
    colors: Array.isArray(product.colors) ? product.colors.filter(Boolean).length : 0,
    categoryLabel: meta.label,
    categoryId: meta.id
  };
};

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ViewProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Unable to load products");
        }
        const data = (await response.json()) as ApiProduct[];
        if (!cancelled) {
          setProducts(data.map(mapProduct));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unexpected error");
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo<ViewCategory[]>(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      const key = product.categoryId;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const ids = new Set<string>([
      ...WORKBENCH_CATEGORY_IDS,
      ...Array.from(counts.keys()).filter(Boolean)
    ]);

    if (!ids.size) {
      ids.add("uncategorized");
    }

    const list = Array.from(ids).map((id) => {
      const meta = getCategoryMeta(id);
      return {
        id: meta.id,
        label: meta.label,
        description: meta.description,
        heroImage: meta.heroImage,
        count: counts.get(meta.id) ?? 0
      };
    });

    list.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a.id);
      const indexB = CATEGORY_ORDER.indexOf(b.id);
      if (indexA === -1 && indexB === -1) {
        return a.label.localeCompare(b.label);
      }
      if (indexA === -1) {
        return 1;
      }
      if (indexB === -1) {
        return -1;
      }
      return indexA - indexB;
    });

    return list;
  }, [products]);

  const categoryParam = searchParams.get("category");

  useEffect(() => {
    if (!categories.length) {
      return;
    }

    if (!categoryParam || !categories.some((category) => category.id === categoryParam)) {
      const fallback = categories[0]?.id;
      if (fallback) {
        setSearchParams({ category: fallback }, { replace: !categoryParam });
      }
    }
  }, [categories, categoryParam, setSearchParams]);

  const activeCategory = useMemo(() => {
    if (!categories.length) {
      return "";
    }
    if (!categoryParam) {
      return categories[0]?.id ?? "";
    }
    const exists = categories.some((category) => category.id === categoryParam);
    return exists ? categoryParam : categories[0]?.id ?? "";
  }, [categories, categoryParam]);

  const activeCategoryData =
    categories.find((category) => category.id === activeCategory) ?? categories[0] ?? null;

  const productsForCategory = useMemo(
    () =>
      products.filter((product) =>
        activeCategory ? product.categoryId === activeCategory : false
      ),
    [activeCategory, products]
  );

  const handleCategoryClick = (categoryId: string) => {
    setSearchParams({ category: categoryId });
  };

  return (
    <main className="section products-page" role="main">
      <div className="inner products-page__shell stack">
        <header className="products-page__hero surface">
          {activeCategoryData ? (
            <>
              <img src={activeCategoryData.heroImage} alt={activeCategoryData.label} />
              <div className="products-page__hero-content">
                <span className="eyebrow">Shop by category</span>
                <h1>{activeCategoryData.label}</h1>
                <p>{activeCategoryData.description}</p>
              </div>
            </>
          ) : (
            <div className="products-page__hero-content">
              <span className="eyebrow">Shop by category</span>
              <h1>Catalog</h1>
              <p>Publish products from the Product Workbench to see them appear here in real-time.</p>
            </div>
          )}
        </header>

        {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}

        <nav className="products-page__categories">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="products-page__category"
              data-active={category.id === activeCategory}
              onClick={() => handleCategoryClick(category.id)}
            >
              <span>
                {category.label}
                {category.count ? <sup> {category.count}</sup> : null}
              </span>
              <small>{category.description}</small>
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="products-page__grid">
            <div className="products-page__empty">
              <h3>Loading catalog…</h3>
              <p>Fetching the latest products from the Product Workbench.</p>
            </div>
          </div>
        ) : (
          <section className="products-page__grid">
            {productsForCategory.map((product) => (
              <article key={product.id} className="product-card product-card--large">
                <Link to={`/products/${product.id}`} className="product-card__media">
                  {product.badge && <span className="badge">{product.badge}</span>}
                  <img src={product.image} alt={product.name} loading="lazy" />
                </Link>
                <div className="product-card__info">
                  <div>
                    <Link to={`/products/${product.id}`}>
                      <h3>{product.name}</h3>
                    </Link>
                    <p>{product.categoryLabel}</p>
                  </div>
                  <div className="product-card__meta">
                    <span className="product-card__price">{formatCurrency(product.price, product.currency)}</span>
                    {product.colors > 1 && (
                      <span className="product-card__colors">{product.colors} colorways</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {!productsForCategory.length ? (
              <div className="products-page__empty">
                <h3>No products yet for this category.</h3>
                <p>We are crafting new silhouettes — check back soon.</p>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
};

export default ProductsPage;
