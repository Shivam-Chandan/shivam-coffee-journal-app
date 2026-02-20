import { db } from "./db";
import type { InsertCoffee, Coffee } from "@shared/schema";

export type CoffeeSortKey = "orderDate" | "overallTasteRating";

export interface IStorage {
  /**
   * @param sort Optional field to sort by (desc). Defaults to orderDate.
   * @param brandName Optional filter; if provided only coffees matching the
   *                    exact brand name will be returned.
   */
  getCoffees(sort?: CoffeeSortKey, brandName?: string): Promise<Coffee[]>;
  getCoffee(id: string): Promise<Coffee | undefined>;
  createCoffee(coffee: InsertCoffee): Promise<Coffee>;
  updateCoffee(id: string, coffee: InsertCoffee): Promise<Coffee | undefined>;
  deleteCoffee(id: string): Promise<boolean>;
}

export class FirestoreStorage implements IStorage {
  private collectionName = "coffees";

  async getCoffees(sort: CoffeeSortKey = 'orderDate', brandName?: string): Promise<Coffee[]> {
    // ensure we only allow permitted fields
    const sortField: CoffeeSortKey = sort === 'overallTasteRating' ? 'overallTasteRating' : 'orderDate';

    // build firestore query, optionally filtering by brand
    let query: FirebaseFirestore.Query = db.collection(this.collectionName);
    if (brandName) {
      query = query.where('brandName', '==', brandName);
    }
    query = query.orderBy(sortField, 'desc');

    const snapshot = await query.get();
    
    const coffees: Coffee[] = snapshot.docs.map(doc => {
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

    // Firestore ordering can be funky if values are missing or stored as strings;
    // perform a stable client-side sort as a safety net when rating-based.
    if (sortField === 'overallTasteRating') {
      coffees.sort((a, b) => {
        // treat undefined as 0
        const ra = typeof a.overallTasteRating === 'number' ? a.overallTasteRating : 0;
        const rb = typeof b.overallTasteRating === 'number' ? b.overallTasteRating : 0;
        return rb - ra;
      });
    }

    return coffees;
  }

  async getCoffee(id: string): Promise<Coffee | undefined> {
    const doc = await db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return undefined;
    }
    const data = doc.data() as any;
    return { 
      id: doc.id, 
      coffeeName: data.coffeeName || "", 
      quantityUnit: data.quantityUnit || "g",
      ...data 
    } as Coffee;
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