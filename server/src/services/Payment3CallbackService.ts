import { database } from "../db/database.js";

export type Payment3Callback = {
  id: number;
  account: string;
  order_id: string;
  pt_order_num: string;
  product: string;
  price: string;
  status: number;
  time: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type CreatePayment3CallbackInput = {
  account: string;
  orderId: string;
  ptOrderNum: string;
  product: string;
  price: string;
  status: number;
  time: string;
  sign: string;
  rawData: string;
  verified: boolean;
};

export class Payment3CallbackService {
  create(input: CreatePayment3CallbackInput): number {
    const now = new Date().toISOString();

    return database.insert(
      `INSERT INTO payment3_callbacks (
        account,
        order_id,
        pt_order_num,
        product,
        price,
        status,
        time,
        sign,
        raw_data,
        verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.account,
        input.orderId,
        input.ptOrderNum,
        input.product,
        input.price,
        input.status,
        input.time,
        input.sign,
        input.rawData,
        input.verified ? 1 : 0,
        now
      ]
    );
  }

  findAll(limit = 50): Payment3Callback[] {
    return database.all<Payment3Callback>(
      `SELECT * FROM payment3_callbacks ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }

  deleteAll(): void {
    database.execute(`DELETE FROM payment3_callbacks`);
  }
}

export const payment3CallbackService = new Payment3CallbackService();
