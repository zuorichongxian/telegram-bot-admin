import { database } from "../db/database.js";

export type PaymentCallback = {
  id: number;
  merchant_no: string;
  merchant_order_no: string;
  system_order_no: string | null;
  order_amount: string;
  order_status: number;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type CreatePaymentCallbackInput = {
  merchantNo: string;
  merchantOrderNo: string;
  systemOrderNo?: string;
  orderAmount: string;
  orderStatus: number;
  sign: string;
  rawData: string;
  verified: boolean;
};

export class PaymentCallbackService {
  create(input: CreatePaymentCallbackInput): number {
    const now = new Date().toISOString();

    return database.insert(
      `INSERT INTO payment_callbacks (
        merchant_no,
        merchant_order_no,
        system_order_no,
        order_amount,
        order_status,
        sign,
        raw_data,
        verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.merchantNo,
        input.merchantOrderNo,
        input.systemOrderNo || null,
        input.orderAmount,
        input.orderStatus,
        input.sign,
        input.rawData,
        input.verified ? 1 : 0,
        now
      ]
    );
  }

  findAll(limit = 50): PaymentCallback[] {
    return database.all<PaymentCallback>(
      `SELECT * FROM payment_callbacks ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }

  findById(id: number): PaymentCallback | null {
    return database.get<PaymentCallback>(
      `SELECT * FROM payment_callbacks WHERE id = ?`,
      [id]
    );
  }

  findByMerchantOrderNo(merchantOrderNo: string): PaymentCallback | null {
    return database.get<PaymentCallback>(
      `SELECT * FROM payment_callbacks WHERE merchant_order_no = ? ORDER BY created_at DESC LIMIT 1`,
      [merchantOrderNo]
    );
  }

  deleteAll(): void {
    database.execute(`DELETE FROM payment_callbacks`);
  }
}

export const paymentCallbackService = new PaymentCallbackService();
