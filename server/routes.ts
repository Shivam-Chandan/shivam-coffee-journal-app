import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCoffeeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all coffees
  app.get("/api/coffees", async (req, res) => {
    try {
      // allow sorting by date or overall taste rating
      const sortParam = req.query.sort as string | undefined;
      console.log("GET /api/coffees sortParam=", sortParam);
      const sortKey = sortParam === "overallTasteRating" ? "overallTasteRating" : "orderDate";
      const coffees = await storage.getCoffees(sortKey as any);
      res.json(coffees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coffees" });
    }
  });

  // Get single coffee
  app.get("/api/coffees/:id", async (req, res) => {
    try {
      const coffee = await storage.getCoffee(req.params.id);
      if (!coffee) {
        return res.status(404).json({ error: "Coffee not found" });
      }
      res.json(coffee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coffee" });
    }
  });

  // Create coffee
  app.post("/api/coffees", async (req, res) => {
    try {
      const validatedData = insertCoffeeSchema.parse(req.body);
      const coffee = await storage.createCoffee(validatedData);
      res.status(201).json(coffee);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create coffee" });
    }
  });

  // Update coffee
  app.patch("/api/coffees/:id", async (req, res) => {
    try {
      const validatedData = insertCoffeeSchema.parse(req.body);
      const coffee = await storage.updateCoffee(req.params.id, validatedData);
      if (!coffee) {
        return res.status(404).json({ error: "Coffee not found" });
      }
      res.json(coffee);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update coffee" });
    }
  });

  // Delete coffee
  app.delete("/api/coffees/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCoffee(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Coffee not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete coffee" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
