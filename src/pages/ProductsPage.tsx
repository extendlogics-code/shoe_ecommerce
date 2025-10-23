import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { withCategoryPresentation } from "../data/categoryMeta";
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
  categoryLabel?: string | null;
  categoryNavLabel?: string | null;
  categoryDescription?: string | null;
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

type ApiCategory = {
  id: string;
  label: string;
  navLabel: string;
  description: string;
  sortOrder: number;
  total: number;
};

type ViewCategory = {
  id: string;
  label: string;
  description: string;
  heroImage: string;
  count: number;
  sortOrder: number;
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
  const categoryPresentation = withCategoryPresentation({
    id: product.category,
    label: product.categoryLabel ?? null,
    navLabel: product.categoryNavLabel ?? null,
    description: product.categoryDescription ?? null
  });

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    currency: product.currency ?? "INR",
    image: resolveImagePath(product.imagePath),
    badge: formatBadge(product.status),
    colors: Array.isArray(product.colors) ? product.colors.filter(Boolean).length : 0,
    categoryLabel: categoryPresentation.label,
    categoryId: categoryPresentation.id
  };
};

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ViewProduct[]>([]);
  const [categoriesData, setCategoriesData] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/products/categories")
        ]);

        if (!productsResponse.ok) {
          throw new Error("Unable to load products");
        }

        if (!categoriesResponse.ok) {
          throw new Error("Unable to load product categories");
        }

        const [productsPayload, categoriesPayload] = await Promise.all([
          productsResponse.json() as Promise<ApiProduct[]>,
          categoriesResponse.json() as Promise<ApiCategory[]>
        ]);

        if (!cancelled) {
          const mappedProducts = productsPayload
            .map(mapProduct)
            .filter((product) => product.categoryId !== "uncategorized");
          setProducts(mappedProducts);
          setCategoriesData(categoriesPayload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unexpected error");
          setProducts([]);
          setCategoriesData([]);
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

    const fromApi = categoriesData.map((category) => {
      const presented = withCategoryPresentation(category);
      return {
        id: presented.id,
        label: presented.label,
        description: presented.description,
        heroImage: presented.heroImage,
        count: counts.get(presented.id) ?? category.total ?? 0,
        sortOrder: category.sortOrder ?? 100
      } satisfies ViewCategory;
    });

    // ensure categories referenced by products but missing from API still appear
    products.forEach((product) => {
      if (!fromApi.some((entry) => entry.id === product.categoryId)) {
        const presented = withCategoryPresentation({ id: product.categoryId, label: product.categoryLabel });
        fromApi.push({
          id: presented.id,
          label: presented.label,
          description: presented.description,
          heroImage: presented.heroImage,
          count: counts.get(presented.id) ?? 0,
          sortOrder: 200
        });
      }
    });

    const filtered = fromApi.filter((entry) => entry.id !== "uncategorized");

    if (!filtered.length) {
      return [];
    }

    return filtered.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.label.localeCompare(b.label);
    });
  }, [categoriesData, products]);

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
              </span>
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
