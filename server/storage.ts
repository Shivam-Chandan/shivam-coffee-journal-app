import { type Coffee, type InsertCoffee } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Coffee operations
  getCoffees(): Promise<Coffee[]>;
  getCoffee(id: string): Promise<Coffee | undefined>;
  createCoffee(coffee: InsertCoffee): Promise<Coffee>;
  updateCoffee(id: string, coffee: InsertCoffee): Promise<Coffee | undefined>;
  deleteCoffee(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private coffees: Map<string, Coffee>;

  constructor() {
    this.coffees = new Map();
  }

  async getCoffees(): Promise<Coffee[]> {
    return Array.from(this.coffees.values()).sort((a, b) => {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    });
  }

  async getCoffee(id: string): Promise<Coffee | undefined> {
    return this.coffees.get(id);
  }

  async createCoffee(insertCoffee: InsertCoffee): Promise<Coffee> {
    const id = randomUUID();
    const coffee: Coffee = { 
      ...insertCoffee, 
      id 
    };
    this.coffees.set(id, coffee);
    return coffee;
  }

  async updateCoffee(id: string, insertCoffee: InsertCoffee): Promise<Coffee | undefined> {
    const existing = this.coffees.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updated: Coffee = {
      ...insertCoffee,
      id,
    };
    this.coffees.set(id, updated);
    return updated;
  }

  async deleteCoffee(id: string): Promise<boolean> {
    return this.coffees.delete(id);
  }
}

export const storage = new MemStorage();
