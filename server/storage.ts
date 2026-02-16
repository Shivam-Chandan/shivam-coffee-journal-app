import { db } from "./db";
// Make sure these types exist in your shared/schema.ts!
// If not, replace them with 'any' for now to get the build passing.
import type { InsertCoffee, Coffee } from "@shared/schema"; 

export interface IStorage {
  getCoffees(): Promise<Coffee[]>;
  createCoffee(coffee: InsertCoffee): Promise<Coffee>;
}

export class FirestoreStorage implements IStorage {
  async getCoffees(): Promise<Coffee[]> {
    const snapshot = await db.collection('coffees').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Convert Firestore Timestamp to Date if needed, or keep as string
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() 
        };
    }) as Coffee[];
  }

  async createCoffee(insertCoffee: InsertCoffee): Promise<Coffee> {
    const docRef = await db.collection('coffees').add({
      ...insertCoffee,
      createdAt: new Date(),
    });
    
    return {
      id: docRef.id,
      ...insertCoffee,
      createdAt: new Date()
    } as Coffee;
  }
}

export const storage = new FirestoreStorage();