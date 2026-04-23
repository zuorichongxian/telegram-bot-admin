import type { Request, Response } from "express";

import { payment10CallbackService } from "../services/Payment10CallbackService.js";
import {
  DEFAULT_PAYMENT10_MERCHANT_KEY,
  verifyPayment10Sign
} from "../utils/payment10Sign.js";

type Payment10CallbackBody = {
  mchId: string;
  tradeNo: string;
  outTradeNo: string;
  originTradeNo?: string;
  amount: string | number;
  subject: string;
  body?: string;
  extParam?: string;
  state: string | number;
  notifyTime: string | number;
  sign: string;
  [key: string]: string | number | undefined;
};

export async function handlePayment10Callback(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const body = req.body as Payment10CallbackBody;
    const { sign, ...params } = body;

    if (!sign) {
      res.status(400).send("FAIL: missing sign");
      return;
    }

    if (
      !params.mchId ||
      !params.tradeNo ||
      !params.outTradeNo ||
      params.amount === undefined ||
      !params.subject ||
      params.state === undefined ||
      params.notifyTime === undefined
    ) {
      res.status(400).send("FAIL: missing required fields");
      return;
    }

    const verified = verifyPayment10Sign(
      params,
      sign,
      DEFAULT_PAYMENT10_MERCHANT_KEY
    );

    payment10CallbackService.create({
      mchId: String(params.mchId),
      tradeNo: String(params.tradeNo),
      outTradeNo: String(params.outTradeNo),
      originTradeNo: params.originTradeNo
        ? String(params.originTradeNo)
        : undefined,
      amount: String(params.amount),
      subject: String(params.subject),
      body: params.body ? String(params.body) : undefined,
      extParam: params.extParam ? String(params.extParam) : undefined,
      state: Number(params.state),
      notifyTime: String(params.notifyTime),
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
    console.error("Payment10 callback error:", error);
    res.status(500).send("FAIL: internal error");
  }
}

export async function getPayment10Callbacks(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const limit = Math.min(
      Math.max(1, parseInt(req.query.limit as string) || 50),
      200
    );
    const callbacks = payment10CallbackService.findAll(limit);

    res.json({
      message: "获取成功",
      data: callbacks
    });
  } catch (error) {
    console.error("Get payment10 callbacks error:", error);
    res.status(500).json({
      message: "获取失败",
      data: []
    });
  }
}

export async function clearPayment10Callbacks(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    payment10CallbackService.deleteAll();
    res.json({
      message: "清空成功",
      data: null
    });
  } catch (error) {
    console.error("Clear payment10 callbacks error:", error);
    res.status(500).json({
      message: "清空失败",
      data: null
    });
  }
}
