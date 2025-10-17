import image1 from "./home7-product1.jpg";
import image1Alt from "./home7-product1-1.jpg";
import image2 from "./home7-product2.jpg";
import image2Alt from "./home7-product2-1.jpg";
import image3 from "./home7-product3.jpg";
import image3Alt from "./home7-product3-1.jpg";
import image4 from "./home7-product4.jpg";
import image4Alt from "./home7-product4-1.jpg";
import image5 from "./home7-product5.jpg";
import image5Alt from "./home7-product5-1.jpg";
import image6 from "./home7-product6.jpg";
import image6Alt from "./home7-product6-1.jpg";

export type CollectionCard = {
  id: string;
  title: string;
  blurb: string;
  image: string;
  href: string;
  tone: "light" | "dark";
};

export type Category = {
  id: string;
  name: string;
  description: string;
  heroImage: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  price: number;
  image: string;
  gallery: string[];
  description: string;
  highlights: string[];
  materials: string[];
  colors: number;
  badge?: string;
};

export type ProductSummary = Pick<Product, "id" | "name" | "price" | "image" | "badge" | "colors" | "categoryLabel"> & {
  href?: string;
};

export const collectionCards: CollectionCard[] = [
  {
    id: "atelier",
    title: "Atelier Capsule",
    blurb: "Hand-stitched details and limited artisan finishes.",
    image: image4,
    href: "#collection-atelier",
    tone: "dark"
  },
  {
    id: "performance",
    title: "Performance Lab",
    blurb: "High-energy sneakers engineered for endurance.",
    image: image5,
    href: "#collection-performance",
    tone: "light"
  },
  {
    id: "lounge",
    title: "Lounge Edit",
    blurb: "Plush comfort silhouettes for effortless weekends.",
    image: image6,
    href: "#collection-lounge",
    tone: "dark"
  }
];

export const categories: Category[] = [
  {
    id: "women",
    name: "Women",
    description: "Sculpted silhouettes with adaptive comfort for motion-filled days.",
    heroImage: image1Alt
  },
  {
    id: "men",
    name: "Men",
    description: "Tailored classics engineered with modern cushioning stacks.",
    heroImage: image2Alt
  },
  {
    id: "kids",
    name: "Kids",
    description: "Play-proof sneakers with intuitive straps and breathable knits.",
    heroImage: image3Alt
  },
  {
    id: "street",
    name: "Street Lab",
    description: "Edition drops collabed with artists, designers, and changemakers.",
    heroImage: image4Alt
  },
  {
    id: "outdoor",
    name: "Outdoor",
    description: "Multi-terrain traction, weather-ready treatments, weightless comfort.",
    heroImage: image5Alt
  }
];

