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
  sizes?: string[];
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
  colorCount: number;
  colorOptions: string[];
  sizeOptions: string[];
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
  const colorOptions = Array.isArray(product.colors)
    ? product.colors.map((color) => color?.trim()).filter((color): color is string => Boolean(color && color.length))
    : [];
  const sizeOptions = Array.isArray(product.sizes)
    ? product.sizes.map((size) => size?.trim()).filter((size): size is string => Boolean(size && size.length))
    : [];

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    currency: product.currency ?? "INR",
    image: resolveImagePath(product.imagePath),
    badge: formatBadge(product.status),
    colorCount: colorOptions.length,
    colorOptions,
    sizeOptions,
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
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

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
          setSelectedSize(null);
          setSelectedColor(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unexpected error");
          setProducts([]);
          setCategoriesData([]);
          setSelectedSize(null);
          setSelectedColor(null);
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

  useEffect(() => {
    setSelectedSize(null);
    setSelectedColor(null);
  }, [activeCategory]);

  const activeCategoryData =
    categories.find((category) => category.id === activeCategory) ?? categories[0] ?? null;

  const productsInActiveCategory = useMemo(() => {
    if (!activeCategory) {
      return [];
    }
    return products.filter((product) => product.categoryId === activeCategory);
  }, [activeCategory, products]);

  const availableSizes = useMemo(() => {
    const seen = new Map<string, string>();
    productsInActiveCategory.forEach((product) => {
      product.sizeOptions.forEach((size) => {
        const key = size.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, size);
        }
      });
    });
    return Array.from(seen.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [productsInActiveCategory]);

  const availableColors = useMemo(() => {
    const seen = new Map<string, string>();
    productsInActiveCategory.forEach((product) => {
      product.colorOptions.forEach((color) => {
        const key = color.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, color);
        }
      });
    });
    return Array.from(seen.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [productsInActiveCategory]);

  useEffect(() => {
    if (selectedSize && !availableSizes.includes(selectedSize)) {
      setSelectedSize(null);
    }
  }, [availableSizes, selectedSize]);

  useEffect(() => {
    if (selectedColor && !availableColors.includes(selectedColor)) {
      setSelectedColor(null);
    }
  }, [availableColors, selectedColor]);

  const productsForCategory = useMemo(() => {
    return productsInActiveCategory.filter((product) => {
      const sizeMatch = selectedSize ? product.sizeOptions.includes(selectedSize) : true;
      const colorMatch = selectedColor ? product.colorOptions.includes(selectedColor) : true;
      return sizeMatch && colorMatch;
    });
  }, [productsInActiveCategory, selectedColor, selectedSize]);

  const handleCategoryClick = (categoryId: string) => {
    setSearchParams({ category: categoryId });
  };

  const handleSizeFilterClick = (size: string | null) => {
    if (!size) {
      setSelectedSize(null);
      return;
    }
    setSelectedSize((prev) => (prev === size ? null : size));
  };

  const handleColorFilterClick = (color: string | null) => {
    if (!color) {
      setSelectedColor(null);
      return;
    }
    setSelectedColor((prev) => (prev === color ? null : color));
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

        {(!loading && (availableSizes.length || availableColors.length)) ? (
          <section className="products-page__filters surface">
            {availableSizes.length ? (
              <div className="products-page__filter-group">
                <span className="products-page__filter-label">Sizes</span>
                <div className="products-page__filter-options">
                  <button
                    type="button"
                    className="products-page__filter-option"
                    data-active={selectedSize === null}
                    onClick={() => handleSizeFilterClick(null)}
                  >
                    All
                  </button>
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className="products-page__filter-option"
                      data-active={selectedSize === size}
                      onClick={() => handleSizeFilterClick(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {availableColors.length ? (
              <div className="products-page__filter-group">
                <span className="products-page__filter-label">Colors</span>
                <div className="products-page__filter-options">
                  <button
                    type="button"
                    className="products-page__filter-option products-page__filter-option--color"
                    data-active={selectedColor === null}
                    onClick={() => handleColorFilterClick(null)}
                  >
                    <span className="products-page__filter-swatch" aria-hidden="true" />
                    <span>All</span>
                  </button>
                  {availableColors.map((color) => {
                    const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
                    const swatchStyle = isHex ? { backgroundColor: color } : undefined;
                    return (
                      <button
                        key={color}
                        type="button"
                        className="products-page__filter-option products-page__filter-option--color"
                        data-active={selectedColor === color}
                        onClick={() => handleColorFilterClick(color)}
                      >
                        <span className="products-page__filter-swatch" style={swatchStyle} aria-hidden="true" />
                        <span>{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

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
                    {product.colorCount > 1 && (
                      <span className="product-card__colors">{product.colorCount} colorways</span>
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
