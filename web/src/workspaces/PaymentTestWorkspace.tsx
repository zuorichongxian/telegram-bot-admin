import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Chip, Input } from "@heroui/react";

import { Field } from "../components/AppPrimitives";
import { LoadingButton } from "../components/LoadingButton";
import { ApiDocPanel, ApiDocSelector, ApiRulesPanel } from "../components/ApiDocPanel";
import {
  DEFAULT_CONFIG,
  generateOrderNo,
  getDefaultCallbackUrls,
  ORDER_STATUS_MAP,
  type PaymentCallback,
  type PaymentConfig,
  createCollectOrder,
  queryCollectOrder,
  createPaymentOrder,
  queryPaymentOrder,
  queryMerchantInfo,
  fetchPaymentCallbacks,
  clearPaymentCallbacks,
  type ApiResult,
  type CollectOrderResponse,
  type CollectOrderQueryResponse,
  type PaymentOrderResponse,
  type PaymentOrderQueryResponse,
  type MerchantInfoResponse
} from "../lib/paymentApi";
import { allApiDocs, type ApiDocInterface } from "../lib/paymentApiDocs";

type LogEntry = {
  id: number;
  timestamp: string;
  action: string;
  request?: unknown;
  response?: unknown;
  error?: string;
};

type PaymentTestWorkspaceProps = {
  showSuccess: (message: string) => void;
  showError: (error: unknown) => void;
};

