import { database } from "../db/database.js";

export type Payment6Callback = {
  id: number;
  mch_id: string;
  product_id: string;
  trade_no: string;
  out_trade_no: string;
  amount: string;
  pay_amount: string;
  state: number;
  create_time: string;
  pay_time: string | null;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type CreatePayment6CallbackInput = {
  mchId: string;
  productId: string;
  tradeNo: string;
  outTradeNo: string;
  amount: string;
  payAmount: string;
  state: number;
  createTime: string;
  payTime?: string;
  sign: string;
  rawData: string;
  verified: boolean;
};

export class Payment6CallbackService {
  create(input: CreatePayment6CallbackInput): number {
    const now = new Date().toISOString();

    return database.insert(
      `INSERT INTO payment6_callbacks (
        mch_id,
        product_id,
        trade_no,
        out_trade_no,
        amount,
        pay_amount,
        state,
        create_time,
        pay_time,
        sign,
        raw_data,
        verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.mchId,
        input.productId,
        input.tradeNo,
        input.outTradeNo,
        input.amount,
        input.payAmount,
        input.state,
        input.createTime,
        input.payTime || null,
        input.sign,
        input.rawData,
        input.verified ? 1 : 0,
        now
      ]
    );
  }

  findAll(limit = 50): Payment6Callback[] {
    return database.all<Payment6Callback>(
      `SELECT * FROM payment6_callbacks ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }

  deleteAll(): void {
    database.execute(`DELETE FROM payment6_callbacks`);
  }
}

export const payment6CallbackService = new Payment6CallbackService();
