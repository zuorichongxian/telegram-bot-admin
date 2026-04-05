import type { Request, Response } from "express";

import { payment9CallbackService } from "../services/Payment9CallbackService.js";
import { DEFAULT_PAYMENT9_CLIENT_SECRET, verifyPayment9Sign } from "../utils/payment9Sign.js";

type Payment9CallbackBody = {
  callbacks: string;
  type: string;
  total: string;
  api_order_sn: string;
  order_sn: string;
  sign: string;
  [key: string]: string | number | undefined;
};

export async function handlePayment9Callback(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Payment9CallbackBody;
    const { sign, ...params } = body;

    if (!sign) {
      res.status(400).send("FAIL: missing sign");
      return;
    }

    if (!params.callbacks || !params.type || !params.total || !params.api_order_sn || !params.order_sn) {
      res.status(400).send("FAIL: missing required fields");
      return;
    }

    const verified = verifyPayment9Sign(params, sign, DEFAULT_PAYMENT9_CLIENT_SECRET);

    payment9CallbackService.create({
      callbacks: String(params.callbacks),
      type: String(params.type),
      total: String(params.total),
      apiOrderSn: String(params.api_order_sn),
      orderSn: String(params.order_sn),
      sign,
      rawData: JSON.stringify(body),
      verified
    });

    if (!verified) {
      res.status(200).send("FAIL: sign verification failed");
      return;
    }

    res.status(200).send("success");
  } catch (error) {
    console.error("Payment9 callback error:", error);
    res.status(500).send("FAIL: internal error");
  }
}

export async function getPayment9Callbacks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const callbacks = payment9CallbackService.findAll(limit);

    res.json({
      message: "获取成功",
      data: callbacks
    });
  } catch (error) {
    console.error("Get payment9 callbacks error:", error);
    res.status(500).json({
      message: "获取失败",
      data: []
    });
  }
}

export async function clearPayment9Callbacks(_req: Request, res: Response): Promise<void> {
  try {
    payment9CallbackService.deleteAll();
    res.json({
      message: "清空成功",
      data: null
    });
  } catch (error) {
    console.error("Clear payment9 callbacks error:", error);
    res.status(500).json({
      message: "清空失败",
      data: null
    });
  }
}
