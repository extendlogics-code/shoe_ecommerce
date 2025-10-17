import { useEffect, useState } from "react";
import HeroCarousel from "../components/HeroCarousel";
import HighlightsBar from "../components/HighlightsBar";
import CollectionGrid from "../components/CollectionGrid";
import ProductRail from "../components/ProductRail";
import BrandTicker from "../components/BrandTicker";
import StoryGrid from "../components/StoryGrid";
import NewsletterBanner from "../components/NewsletterBanner";
import { collectionCards, featuredProducts, newArrivals, type ProductSummary } from "../data/products";
import { formatCurrency } from "../utils/currency";

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
        products={newArrivals}
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
