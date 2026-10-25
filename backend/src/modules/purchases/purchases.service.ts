import type { Purchase, PurchasesRepository } from './purchases.repository';

export interface PurchasesService {
  /** The caller's own purchase history ("My Garage"). */
  listMine(userId: string): Promise<Purchase[]>;
}

/** Purchase history rules; knows nothing about HTTP. */
export function createPurchasesService(purchases: PurchasesRepository): PurchasesService {
  return {
    listMine(userId) {
      return purchases.listForUser(userId);
    },
  };
}
