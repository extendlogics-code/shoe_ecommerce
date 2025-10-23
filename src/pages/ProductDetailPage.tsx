import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "../utils/currency";
import { useCart } from "../context/CartContext";
import { getCategoryMeta } from "../data/categoryMeta";

const PLACEHOLDER_IMAGE = "https://dummyimage.com/640x800/e8dcd2/2e1b12&text=Kalaa+Product";

type ApiProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  status: string;
  description: string | null;
  productDetails: string[] | null;
  productStory: string | null;
  materialInfo: string | null;
  careInstructions: string[] | null;
  features: string[] | null;
  imagePath: string | null;
  colors: string[];
  sizes: string[];
  category: string | null;
};

type ViewProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  image: string;
  gallery: string[];
  description: string | null;
  productDetails: string[];
  productStory: string | null;
  materialInfo: string | null;
  careInstructions: string[];
  features: string[];
  categoryLabel: string;
  badge?: string;
  colors: number;
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
  const colorOptions = Array.isArray(product.colors) ? product.colors.filter(Boolean) : [];
  const galleryImage = resolveImagePath(product.imagePath);
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    currency: product.currency ?? "INR",
    image: galleryImage,
    gallery: [galleryImage],
    description: product.description,
    productDetails: product.productDetails?.filter((entry) => entry && entry.trim().length) ?? [],
    productStory: product.productStory ?? null,
    materialInfo: product.materialInfo ?? null,
    careInstructions: product.careInstructions?.filter((entry) => entry && entry.trim().length) ?? [],
    features: product.features?.filter((entry) => entry && entry.trim().length) ?? [],
    categoryLabel: meta.label,
    badge: formatBadge(product.status),
    colors: colorOptions.length
  };
};

const ProductDetailPage = () => {
  const { productId = "" } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<ViewProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/products/${productId}`);
        let payload: ApiProduct | { message?: string } | null = null;

        try {
          payload = (await response.json()) as ApiProduct | { message?: string };
        } catch {
          payload = null;
        }

        if (!response.ok) {
          const detail = payload && "message" in payload && payload.message ? payload.message : "Product not found";
          throw new Error(detail);
        }

        if (!cancelled) {
          const mapped = mapProduct(payload as ApiProduct);
          setProduct(mapped);
          setSelectedImage(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unexpected error");
          setProduct(null);
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
  }, [productId]);

  useEffect(() => {
    setQuantity(1);
  }, [productId]);

  const activeImage = useMemo(() => {
    const source = selectedImage ?? product?.gallery[0] ?? product?.image ?? null;
    return source ?? PLACEHOLDER_IMAGE;
  }, [product, selectedImage]);

  const handleAddToCart = () => {
    if (!product) {
      return;
    }
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        badge: product.badge,
        colors: product.colors,
        categoryLabel: product.categoryLabel
      },
      quantity,
      { productId: product.id, sku: product.sku }
    );
    navigate("/cart");
  };

  const handleBuyNow = () => {
    if (!product) {
      return;
    }
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        badge: product.badge,
        colors: product.colors,
        categoryLabel: product.categoryLabel
      },
      quantity,
      { productId: product.id, sku: product.sku }
    );
    navigate("/checkout");
  };

  const increment = () => setQuantity((prev) => Math.min(prev + 1, 10));
  const decrement = () => setQuantity((prev) => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <main className="section product-detail">
        <div className="inner product-detail__shell">
          <h1>Loading product…</h1>
          <p>Fetching the latest details from the Product Workbench.</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="section product-detail">
        <div className="inner product-detail__shell">
          <h1>Product not available</h1>
          <p>{error ?? "The style you were looking for is no longer available. Explore our latest releases."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="section product-detail" role="main">
      <div className="inner product-detail__shell">
        <div className="product-detail__media surface">
          <img src={activeImage} alt={product.name} />
          {product.gallery.length > 1 ? (
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
          ) : null}
        </div>

        <div className="product-detail__content">
          <span className="eyebrow">{product.categoryLabel}</span>
          <h1>{product.name}</h1>
          <p className="product-detail__price">{formatCurrency(product.price, product.currency)}</p>
          {product.description ? <p className="product-detail__description">{product.description}</p> : null}

          {product.productDetails.length ? (
            <div className="product-detail__section">
              <h3>Highlights</h3>
              <ul>
                {product.productDetails.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {product.features.length ? (
            <div className="product-detail__section">
              <h3>Key Features</h3>
              <ul>
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {product.materialInfo ? (
            <div className="product-detail__section">
              <h3>Materials</h3>
              <p>{product.materialInfo}</p>
            </div>
          ) : null}

          {product.careInstructions.length ? (
            <div className="product-detail__section">
              <h3>Care Instructions</h3>
              <ul>
                {product.careInstructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ul>
            </div>
          ) : null}

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
