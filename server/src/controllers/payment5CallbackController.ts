import type { Request, Response } from "express";

import { payment5CallbackService } from "../services/Payment5CallbackService.js";
import { DEFAULT_PAYMENT5_MERCHANT_KEY, verifyPayment5Sign } from "../utils/payment5Sign.js";

type Payment5CallbackBody = {
  memberid: string;
  orderid: string;
  amount: string | number;
  transaction_id: string;
  datetime: string;
  returncode: string;
  attach?: string;
  sign: string;
  [key: string]: string | number | undefined;
};

export async function handlePayment5Callback(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Payment5CallbackBody;
    const { sign, attach, ...params } = body;

    if (!sign) {
      res.status(400).send("FAIL: missing sign");
      return;
    }

    if (!params.memberid || !params.orderid || params.amount === undefined || !params.transaction_id || !params.datetime || !params.returncode) {
      res.status(400).send("FAIL: missing required fields");
      return;
    }

    const signParams: Record<string, string | number | undefined> = {
      memberid: params.memberid,
      orderid: params.orderid,
      amount: params.amount,
      transaction_id: params.transaction_id,
      datetime: params.datetime,
      returncode: params.returncode
    };

    const verified = verifyPayment5Sign(signParams, sign, DEFAULT_PAYMENT5_MERCHANT_KEY);

    payment5CallbackService.create({
      memberid: String(params.memberid),
      orderid: String(params.orderid),
      amount: String(params.amount),
      transactionId: String(params.transaction_id),
      datetime: String(params.datetime),
      returncode: String(params.returncode),
      attach: attach ?? null,
      sign,
      rawData: JSON.stringify(body),
      verified
    });

    if (!verified) {
      res.status(200).send("FAIL: sign verification failed");
      return;
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Payment5 callback error:", error);
    res.status(500).send("FAIL: internal error");
  }
}

export async function getPayment5Callbacks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const callbacks = payment5CallbackService.findAll(limit);

    res.json({
      message: "获取成功",
      data: callbacks
    });
  } catch (error) {
    console.error("Get payment5 callbacks error:", error);
    res.status(500).json({
      message: "获取失败",
      data: []
    });
  }
}

export async function clearPayment5Callbacks(_req: Request, res: Response): Promise<void> {
  try {
    payment5CallbackService.deleteAll();
    res.json({
      message: "清空成功",
      data: null
    });
  } catch (error) {
    console.error("Clear payment5 callbacks error:", error);
    res.status(500).json({
      message: "清空失败",
      data: null
    });
  }
}
