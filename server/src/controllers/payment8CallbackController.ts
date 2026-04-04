import type { Request, Response } from "express";

import { payment8CallbackService } from "../services/Payment8CallbackService.js";
import { DEFAULT_PAYMENT8_MERCHANT_KEY, verifyPayment8Sign } from "../utils/payment8Sign.js";

type Payment8CallbackBody = {
  mchId: string;
  tradeNo: string;
  outTradeNo: string;
  amount: string | number;
  orderStatus: string | number | undefined;
  sign: string;
  [key: string]: string | number | undefined;
};

export async function handlePayment8Callback(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Payment8CallbackBody;
    const { sign, ...params } = body;

    if (!sign) {
      res.status(400).send("FAIL: missing sign");
      return;
    }

    if (!params.mchId || !params.tradeNo || !params.outTradeNo || params.amount === undefined) {
      res.status(400).send("FAIL: missing required fields");
      return;
    }

    const verified = verifyPayment8Sign(params, sign, DEFAULT_PAYMENT8_MERCHANT_KEY);

    payment8CallbackService.create({
      mchId: String(params.mchId),
      tradeNo: String(params.tradeNo),
      outTradeNo: String(params.outTradeNo),
      amount: String(params.amount),
      orderStatus: String(params.orderStatus ?? ""),
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
    console.error("Payment8 callback error:", error);
    res.status(500).send("FAIL: internal error");
  }
}

export async function getPayment8Callbacks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const callbacks = payment8CallbackService.findAll(limit);

    res.json({
      message: "获取成功",
      data: callbacks
    });
  } catch (error) {
    console.error("Get payment8 callbacks error:", error);
    res.status(500).json({
      message: "获取失败",
      data: []
    });
  }
}

export async function clearPayment8Callbacks(_req: Request, res: Response): Promise<void> {
  try {
    payment8CallbackService.deleteAll();
    res.json({
      message: "清空成功",
      data: null
    });
  } catch (error) {
    console.error("Clear payment8 callbacks error:", error);
    res.status(500).json({
      message: "清空失败",
      data: null
    });
  }
}
