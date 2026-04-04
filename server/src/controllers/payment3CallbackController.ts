import type { Request, Response } from "express";

import { payment3CallbackService } from "../services/Payment3CallbackService.js";
import {
  DEFAULT_PAYMENT3_MERCHANT_KEY,
  verifyPayment3CallbackSign
} from "../utils/payment3Sign.js";

type Payment3CallbackBody = {
  account: string;
  orderId: string;
  ptOrderNum: string;
  product: string;
  price: string | number;
  status: string | number;
  time: string | number;
  sign: string;
  [key: string]: string | number | undefined;
};

export async function handlePayment3Callback(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Payment3CallbackBody;
    const { sign, ...params } = body;

    if (!sign) {
      res.status(400).send("fail: missing sign");
      return;
    }

    if (
      !params.account ||
      !params.orderId ||
      !params.ptOrderNum ||
      !params.product ||
      params.price === undefined ||
      params.status === undefined ||
      params.time === undefined
    ) {
      res.status(400).send("fail: missing required fields");
      return;
    }

    const normalized = {
      account: String(params.account),
      orderId: String(params.orderId),
      ptOrderNum: String(params.ptOrderNum),
      product: String(params.product),
      price: String(params.price),
      status: String(params.status),
      time: String(params.time)
    };

    const verified = verifyPayment3CallbackSign(
      normalized,
      sign,
      DEFAULT_PAYMENT3_MERCHANT_KEY
    );

    payment3CallbackService.create({
      ...normalized,
      status: Number(params.status ?? 0),
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
    console.error("Payment3 callback error:", error);
    res.status(500).send("fail: internal error");
  }
}

export async function getPayment3Callbacks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const callbacks = payment3CallbackService.findAll(limit);

    res.json({
      message: "获取成功",
      data: callbacks
    });
  } catch (error) {
    console.error("Get payment3 callbacks error:", error);
    res.status(500).json({
      message: "获取失败",
      data: []
    });
  }
}

export async function clearPayment3Callbacks(_req: Request, res: Response): Promise<void> {
  try {
    payment3CallbackService.deleteAll();
    res.json({
      message: "清空成功",
      data: null
    });
  } catch (error) {
    console.error("Clear payment3 callbacks error:", error);
    res.status(500).json({
      message: "清空失败",
      data: null
    });
  }
}
