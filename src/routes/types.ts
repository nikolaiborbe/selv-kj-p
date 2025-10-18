export type Product = {
  productId: string;
  gtin: string;
  name: string;
  description: string;
  price: number;
  pricePerUnit: number;
  unit: string;
  allergens: string;
  carbonFootprintGram: number;
  organic: boolean;
};