export function PaymentTestWorkspace({ showSuccess, showError }: PaymentTestWorkspaceProps) {
  const [config, setConfig] = useState<PaymentConfig>({
    merchantNo: DEFAULT_CONFIG.merchantNo,
    merchantKey: DEFAULT_CONFIG.merchantKey,
    channelCode: DEFAULT_CONFIG.channelCode,
    notifyUrl: DEFAULT_CONFIG.notifyUrl,
    returnUrl: DEFAULT_CONFIG.returnUrl,
    collectOrderApi: DEFAULT_CONFIG.collectOrderApi,
    collectOrderQueryApi: DEFAULT_CONFIG.collectOrderQueryApi,
    paymentOrderApi: DEFAULT_CONFIG.paymentOrderApi,
    paymentOrderQueryApi: DEFAULT_CONFIG.paymentOrderQueryApi,
    merchantInfoApi: DEFAULT_CONFIG.merchantInfoApi
  });

  const [showKey, setShowKey] = useState(false);

  const [collectOrderForm, setCollectOrderForm] = useState({
    orderAmount: "100.00",
    merchantOrderNo: "",
    payerName: "",
    payerIp: "",
    extParam: ""
  });
  const [collectOrderLoading, setCollectOrderLoading] = useState(false);
  const [collectOrderResult, setCollectOrderResult] = useState<ApiResult<CollectOrderResponse> | null>(null);

  const [collectQueryForm, setCollectQueryForm] = useState({
    merchantOrderNo: ""
  });
  const [collectQueryLoading, setCollectQueryLoading] = useState(false);
  const [collectQueryResult, setCollectQueryResult] = useState<ApiResult<CollectOrderQueryResponse> | null>(null);

  const [paymentOrderForm, setPaymentOrderForm] = useState({
    orderAmount: "100.00",
    merchantOrderNo: "",
    payeeAccountNo: "",
    payeeAccountName: "",
    payeeBankCode: "",
    extParam: ""
  });
  const [paymentOrderLoading, setPaymentOrderLoading] = useState(false);
  const [paymentOrderResult, setPaymentOrderResult] = useState<ApiResult<PaymentOrderResponse> | null>(null);

  const [paymentQueryForm, setPaymentQueryForm] = useState({
    merchantOrderNo: ""
  });
  const [paymentQueryLoading, setPaymentQueryLoading] = useState(false);
  const [paymentQueryResult, setPaymentQueryResult] = useState<ApiResult<PaymentOrderQueryResponse> | null>(null);

  const [selectedApiDoc, setSelectedApiDoc] = useState<ApiDocInterface>(allApiDocs[0]);

  const [merchantInfoLoading, setMerchantInfoLoading] = useState(false);
  const [merchantInfoResult, setMerchantInfoResult] = useState<ApiResult<MerchantInfoResponse> | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logIdCounter, setLogIdCounter] = useState(0);

  const [callbacks, setCallbacks] = useState<PaymentCallback[]>([]);
  const [callbacksLoading, setCallbacksLoading] = useState(false);

  useEffect(() => {
    const urls = getDefaultCallbackUrls();
    setConfig((prev) => ({
      ...prev,
      notifyUrl: urls.notifyUrl,
      returnUrl: urls.returnUrl
    }));
  }, []);

  function fillDefaultCallbackUrls() {
    const urls = getDefaultCallbackUrls();
    setConfig((prev) => ({
      ...prev,
      notifyUrl: urls.notifyUrl,
      returnUrl: urls.returnUrl
    }));
    showSuccess("已自动填充回调地址");
  }

  async function refreshCallbacks() {
    setCallbacksLoading(true);
    try {
      const result = await fetchPaymentCallbacks(50);
      if (result.data) {
        setCallbacks(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch callbacks:", error);
    } finally {
      setCallbacksLoading(false);
    }
  }

  async function handleClearCallbacks() {
    try {
      await clearPaymentCallbacks();
      setCallbacks([]);
      showSuccess("回调记录已清空");
    } catch (error) {
      showError(error);
    }
  }

  function addLog(action: string, request?: unknown, response?: unknown, error?: string) {
    const entry: LogEntry = {
      id: logIdCounter,
      timestamp: new Date().toLocaleString("zh-CN"),
      action,
      request,
      response,
      error
    };
    setLogIdCounter((c) => c + 1);
    setLogs((prev) => [entry, ...prev].slice(0, 100));
  }

  function clearLogs() {
    setLogs([]);
  }

  async function handleCreateCollectOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!collectOrderForm.orderAmount.trim()) {
      showError(new Error("请输入订单金额。"));
      return;
    }

    if (!config.notifyUrl.trim()) {
      showError(new Error("请在配置中设置异步通知地址。"));
      return;
    }

    setCollectOrderLoading(true);
    setCollectOrderResult(null);

    try {
      const result = await createCollectOrder(config, {
        orderAmount: collectOrderForm.orderAmount,
        merchantOrderNo: collectOrderForm.merchantOrderNo || undefined,
        payerName: collectOrderForm.payerName || undefined,
        payerIp: collectOrderForm.payerIp || undefined,
        extParam: collectOrderForm.extParam || undefined
      });

      setCollectOrderResult(result);
      addLog("代收下单", collectOrderForm, result);

      if (result.code === "00000") {
        showSuccess(`代收下单成功，订单号: ${result.data?.merchantOrderNo}`);
      } else {
        showError(new Error(result.message || "代收下单失败"));
      }
    } catch (error) {
      addLog("代收下单", collectOrderForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setCollectOrderLoading(false);
    }
  }

  async function handleQueryCollectOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!collectQueryForm.merchantOrderNo.trim()) {
      showError(new Error("请输入商户订单号。"));
      return;
    }

    setCollectQueryLoading(true);
    setCollectQueryResult(null);

    try {
      const result = await queryCollectOrder(config, collectQueryForm.merchantOrderNo);
      setCollectQueryResult(result);
      addLog("代收订单查询", collectQueryForm, result);

      if (result.code === "00000") {
        showSuccess("查询成功");
      } else {
        showError(new Error(result.message || "查询失败"));
      }
    } catch (error) {
      addLog("代收订单查询", collectQueryForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setCollectQueryLoading(false);
    }
  }

  async function handleCreatePaymentOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paymentOrderForm.orderAmount.trim()) {
      showError(new Error("请输入订单金额。"));
      return;
    }

    if (!paymentOrderForm.payeeAccountNo.trim()) {
      showError(new Error("请输入收款账号。"));
      return;
    }

    if (!config.notifyUrl.trim()) {
      showError(new Error("请在配置中设置异步通知地址。"));
      return;
    }

    setPaymentOrderLoading(true);
    setPaymentOrderResult(null);

    try {
      const result = await createPaymentOrder(config, {
        orderAmount: paymentOrderForm.orderAmount,
        merchantOrderNo: paymentOrderForm.merchantOrderNo || undefined,
        payeeAccountNo: paymentOrderForm.payeeAccountNo,
        payeeAccountName: paymentOrderForm.payeeAccountName || undefined,
        payeeBankCode: paymentOrderForm.payeeBankCode || undefined,
        extParam: paymentOrderForm.extParam || undefined
      });

      setPaymentOrderResult(result);
      addLog("代付下单", paymentOrderForm, result);

      if (result.code === "00000") {
        showSuccess(`代付下单成功，订单号: ${result.data?.merchantOrderNo}`);
      } else {
        showError(new Error(result.message || "代付下单失败"));
      }
    } catch (error) {
      addLog("代付下单", paymentOrderForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setPaymentOrderLoading(false);
    }
  }

  async function handleQueryPaymentOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paymentQueryForm.merchantOrderNo.trim()) {
      showError(new Error("请输入商户订单号。"));
      return;
    }

    setPaymentQueryLoading(true);
    setPaymentQueryResult(null);

    try {
      const result = await queryPaymentOrder(config, paymentQueryForm.merchantOrderNo);
      setPaymentQueryResult(result);
      addLog("代付订单查询", paymentQueryForm, result);

      if (result.code === "00000") {
        showSuccess("查询成功");
      } else {
        showError(new Error(result.message || "查询失败"));
      }
    } catch (error) {
      addLog("代付订单查询", paymentQueryForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setPaymentQueryLoading(false);
    }
  }

  async function handleQueryMerchantInfo() {
    setMerchantInfoLoading(true);
    setMerchantInfoResult(null);

    try {
      const result = await queryMerchantInfo(config);
      setMerchantInfoResult(result);
      addLog("商户信息查询", {}, result);

      if (result.code === "00000") {
        showSuccess("查询成功");
      } else {
        showError(new Error(result.message || "查询失败"));
      }
    } catch (error) {
      addLog("商户信息查询", {}, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setMerchantInfoLoading(false);
    }
  }

  function generateNewOrderNo() {
    setCollectOrderForm((prev) => ({
      ...prev,
      merchantOrderNo: generateOrderNo()
    }));
  }

  function generatePaymentNewOrderNo() {
    setPaymentOrderForm((prev) => ({
      ...prev,
      merchantOrderNo: generateOrderNo()
    }));
  }

  function updateConfig(key: keyof PaymentConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function updateCollectOrderForm(key: string, value: string) {
    setCollectOrderForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateCollectQueryForm(key: string, value: string) {
    setCollectQueryForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePaymentOrderForm(key: string, value: string) {
    setPaymentOrderForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePaymentQueryForm(key: string, value: string) {
    setPaymentQueryForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <div>
            <CardTitle className="display-font text-2xl font-bold">拉单测试1</CardTitle>
            <CardDescription className="mt-1 text-sm text-stone-600">
              支付接口可视化测试工具，支持代收/代付下单和订单查询。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-xl font-bold">配置面板</CardTitle>
          <CardDescription className="text-sm text-stone-600">设置商户信息和 API 地址。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="商户号">
              <Input
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={config.merchantNo}
                onChange={(e) => updateConfig("merchantNo", e.currentTarget.value)}
              />
            </Field>
            <Field label="商户密钥">
              <div className="flex gap-2">
                <Input
                  className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  type={showKey ? "text" : "password"}
                  value={config.merchantKey}
                  onChange={(e) => updateConfig("merchantKey", e.currentTarget.value)}
                />
                <button
                  className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                >
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </Field>
            <Field label="通道编码">
              <Input
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={config.channelCode}
                onChange={(e) => updateConfig("channelCode", e.currentTarget.value)}
                placeholder="请输入通道编码"
              />
            </Field>
            <Field label="异步通知地址">
              <div className="flex gap-2">
                <Input
                  className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  value={config.notifyUrl}
                  onChange={(e) => updateConfig("notifyUrl", e.currentTarget.value)}
                  placeholder="https://example.com/notify"
                />
              </div>
            </Field>
            <Field label="跳转通知地址">
              <div className="flex gap-2">
                <Input
                  className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  value={config.returnUrl}
                  onChange={(e) => updateConfig("returnUrl", e.currentTarget.value)}
                  placeholder="https://example.com/return"
                />
              </div>
            </Field>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              type="button"
              onClick={fillDefaultCallbackUrls}
            >
              自动填充回调地址
            </button>
          </div>
          <div className="mt-4 rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-4 text-sm leading-7 text-stone-600">
            <p>
              <strong>商户端登录地址：</strong>
              <span className="ml-2 break-all">8028476b0f894f079edbe5793c04b6b0-mch.fykknn.xyz, 5342303cd0d34f7b87f36bee7ddea829-mch.fykknn.xyz</span>
            </p>
            <p>
              <strong>登录账号：</strong>
              <span className="ml-2">山野</span>
            </p>
            <p>
              <strong>初始登录密码：</strong>
              <span className="ml-2">BIQoyrS9M48yoD</span>
            </p>
            <p>
              <strong>回调IP：</strong>
              <span className="ml-2 break-all">3.90.154.183, 54.152.54.61, 3.85.45.208, 13.223.42.108, 52.54.247.216, 52.90.217.233, 13.217.82.9, 18.234.245.253, 54.146.52.118, 3.85.186.119</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">代收下单</CardTitle>
            <CardDescription className="text-sm text-stone-600">创建代收订单，生成支付链接。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void handleCreateCollectOrder(e)}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="订单金额">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="100.00"
                    value={collectOrderForm.orderAmount}
                    onChange={(e) => updateCollectOrderForm("orderAmount", e.currentTarget.value)}
                  />
                </Field>
                <Field label="商户订单号">
                  <div className="flex gap-2">
                    <Input
                      className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                      placeholder="自动生成"
                      value={collectOrderForm.merchantOrderNo}
                      onChange={(e) => updateCollectOrderForm("merchantOrderNo", e.currentTarget.value)}
                    />
                    <button
                      className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                      type="button"
                      onClick={generateNewOrderNo}
                    >
                      生成
                    </button>
                  </div>
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="付款人姓名">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    value={collectOrderForm.payerName}
                    onChange={(e) => updateCollectOrderForm("payerName", e.currentTarget.value)}
                  />
                </Field>
                <Field label="付款人IP">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    value={collectOrderForm.payerIp}
                    onChange={(e) => updateCollectOrderForm("payerIp", e.currentTarget.value)}
                  />
                </Field>
              </div>
              <Field label="扩展参数">
                <Input
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  value={collectOrderForm.extParam}
                  onChange={(e) => updateCollectOrderForm("extParam", e.currentTarget.value)}
                />
              </Field>
              <LoadingButton
                className="w-full rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                loading={collectOrderLoading}
                loadingLabel="正在下单..."
                type="submit"
              >
                代收下单
              </LoadingButton>
            </form>
            {collectOrderResult ? (
              <div className="mt-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-800">响应结果</p>
                  <Chip
                    className={`px-3 py-1 text-xs font-semibold ${
                      collectOrderResult.code === "00000"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {collectOrderResult.code === "00000" ? "成功" : "失败"}
                  </Chip>
                </div>
                <div className="mt-3 space-y-2 text-sm text-stone-600">
                  <p>响应码: {collectOrderResult.code}</p>
                  <p>响应信息: {collectOrderResult.message}</p>
                  {collectOrderResult.data ? (
                    <>
                      <p>商户订单号: {collectOrderResult.data.merchantOrderNo}</p>
                      <p>系统订单号: {collectOrderResult.data.systemOrderNo}</p>
                      <p>订单金额: {collectOrderResult.data.orderAmount}</p>
                      <p>订单状态: {ORDER_STATUS_MAP[collectOrderResult.data.orderStatus] || collectOrderResult.data.orderStatus}</p>
                      {collectOrderResult.data.payUrl ? (
                        <p className="break-all">支付链接: {collectOrderResult.data.payUrl}</p>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">代收订单查询</CardTitle>
            <CardDescription className="text-sm text-stone-600">查询代收订单状态。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void handleQueryCollectOrder(e)}>
              <Field label="商户订单号">
                <Input
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  placeholder="请输入商户订单号"
                  value={collectQueryForm.merchantOrderNo}
                  onChange={(e) => updateCollectQueryForm("merchantOrderNo", e.currentTarget.value)}
                />
              </Field>
              <LoadingButton
                className="w-full rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                loading={collectQueryLoading}
                loadingLabel="正在查询..."
                type="submit"
              >
                查询订单
              </LoadingButton>
            </form>
            {collectQueryResult ? (
              <div className="mt-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-800">查询结果</p>
                  <Chip
                    className={`px-3 py-1 text-xs font-semibold ${
                      collectQueryResult.code === "00000"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {collectQueryResult.code === "00000" ? "成功" : "失败"}
                  </Chip>
                </div>
                <div className="mt-3 space-y-2 text-sm text-stone-600">
                  <p>响应码: {collectQueryResult.code}</p>
                  <p>响应信息: {collectQueryResult.message}</p>
                  {collectQueryResult.data ? (
                    <>
                      <p>商户订单号: {collectQueryResult.data.merchantOrderNo}</p>
                      <p>系统订单号: {collectQueryResult.data.systemOrderNo}</p>
                      <p>订单金额: {collectQueryResult.data.orderAmount}</p>
                      <p>订单状态: {ORDER_STATUS_MAP[collectQueryResult.data.orderStatus] || collectQueryResult.data.orderStatus}</p>
                      {collectQueryResult.data.createdAt ? <p>创建时间: {collectQueryResult.data.createdAt}</p> : null}
                      {collectQueryResult.data.paidAt ? <p>支付时间: {collectQueryResult.data.paidAt}</p> : null}
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">代付下单</CardTitle>
            <CardDescription className="text-sm text-stone-600">创建代付订单，向指定账户打款。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void handleCreatePaymentOrder(e)}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="订单金额">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="100.00"
                    value={paymentOrderForm.orderAmount}
                    onChange={(e) => updatePaymentOrderForm("orderAmount", e.currentTarget.value)}
                  />
                </Field>
                <Field label="商户订单号">
                  <div className="flex gap-2">
                    <Input
                      className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                      placeholder="自动生成"
                      value={paymentOrderForm.merchantOrderNo}
                      onChange={(e) => updatePaymentOrderForm("merchantOrderNo", e.currentTarget.value)}
                    />
                    <button
                      className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                      type="button"
                      onClick={generatePaymentNewOrderNo}
                    >
                      生成
                    </button>
                  </div>
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="收款账号">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    value={paymentOrderForm.payeeAccountNo}
                    onChange={(e) => updatePaymentOrderForm("payeeAccountNo", e.currentTarget.value)}
                  />
                </Field>
                <Field label="收款人姓名">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    value={paymentOrderForm.payeeAccountName}
                    onChange={(e) => updatePaymentOrderForm("payeeAccountName", e.currentTarget.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="银行编码">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    value={paymentOrderForm.payeeBankCode}
                    onChange={(e) => updatePaymentOrderForm("payeeBankCode", e.currentTarget.value)}
                  />
                </Field>
                <Field label="扩展参数">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    value={paymentOrderForm.extParam}
                    onChange={(e) => updatePaymentOrderForm("extParam", e.currentTarget.value)}
                  />
                </Field>
              </div>
              <LoadingButton
                className="w-full rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                loading={paymentOrderLoading}
                loadingLabel="正在下单..."
                type="submit"
              >
                代付下单
              </LoadingButton>
            </form>
            {paymentOrderResult ? (
              <div className="mt-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-800">响应结果</p>
                  <Chip
                    className={`px-3 py-1 text-xs font-semibold ${
                      paymentOrderResult.code === "00000"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {paymentOrderResult.code === "00000" ? "成功" : "失败"}
                  </Chip>
                </div>
                <div className="mt-3 space-y-2 text-sm text-stone-600">
                  <p>响应码: {paymentOrderResult.code}</p>
                  <p>响应信息: {paymentOrderResult.message}</p>
                  {paymentOrderResult.data ? (
                    <>
                      <p>商户订单号: {paymentOrderResult.data.merchantOrderNo}</p>
                      <p>系统订单号: {paymentOrderResult.data.systemOrderNo}</p>
                      <p>订单金额: {paymentOrderResult.data.orderAmount}</p>
                      <p>订单状态: {ORDER_STATUS_MAP[paymentOrderResult.data.orderStatus] || paymentOrderResult.data.orderStatus}</p>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">代付订单查询</CardTitle>
            <CardDescription className="text-sm text-stone-600">查询代付订单状态。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void handleQueryPaymentOrder(e)}>
              <Field label="商户订单号">
                <Input
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  placeholder="请输入商户订单号"
                  value={paymentQueryForm.merchantOrderNo}
                  onChange={(e) => updatePaymentQueryForm("merchantOrderNo", e.currentTarget.value)}
                />
              </Field>
              <LoadingButton
                className="w-full rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                loading={paymentQueryLoading}
                loadingLabel="正在查询..."
                type="submit"
              >
                查询订单
              </LoadingButton>
            </form>
            {paymentQueryResult ? (
              <div className="mt-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-800">查询结果</p>
                  <Chip
                    className={`px-3 py-1 text-xs font-semibold ${
                      paymentQueryResult.code === "00000"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {paymentQueryResult.code === "00000" ? "成功" : "失败"}
                  </Chip>
                </div>
                <div className="mt-3 space-y-2 text-sm text-stone-600">
                  <p>响应码: {paymentQueryResult.code}</p>
                  <p>响应信息: {paymentQueryResult.message}</p>
                  {paymentQueryResult.data ? (
                    <>
                      <p>商户订单号: {paymentQueryResult.data.merchantOrderNo}</p>
                      <p>系统订单号: {paymentQueryResult.data.systemOrderNo}</p>
                      <p>订单金额: {paymentQueryResult.data.orderAmount}</p>
                      <p>订单状态: {ORDER_STATUS_MAP[paymentQueryResult.data.orderStatus] || paymentQueryResult.data.orderStatus}</p>
                      {paymentQueryResult.data.createdAt ? <p>创建时间: {paymentQueryResult.data.createdAt}</p> : null}
                      {paymentQueryResult.data.paidAt ? <p>支付时间: {paymentQueryResult.data.paidAt}</p> : null}
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-xl font-bold">商户信息查询</CardTitle>
          <CardDescription className="text-sm text-stone-600">查询商户余额和状态信息。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <LoadingButton
              className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
              loading={merchantInfoLoading}
              loadingLabel="正在查询..."
              onPress={() => void handleQueryMerchantInfo()}
            >
              查询商户信息
            </LoadingButton>
          </div>
          {merchantInfoResult ? (
            <div className="mt-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-800">查询结果</p>
                <Chip
                  className={`px-3 py-1 text-xs font-semibold ${
                    merchantInfoResult.code === "00000"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {merchantInfoResult.code === "00000" ? "成功" : "失败"}
                </Chip>
              </div>
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <p>响应码: {merchantInfoResult.code}</p>
                <p>响应信息: {merchantInfoResult.message}</p>
                {merchantInfoResult.data ? (
                  <>
                    <p>商户号: {merchantInfoResult.data.merchantNo}</p>
                    {merchantInfoResult.data.merchantName ? <p>商户名称: {merchantInfoResult.data.merchantName}</p> : null}
                    {merchantInfoResult.data.balance ? <p>账户余额: {merchantInfoResult.data.balance}</p> : null}
                    {merchantInfoResult.data.frozenBalance ? <p>冻结余额: {merchantInfoResult.data.frozenBalance}</p> : null}
                    {merchantInfoResult.data.status !== undefined ? (
                      <p>状态: {merchantInfoResult.data.statusDesc || merchantInfoResult.data.status}</p>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="display-font text-xl font-bold">操作日志</CardTitle>
            <CardDescription className="text-sm text-stone-600">记录所有 API 调用历史。</CardDescription>
          </div>
          <LoadingButton
            className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
            isDisabled={logs.length === 0}
            loading={false}
            onPress={clearLogs}
          >
            清空日志
          </LoadingButton>
        </CardHeader>
        <CardContent>
          {logs.length ? (
            <div className="max-h-[400px] space-y-3 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="rounded-[24px] border border-stone-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-800">{log.action}</p>
                    <p className="text-xs text-stone-500">{log.timestamp}</p>
                  </div>
                  {log.error ? (
                    <p className="mt-2 text-sm text-rose-600">错误: {log.error}</p>
                  ) : null}
                  {log.request ? (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-stone-500">请求参数:</p>
                      <pre className="mt-1 max-h-[120px] overflow-auto rounded-lg bg-stone-100 p-2 text-xs text-stone-700">
                        {JSON.stringify(log.request, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                  {log.response ? (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-stone-500">响应结果:</p>
                      <pre className="mt-1 max-h-[120px] overflow-auto rounded-lg bg-stone-100 p-2 text-xs text-stone-700">
                        {JSON.stringify(log.response, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm text-stone-500">
              暂无操作日志。执行 API 调用后会在这里显示记录。
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="display-font text-xl font-bold">回调记录</CardTitle>
            <CardDescription className="text-sm text-stone-600">支付系统异步通知记录。</CardDescription>
          </div>
          <div className="flex gap-2">
            <LoadingButton
              className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
              loading={callbacksLoading}
              loadingLabel="刷新中..."
              onPress={() => void refreshCallbacks()}
            >
              刷新
            </LoadingButton>
            <LoadingButton
              className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
              isDisabled={callbacks.length === 0}
              loading={false}
              onPress={() => void handleClearCallbacks()}
            >
              清空
            </LoadingButton>
          </div>
        </CardHeader>
        <CardContent>
          {callbacks.length ? (
            <div className="max-h-[400px] space-y-3 overflow-y-auto">
              {callbacks.map((callback) => (
                <div key={callback.id} className="rounded-[24px] border border-stone-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-800">订单: {callback.merchant_order_no}</p>
                    <div className="flex items-center gap-2">
                      <Chip
                        className={`px-3 py-1 text-xs font-semibold ${
                          callback.verified
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {callback.verified ? "签名验证通过" : "签名验证失败"}
                      </Chip>
                      <span className="text-xs text-stone-500">{callback.created_at}</span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-stone-600">
                    <p>商户号: {callback.merchant_no}</p>
                    <p>订单金额: ¥{callback.order_amount}</p>
                    <p>订单状态: {ORDER_STATUS_MAP[callback.order_status] || callback.order_status}</p>
                    {callback.system_order_no ? <p>系统订单号: {callback.system_order_no}</p> : null}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-stone-500">原始数据:</p>
                    <pre className="mt-1 max-h-[100px] overflow-auto rounded-lg bg-stone-100 p-2 text-xs text-stone-700">
                      {JSON.stringify(JSON.parse(callback.raw_data), null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm text-stone-500">
              暂无回调记录。支付系统发送回调后会在这里显示。
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <div>
            <CardTitle className="display-font text-xl font-bold">接口文档</CardTitle>
            <CardDescription className="text-sm text-stone-600">查看支付接口的完整参数说明。</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <ApiRulesPanel />
            
            <div className="border-t border-stone-200 pt-6">
              <h3 className="mb-4 text-lg font-semibold text-stone-800">接口列表</h3>
              <ApiDocSelector
                apis={allApiDocs}
                selectedApi={selectedApiDoc}
                onSelect={setSelectedApiDoc}
              />
            </div>

            <div className="border-t border-stone-200 pt-6">
              <ApiDocPanel apiDoc={selectedApiDoc} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
