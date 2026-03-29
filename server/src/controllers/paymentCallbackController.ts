import type { Request, Response } from "express";

import { paymentCallbackService } from "../services/PaymentCallbackService.js";
import { verifySign, sortParams, DEFAULT_MERCHANT_KEY } from "../utils/paymentSign.js";

type PaymentCallbackBody = {
  merchantNo: string;
  merchantOrderNo: string;
  systemOrderNo?: string;
  orderAmount: string;
  orderStatus: number;
  sign: string;
  [key: string]: string | number | undefined;
};

export async function handlePaymentCallback(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as PaymentCallbackBody;
    const { sign, ...params } = body;

    if (!sign) {
      res.status(400).send("FAIL: missing sign");
      return;
    }

    if (!params.merchantNo || !params.merchantOrderNo || !params.orderAmount) {
      res.status(400).send("FAIL: missing required fields");
      return;
    }

    const verified = verifySign(params, sign, DEFAULT_MERCHANT_KEY);

    paymentCallbackService.create({
      merchantNo: params.merchantNo,
      merchantOrderNo: params.merchantOrderNo,
      systemOrderNo: params.systemOrderNo,
      orderAmount: params.orderAmount,
      orderStatus: params.orderStatus ?? 0,
      sign,
      rawData: JSON.stringify(body),
      verified
    });

    if (!verified) {
      res.status(200).send("FAIL: sign verification failed");
      return;
    }

    res.status(200).send("SUCCESS");
  } catch (error) {
    console.error("Payment callback error:", error);
    res.status(500).send("FAIL: internal error");
  }
}

export async function getPaymentCallbacks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const callbacks = paymentCallbackService.findAll(limit);

    res.json({
      message: "获取成功",
      data: callbacks
    });
  } catch (error) {
    console.error("Get payment callbacks error:", error);
    res.status(500).json({
      message: "获取失败",
      data: []
    });
  }
}

export async function clearPaymentCallbacks(req: Request, res: Response): Promise<void> {
  try {
    paymentCallbackService.deleteAll();
    res.json({
      message: "清空成功",
      data: null
    });
  } catch (error) {
    console.error("Clear payment callbacks error:", error);
    res.status(500).json({
      message: "清空失败",
      data: null
    });
  }
}
