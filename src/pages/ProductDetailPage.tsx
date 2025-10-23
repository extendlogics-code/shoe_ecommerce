import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "../utils/currency";
import { useCart } from "../context/CartContext";
import { DEFAULT_CATEGORY_ID, withCategoryPresentation } from "../data/categoryMeta";

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
  categoryLabel?: string | null;
  categoryNavLabel?: string | null;
  categoryDescription?: string | null;
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
  categoryNavLabel?: string;
  categoryDescription?: string | null;
  badge?: string;
  colors: number;
  colorOptions: string[];
  sizeOptions: string[];
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
  const presentation = withCategoryPresentation({
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
    categoryLabel: presentation.id === DEFAULT_CATEGORY_ID ? "Latest arrival" : presentation.label,
    categoryNavLabel: presentation.navLabel,
    categoryDescription: presentation.description,
    badge: formatBadge(product.status),
    colors: colorOptions.length,
    colorOptions,
    sizeOptions
  };
};

const ProductDetailPage = () => {
  const { productId = "" } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!product) {
      setSelectedSize(null);
      setSelectedColor(null);
      setSizeError(null);
      setColorError(null);
      return;
    }

    const defaultSize = product.sizeOptions[0] ?? null;
    const defaultColor = product.colorOptions[0] ?? null;
    setSelectedSize(defaultSize);
    setSelectedColor(defaultColor);
    setSizeError(null);
    setColorError(null);
  }, [product]);

  const activeImage = useMemo(() => {
    const source = selectedImage ?? product?.gallery[0] ?? product?.image ?? null;
    return source ?? PLACEHOLDER_IMAGE;
  }, [product, selectedImage]);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSizeError(null);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setColorError(null);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/products");
    }
  };

  const validateSelections = () => {
    if (!product) {
      return false;
    }

    let valid = true;
    if (product.sizeOptions.length && !selectedSize) {
      setSizeError("Please select a size");
      valid = false;
    }
    if (product.colorOptions.length && !selectedColor) {
      setColorError("Please select a color");
      valid = false;
    }
    return valid;
  };

  const handleAddToCart = () => {
    if (!product) {
      return;
    }
    if (!validateSelections()) {
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
      { productId: product.id, sku: product.sku, size: selectedSize, color: selectedColor }
    );
    navigate("/cart");
  };

  const handleBuyNow = () => {
    if (!product) {
      return;
    }
    if (!validateSelections()) {
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
      { productId: product.id, sku: product.sku, size: selectedSize, color: selectedColor }
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
          <button type="button" className="product-detail__back" onClick={handleBack}>
            Back
          </button>
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

          {product.sizeOptions.length ? (
            <div className="product-detail__selector">
              <span className="product-detail__selector-label">Size</span>
              <div className="product-detail__selector-options">
                {product.sizeOptions.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`product-detail__selector-option${
                        isSelected ? " product-detail__selector-option--selected" : ""
                      }`}
                      onClick={() => handleSizeSelect(size)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {sizeError ? <p className="product-detail__selector-error">{sizeError}</p> : null}
            </div>
          ) : null}

          {product.colorOptions.length ? (
            <div className="product-detail__selector">
              <span className="product-detail__selector-label">Color</span>
              <div className="product-detail__selector-options">
                {product.colorOptions.map((color) => {
                  const normalized = color.trim();
                  const isSelected = selectedColor === color;
                  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized);
                  const swatchStyle = isHex ? { backgroundColor: normalized } : undefined;
                  return (
                    <button
                      key={color}
                      type="button"
                      className={`product-detail__selector-option product-detail__selector-option--color${
                        isSelected ? " product-detail__selector-option--selected" : ""
                      }`}
                      onClick={() => handleColorSelect(color)}
                    >
                      <span className="product-detail__selector-swatch" style={swatchStyle} aria-hidden="true" />
                      <span>{normalized}</span>
                    </button>
                  );
                })}
              </div>
              {colorError ? <p className="product-detail__selector-error">{colorError}</p> : null}
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
