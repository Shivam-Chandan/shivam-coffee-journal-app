import { type Coffee, type InsertCoffee } from "@shared/schema";
import { getFirestore, type Firestore, Timestamp, FieldValue } from "firebase-admin/firestore";

export interface IStorage {
  // Coffee operations
  getCoffees(): Promise<Coffee[]>;
  getCoffee(id: string): Promise<Coffee | undefined>;
  createCoffee(coffee: InsertCoffee): Promise<Coffee>;
  updateCoffee(id: string, coffee: InsertCoffee): Promise<Coffee | undefined>;
  deleteCoffee(id: string): Promise<boolean>;
}

export class FirestoreStorage implements IStorage {
  private db: Firestore;
  private collectionName = "coffees";

  constructor() {
    this.db = getFirestore();
  }

  async getCoffees(): Promise<Coffee[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy("orderDate", "desc")
      .get();

    return snapshot.docs.map((doc: any) => this.docToObj(doc.id, doc.data()));
  }

  async getCoffee(id: string): Promise<Coffee | undefined> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return undefined;
    }
    return this.docToObj(id, doc.data()!);
  }

  async createCoffee(insertCoffee: InsertCoffee): Promise<Coffee> {
    const docRef = this.db.collection(this.collectionName).doc();
    await docRef.set(this.objToDoc(insertCoffee));
    return {
      ...insertCoffee,
      id: docRef.id,
    };
  }

  async updateCoffee(
    id: string,
    insertCoffee: InsertCoffee
  ): Promise<Coffee | undefined> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return undefined;
    }

    await docRef.update(this.objToDoc(insertCoffee));
    return {
      ...insertCoffee,
      id,
    };
  }

  async deleteCoffee(id: string): Promise<boolean> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    return true;
  }

  private objToDoc(insertCoffee: InsertCoffee): Record<string, any> {
    return {
      brandName: insertCoffee.brandName,
      quantity: insertCoffee.quantity,
      orderDate: Timestamp.fromDate(new Date(insertCoffee.orderDate)),
      roast: insertCoffee.roast,
      formFactor: insertCoffee.formFactor,
      notes: insertCoffee.notes,
      bitternessRating: insertCoffee.bitternessRating,
      acidityRating: insertCoffee.acidityRating,
      noteClarityRating: insertCoffee.noteClarityRating,
      overallTasteRating: insertCoffee.overallTasteRating,
      worthReordering: insertCoffee.worthReordering,
      createdAt: Timestamp.now(),
    };
  }

  private docToObj(id: string, data: any): Coffee {
    return {
      id,
      brandName: data.brandName,
      quantity: data.quantity,
      orderDate: data.orderDate.toDate().toISOString().split("T")[0],
      roast: data.roast,
      formFactor: data.formFactor,
      notes: data.notes,
      bitternessRating: data.bitternessRating,
      acidityRating: data.acidityRating,
      noteClarityRating: data.noteClarityRating,
      overallTasteRating: data.overallTasteRating,
      worthReordering: data.worthReordering,
    };
  }
}

export const storage = new FirestoreStorage();
