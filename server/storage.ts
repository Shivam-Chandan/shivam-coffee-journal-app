import { db } from "./db";
import type { InsertCoffee, Coffee } from "@shared/schema";

export interface IStorage {
  getCoffees(): Promise<Coffee[]>;
  getCoffee(id: string): Promise<Coffee | undefined>;
  createCoffee(coffee: InsertCoffee): Promise<Coffee>;
  updateCoffee(id: string, coffee: InsertCoffee): Promise<Coffee | undefined>;
  deleteCoffee(id: string): Promise<boolean>;
}

export class FirestoreStorage implements IStorage {
  private collectionName = "coffees";

  async getCoffees(): Promise<Coffee[]> {
    const snapshot = await db.collection(this.collectionName)
      .orderBy('orderDate', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Coffee));
  }

  async getCoffee(id: string): Promise<Coffee | undefined> {
    const doc = await db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return undefined;
    }
    return { id: doc.id, ...doc.data() } as Coffee;
  }

  async createCoffee(insertCoffee: InsertCoffee): Promise<Coffee> {
    const docRef = await db.collection(this.collectionName).add({
      ...insertCoffee,
      createdAt: new Date(),
    });
    
    return {
      id: docRef.id,
      ...insertCoffee
    } as Coffee;
  }

  async updateCoffee(id: string, insertCoffee: InsertCoffee): Promise<Coffee | undefined> {
    const docRef = db.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return undefined;
    }
    
    await docRef.update({
      ...insertCoffee,
      updatedAt: new Date(),
    });
    
    return { id, ...insertCoffee } as Coffee;
  }

  async deleteCoffee(id: string): Promise<boolean> {
    const docRef = db.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return false;
    }
    
    await docRef.delete();
    return true;
  }
}

export const storage = new FirestoreStorage();