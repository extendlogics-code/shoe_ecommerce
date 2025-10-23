export type PrimaryNavItem = {
  label: string;
  categoryId?: string;
  path?: string;
  accent?: boolean;
};

export const primaryNav: PrimaryNavItem[] = [
  { label: "New Products", path: "/new-products" },
  { label: "Collections", path: "/products" }
];

export const quickLinks = [
  { label: "Track Order", href: "#track-order" },
  { label: "Store Locator", href: "#stores" },
  { label: "Support", href: "#support" }
];
