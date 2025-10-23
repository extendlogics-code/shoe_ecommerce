import image1Alt from "./home7-product1-1.jpg";
import image2Alt from "./home7-product2-1.jpg";
import image3Alt from "./home7-product3-1.jpg";
import image4Alt from "./home7-product4-1.jpg";
import image5Alt from "./home7-product5-1.jpg";
import image6Alt from "./home7-product6-1.jpg";

export type CategoryLike = {
  id?: string | null;
  label?: string | null;
  navLabel?: string | null;
  description?: string | null;
};

export type CategoryPresentation = {
  id: string;
  label: string;
  navLabel: string;
  description: string;
  heroImage: string;
};

export const DEFAULT_CATEGORY_ID = "uncategorized";

const DEFAULT_PRESENTATION: CategoryPresentation = {
  id: DEFAULT_CATEGORY_ID,
  label: "Needs category assignment",
  navLabel: "Needs category assignment",
  description: "Set a category in the Product Workbench to surface this collection alongside Men, Women, or Kids.",
  heroImage: image6Alt
};

const PRESENTATION_PRESETS: Record<string, Omit<CategoryPresentation, "id">> = {
  womens: {
    label: "Women",
    navLabel: "Women",
    description: "Sculpted silhouettes with adaptive comfort for motion-filled days.",
    heroImage: image1Alt
  },
  mens: {
    label: "Men",
    navLabel: "Men",
    description: "Tailored classics engineered with modern cushioning stacks.",
    heroImage: image2Alt
  },
  kids: {
    label: "Kids",
    navLabel: "Kids",
    description: "Play-proof sneakers with intuitive straps and breathable knits.",
    heroImage: image3Alt
  },
  street: {
    label: "Street Lab",
    navLabel: "Street Lab",
    description: "Edition drops collabed with artists, designers, and changemakers.",
    heroImage: image4Alt
  },
  outdoor: {
    label: "Outdoor",
    navLabel: "Outdoor",
    description: "Multi-terrain traction with weather-ready treatments and weightless comfort.",
    heroImage: image5Alt
  }
};

const normalizeId = (value?: string | null) => value?.trim().toLowerCase() ?? DEFAULT_CATEGORY_ID;

export const withCategoryPresentation = (input?: CategoryLike | null): CategoryPresentation => {
  const id = normalizeId(input?.id);
  const preset = PRESENTATION_PRESETS[id] ?? null;
  return {
    id,
    label: input?.label?.trim().length ? input.label : preset?.label ?? DEFAULT_PRESENTATION.label,
    navLabel: input?.navLabel?.trim().length ? input.navLabel : preset?.navLabel ?? DEFAULT_PRESENTATION.navLabel,
    description:
      input?.description?.trim().length
        ? input.description
        : preset?.description ?? DEFAULT_PRESENTATION.description,
    heroImage: preset?.heroImage ?? DEFAULT_PRESENTATION.heroImage
  };
};
