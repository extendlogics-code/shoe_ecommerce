export interface ProductInput {
  name: string;
  sku: string;
  description?: string;
  productDetails?: string[];
  productStory?: string;
  materialInfo?: string;
  careInstructions?: string[];
  features?: string[];
  price: number;
  currency?: string;
  status?: "draft" | "active" | "inactive";
  category?: "mens" | "womens" | "kids";
  colors: string[];
  sizes: string[];
  inventory: {
    onHand: number;
    reserved?: number;
    safetyStock?: number;
    reorderPoint?: number;
  };
  imagePath?: string;
  imageAlt?: string;
}
