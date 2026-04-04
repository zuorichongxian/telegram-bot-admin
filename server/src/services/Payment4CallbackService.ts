import { database } from "../db/database.js";

export type Payment4Callback = {
  id: number;
  merchant_id: string;
  order_id: string;
  amount: string;
  status: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type CreatePayment4CallbackInput = {
  merchantId: string;
  orderId: string;
  amount: string;
  status: string;
  sign: string;
  rawData: string;
  verified: boolean;
};

export class Payment4CallbackService {
  create(input: CreatePayment4CallbackInput): number {
    const now = new Date().toISOString();

    return database.insert(
      `INSERT INTO payment4_callbacks (
        merchant_id,
        order_id,
        amount,
        status,
        sign,
        raw_data,
        verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.merchantId,
        input.orderId,
        input.amount,
        input.status,
        input.sign,
        input.rawData,
        input.verified ? 1 : 0,
        now
      ]
    );
  }

  findAll(limit = 50): Payment4Callback[] {
    return database.all<Payment4Callback>(
      `SELECT * FROM payment4_callbacks ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }

  deleteAll(): void {
    database.execute(`DELETE FROM payment4_callbacks`);
  }
}

export const payment4CallbackService = new Payment4CallbackService();
