import type { Request, Response } from "express";

import { payment6CallbackService } from "../services/Payment6CallbackService.js";
import { DEFAULT_PAYMENT6_MERCHANT_KEY, verifyPayment6Sign } from "../utils/payment6Sign.js";

type Payment6CallbackBody = {
  mchId: string;
  productId: string;
  tradeNo: string;
  outTradeNo: string;
  amount: string | number;
  payAmount: string | number;
  state: string | number;
  createTime: string;
  payTime?: string;
  sign: string;
  [key: string]: string | number | undefined;
};

export async function handlePayment6Callback(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Payment6CallbackBody;
    const { sign, ...params } = body;

    if (!sign) {
      res.status(400).send("FAIL: missing sign");
      return;
    }

    if (!params.mchId || !params.productId || !params.tradeNo || !params.outTradeNo || params.amount === undefined || params.payAmount === undefined) {
      res.status(400).send("FAIL: missing required fields");
      return;
    }

    const verified = verifyPayment6Sign(params, sign, DEFAULT_PAYMENT6_MERCHANT_KEY);

    payment6CallbackService.create({
      mchId: String(params.mchId),
      productId: String(params.productId),
      tradeNo: String(params.tradeNo),
      outTradeNo: String(params.outTradeNo),
      amount: String(params.amount),
      payAmount: String(params.payAmount),
      state: Number(params.state ?? 0),
      createTime: String(params.createTime ?? ""),
      payTime: params.payTime ? String(params.payTime) : undefined,
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
    console.error("Payment6 callback error:", error);
    res.status(500).send("FAIL: internal error");
  }
}

export async function getPayment6Callbacks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const callbacks = payment6CallbackService.findAll(limit);

    res.json({
      message: "获取成功",
      data: callbacks
    });
  } catch (error) {
    console.error("Get payment6 callbacks error:", error);
    res.status(500).json({
      message: "获取失败",
      data: []
    });
  }
}

export async function clearPayment6Callbacks(_req: Request, res: Response): Promise<void> {
  try {
    payment6CallbackService.deleteAll();
    res.json({
      message: "清空成功",
      data: null
    });
  } catch (error) {
    console.error("Clear payment6 callbacks error:", error);
    res.status(500).json({
      message: "清空失败",
      data: null
    });
  }
}
