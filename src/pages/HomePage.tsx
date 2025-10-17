import { useEffect, useState } from "react";
import HeroCarousel from "../components/HeroCarousel";
import HighlightsBar from "../components/HighlightsBar";
import CollectionGrid from "../components/CollectionGrid";
import ProductRail from "../components/ProductRail";
import BrandTicker from "../components/BrandTicker";
import StoryGrid from "../components/StoryGrid";
import NewsletterBanner from "../components/NewsletterBanner";
import { collectionCards, featuredProducts, newArrivals, type ProductSummary } from "../data/products";

type ApiProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  status: string;
  imagePath: string | null;
  colors: string[];
};

type ApiOrder = {
  id: string;
  status: string;
  placedAt: string;
  items: Array<{
    id: string;
    productId: string;
    sku: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    imagePath: string | null;
  }>;
};

const HomePage = () => {
  const [arrivals, setArrivals] = useState<ProductSummary[]>(newArrivals);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [ordersResponse, productsResponse] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/products")
        ]);

        if (!ordersResponse.ok || !productsResponse.ok) {
          throw new Error("Failed to load live arrivals");
        }

        const orders = (await ordersResponse.json()) as ApiOrder[];
        const products = (await productsResponse.json()) as ApiProduct[];

        const productById = new Map(products.map((product) => [product.id, product]));
        const productBySku = new Map(products.map((product) => [product.sku, product]));

        const sortedOrders = [...orders].sort(
          (a, b) => new Date(b.placedAt).valueOf() - new Date(a.placedAt).valueOf()
        );

        const unique = new Map<string, ProductSummary>();
        const fallback = newArrivals.length ? newArrivals : featuredProducts;
        if (!fallback.length) {
          return;
        }

        for (const order of sortedOrders) {
          for (const item of order.items) {
            const key = item.productId || item.sku || item.id;
            if (unique.has(key)) {
              continue;
            }

            const product = (item.productId && productById.get(item.productId)) || productBySku.get(item.sku);
            const fallbackEntry = fallback[unique.size % fallback.length];

            const imagePath = product?.imagePath ?? item.imagePath;
            const summary: ProductSummary = {
              id: product?.id ?? key,
              name: product?.name ?? item.productName,
              price: product?.price ?? item.unitPrice,
              image: imagePath ? `/${imagePath}` : fallbackEntry?.image ?? "",
              colors: product?.colors?.length ?? fallbackEntry?.colors ?? 0,
              categoryLabel: product ? `SKU ${product.sku}` : fallbackEntry?.categoryLabel ?? "Latest arrival",
              badge:
                order.status === "fulfilled"
                  ? "Fulfilled"
                  : order.status === "processing"
                  ? "New"
                  : order.status.toUpperCase(),
              href: product ? `/products/${product.id}` : undefined
            };

            unique.set(key, summary);
            if (unique.size >= fallback.length) {
              break;
            }
          }
          if (unique.size >= fallback.length) {
            break;
          }
        }

        if (!cancelled && unique.size) {
          setArrivals(Array.from(unique.values()));
        }
      } catch {
        if (!cancelled) {
          setArrivals(newArrivals);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="stack" role="main">
      <HeroCarousel />
      <HighlightsBar />
      <CollectionGrid cards={collectionCards} />
      <ProductRail
        id="new-arrivals"
        eyebrow="Fresh for the season"
        title="Latest arrivals redefining comfort"
        subtitle="Meticulously engineered silhouettes crafted with regenerative leathers, recycled knit uppers, and cloud-cushion midsoles."
        products={arrivals}
        ctaLabel="Shop New In"
      />
      <BrandTicker />
      <ProductRail
        id="featured"
        eyebrow="Most loved"
        title="Signature bestsellers"
        subtitle="Pieces refined over seven iterations and thousands of fittings. Your rotation essentials, elevated."
        products={featuredProducts}
        ctaLabel="View the Icons"
      />
      <StoryGrid />
      <NewsletterBanner />
    </main>
  );
};

export default HomePage;