export const products: Product[] = [
  {
    id: "flux-knit",
    slug: "flux-knit-runner",
    name: "Flux Knit Runner",
    categoryId: "women",
    categoryLabel: "Women • Performance",
    price: 15990,
    image: image1,
    gallery: [image1Alt, image4, image4Alt],
    description:
      "An ultra-light knit runner crafted for high-mileage days. The Flux Knit wraps your foot in breathable jacquard while a triple-density midsole keeps you cushioned from city miles to studio sprints.",
    highlights: [
      "Adaptive jacquard knit upper with targeted compression zones",
      "CloudForm triple-foam midsole for all-day support",
      "Removable algae-based insole reduces odor and improves airflow"
    ],
    materials: ["Recycled PET yarn knit", "Bloom™ algae foam insole", "Natural rubber outsole"],
    colors: 6,
    badge: "Bestseller"
  },
  {
    id: "midnight-oxford",
    slug: "midnight-oxford",
    name: "Midnight Oxford",
    categoryId: "men",
    categoryLabel: "Men • Dress",
    price: 21990,
    image: image2,
    gallery: [image2Alt, image5, image5Alt],
    description:
      "Hand-finished Italian leather upper meets a flexible strobel construction for a dress shoe that keeps pace with modern schedules. Glide across boardrooms and late dinners without sacrificing comfort.",
    highlights: [
      "Hand-burnished full-grain leather sourced from Tuscany",
      "Responsive strobel construction for sneaker-like flex",
      "Dual-density footbed with anti-microbial lining"
    ],
    materials: ["Full-grain calf leather", "Memory foam insole", "Stacked leather heel"],
    colors: 3
  },
  {
    id: "aero-sole",
    slug: "aero-sole-high",
    name: "Aero Sole High",
    categoryId: "street",
    categoryLabel: "Unisex • Street",
    price: 17990,
    image: image3,
    gallery: [image3Alt, image6, image6Alt],
    description:
      "Edition VII of our street lab high-top is wrapped in Italian nubuck with a recycled EVA midsole. Designed with choreographer Ria Tanaka, Aero Sole brings lock-in support and fluid movement.",
    highlights: [
      "Nubuck upper with adaptive ankle padding",
      "Recycled EVA midsole inspired by dance floor cushioning",
      "Custom herringbone outsole for multi-directional grip"
    ],
    materials: ["Italian nubuck leather", "Recycled EVA midsole", "Natural rubber outsole"],
    colors: 4,
    badge: "Member Exclusive"
  },
  {
    id: "terra-walker",
    slug: "terra-walker",
    name: "Terra Walker",
    categoryId: "outdoor",
    categoryLabel: "Men • Outdoor",
    price: 16990,
    image: image4,
    gallery: [image4Alt, image1, image1Alt],
    description:
      "Trail-to-town versatility. Terra Walker combines waterproof suede with a lugged outsole that grips in wet conditions. Breathable merino lining keeps you cool through every elevation change.",
    highlights: [
      "StormGuard waterproof suede treatment",
      "Merino wool lining regulates temperature",
      "Vibram®-inspired lug outsole with recycled rubber"
    ],
    materials: ["Waterproof suede", "Merino wool lining", "Recycled rubber outsole"],
    colors: 5
  },
  {
    id: "glide-slip",
    slug: "glide-slip-on",
    name: "Glide Slip On",
    categoryId: "women",
    categoryLabel: "Women • Everyday",
    price: 13990,
    image: image5,
    gallery: [image5Alt, image2, image2Alt],
    description:
      "Soft-molded slip on with elasticized panels and a recycled knit upper that hugs without pressure points. Perfect for quick airport dashes, coffee runs, and creative sessions.",
    highlights: [
      "Seamless knit upper with reinforced toe cap",
      "Dual-density cushioning with arch support",
      "Machine washable for easy refresh"
    ],
    materials: ["Recycled knit yarn", "Dual-density EVA", "Rubber outsole"],
    colors: 3
  },
  {
    id: "crest-lux",
    slug: "crest-lux-loafer",
    name: "Crest Lux Loafer",
    categoryId: "men",
    categoryLabel: "Men • Premium",
    price: 19990,
    image: image6,
    gallery: [image6Alt, image3, image3Alt],
    description:
      "A penny loafer silhouette refreshed with collapsible heel counter and lux suede lining. Crest Lux transitions from studio rehearsals to formal evenings in one seamless move.",
    highlights: [
      "Collapsible heel for convertible wear",
      "Custom-milled suede lining keeps feet cool",
      "Signature Kalaa crest hardware in brushed brass"
    ],
    materials: ["Italian calf suede", "Suede lining", "Leather outsole"],
    colors: 2,
    badge: "Just In"
  },
  {
    id: "pulse-react",
    slug: "pulse-react",
    name: "Pulse React",
    categoryId: "kids",
    categoryLabel: "Kids • Active",
    price: 9990,
    image: image1Alt,
    gallery: [image3Alt, image5Alt, image6Alt],
    description:
      "Built for playground sprints and after-school adventures, Pulse React keeps energy high with its responsive foam midsole and playful color pops.",
    highlights: [
      "Easy hook-and-loop strap for independent wear",
      "Rebound foam midsole cushions growing feet",
      "Toe bumper adds durability for active play"
    ],
    materials: ["Mesh textile upper", "Rebound EVA midsole", "Rubber outsole"],
    colors: 5
  },
  {
    id: "verve-sandal",
    slug: "verve-sandal",
    name: "Verve Sandal",
    categoryId: "women",
    categoryLabel: "Women • Resort",
    price: 10990,
    image: image2Alt,
    gallery: [image4Alt, image5, image6],
    description:
      "Verve pairs contoured footbeds with braided leather straps for a sandal that supports from poolside mornings to sunset dinners.",
    highlights: [
      "Contoured cork footbed wrapped in suede",
      "Hand-braided leather straps with hidden elastic",
      "Lightweight EVA outsole for easy travel"
    ],
    materials: ["Leather straps", "Cork footbed", "EVA outsole"],
    colors: 4
  }
];

export const newArrivals: ProductSummary[] = [
  "glide-slip",
  "crest-lux",
  "pulse-react",
  "verve-sandal",
  "aero-sole"
].map((id) => {
  const product = products.find((item) => item.id === id);
  if (!product) {
    throw new Error(`Missing product for new arrival id: ${id}`);
  }
  const { name, price, image, badge, colors, categoryLabel } = product;
  return { id, name, price, image, badge, colors, categoryLabel };
});

export const featuredProducts: ProductSummary[] = ["flux-knit", "midnight-oxford", "aero-sole", "terra-walker"].map(
  (id) => {
    const product = products.find((item) => item.id === id);
    if (!product) {
      throw new Error(`Missing product for featured id: ${id}`);
    }
    const { name, price, image, badge, colors, categoryLabel } = product;
    return { id, name, price, image, badge, colors, categoryLabel };
  }
);

export const categoryProductMap: Record<string, ProductSummary[]> = categories.reduce((acc, category) => {
  acc[category.id] = products
    .filter((product) => product.categoryId === category.id)
    .slice(0, 5)
    .map(({ id, name, price, image, badge, colors, categoryLabel }) => ({
      id,
      name,
      price,
      image,
      badge,
      colors,
      categoryLabel
    }));
  return acc;
}, {} as Record<string, ProductSummary[]>);

export const getProductById = (id: string) => products.find((product) => product.id === id);
