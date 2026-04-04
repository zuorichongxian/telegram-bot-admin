import { database } from "../db/database.js";

export type Payment5Callback = {
  id: number;
  mch_id: string;
  trade_no: string;
  out_trade_no: string;
  amount: string;
  order_status: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type CreatePayment5CallbackInput = {
  mchId: string;
  tradeNo: string;
  outTradeNo: string;
  amount: string;
  orderStatus: string;
  sign: string;
  rawData: string;
  verified: boolean;
};

export class Payment5CallbackService {
  create(input: CreatePayment5CallbackInput): number {
    const now = new Date().toISOString();

    return database.insert(
      `INSERT INTO payment5_callbacks (
        mch_id,
        trade_no,
        out_trade_no,
        amount,
        order_status,
        sign,
        raw_data,
        verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.mchId,
        input.tradeNo,
        input.outTradeNo,
        input.amount,
        input.orderStatus,
        input.sign,
        input.rawData,
        input.verified ? 1 : 0,
        now
      ]
    );
  }

  findAll(limit = 50): Payment5Callback[] {
    return database.all<Payment5Callback>(
      `SELECT * FROM payment5_callbacks ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }

  deleteAll(): void {
    database.execute(`DELETE FROM payment5_callbacks`);
  }
}

export const payment5CallbackService = new Payment5CallbackService();
