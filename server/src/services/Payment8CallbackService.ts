import { database } from "../db/database.js";

export type Payment8Callback = {
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

export type CreatePayment8CallbackInput = {
  mchId: string;
  tradeNo: string;
  outTradeNo: string;
  amount: string;
  orderStatus: string;
  sign: string;
  rawData: string;
  verified: boolean;
};

export class Payment8CallbackService {
  create(input: CreatePayment8CallbackInput): number {
    const now = new Date().toISOString();

    return database.insert(
      `INSERT INTO payment8_callbacks (
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

  findAll(limit = 50): Payment8Callback[] {
    return database.all<Payment8Callback>(
      `SELECT * FROM payment8_callbacks ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }

  deleteAll(): void {
    database.execute(`DELETE FROM payment8_callbacks`);
  }
}

export const payment8CallbackService = new Payment8CallbackService();
