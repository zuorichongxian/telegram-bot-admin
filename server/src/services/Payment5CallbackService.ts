import { database } from "../db/database.js";

export type Payment5Callback = {
  id: number;
  memberid: string;
  orderid: string;
  amount: string;
  transaction_id: string;
  datetime: string;
  returncode: string;
  attach: string | null;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type CreatePayment5CallbackInput = {
  memberid: string;
  orderid: string;
  amount: string;
  transactionId: string;
  datetime: string;
  returncode: string;
  attach: string | null;
  sign: string;
  rawData: string;
  verified: boolean;
};

export class Payment5CallbackService {
  create(input: CreatePayment5CallbackInput): number {
    const now = new Date().toISOString();

    return database.insert(
      `INSERT INTO payment5_callbacks (
        memberid,
        orderid,
        amount,
        transaction_id,
        datetime,
        returncode,
        attach,
        sign,
        raw_data,
        verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.memberid,
        input.orderid,
        input.amount,
        input.transactionId,
        input.datetime,
        input.returncode,
        input.attach,
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
