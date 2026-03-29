import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Chip } from "@heroui/react";

import { ORDER_STATUS_MAP } from "../lib/paymentApi";

type PaymentResultParams = {
  merchantNo?: string;
  merchantOrderNo?: string;
  systemOrderNo?: string;
  orderAmount?: string;
  orderStatus?: string;
  sign?: string;
};

export function PaymentResultPage() {
  const [params, setParams] = useState<PaymentResultParams>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const extracted: PaymentResultParams = {
      merchantNo: searchParams.get("merchantNo") || searchParams.get("merchant_no") || undefined,
      merchantOrderNo: searchParams.get("merchantOrderNo") || searchParams.get("merchant_order_no") || undefined,
      systemOrderNo: searchParams.get("systemOrderNo") || searchParams.get("system_order_no") || undefined,
      orderAmount: searchParams.get("orderAmount") || searchParams.get("order_amount") || undefined,
      orderStatus: searchParams.get("orderStatus") || searchParams.get("order_status") || undefined,
      sign: searchParams.get("sign") || undefined
    };
    setParams(extracted);
  }, []);

  const isSuccess = params.orderStatus === "3";

  return (
    <div className="min-h-screen grid-pattern px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader className="text-center">
            <div className="mx-auto">
              <div
                className={`mx-auto mb-4 flex size-20 items-center justify-center rounded-full ${
                  isSuccess ? "bg-emerald-100" : "bg-amber-100"
                }`}
              >
                {isSuccess ? (
                  <svg className="size-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="size-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <CardTitle className="display-font text-2xl font-bold">
                {isSuccess ? "支付成功" : "支付结果通知"}
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-stone-600">
                {isSuccess ? "您的订单已支付成功" : "以下是您的支付结果信息"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="space-y-3 text-sm">
                  {params.merchantNo ? (
                    <div className="flex justify-between">
                      <span className="text-stone-500">商户号</span>
                      <span className="font-medium text-stone-800">{params.merchantNo}</span>
                    </div>
                  ) : null}
                  {params.merchantOrderNo ? (
                    <div className="flex justify-between">
                      <span className="text-stone-500">商户订单号</span>
                      <span className="font-medium text-stone-800">{params.merchantOrderNo}</span>
                    </div>
                  ) : null}
                  {params.systemOrderNo ? (
                    <div className="flex justify-between">
                      <span className="text-stone-500">系统订单号</span>
                      <span className="font-medium text-stone-800">{params.systemOrderNo}</span>
                    </div>
                  ) : null}
                  {params.orderAmount ? (
                    <div className="flex justify-between">
                      <span className="text-stone-500">订单金额</span>
                      <span className="font-medium text-stone-800">¥{params.orderAmount}</span>
                    </div>
                  ) : null}
                  {params.orderStatus ? (
                    <div className="flex justify-between">
                      <span className="text-stone-500">订单状态</span>
                      <Chip
                        className={`px-3 py-1 text-xs font-semibold ${
                          params.orderStatus === "3"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {ORDER_STATUS_MAP[parseInt(params.orderStatus, 10)] || params.orderStatus}
                      </Chip>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="text-center">
                <a
                  className="inline-block rounded-2xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                  href="/"
                >
                  返回首页
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
