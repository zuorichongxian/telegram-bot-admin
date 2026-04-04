import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Chip, Input } from "@heroui/react";

import { Field, formatDate } from "../components/AppPrimitives";
import { ApiDocPanel, ApiDocSelector } from "../components/ApiDocPanel";
import { LoadingButton } from "../components/LoadingButton";
import type { ApiDocInterface } from "../lib/paymentApiDocs";
import {
  clearPayment3Callbacks,
  createPayment3Order,
  DEFAULT_PAYMENT3_CONFIG,
  fetchPayment3Callbacks,
  formatFenToYuan,
  generateOrderNo,
  getDefaultPayment3CallbackUrls,
  getPayment3ApiConfig,
  isProxyPayment3ApiConfig,
  isValidFenAmount,
  maskKey,
  PAYMENT3_STATUS_MAP,
  queryPayment3Order,
  type Payment3ApiResult,
  type Payment3Callback,
  type Payment3Config,
  type Payment3OrderResponse,
  type Payment3QueryResponse
} from "../lib/paymentApi3";
import { payment3ApiDocs, payment3InterfaceRules, payment3OrderStates, payment3SignRules } from "../lib/paymentApi3Docs";

type PaymentTest3WorkspaceProps = {
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

export function PaymentTest3Workspace({ showSuccess, showError }: PaymentTest3WorkspaceProps) {
  const [config, setConfig] = useState<Payment3Config>(DEFAULT_PAYMENT3_CONFIG);
  const [useProxyApi, setUseProxyApi] = useState(() =>
    isProxyPayment3ApiConfig({
      orderApi: DEFAULT_PAYMENT3_CONFIG.orderApi,
      queryApi: DEFAULT_PAYMENT3_CONFIG.queryApi
    })
  );
  const [showKey, setShowKey] = useState(false);
  const [orderForm, setOrderForm] = useState({
    price: "100",
    orderId: "",
    clientIp: "",
    clientType: "Android",
    goodDescribe: "",
    extraParams: ""
  });
  const [queryForm, setQueryForm] = useState({
    orderId: ""
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [callbacksLoading, setCallbacksLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<Payment3ApiResult<Payment3OrderResponse> | null>(null);
  const [queryResult, setQueryResult] = useState<Payment3ApiResult<Payment3QueryResponse> | null>(null);
  const [callbacks, setCallbacks] = useState<Payment3Callback[]>([]);
  const [selectedApiDoc, setSelectedApiDoc] = useState<ApiDocInterface>(payment3ApiDocs[0]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const urls = getDefaultPayment3CallbackUrls();
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
      const response = await fetchPayment3Callbacks(50);
      setCallbacks(response.data ?? []);
    } catch (error) {
      console.error("Failed to fetch payment3 callbacks:", error);
    } finally {
      setCallbacksLoading(false);
    }
  }

  async function handleClearCallbacks() {
    try {
      await clearPayment3Callbacks();
      setCallbacks([]);
      showSuccess("接单测试3回调记录已清空");
    } catch (error) {
      showError(error);
    }
  }

  function updateConfig(key: keyof Payment3Config, value: string) {
    setConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function fillDefaultCallbackUrls() {
    const urls = getDefaultPayment3CallbackUrls();
    setConfig((prev) => ({
      ...prev,
      notifyUrl: urls.notifyUrl,
      returnUrl: urls.returnUrl
    }));
    showSuccess("已自动填充接单测试3回调地址");
  }

  function handleToggleProxyApi(checked: boolean) {
    setUseProxyApi(checked);
    setConfig((prev) => ({
      ...prev,
      ...getPayment3ApiConfig(checked)
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

    if (!isValidFenAmount(orderForm.price)) {
      showError(new Error("请输入整数金额，单位为分"));
      return;
    }

    if (!config.notifyUrl.trim()) {
      showError(new Error("请先配置异步通知地址"));
      return;
    }

    setOrderLoading(true);
    setOrderResult(null);

    try {
      const result = await createPayment3Order(config, {
        price: orderForm.price.trim(),
        orderId: orderForm.orderId.trim() || undefined,
        clientIp: orderForm.clientIp.trim() || undefined,
        clientType: orderForm.clientType.trim() || undefined,
        goodDescribe: orderForm.goodDescribe.trim() || undefined,
        extraParams: orderForm.extraParams.trim() || undefined
      });

      setOrderResult(result);
      addLog("订单支付", orderForm, result);

      if (result.code === 0 && result.success) {
        const latestOrderId = orderForm.orderId.trim() || undefined;
        if (latestOrderId) {
          setQueryForm({ orderId: latestOrderId });
        }
        showSuccess(`订单支付成功，平台订单号：${result.data?.ptOrderNum ?? "-"}`);
      } else {
        showError(new Error(result.message || "订单支付失败"));
      }
    } catch (error) {
      addLog("订单支付", orderForm, undefined, error instanceof Error ? error.message : "未知错误");
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
      const result = await queryPayment3Order(config, queryForm.orderId.trim());
      setQueryResult(result);
      addLog("支付查询", queryForm, result);

      if (result.code === 0 && result.success) {
        showSuccess("订单查询成功");
      } else {
        showError(new Error(result.message || "订单查询失败"));
      }
    } catch (error) {
      addLog("支付查询", queryForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setQueryLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <div>
            <CardTitle className="display-font text-2xl font-bold">接单测试3</CardTitle>
            <CardDescription className="mt-1 text-sm text-stone-600">
              基于四方支付新网关的可视化测试页，支持订单支付、订单查询、回调验签与文档查看。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-xl font-bold">配置面板</CardTitle>
          <CardDescription className="text-sm text-stone-600">金额单位统一为分，默认商户为“游戏城979”。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="商户号(account)">
              <Input value={config.account} onChange={(e) => updateConfig("account", e.currentTarget.value)} />
            </Field>
            <Field label="商户密钥">
              <div className="flex gap-2">
                <Input className="flex-1" type={showKey ? "text" : "password"} value={config.merchantKey} onChange={(e) => updateConfig("merchantKey", e.currentTarget.value)} />
                <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => setShowKey((current) => !current)}>
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </Field>
            <Field label="支付产品编码(product)">
              <Input value={config.product} onChange={(e) => updateConfig("product", e.currentTarget.value)} placeholder="zfb" />
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
              <p className="text-xs text-stone-500">开启后经由 /api/payment3-proxy 转发到目标网关。</p>
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
            <p>
              <strong>登录地址：</strong>
              <span className="ml-2 break-all">http://47.57.185.38/#/dashboard</span>
            </p>
            <p>
              <strong>商户名称：</strong>
              <span className="ml-2">游戏城979</span>
            </p>
            <p>
              <strong>商户密码：</strong>
              <span className="ml-2">Ab123456</span>
            </p>
            <p>
              <strong>商户号：</strong>
              <span className="ml-2">{config.account}</span>
            </p>
            <p>
              <strong>商户密钥预览：</strong>
              <span className="ml-2 font-mono">{maskKey(config.merchantKey)}</span>
            </p>
            <p>
              <strong>IP 白名单：</strong>
              <span className="ml-2">8.212.118.220, 8.223.25.15</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">订单支付</CardTitle>
            <CardDescription className="text-sm text-stone-600">金额单位为分，例如 100 表示 1.00 元。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleCreateOrder}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="支付金额(price, 分)">
                  <Input value={orderForm.price} onChange={(e) => updateOrderForm("price", e.currentTarget.value)} placeholder="100" />
                </Field>
                <Field label="商户订单号(orderId)">
                  <div className="flex gap-2">
                    <Input className="flex-1" value={orderForm.orderId} onChange={(e) => updateOrderForm("orderId", e.currentTarget.value)} placeholder="留空则自动生成" />
                    <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => updateOrderForm("orderId", generateOrderNo())}>
                      生成
                    </button>
                  </div>
                </Field>
                <Field label="客户端 IP(clientIp)">
                  <Input value={orderForm.clientIp} onChange={(e) => updateOrderForm("clientIp", e.currentTarget.value)} placeholder="1.1.1.1" />
                </Field>
                <Field label="客户端类型(clientType)">
                  <Input value={orderForm.clientType} onChange={(e) => updateOrderForm("clientType", e.currentTarget.value)} placeholder="Android" />
                </Field>
                <Field label="商品描述(goodDescribe)">
                  <Input value={orderForm.goodDescribe} onChange={(e) => updateOrderForm("goodDescribe", e.currentTarget.value)} placeholder="商品描述" />
                </Field>
                <Field label="扩展参数(extraParams)">
                  <Input value={orderForm.extraParams} onChange={(e) => updateOrderForm("extraParams", e.currentTarget.value)} placeholder="附加参数" />
                </Field>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-600">
                当前金额折合：<span className="font-semibold text-stone-900">¥ {formatFenToYuan(orderForm.price)}</span>
              </div>

              <LoadingButton className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800" loading={orderLoading} loadingLabel="下单中..." type="submit">
                发起订单支付
              </LoadingButton>
            </form>

            {orderResult ? (
              <div className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">订单支付响应</p>
                    <p className="text-xs text-stone-500">code: {orderResult.code}</p>
                  </div>
                  <ResultStatus ok={orderResult.code === 0 && orderResult.success} />
                </div>
                <p className="text-sm text-stone-600">{orderResult.message}</p>
                {orderResult.data ? (
                  <div className="grid gap-2 text-sm text-stone-700">
                    <p>平台订单号：{orderResult.data.ptOrderNum}</p>
                    <p className="break-all">支付链接：{orderResult.data.payUrl}</p>
                  </div>
                ) : null}
                <JsonBlock value={orderResult} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">支付查询</CardTitle>
            <CardDescription className="text-sm text-stone-600">使用商户订单号查询订单最新状态。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleQueryOrder}>
              <Field label="商户订单号(orderId)">
                <Input value={queryForm.orderId} onChange={(e) => setQueryForm({ orderId: e.currentTarget.value })} placeholder="请输入 orderId" />
              </Field>
              <LoadingButton className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800" loading={queryLoading} loadingLabel="查询中..." type="submit">
                查询订单
              </LoadingButton>
            </form>

            {queryResult ? (
              <div className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">订单查询响应</p>
                    <p className="text-xs text-stone-500">code: {queryResult.code}</p>
                  </div>
                  <ResultStatus ok={queryResult.code === 0 && queryResult.success} />
                </div>
                <p className="text-sm text-stone-600">{queryResult.message}</p>
                {queryResult.data ? (
                  <div className="grid gap-2 text-sm text-stone-700">
                    <p>商户号：{queryResult.data.account}</p>
                    <p>支付产品：{queryResult.data.product}</p>
                    <p>平台订单号：{queryResult.data.ptOrderNum}</p>
                    <p>商户订单号：{queryResult.data.orderId}</p>
                    <p>订单金额：{queryResult.data.price} 分（¥ {formatFenToYuan(queryResult.data.price)}）</p>
                    <p>订单状态：{PAYMENT3_STATUS_MAP[Number(queryResult.data.status)] || queryResult.data.status}</p>
                  </div>
                ) : null}
                <JsonBlock value={queryResult} />
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
                <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => void refreshCallbacks()}>
                  {callbacksLoading ? "刷新中..." : "刷新"}
                </button>
                <button className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100" type="button" onClick={() => void handleClearCallbacks()}>
                  清空
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {callbacks.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">暂无回调记录。</div>
            ) : (
              callbacks.map((callback) => {
                const isPaid = callback.status === 2;

                return (
                  <div key={callback.id} className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip className={`px-3 py-1 text-xs font-semibold ${callback.verified ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                        {callback.verified ? "签名通过" : "签名失败"}
                      </Chip>
                      <Chip className={`px-3 py-1 text-xs font-semibold ${isPaid ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {PAYMENT3_STATUS_MAP[callback.status] || `状态${callback.status}`}
                      </Chip>
                    </div>

                    <div className="grid gap-2 text-sm text-stone-700 md:grid-cols-2">
                      <p>商户号：{callback.account}</p>
                      <p>支付产品：{callback.product}</p>
                      <p>商户订单号：{callback.order_id}</p>
                      <p>平台订单号：{callback.pt_order_num}</p>
                      <p>订单金额：{callback.price} 分（¥ {formatFenToYuan(callback.price)}）</p>
                      <p>回调状态：{callback.status}</p>
                      <p>回调时间戳：{callback.time}</p>
                      <p>记录时间：{formatDate(callback.created_at)}</p>
                    </div>

                    <JsonBlock value={safeParse(callback.raw_data)} />
                  </div>
                );
              })
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
              <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => setLogs([])}>
                清空日志
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {logs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">暂无操作日志。</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="space-y-3 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{log.action}</p>
                      <p className="text-xs text-stone-500">{log.timestamp}</p>
                    </div>
                    <Chip className={`px-3 py-1 text-xs font-semibold ${log.error ? "border border-rose-200 bg-rose-50 text-rose-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                      {log.error ? "失败" : "完成"}
                    </Chip>
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
            {payment3InterfaceRules.map((rule) => (
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
                {payment3SignRules.map((rule) => (
                  <div key={rule} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">订单状态</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {payment3OrderStates.map((state) => (
                  <div key={state.code} className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
                    <span className="rounded-lg bg-stone-200 px-2 py-1 text-xs font-semibold text-stone-700">{state.code}</span>
                    <span className="text-sm text-stone-700">{state.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">原始文档链接</p>
            <div className="mt-3 space-y-2 break-all">
              <p>
                <a className="text-emerald-700 underline" href="https://docs.apipost.net/docs/detail/3c5c45445001000?target_id=5bf626b317001" rel="noreferrer" target="_blank">
                  订单支付文档
                </a>
              </p>
              <p>
                <a className="text-emerald-700 underline" href="https://docs.apipost.net/docs/detail/3c5c45445001000?target_id=5bf79da717003" rel="noreferrer" target="_blank">
                  支付查询文档
                </a>
              </p>
              <p>
                <a className="text-emerald-700 underline" href="https://docs.apipost.net/docs/detail/3c5c45445001000?target_id=5bf92f1b17005" rel="noreferrer" target="_blank">
                  支付回调文档
                </a>
              </p>
            </div>
          </div>

          <ApiDocSelector apis={payment3ApiDocs} selectedApi={selectedApiDoc} onSelect={setSelectedApiDoc} />
          <ApiDocPanel apiDoc={selectedApiDoc} />
        </CardContent>
      </Card>
    </div>
  );
}
