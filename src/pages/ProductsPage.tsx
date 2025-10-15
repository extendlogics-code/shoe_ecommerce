import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { categories, categoryProductMap } from "../data/products";
import { formatCurrency } from "../utils/currency";

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromParam = searchParams.get("category") ?? categories[0]?.id;

  const activeCategory = useMemo(() => {
    if (!categoryFromParam) {
      return categories[0]?.id ?? "";
    }
    const exists = categories.some((category) => category.id === categoryFromParam);
    return exists ? categoryFromParam : categories[0]?.id ?? "";
  }, [categoryFromParam]);

  const activeCategoryData = categories.find((category) => category.id === activeCategory) ?? categories[0];
  const products = categoryProductMap[activeCategory] ?? [];

  const handleCategoryClick = (categoryId: string) => {
    setSearchParams({ category: categoryId });
  };

  return (
    <main className="section products-page" role="main">
      <div className="inner products-page__shell stack">
        <header className="products-page__hero surface">
          <img src={activeCategoryData.heroImage} alt={activeCategoryData.name} />
          <div className="products-page__hero-content">
            <span className="eyebrow">Shop by category</span>
            <h1>{activeCategoryData.name}</h1>
            <p>{activeCategoryData.description}</p>
          </div>
        </header>

        <nav className="products-page__categories">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="products-page__category"
              data-active={category.id === activeCategory}
              onClick={() => handleCategoryClick(category.id)}
            >
              <span>{category.name}</span>
              <small>{category.description}</small>
            </button>
          ))}
        </nav>

        <section className="products-page__grid">
          {products.map((product) => (
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
                  <span className="product-card__price">{formatCurrency(product.price)}</span>
                  {product.colors > 1 && <span className="product-card__colors">{product.colors} colorways</span>}
                </div>
              </div>
            </article>
          ))}
          {products.length === 0 && (
            <div className="products-page__empty">
              <h3>No products yet for this category.</h3>
              <p>We are crafting new silhouettes — check back soon.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ProductsPage;
