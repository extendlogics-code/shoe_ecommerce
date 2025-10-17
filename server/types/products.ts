export interface ProductInput {
  name: string;
  sku: string;
  description?: string;
  price: number;
  currency?: string;
  status?: "draft" | "active" | "inactive";
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
