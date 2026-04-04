import type { Request, Response } from "express";

import { payment4CallbackService } from "../services/Payment4CallbackService.js";
import {
  DEFAULT_PAYMENT4_MERCHANT_KEY,
  verifyPayment4Sign
} from "../utils/payment4Sign.js";

type Payment4CallbackBody = {
  merchantId: string;
  orderId: string;
  amount: string | number;
  status: string;
  sign: string;
  [key: string]: string | number | undefined;
};

export async function handlePayment4Callback(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Payment4CallbackBody;
    const { sign, ...params } = body;

    if (!sign) {
      res.status(400).send("fail: missing sign");
      return;
    }

    if (!params.merchantId || !params.orderId || params.amount === undefined || !params.status) {
      res.status(400).send("fail: missing required fields");
      return;
    }

    const verified = verifyPayment4Sign(params, sign, DEFAULT_PAYMENT4_MERCHANT_KEY);

    payment4CallbackService.create({
      merchantId: String(params.merchantId),
      orderId: String(params.orderId),
      amount: String(params.amount),
      status: String(params.status),
      sign,
      rawData: JSON.stringify(body),
      verified
    });

    if (!verified) {
      res.status(200).send("fail: sign verification failed");
      return;
    }

    res.status(200).send("success");
  } catch (error) {
    console.error("Payment4 callback error:", error);
    res.status(500).send("fail: internal error");
  }
}

export async function getPayment4Callbacks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const callbacks = payment4CallbackService.findAll(limit);

    res.json({
      message: "获取成功",
      data: callbacks
    });
  } catch (error) {
    console.error("Get payment4 callbacks error:", error);
    res.status(500).json({
      message: "获取失败",
      data: []
    });
  }
}

export async function clearPayment4Callbacks(_req: Request, res: Response): Promise<void> {
  try {
    payment4CallbackService.deleteAll();
    res.json({
      message: "清空成功",
      data: null
    });
  } catch (error) {
    console.error("Clear payment4 callbacks error:", error);
    res.status(500).json({
      message: "清空失败",
      data: null
    });
  }
}
