import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Chip, Input } from "@heroui/react";

import { Field, formatDate } from "../components/AppPrimitives";
import { ApiDocPanel, ApiDocSelector } from "../components/ApiDocPanel";
import { LoadingButton } from "../components/LoadingButton";
import type { ApiDocInterface } from "../lib/paymentApiDocs";
import {
  clearPayment9Callbacks,
  createUnifiedOrder,
  DEFAULT_PAYMENT9_CONFIG,
  fetchPayment9Callbacks,
  getDefaultPayment9CallbackUrls,
  getPayment9ApiConfig,
  isProxyPayment9ApiConfig,
  maskKey,
  PAYMENT9_IS_PAY_MAP,
  queryOrder,
  type Payment9ApiResult,
  type Payment9Callback,
  type Payment9Config,
  type QueryOrderResponse,
  type UnifiedOrderResponse,
  generateOrderNo
} from "../lib/paymentApi9";
import { 
  payment9ApiDocs, 
  payment9InterfaceRules, 
  payment9OrderStates, 
  payment9SignRules,
  payment9CallbackStatuses
} from "../lib/paymentApi9Docs";

type PaymentTest9WorkspaceProps = {
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

export function PaymentTest9Workspace({ showSuccess, showError }: PaymentTest9WorkspaceProps) {
  const [config, setConfig] = useState<Payment9Config>(DEFAULT_PAYMENT9_CONFIG);
  const [useProxyApi, setUseProxyApi] = useState(() =>
    isProxyPayment9ApiConfig({
      unifiedOrderApi: DEFAULT_PAYMENT9_CONFIG.unifiedOrderApi,
      queryOrderApi: DEFAULT_PAYMENT9_CONFIG.queryOrderApi
    })
  );
  const [showKey, setShowKey] = useState(false);
  const [orderForm, setOrderForm] = useState({
    total: "10",
    apiOrderSn: ""
  });
  const [queryForm, setQueryForm] = useState({
    orderSn: ""
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [callbacksLoading, setCallbacksLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<Payment9ApiResult<UnifiedOrderResponse> | null>(null);
  const [queryResult, setQueryResult] = useState<Payment9ApiResult<QueryOrderResponse> | null>(null);
  const [callbacks, setCallbacks] = useState<Payment9Callback[]>([]);
  const [selectedApiDoc, setSelectedApiDoc] = useState<ApiDocInterface>(payment9ApiDocs[0]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logIdCounter, setLogIdCounter] = useState(0);

  useEffect(() => {
    const urls = getDefaultPayment9CallbackUrls();
    setConfig((prev) => ({
      ...prev,
      notifyUrl: urls.notifyUrl
    }));
    void refreshCallbacks();
  }, []);

  function addLog(action: string, request?: unknown, response?: unknown, error?: string) {
    setLogs((current) => [
      {
        id: logIdCounter,
        timestamp: new Date().toLocaleString("zh-CN"),
        action,
        request,
        response,
        error
      },
      ...current
    ].slice(0, 100));
    setLogIdCounter((current) => current + 1);
  }

  async function refreshCallbacks() {
    setCallbacksLoading(true);
    try {
      const response = await fetchPayment9Callbacks(50);
      setCallbacks(response.data ?? []);
    } catch (error) {
      console.error("Failed to fetch payment9 callbacks:", error);
    } finally {
      setCallbacksLoading(false);
    }
  }

  async function handleClearCallbacks() {
    try {
      await clearPayment9Callbacks();
      setCallbacks([]);
      showSuccess("接单测试9回调记录已清空");
    } catch (error) {
      showError(error);
    }
  }

  function updateConfig(key: keyof Payment9Config, value: string) {
    setConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function fillDefaultCallbackUrls() {
    const urls = getDefaultPayment9CallbackUrls();
    setConfig((prev) => ({
      ...prev,
      notifyUrl: urls.notifyUrl
    }));
    showSuccess("已自动填充接单测试9回调地址");
  }

  function handleToggleProxyApi(checked: boolean) {
    setUseProxyApi(checked);
    setConfig((prev) => ({
      ...prev,
      ...getPayment9ApiConfig(checked)
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

    const totalNum = Number(orderForm.total.trim());
    if (isNaN(totalNum) || totalNum < 10 || totalNum > 50) {
      showError(new Error("请输入有效的支付金额，范围 10-50 元"));
      return;
    }

    if (!config.notifyUrl.trim()) {
      showError(new Error("请先配置异步通知地址"));
      return;
    }

    setOrderLoading(true);
    setOrderResult(null);

    try {
      const result = await createUnifiedOrder(config, {
        total: totalNum,
        apiOrderSn: orderForm.apiOrderSn.trim() || undefined
      });

      setOrderResult(result);
      addLog("统一下单", orderForm, result);

      if (result.code === 200) {
        if (result.data?.order_sn) {
          setQueryForm({ orderSn: result.data.order_sn });
        }
        showSuccess(`统一下单成功，平台订单号：${result.data?.order_sn ?? "-"}`);
      } else {
        showError(new Error(result.msg || "统一下单失败"));
      }
    } catch (error) {
      addLog("统一下单", orderForm, undefined, error instanceof Error ? error.message : "未知错误");
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

    if (!queryForm.orderSn.trim()) {
      showError(new Error("请输入平台订单号"));
      return;
    }

    setQueryLoading(true);
    setQueryResult(null);

    try {
      const result = await queryOrder(config, queryForm.orderSn.trim());
      setQueryResult(result);
      addLog("查询订单", queryForm, result);

      if (result.code === 200) {
        showSuccess("订单查询成功");
      } else {
        showError(new Error(result.msg || "订单查询失败"));
      }
    } catch (error) {
      addLog("查询订单", queryForm, undefined, error instanceof Error ? error.message : "未知错误");
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
            <CardTitle className="display-font text-2xl font-bold">接单测试9</CardTitle>
            <CardDescription className="mt-1 text-sm text-stone-600">
              新支付通道测试页，支持统一下单、订单查询、回调记录和静态文档查看。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-xl font-bold">配置面板</CardTitle>
          <CardDescription className="text-sm text-stone-600">金额单位为元（整数），支付方式固定为 alipay。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="商户ID">
              <Input value={config.clientId} onChange={(e) => updateConfig("clientId", e.currentTarget.value)} />
            </Field>
            <Field label="商户密钥">
              <div className="flex gap-2">
                <Input className="flex-1" type={showKey ? "text" : "password"} value={config.merchantKey} onChange={(e) => updateConfig("merchantKey", e.currentTarget.value)} />
                <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => setShowKey((current) => !current)}>
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </Field>
            <Field label="支付方式">
              <Input value={config.payType} readOnly placeholder="固定值 alipay" />
            </Field>
            <Field label="异步通知地址">
              <Input value={config.notifyUrl} onChange={(e) => updateConfig("notifyUrl", e.currentTarget.value)} placeholder="https://example.com/notify" />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white/80 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-stone-800">是否使用本地代理</p>
              <p className="text-xs text-stone-500">开启后经由 /api/payment9-proxy 转发到支付网关。</p>
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
            <p><strong>网关地址：</strong><span className="ml-2 break-all">http://47.76.172.252:8083</span></p>
            <p><strong>下单接口：</strong><span className="ml-2">/index/api/order.html</span></p>
            <p><strong>查询接口：</strong><span className="ml-2">/index/api/queryorder.html</span></p>
            <p><strong>支付方式：</strong><span className="ml-2">alipay（金额范围 10-50 元）</span></p>
            <p><strong>当前密钥预览：</strong><span className="ml-2 font-mono">{maskKey(config.merchantKey)}</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">统一下单</CardTitle>
            <CardDescription className="text-sm text-stone-600">金额单位为元（整数），范围 10-50 元。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleCreateOrder}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="支付金额（元）">
                  <Input value={orderForm.total} onChange={(e) => updateOrderForm("total", e.currentTarget.value)} placeholder="10" />
                </Field>
                <Field label="客户端订单号(api_order_sn)">
                  <div className="flex gap-2">
                    <Input className="flex-1" value={orderForm.apiOrderSn} onChange={(e) => updateOrderForm("apiOrderSn", e.currentTarget.value)} placeholder="留空则自动生成" />
                    <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => updateOrderForm("apiOrderSn", generateOrderNo())}>
                      生成
                    </button>
                  </div>
                </Field>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-600">
                当前金额：<span className="font-semibold text-stone-900">¥ {orderForm.total}</span>
              </div>

              <LoadingButton className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800" loading={orderLoading} loadingLabel="下单中..." type="submit">
                发起统一下单
              </LoadingButton>
            </form>

            {orderResult ? (
              <div className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">统一下单响应</p>
                    <p className="text-xs text-stone-500">code: {orderResult.code} / status: {orderResult.status} / msg: {orderResult.msg}</p>
                  </div>
                  <ResultStatus ok={orderResult.code === 200} />
                </div>
                {orderResult.data ? (
                  <div className="grid gap-2 text-sm text-stone-700">
                    <p>平台订单号(order_sn)：{orderResult.data.order_sn}</p>
                    <p>客户端订单号(api_order_sn)：{orderResult.data.api_order_sn}</p>
                    <p>支付方式(type)：{orderResult.data.type}</p>
                    <p>H5 支付链接：<a className="break-all text-blue-600 hover:underline" href={orderResult.data.h5_url} rel="noreferrer" target="_blank">{orderResult.data.h5_url}</a></p>
                    <p>二维码支付链接：<a className="break-all text-blue-600 hover:underline" href={orderResult.data.qr_url} rel="noreferrer" target="_blank">{orderResult.data.qr_url}</a></p>
                  </div>
                ) : null}
                <JsonBlock value={orderResult} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">查询订单</CardTitle>
            <CardDescription className="text-sm text-stone-600">使用平台订单号(order_sn)查询订单最新状态。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleQueryOrder}>
              <Field label="平台订单号(order_sn)">
                <Input value={queryForm.orderSn} onChange={(e) => setQueryForm({ orderSn: e.currentTarget.value })} placeholder="请输入平台订单号" />
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
                    <p className="text-xs text-stone-500">code: {queryResult.code} / status: {queryResult.status} / msg: {queryResult.msg}</p>
                  </div>
                  <ResultStatus ok={queryResult.code === 200} />
                </div>
                {queryResult.data ? (
                  <div className="grid gap-2 text-sm text-stone-700">
                    <p>平台订单号(order_sn)：{queryResult.data.order_sn}</p>
                    <p>支付金额(total)：{queryResult.data.total} 元</p>
                    <p>支付方式(type)：{queryResult.data.type}</p>
                    <p>是否支付(is_pay)：{PAYMENT9_IS_PAY_MAP[queryResult.data.is_pay] ?? queryResult.data.is_pay}</p>
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
                <CardTitle className="display-font text-xl font-bold">回调记录</CardTitle>
                <CardDescription className="text-sm text-stone-600">本地记录 notifyUrl 回调，核对签名、状态和支付结果。</CardDescription>
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
                const callbackStatusLabel = callback.callbacks === "CODE_SUCCESS" ? "支付成功" : callback.callbacks === "CODE_FAILURE" ? "支付失败" : callback.callbacks;

                return (
                  <div key={callback.id} className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip className={`px-3 py-1 text-xs font-semibold ${callback.verified ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                        {callback.verified ? "签名通过" : "签名失败"}
                      </Chip>
                      <Chip className={`px-3 py-1 text-xs font-semibold ${callback.callbacks === "CODE_SUCCESS" ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {callbackStatusLabel}
                      </Chip>
                    </div>

                    <div className="grid gap-2 text-sm text-stone-700 md:grid-cols-2">
                      <p>客户端订单号(api_order_sn)：{callback.api_order_sn}</p>
                      <p>平台订单号(order_sn)：{callback.order_sn}</p>
                      <p>支付方式(type)：{callback.type}</p>
                      <p>支付总额(total)：{callback.total} 元</p>
                      <p>状态(callbacks)：{callback.callbacks}</p>
                      <p>创建时间：{formatDate(callback.created_at)}</p>
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
            {payment9InterfaceRules.map((rule) => (
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
                {payment9SignRules.map((rule) => (
                  <div key={rule} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">订单/回调状态</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {payment9OrderStates.map((state) => (
                  <div key={state.code} className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
                    <span className="rounded-lg bg-stone-200 px-2 py-1 text-xs font-semibold text-stone-700">{state.code}</span>
                    <span className="text-sm text-stone-700">{state.desc}</span>
                  </div>
                ))}
                {payment9CallbackStatuses.map((status) => (
                  <div key={status.code} className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
                    <span className="rounded-lg bg-blue-200 px-2 py-1 text-xs font-semibold text-stone-700">{status.code}</span>
                    <span className="text-sm text-stone-700">{status.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ApiDocSelector apis={payment9ApiDocs} selectedApi={selectedApiDoc} onSelect={setSelectedApiDoc} />
          <ApiDocPanel apiDoc={selectedApiDoc} />
        </CardContent>
      </Card>
    </div>
  );
}
