import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import "../styles/customization.css";
import "../styles/product-details.css";
import { formatCurrency } from "../utils/currency";
import { useCart } from "../context/CartContext";
type CustomizationOption = {
  id: string;
  name: string;
  type: 'color' | 'material' | 'text';
  choices: {
    id: string;
    name: string;
    value: string;
    image?: string;
    priceAdjustment: number;
  }[];
};

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
  createdAt?: string;
  onHand: number | null;
  reserved: number | null;
  safetyStock: number | null;
  reorderPoint: number | null;
  isCustomizable?: boolean;
  customizationOptions?: CustomizationOption[];
  angles?: string[];
};

type ViewProduct = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  status: string;
  colors: string[];
  sizes: string[];
  description: string | null;
  productDetails: string[] | null;
  productStory: string | null;
  materialInfo: string | null;
  careInstructions: string[] | null;
  features: string[] | null;
  onHand: number | null;
  reserved: number | null;
  safetyStock: number | null;
  reorderPoint: number | null;
  createdAt?: string;
  isCustomizable?: boolean;
  customizationOptions?: CustomizationOption[];
  angles?: string[];
  currentCustomizations?: Record<string, string>;
  currentAngle?: number;
};

const PLACEHOLDER_IMAGE =
  "https://dummyimage.com/640x800/e8dcd2/2e1b12&text=Kalaa+Product";

const mapToViewProduct = (product: ApiProduct): ViewProduct => ({
  id: product.id,
  name: product.name,
  price: product.price,
  currency: product.currency ?? "INR",
  image: product.imagePath ? `/${product.imagePath}` : PLACEHOLDER_IMAGE,
  status: product.status,
  colors: Array.isArray(product.colors) ? product.colors : [],
  sizes: Array.isArray(product.sizes) ? product.sizes : [],
  description: product.description,
  productDetails: product.productDetails ?? null,
  productStory: product.productStory ?? null,
  materialInfo: product.materialInfo ?? null,
  careInstructions: product.careInstructions ?? null,
  features: product.features ?? null,
  onHand: product.onHand ?? null,
  reserved: product.reserved ?? null,
  safetyStock: product.safetyStock ?? null,
  reorderPoint: product.reorderPoint ?? null,
  createdAt: product.createdAt,
  isCustomizable: product.isCustomizable ?? false,
  customizationOptions: product.customizationOptions ?? [],
  angles: product.angles ?? [],
  currentCustomizations: {},
  currentAngle: 0
});

const NewProductsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ViewProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ViewProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [currentAngle, setCurrentAngle] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const navigate = useNavigate();
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/products/new");
        if (!response.ok) {
          let detail = "Unable to load new products.";
          try {
            const payload = (await response.json()) as { message?: string };
            detail = payload.message ?? detail;
          } catch {
            // ignore JSON parsing issues
          }
          throw new Error(detail);
        }

        const data = (await response.json()) as ApiProduct[];
        if (!cancelled) {
          const mapped = data.map((product) => mapToViewProduct(product));
          setProducts(mapped);
          setSelectedProduct(null);
          setSelectedSize(null);
          setSizeError(null);
          setQuantity(1);
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

  const openProduct = (product: ViewProduct) => {
    setSelectedProduct(product);
    setSelectedSize(null);
    setSizeError(null);
    setQuantity(1);
  };

  const showAllProducts = () => {
    setSelectedProduct(null);
    setSelectedSize(null);
    setSizeError(null);
    setQuantity(1);
  };

  const incrementQuantity = () => setQuantity((prev) => Math.max(1, prev + 1));
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleQuantityInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      setQuantity(Math.max(1, value));
    }
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSizeError(null);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      return;
    }
    if (!selectedSize) {
      setSizeError("Please select a size");
      return;
    }
    const customizationLabels = selectedProduct.customizationOptions
      ?.filter(opt => customizations[opt.id])
      ?.map(opt => {
        const choice = opt.choices.find(c => c.id === customizations[opt.id]);
        return `${opt.name}: ${choice?.name}`;
      });

    addItem(
      {
        id: `${selectedProduct.id}${Object.values(customizations).join('-')}`,
        name: selectedProduct.name,
        price: selectedProduct.price + totalPrice,
        image: selectedProduct.image,
        badge: selectedProduct.status === "active" ? "New" : selectedProduct.status,
        colors: selectedProduct.colors.length,
        categoryLabel: `Size ${selectedSize}${customizationLabels?.length ? ` | ${customizationLabels.join(' | ')}` : ''}`
      },
      quantity
    );
  };

  const handleBuyNow = () => {
    if (!selectedProduct) {
      return;
    }
    if (!selectedSize) {
      setSizeError("Please select a size");
      return;
    }
    handleAddToCart();
    navigate("/checkout");
  };

  const emptyStateCopy = useMemo(
    () => ({
      title: "No products have been added yet",
      description: "Visit the Product Workbench to publish your first SKU and it will appear here automatically."
    }),
    []
  );

  return (
    <>
      <main className="section new-products-page" role="main">
        <div className="inner stack">
        <header className="new-products-page__hero surface">
          <span className="eyebrow">New products</span>
          <h1>Fresh from the Kalaa atelier</h1>
          <p>
            Every product you create in the Product Workbench is automatically showcased here. Perfect for sharing the
            latest drops with your customers.
          </p>
        </header>

        {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}

        {loading ? <div className="surface new-products-page__loader">Loading new releases…</div> : null}

        {!loading && !error && !selectedProduct && products.length ? (
          <section className="new-products-page__grid">
            {products.map((product) => (
              <article key={product.id} className="product-card surface">
                <button
                  type="button"
                  className="new-products-page__card-button"
                  onClick={() => openProduct(product)}
                >
                  <figure className="product-card__media">
                    <span className="badge">{product.status === "active" ? "New" : product.status}</span>
                    <img src={product.image} alt={product.name} loading="lazy" />
                  </figure>
                  <div className="product-card__info">
                    <div>
                      <h3>{product.name}</h3>
                    </div>
                    <div className="product-card__meta">
                      <span className="product-card__price">{formatCurrency(product.price, product.currency)}</span>
                      {product.colors.length ? (
                        <small className="new-products-page__colors">
                          Shades: {product.colors.join(", ")}
                        </small>
                      ) : null}
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </section>
        ) : null}

        {!loading && !error && selectedProduct ? (
          <section className="surface new-products-page__detail" aria-labelledby="new-product-detail-title">
            <header className="new-products-page__detail-header">
              <button type="button" className="button button--ghost" onClick={showAllProducts}>
                ← Back to new products
              </button>
              <span className="eyebrow">New product spotlight</span>
              <h2 id="new-product-detail-title">{selectedProduct.name}</h2>
            </header>
            <div className="new-products-page__detail-grid">
              <figure>
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </figure>
              <div className="new-products-page__detail-info">
                <div className="new-products-page__detail-meta">
                  <strong className="new-products-page__detail-price">
                    {formatCurrency(selectedProduct.price + (totalPrice || 0), selectedProduct.currency)}
                  </strong>
                  {selectedProduct.isCustomizable && (
                    <div className="new-products-page__customize-badge">
                      <span>Customizable</span>
                    </div>
                  )}
                </div>

                {selectedProduct.description ? (
                  <p className="new-products-page__detail-description">{selectedProduct.description}</p>
                ) : null}

                {selectedProduct.productStory ? (
                  <div className="new-products-page__section">
                    <h3>Product Story</h3>
                    <p>{selectedProduct.productStory}</p>
                  </div>
                ) : null}

                {selectedProduct.productDetails && selectedProduct.productDetails.length > 0 ? (
                  <div className="new-products-page__section">
                    <h3>Product Details</h3>
                    <ul className="new-products-page__details-list">
                      {selectedProduct.productDetails.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {selectedProduct.materialInfo ? (
                  <div className="new-products-page__section">
                    <h3>Material & Care</h3>
                    <p>{selectedProduct.materialInfo}</p>
                    {selectedProduct.careInstructions && selectedProduct.careInstructions.length > 0 ? (
                      <ul className="new-products-page__care-list">
                        {selectedProduct.careInstructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                {selectedProduct.features && selectedProduct.features.length > 0 ? (
                  <div className="new-products-page__section">
                    <h3>Key Features</h3>
                    <ul className="new-products-page__features-list">
                      {selectedProduct.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {selectedProduct.isCustomizable && selectedProduct.customizationOptions?.map((option) => (
                  <div key={option.id} className="new-products-page__customization-section">
                    <h3>{option.name}</h3>
                    <div className={`new-products-page__customization-options new-products-page__customization-options--${option.type}`}>
                      {option.choices.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          className={clsx(
                            'new-products-page__customization-choice',
                            customizations[option.id] === choice.id && 'new-products-page__customization-choice--selected'
                          )}
                          onClick={() => {
                            const newCustomizations = {
                              ...customizations,
                              [option.id]: choice.id
                            };
                            setCustomizations(newCustomizations);
                            const newTotal = Object.entries(newCustomizations).reduce((sum, [optId, choiceId]) => {
                              const opt = selectedProduct.customizationOptions?.find(o => o.id === optId);
                              const choice = opt?.choices.find(c => c.id === choiceId);
                              return sum + (choice?.priceAdjustment || 0);
                            }, 0);
                            setTotalPrice(newTotal);
                          }}
                          style={option.type === 'color' ? { backgroundColor: choice.value } : undefined}
                          title={`${choice.name}${choice.priceAdjustment ? ` (+${formatCurrency(choice.priceAdjustment, selectedProduct.currency)})` : ''}`}
                        >
                          {option.type !== 'color' && choice.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {selectedProduct.angles && selectedProduct.angles.length > 0 && (
                  <div className="new-products-page__angles">
                    <h3>View Angles</h3>
                    <div className="new-products-page__angle-options">
                      {selectedProduct.angles.map((angle, index) => (
                        <button
                          key={index}
                          type="button"
                          className={clsx(
                            'new-products-page__angle-button',
                            currentAngle === index && 'new-products-page__angle-button--selected'
                          )}
                          onClick={() => setCurrentAngle(index)}
                        >
                          <img src={angle} alt={`View ${index + 1}`} className="new-products-page__angle-preview" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.sizes.length ? (
                  <div className="new-products-page__size-picker">
                    <span>Sizes</span>
                    <div className="new-products-page__size-options">
                      {selectedProduct.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={clsx(
                            'new-products-page__size-option',
                            selectedSize === size && 'new-products-page__size-option--selected'
                          )}
                          onClick={() => handleSizeSelect(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {sizeError && <p className="new-products-page__size-error">{sizeError}</p>}
                  </div>
                ) : null}

                <div className="new-products-page__quantity">
                  <span>Quantity</span>
                  <div>
                    <button type="button" onClick={decrementQuantity} aria-label="Decrease quantity">
                      –
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={handleQuantityInput}
                      aria-label="Selected quantity"
                    />
                    <button type="button" onClick={incrementQuantity} aria-label="Increase quantity">
                      +
                    </button>
                  </div>
                </div>

                <div className="new-products-page__actions">
                  <button type="button" className="button button--primary" onClick={handleAddToCart}>
                    Add to cart
                  </button>
                  <button type="button" className="button button--ghost" onClick={handleBuyNow}>
                    Buy now
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && !error && !products.length ? (
          <section className="surface new-products-page__empty">
            <h2>{emptyStateCopy.title}</h2>
            <p>{emptyStateCopy.description}</p>
            <Link to="/admin/catalog" className="button button--primary">
              Go to Product Workbench
            </Link>
          </section>
        ) : null}
        </div>
      </main>
    </>
  );
};

export default NewProductsPage;
