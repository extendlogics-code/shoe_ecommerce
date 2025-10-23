import image1Alt from "./home7-product1-1.jpg";
import image2Alt from "./home7-product2-1.jpg";
import image3Alt from "./home7-product3-1.jpg";
import image4Alt from "./home7-product4-1.jpg";
import image5Alt from "./home7-product5-1.jpg";
import image6Alt from "./home7-product6-1.jpg";

export type CategoryMeta = {
  id: string;
  label: string;
  description: string;
  heroImage: string;
  navLabel: string;
};

const DEFAULT_CATEGORY_ID = "uncategorized";

const DEFAULT_META: CategoryMeta = {
  id: DEFAULT_CATEGORY_ID,
  label: "Uncategorized",
  navLabel: "Uncategorized",
  description: "Products awaiting a category assignment in the Product Workbench appear here.",
  heroImage: image6Alt
};

const BASE_METADATA: Record<string, CategoryMeta> = {
  womens: {
    id: "womens",
    label: "Women",
    navLabel: "Women",
    description: "Sculpted silhouettes with adaptive comfort for motion-filled days.",
    heroImage: image1Alt
  },
  mens: {
    id: "mens",
    label: "Men",
    navLabel: "Men",
    description: "Tailored classics engineered with modern cushioning stacks.",
    heroImage: image2Alt
  },
  kids: {
    id: "kids",
    label: "Kids",
    navLabel: "Kids",
    description: "Play-proof sneakers with intuitive straps and breathable knits.",
    heroImage: image3Alt
  },
  street: {
    id: "street",
    label: "Street Lab",
    navLabel: "Street Lab",
    description: "Edition drops collabed with artists, designers, and changemakers.",
    heroImage: image4Alt
  },
  outdoor: {
    id: "outdoor",
    label: "Outdoor",
    navLabel: "Outdoor",
    description: "Multi-terrain traction with weather-ready treatments and weightless comfort.",
    heroImage: image5Alt
  }
};

const titleCase = (value: string) =>
  value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const WORKBENCH_CATEGORY_IDS = ["womens", "mens", "kids"];
export const CATEGORY_ORDER = [...WORKBENCH_CATEGORY_IDS, "street", "outdoor"];

export const getCategoryMeta = (id?: string | null): CategoryMeta => {
  if (!id) {
    return DEFAULT_META;
  }
  const key = id.trim().toLowerCase();
  const preset = BASE_METADATA[key];
  if (preset) {
    return preset;
  }

  return {
    id: key || DEFAULT_CATEGORY_ID,
    label: key ? titleCase(key) : DEFAULT_META.label,
    navLabel: key ? titleCase(key) : DEFAULT_META.navLabel,
    description: DEFAULT_META.description,
    heroImage: DEFAULT_META.heroImage
  };
};

export const getKnownCategories = () => CATEGORY_ORDER.map((id) => BASE_METADATA[id]).filter(Boolean);
