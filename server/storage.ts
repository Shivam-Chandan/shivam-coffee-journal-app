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
  private allCoffeesCache: Coffee[] | null = null;

  async getCoffees(sort: CoffeeSortKey = 'orderDate', brandName?: string): Promise<Coffee[]> {
    if (!this.allCoffeesCache) {
      // Fetch all coffees first to avoid Firestore composite index requirements
      // when filtering and sorting on different fields.
      const snapshot = await db.collection(this.collectionName).get();
      
      this.allCoffeesCache = snapshot.docs.map(doc => {
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
    }

    // Use a shallow copy of the cache for filtering/sorting
    let coffees = [...this.allCoffeesCache];

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
    
    this.allCoffeesCache = null;
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
    
    this.allCoffeesCache = null;
    return { id, ...insertCoffee } as Coffee;
  }

  async deleteCoffee(id: string): Promise<boolean> {
    const docRef = db.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return false;
    }
    
    await docRef.delete();
    this.allCoffeesCache = null;
    return true;
  }
}

export const storage = new FirestoreStorage();