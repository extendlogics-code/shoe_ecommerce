import { IconArrowRight, IconPalette } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { ProductSummary } from "../data/products";
import { formatCurrency } from "../utils/currency";

type Props = {
  id: string;
  title: string;
  subtitle: string;
  products: ProductSummary[];
  eyebrow?: string;
  ctaLabel?: string;
};

const ProductRail = ({ id, title, subtitle, products, eyebrow, ctaLabel }: Props) => {
  return (
    <section className="section product-rail" id={id}>
      <div className="inner stack">
        <header className="product-rail__header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <a href="#shop-all" className="button button--dark">
            {ctaLabel ?? "View All"}
            <IconArrowRight size={18} stroke={1.8} />
          </a>
        </header>

        <div className="product-rail__grid">
          {products.map((product) => (
            <motion.article
              key={product.id}
              className="product-card"
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
            >
              <figure className="product-card__media">
                {product.badge && <span className="badge">{product.badge}</span>}
                <Link to={`/products/${product.id}`}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                </Link>
              </figure>
              <div className="product-card__info">
                <div>
                  <Link to={`/products/${product.id}`}>
                    <h3>{product.name}</h3>
                  </Link>
                  <p>{product.categoryLabel}</p>
                </div>
                <div className="product-card__meta">
                  <span className="product-card__price">{formatCurrency(product.price)}</span>
                  {product.colors > 1 && (
                    <span className="product-card__colors">
                      <IconPalette size={18} stroke={1.6} />
                      {product.colors} shades
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductRail;
