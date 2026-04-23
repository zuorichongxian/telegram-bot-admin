import { database } from "../db/database.js";

export type Payment10Callback = {
  id: number;
  mch_id: string;
  trade_no: string;
  out_trade_no: string;
  origin_trade_no: string | null;
  amount: string;
  subject: string;
  body: string | null;
  ext_param: string | null;
  state: number;
  notify_time: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type CreatePayment10CallbackInput = {
  mchId: string;
  tradeNo: string;
  outTradeNo: string;
  originTradeNo?: string;
  amount: string;
  subject: string;
  body?: string;
  extParam?: string;
  state: number;
  notifyTime: string;
  sign: string;
  rawData: string;
  verified: boolean;
};

export class Payment10CallbackService {
  create(input: CreatePayment10CallbackInput): number {
    const now = new Date().toISOString();

    return database.insert(
      `INSERT INTO payment10_callbacks (
        mch_id,
        trade_no,
        out_trade_no,
        origin_trade_no,
        amount,
        subject,
        body,
        ext_param,
        state,
        notify_time,
        sign,
        raw_data,
        verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.mchId,
        input.tradeNo,
        input.outTradeNo,
        input.originTradeNo || null,
        input.amount,
        input.subject,
        input.body || null,
        input.extParam || null,
        input.state,
        input.notifyTime,
        input.sign,
        input.rawData,
        input.verified ? 1 : 0,
        now
      ]
    );
  }

  findAll(limit = 50): Payment10Callback[] {
    return database.all<Payment10Callback>(
      `SELECT * FROM payment10_callbacks ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }

  deleteAll(): void {
    database.execute(`DELETE FROM payment10_callbacks`);
  }
}

export const payment10CallbackService = new Payment10CallbackService();
