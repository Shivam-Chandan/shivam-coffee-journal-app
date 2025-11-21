import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const coffees = pgTable("coffees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandName: text("brand_name").notNull(),
  quantity: text("quantity").notNull(),
  orderDate: date("order_date").notNull(),
  roast: text("roast").notNull(),
  formFactor: text("form_factor").notNull(),
  notes: text("notes").notNull(),
  bitternessRating: integer("bitterness_rating").notNull(),
  acidityRating: integer("acidity_rating").notNull(),
  noteClarityRating: integer("note_clarity_rating").notNull(),
  overallTasteRating: integer("overall_taste_rating").notNull(),
  worthReordering: integer("worth_reordering").notNull().default(0),
});

export const insertCoffeeSchema = createInsertSchema(coffees).omit({
  id: true,
}).extend({
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

export type InsertCoffee = z.infer<typeof insertCoffeeSchema>;
export type Coffee = typeof coffees.$inferSelect;
