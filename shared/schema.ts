import { z } from "zod";

// Zod validation schema for coffee entries
export const insertCoffeeSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  quantity: z.string().min(1, "Quantity is required"),
  orderDate: z.string().min(1, "Order date is required"),
  roast: z.string().min(1, "Roast type is required"),
  formFactor: z.string().min(1, "Form factor is required"),
  notes: z.string().min(1, "Tasting notes are required"),
  bitternessRating: z.number().min(1).max(10),
  acidityRating: z.number().min(1).max(10),
  noteClarityRating: z.number().min(1).max(10),
  overallTasteRating: z.number().min(1).max(10),
  worthReordering: z.number().min(0).max(1),
});

// TypeScript types for coffee data
export type InsertCoffee = z.infer<typeof insertCoffeeSchema>;

export interface Coffee extends InsertCoffee {
  id: string;
}
