import { db } from "./db";
import type { InsertCoffee, Coffee } from "@shared/schema";

export type CoffeeSortKey = "orderDate" | "overallTasteRating";

export interface IStorage {
  /**
   * @param sort Optional field to sort by (desc). Defaults to orderDate.
   * @param brandName Optional filter; if provided only coffees matching the
   *                    exact brand name will be returned.
   */
  getCoffees(userId: string, sort?: CoffeeSortKey, brandName?: string): Promise<Coffee[]>;
  getCoffee(userId: string, id: string): Promise<Coffee | undefined>;
  createCoffee(userId: string, coffee: InsertCoffee): Promise<Coffee>;
  updateCoffee(userId: string, id: string, coffee: InsertCoffee): Promise<Coffee | undefined>;
  deleteCoffee(userId: string, id: string): Promise<boolean>;
}

export class FirestoreStorage implements IStorage {
  private collectionName = "coffees";

  async getCoffees(userId: string, sort: CoffeeSortKey = 'orderDate', brandName?: string): Promise<Coffee[]> {
    // Fetch only this user's coffees
    // Note: Removed in-memory cache to prevent memory leaks in production.
    // Firestore is performant enough for this scale.
    const snapshot = await db.collection(this.collectionName)
      .where('userId', '==', userId)
      .get();
    
    let coffees = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      // normalize rating in case older entries used 10-point scale
      let overall = data.overallTasteRating;
      if (typeof overall === 'number' && overall > 5) {
        overall = overall / 2;
      }
      return {
        id: doc.id,
        coffeeName: data.coffeeName || "",
        quantityUnit: data.quantityUnit || "g",
        ...data,
        overallTasteRating: overall,
      } as Coffee;
    });

    // Filter in-memory
    if (brandName) {
      coffees = coffees.filter(c => c.brandName === brandName);
    }

    // Sort in-memory
    const sortField = sort === 'overallTasteRating' ? 'overallTasteRating' : 'orderDate';
    
    coffees.sort((a, b) => {
      if (sortField === 'overallTasteRating') {
        const ra = typeof a.overallTasteRating === 'number' ? a.overallTasteRating : 0;
        const rb = typeof b.overallTasteRating === 'number' ? b.overallTasteRating : 0;
        return rb - ra;
      } else {
        // orderDate (descending)
        const getMillis = (d: any) => {
          if (!d) return 0;
          if (typeof d.toDate === 'function') return d.toDate().getTime();
          return new Date(d).getTime();
        };
        return getMillis(b.orderDate) - getMillis(a.orderDate);
      }
    });

    return coffees;
  }

  async getCoffee(userId: string, id: string): Promise<Coffee | undefined> {
    const doc = await db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return undefined;
    }
    const data = doc.data() as any;
    if (data.userId !== userId) return undefined; // Security check
    return { 
      id: doc.id, 
      coffeeName: data.coffeeName || "", 
      quantityUnit: data.quantityUnit || "g",
      ...data 
    } as Coffee;
  }

  async createCoffee(userId: string, insertCoffee: InsertCoffee): Promise<Coffee> {
    const docRef = await db.collection(this.collectionName).add({
      ...insertCoffee,
      userId, // Associate with user
      createdAt: new Date(),
    });
    
    return {
      id: docRef.id,
      ...insertCoffee
    } as Coffee;
  }

  async updateCoffee(userId: string, id: string, insertCoffee: InsertCoffee): Promise<Coffee | undefined> {
    const docRef = db.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || (doc.data() as any).userId !== userId) {
      return undefined;
    }
    
    await docRef.update({
      ...insertCoffee,
      userId, // Ensure userId stays consistent
      updatedAt: new Date(),
    });
    
    return { id, ...insertCoffee } as Coffee;
  }

  async deleteCoffee(userId: string, id: string): Promise<boolean> {
    const docRef = db.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || (doc.data() as any).userId !== userId) {
      return false;
    }
    
    await docRef.delete();
    return true;
  }
}

export const storage = new FirestoreStorage();