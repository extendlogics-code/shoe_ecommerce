import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById } from "../data/products";
import { formatCurrency } from "../utils/currency";
import { useCart } from "../context/CartContext";

const ProductDetailPage = () => {
  const { productId = "" } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const product = useMemo(() => getProductById(productId), [productId]);

  if (!product) {
    return (
      <main className="section product-detail">
        <div className="inner product-detail__shell">
          <h1>Product not found</h1>
          <p>The style you were looking for is no longer available. Explore our latest releases.</p>
        </div>
      </main>
    );
  }

  const activeImage = selectedImage ?? product.gallery[0] ?? product.image;

  const handleAddToCart = () => {
    addItem(product, quantity);
    navigate("/cart");
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate("/checkout");
  };

  const increment = () => setQuantity((prev) => Math.min(prev + 1, 10));
  const decrement = () => setQuantity((prev) => Math.max(prev - 1, 1));

  return (
    <main className="section product-detail" role="main">
      <div className="inner product-detail__shell">
        <div className="product-detail__media surface">
          <img src={activeImage} alt={product.name} />
          <div className="product-detail__thumbnails">
            {product.gallery.map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedImage(image)}
                data-active={image === activeImage}
              >
                <img src={image} alt={`${product.name} view`} />
              </button>
            ))}
          </div>
        </div>

        <div className="product-detail__content">
          <span className="eyebrow">{product.categoryLabel}</span>
          <h1>{product.name}</h1>
          <p className="product-detail__price">{formatCurrency(product.price)}</p>
          <p className="product-detail__description">{product.description}</p>

          <div className="product-detail__section">
            <h3>Highlights</h3>
            <ul>
              {product.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>

          <div className="product-detail__section">
            <h3>Materials</h3>
            <ul>
              {product.materials.map((material) => (
                <li key={material}>{material}</li>
              ))}
            </ul>
          </div>

          <div className="product-detail__quantity">
            <span>Quantity</span>
            <div className="quantity-input">
              <button type="button" onClick={decrement} aria-label="Decrease quantity">
                -
              </button>
              <input type="number" value={quantity} min={1} max={10} readOnly />
              <button type="button" onClick={increment} aria-label="Increase quantity">
                +
              </button>
            </div>
          </div>

          <div className="product-detail__actions">
            <button type="button" className="button button--primary" onClick={handleBuyNow}>
              Buy Now
            </button>
            <button type="button" className="button button--dark" onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetailPage;
