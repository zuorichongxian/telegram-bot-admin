import { database } from "../db/database.js";

export type Payment9Callback = {
  id: number;
  callbacks: string;
  type: string;
  total: string;
  api_order_sn: string;
  order_sn: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type CreatePayment9CallbackInput = {
  callbacks: string;
  type: string;
  total: string;
  apiOrderSn: string;
  orderSn: string;
  sign: string;
  rawData: string;
  verified: boolean;
};

export class Payment9CallbackService {
  create(input: CreatePayment9CallbackInput): number {
    const now = new Date().toISOString();

    return database.insert(
      `INSERT INTO payment9_callbacks (
        callbacks,
        type,
        total,
        api_order_sn,
        order_sn,
        sign,
        raw_data,
        verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.callbacks,
        input.type,
        input.total,
        input.apiOrderSn,
        input.orderSn,
        input.sign,
        input.rawData,
        input.verified ? 1 : 0,
        now
      ]
    );
  }

  findAll(limit = 50): Payment9Callback[] {
    return database.all<Payment9Callback>(
      `SELECT * FROM payment9_callbacks ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }

  deleteAll(): void {
    database.execute(`DELETE FROM payment9_callbacks`);
  }
}

export const payment9CallbackService = new Payment9CallbackService();
