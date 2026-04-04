import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Chip, Input } from "@heroui/react";

import { Field, formatDate } from "../components/AppPrimitives";
import { ApiDocPanel, ApiDocSelector } from "../components/ApiDocPanel";
import { LoadingButton } from "../components/LoadingButton";
import type { ApiDocInterface } from "../lib/paymentApiDocs";
import {
  clearPayment4Callbacks,
  createPayment4Order,
  DEFAULT_PAYMENT4_CONFIG,
  fetchPayment4Callbacks,
  formatYuanToText,
  generateOrderNo,
  getDefaultPayment4CallbackUrls,
  getPayment4ApiConfig,
  isProxyPayment4ApiConfig,
  isValidYuanAmount,
  maskKey,
  PAYMENT4_STATUS_MAP,
  queryPayment4Order,
  type Payment4ApiResult,
  type Payment4Callback,
  type Payment4Config,
  type Payment4OrderResponse,
  type Payment4QueryResponse
} from "../lib/paymentApi4";
import { payment4ApiDocs, payment4InterfaceRules, payment4OrderStates, payment4SignRules } from "../lib/paymentApi4Docs";

type PaymentTest4WorkspaceProps = {
  showSuccess: (message: string) => void;
  showError: (error: unknown) => void;
};

type LogEntry = {
  id: number;
  timestamp: string;
  action: string;
  request?: unknown;
  response?: unknown;
  error?: string;
};

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-stone-950/95 p-4 text-xs leading-6 text-stone-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ResultStatus({ ok }: { ok: boolean }) {
  return (
    <Chip className={`px-3 py-1 text-xs font-semibold ${ok ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
      {ok ? "成功" : "失败"}
    </Chip>
  );
}

function safeParse(rawData: string): unknown {
  try {
    return JSON.parse(rawData);
  } catch {
    return rawData;
  }
}

export function PaymentTest4Workspace({ showSuccess, showError }: PaymentTest4WorkspaceProps) {
  const [config, setConfig] = useState<Payment4Config>(DEFAULT_PAYMENT4_CONFIG);
  const [useProxyApi, setUseProxyApi] = useState(() =>
    isProxyPayment4ApiConfig({
      newOrderApi: DEFAULT_PAYMENT4_CONFIG.newOrderApi,
      queryOrderApi: DEFAULT_PAYMENT4_CONFIG.queryOrderApi,
      queryOrderV2Api: DEFAULT_PAYMENT4_CONFIG.queryOrderV2Api
    })
  );
  const [showKey, setShowKey] = useState(false);
  const [orderForm, setOrderForm] = useState({
    orderAmount: "1.00",
    orderId: "",
    payerIp: "",
    payerId: "",
    orderTitle: "",
    orderBody: "",
    isForm: "2"
  });
  const [queryForm, setQueryForm] = useState({
    orderId: ""
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryV2Loading, setQueryV2Loading] = useState(false);
  const [callbacksLoading, setCallbacksLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<Payment4ApiResult<Payment4OrderResponse> | null>(null);
  const [queryResult, setQueryResult] = useState<Payment4ApiResult<Payment4QueryResponse> | null>(null);
  const [queryV2Result, setQueryV2Result] = useState<Payment4ApiResult<Payment4QueryResponse> | null>(null);
  const [callbacks, setCallbacks] = useState<Payment4Callback[]>([]);
  const [selectedApiDoc, setSelectedApiDoc] = useState<ApiDocInterface>(payment4ApiDocs[0]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const urls = getDefaultPayment4CallbackUrls();
    setConfig((prev) => ({
      ...prev,
      notifyUrl: urls.notifyUrl,
      returnUrl: urls.returnUrl
    }));
    void refreshCallbacks();
  }, []);

  function addLog(action: string, request?: unknown, response?: unknown, error?: string) {
    setLogs((current) => [
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        timestamp: new Date().toLocaleString("zh-CN"),
        action,
        request,
        response,
        error
      },
      ...current
    ].slice(0, 100));
  }

  async function refreshCallbacks() {
    setCallbacksLoading(true);
    try {
      const response = await fetchPayment4Callbacks(50);
      setCallbacks(response.data ?? []);
    } catch (error) {
      console.error("Failed to fetch payment4 callbacks:", error);
    } finally {
      setCallbacksLoading(false);
    }
  }

  async function handleClearCallbacks() {
    try {
      await clearPayment4Callbacks();
      setCallbacks([]);
      showSuccess("接单测试4回调记录已清空");
    } catch (error) {
      showError(error);
    }
  }

  function updateConfig(key: keyof Payment4Config, value: string) {
    setConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function fillDefaultCallbackUrls() {
    const urls = getDefaultPayment4CallbackUrls();
    setConfig((prev) => ({
      ...prev,
      notifyUrl: urls.notifyUrl,
      returnUrl: urls.returnUrl
    }));
    showSuccess("已自动填充接单测试4回调地址");
  }

  function handleToggleProxyApi(checked: boolean) {
    setUseProxyApi(checked);
    setConfig((prev) => ({
      ...prev,
      ...getPayment4ApiConfig(checked)
    }));
  }

  function updateOrderForm(key: keyof typeof orderForm, value: string) {
    setOrderForm((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!config.merchantKey.trim()) {
      showError(new Error("请先填写商户密钥"));
      return;
    }

    if (!config.channelType.trim()) {
      showError(new Error("请先填写通道编号(channelType)"));
      return;
    }

    if (!isValidYuanAmount(orderForm.orderAmount)) {
      showError(new Error("请输入合法金额，单位为元，最多2位小数"));
      return;
    }

    if (!config.notifyUrl.trim()) {
      showError(new Error("请先配置异步通知地址"));
      return;
    }

    setOrderLoading(true);
    setOrderResult(null);

    try {
      const requestOrderId = orderForm.orderId.trim() || generateOrderNo();
      const result = await createPayment4Order(config, {
        orderAmount: orderForm.orderAmount.trim(),
        orderId: requestOrderId,
        payerIp: orderForm.payerIp.trim() || undefined,
        payerId: orderForm.payerId.trim() || undefined,
        orderTitle: orderForm.orderTitle.trim() || undefined,
        orderBody: orderForm.orderBody.trim() || undefined,
        isForm: orderForm.isForm.trim() || "2"
      });

      setOrderResult(result);
      addLog("下单(newOrder)", orderForm, result);

      if (result.code === 200) {
        setOrderForm((prev) => ({ ...prev, orderId: requestOrderId }));
        setQueryForm({ orderId: requestOrderId });
        showSuccess("下单成功");
      } else {
        showError(new Error(result.msg || "下单失败"));
      }
    } catch (error) {
      addLog("下单(newOrder)", orderForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setOrderLoading(false);
    }
  }

  async function handleQueryOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!config.merchantKey.trim()) {
      showError(new Error("请先填写商户密钥"));
      return;
    }

    if (!queryForm.orderId.trim()) {
      showError(new Error("请输入商户订单号"));
      return;
    }

    setQueryLoading(true);
    setQueryResult(null);

    try {
      const result = await queryPayment4Order(config, queryForm.orderId.trim(), false);
      setQueryResult(result);
      addLog("查单(queryOrder)", queryForm, result);

      if (result.code === 200) {
        showSuccess("旧查单成功");
      } else {
        showError(new Error(result.msg || "旧查单失败"));
      }
    } catch (error) {
      addLog("查单(queryOrder)", queryForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setQueryLoading(false);
    }
  }

  async function handleQueryOrderV2() {
    if (!config.merchantKey.trim()) {
      showError(new Error("请先填写商户密钥"));
      return;
    }

    if (!queryForm.orderId.trim()) {
      showError(new Error("请输入商户订单号"));
      return;
    }

    setQueryV2Loading(true);
    setQueryV2Result(null);

    try {
      const result = await queryPayment4Order(config, queryForm.orderId.trim(), true);
      setQueryV2Result(result);
      addLog("查单(queryOrderV2)", queryForm, result);

      if (result.code === 200) {
        showSuccess("新查单成功");
      } else {
        showError(new Error(result.msg || "新查单失败"));
      }
    } catch (error) {
      addLog("查单(queryOrderV2)", queryForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setQueryV2Loading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <div>
            <CardTitle className="display-font text-2xl font-bold">接单测试4</CardTitle>
            <CardDescription className="mt-1 text-sm text-stone-600">
              参考接单测试2实现，接入鲨鱼支付网关：下单、查单（旧/新）、回调验签与文档查看。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-xl font-bold">配置面板</CardTitle>
          <CardDescription className="text-sm text-stone-600">金额单位为元（最多2位小数），签名为小写 MD5。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="商户号(merchantId)">
              <Input value={config.merchantId} onChange={(e) => updateConfig("merchantId", e.currentTarget.value)} />
            </Field>
            <Field label="商户密钥">
              <div className="flex gap-2">
                <Input className="flex-1" type={showKey ? "text" : "password"} value={config.merchantKey} onChange={(e) => updateConfig("merchantKey", e.currentTarget.value)} />
                <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => setShowKey((current) => !current)}>
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </Field>
            <Field label="通道编号(channelType)">
              <Input value={config.channelType} onChange={(e) => updateConfig("channelType", e.currentTarget.value)} placeholder="请填商户后台通道编号" />
            </Field>
            <Field label="异步通知地址(notifyUrl)">
              <Input value={config.notifyUrl} onChange={(e) => updateConfig("notifyUrl", e.currentTarget.value)} placeholder="https://example.com/notify" />
            </Field>
            <Field label="同步返回地址(returnUrl)">
              <Input value={config.returnUrl} onChange={(e) => updateConfig("returnUrl", e.currentTarget.value)} placeholder="https://example.com/return" />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white/80 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-stone-800">是否使用本地代理</p>
              <p className="text-xs text-stone-500">开启后经由 /api/payment4-proxy 转发到 xiaohuob.aspay.one。</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone-700">
              <input checked={useProxyApi} className="h-4 w-4 accent-emerald-600" onChange={(e) => handleToggleProxyApi(e.currentTarget.checked)} type="checkbox" />
              {useProxyApi ? "已开启" : "已关闭"}
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100" type="button" onClick={fillDefaultCallbackUrls}>
              自动填充回调地址
            </button>
          </div>

          <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-4 text-sm leading-7 text-stone-600">
            <p><strong>商户编号：</strong><span className="ml-2">{config.merchantId}</span></p>
            <p><strong>下单地址：</strong><span className="ml-2 break-all">http://xiaohuob.aspay.one/api/newOrder</span></p>
            <p><strong>查单地址：</strong><span className="ml-2 break-all">http://xiaohuob.aspay.one/api/queryOrder</span></p>
            <p><strong>查单地址新：</strong><span className="ml-2 break-all">http://xiaohuob.aspay.one/api/queryOrderV2</span></p>
            <p><strong>回调 IP：</strong><span className="ml-2">52.69.141.147</span></p>
            <p><strong>商户密钥预览：</strong><span className="ml-2 font-mono">{maskKey(config.merchantKey)}</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">下单(newOrder)</CardTitle>
            <CardDescription className="text-sm text-stone-600">金额单位为元，例如 1.00 表示 1 元。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleCreateOrder}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="订单金额(orderAmount)"><Input value={orderForm.orderAmount} onChange={(e) => updateOrderForm("orderAmount", e.currentTarget.value)} /></Field>
                <Field label="商户订单号(orderId)">
                  <div className="flex gap-2">
                    <Input className="flex-1" value={orderForm.orderId} onChange={(e) => updateOrderForm("orderId", e.currentTarget.value)} placeholder="留空自动生成" />
                    <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => updateOrderForm("orderId", generateOrderNo())}>生成</button>
                  </div>
                </Field>
                <Field label="会员IP(payer_ip)"><Input value={orderForm.payerIp} onChange={(e) => updateOrderForm("payerIp", e.currentTarget.value)} /></Field>
                <Field label="会员编号(payer_id)"><Input value={orderForm.payerId} onChange={(e) => updateOrderForm("payerId", e.currentTarget.value)} /></Field>
                <Field label="订单标题(order_title)"><Input value={orderForm.orderTitle} onChange={(e) => updateOrderForm("orderTitle", e.currentTarget.value)} /></Field>
                <Field label="订单描述(order_body)"><Input value={orderForm.orderBody} onChange={(e) => updateOrderForm("orderBody", e.currentTarget.value)} /></Field>
              </div>

              <Field label="返回模式(isForm)">
                <Input value={orderForm.isForm} onChange={(e) => updateOrderForm("isForm", e.currentTarget.value)} placeholder="1=form跳转, 2=json" />
              </Field>

              <div className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-600">
                当前金额：<span className="font-semibold text-stone-900">¥ {formatYuanToText(orderForm.orderAmount || "0")}</span>
              </div>

              <LoadingButton className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800" loading={orderLoading} loadingLabel="下单中..." type="submit">
                发起下单
              </LoadingButton>
            </form>

            {orderResult ? (
              <div className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-stone-800">下单响应</p><p className="text-xs text-stone-500">code: {orderResult.code}</p></div>
                  <ResultStatus ok={orderResult.code === 200} />
                </div>
                <p className="text-sm text-stone-600">{orderResult.msg}</p>
                {orderResult.data?.payUrl ? <p className="break-all text-sm text-stone-700">支付链接：{orderResult.data.payUrl}</p> : null}
                <JsonBlock value={orderResult} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">查单</CardTitle>
            <CardDescription className="text-sm text-stone-600">支持旧接口(queryOrder)和新接口(queryOrderV2)。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleQueryOrder}>
              <Field label="商户订单号(orderId)">
                <Input value={queryForm.orderId} onChange={(e) => setQueryForm({ orderId: e.currentTarget.value })} placeholder="请输入 orderId" />
              </Field>
              <div className="flex flex-wrap gap-3">
                <LoadingButton className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800" loading={queryLoading} loadingLabel="旧查单中..." type="submit">查单(旧)</LoadingButton>
                <LoadingButton className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600" loading={queryV2Loading} loadingLabel="新查单中..." type="button" onPress={() => void handleQueryOrderV2()}>查单(新V2)</LoadingButton>
              </div>
            </form>

            {queryResult ? (
              <div className="space-y-3 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-stone-800">旧查单响应</p><ResultStatus ok={queryResult.code === 200} /></div>
                <p className="text-sm text-stone-600">{queryResult.msg}</p>
                <JsonBlock value={queryResult} />
              </div>
            ) : null}

            {queryV2Result ? (
              <div className="space-y-3 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-stone-800">新查单响应(V2)</p><ResultStatus ok={queryV2Result.code === 200} /></div>
                <p className="text-sm text-stone-600">{queryV2Result.msg}</p>
                {queryV2Result.data ? (
                  <div className="grid gap-2 text-sm text-stone-700 md:grid-cols-2">
                    <p>商户号：{queryV2Result.data.merchantId}</p>
                    <p>商户订单号：{queryV2Result.data.orderId}</p>
                    <p>订单状态：{PAYMENT4_STATUS_MAP[queryV2Result.data.status] || queryV2Result.data.status}</p>
                    <p>订单金额：{queryV2Result.data.amount ?? "-"}</p>
                  </div>
                ) : null}
                <JsonBlock value={queryV2Result} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <div className="flex w-full items-start justify-between gap-4">
              <div>
                <CardTitle className="display-font text-xl font-bold">支付回调记录</CardTitle>
                <CardDescription className="text-sm text-stone-600">本地记录 notifyUrl 回调，核对签名与支付状态。</CardDescription>
              </div>
              <div className="flex gap-2">
                <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => void refreshCallbacks()}>{callbacksLoading ? "刷新中..." : "刷新"}</button>
                <button className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100" type="button" onClick={() => void handleClearCallbacks()}>清空</button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {callbacks.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">暂无回调记录。</div>
            ) : (
              callbacks.map((callback) => (
                <div key={callback.id} className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip className={`px-3 py-1 text-xs font-semibold ${callback.verified ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>{callback.verified ? "签名通过" : "签名失败"}</Chip>
                    <Chip className="px-3 py-1 text-xs font-semibold border border-stone-200 bg-stone-100 text-stone-700">{PAYMENT4_STATUS_MAP[callback.status] || callback.status}</Chip>
                  </div>
                  <div className="grid gap-2 text-sm text-stone-700 md:grid-cols-2">
                    <p>商户号：{callback.merchant_id}</p>
                    <p>商户订单号：{callback.order_id}</p>
                    <p>订单金额：{callback.amount}</p>
                    <p>订单状态：{callback.status}</p>
                    <p>记录时间：{formatDate(callback.created_at)}</p>
                  </div>
                  <JsonBlock value={safeParse(callback.raw_data)} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <div className="flex w-full items-start justify-between gap-4">
              <div>
                <CardTitle className="display-font text-xl font-bold">操作日志</CardTitle>
                <CardDescription className="text-sm text-stone-600">保留最近 100 条请求与响应。</CardDescription>
              </div>
              <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => setLogs([])}>清空日志</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {logs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">暂无操作日志。</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="space-y-3 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-sm font-semibold text-stone-800">{log.action}</p><p className="text-xs text-stone-500">{log.timestamp}</p></div>
                    <Chip className={`px-3 py-1 text-xs font-semibold ${log.error ? "border border-rose-200 bg-rose-50 text-rose-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{log.error ? "失败" : "完成"}</Chip>
                  </div>
                  {log.error ? <p className="text-sm text-rose-600">{log.error}</p> : null}
                  <JsonBlock value={{ request: log.request, response: log.response }} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-xl font-bold">接口文档</CardTitle>
          <CardDescription className="text-sm text-stone-600">对接字段、签名规则、状态说明和回调要求。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-4">
            {payment4InterfaceRules.map((rule) => (
              <div key={rule.name} className="rounded-2xl border border-stone-200 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{rule.name}</p>
                <p className="mt-2 text-sm font-semibold text-stone-900">{rule.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">签名规则</h3>
              <div className="mt-4 space-y-2 text-sm text-stone-600">
                {payment4SignRules.map((rule) => (
                  <div key={rule} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 rounded-full bg-emerald-500" /><span>{rule}</span></div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">订单状态</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {payment4OrderStates.map((state) => (
                  <div key={state.code} className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3"><span className="rounded-lg bg-stone-200 px-2 py-1 text-xs font-semibold text-stone-700">{state.code}</span><span className="text-sm text-stone-700">{state.desc}</span></div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">原始文档链接</p>
            <p className="mt-3 break-all"><a className="text-emerald-700 underline" href="http://xiaohuob.aspay.one/start/#/api_doc" rel="noreferrer" target="_blank">http://xiaohuob.aspay.one/start/#/api_doc</a></p>
          </div>

          <ApiDocSelector apis={payment4ApiDocs} selectedApi={selectedApiDoc} onSelect={setSelectedApiDoc} />
          <ApiDocPanel apiDoc={selectedApiDoc} />
        </CardContent>
      </Card>
    </div>
  );
}
