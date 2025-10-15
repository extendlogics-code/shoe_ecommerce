import heroImageOne from "./home7-product1.jpg";
import heroImageTwo from "./home7-product2.jpg";
import heroImageThree from "./home7-product3.jpg";

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  accentLabel?: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: "artisan-series",
    title: "Artisan Series VII",
    subtitle: "Handcrafted Italian leather with ultra-responsive comfort tech.",
    ctaLabel: "Shop the Collection",
    ctaHref: "/products?category=women",
    image: heroImageOne,
    accentLabel: "Limited Release"
  },
  {
    id: "urban-runner",
    title: "Urban Runner Pro",
    subtitle: "Water-resistant knit uppers meet recycled cloudfoam cushioning.",
    ctaLabel: "Explore Colors",
    ctaHref: "/products?category=street",
    image: heroImageTwo,
    accentLabel: "New Drop"
  },
  {
    id: "studio-edit",
    title: "Studio Edit: Monochrome",
    subtitle: "Minimal silhouettes reimagined for everyday movement.",
    ctaLabel: "Discover Lookbook",
    ctaHref: "/products",
    image: heroImageThree
  }
];
