import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Chip, Input } from "@heroui/react";

import { Field, formatDate } from "../components/AppPrimitives";
import { ApiDocPanel, ApiDocSelector } from "../components/ApiDocPanel";
import { LoadingButton } from "../components/LoadingButton";
import type { ApiDocInterface } from "../lib/paymentApiDocs";
import {
  clearPayment10Callbacks,
  createUnifiedOrder,
  DEFAULT_PAYMENT10_CONFIG,
  fetchPayment10Callbacks,
  formatFenToYuan,
  generateOrderNo,
  getDefaultPayment10CallbackUrls,
  getPayment10ApiConfig,
  isProxyPayment10ApiConfig,
  isValidFenAmount,
  maskKey,
  PAYMENT10_NOTIFY_STATE_MAP,
  PAYMENT10_STATE_MAP,
  queryBalance,
  queryOrder,
  type Payment10ApiResult,
  type Payment10Callback,
  type Payment10Config,
  type QueryBalanceResponse,
  type QueryOrderResponse,
  type UnifiedOrderResponse
} from "../lib/paymentApi10";
import {
  payment10ApiDocs,
  payment10InterfaceRules,
  payment10NotifyStates,
  payment10OrderStates,
  payment10SignRules
} from "../lib/paymentApi10Docs";

type Props = {
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

function Json({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-stone-950/95 p-3 text-xs leading-6 text-stone-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function PaymentTest10Workspace({ showSuccess, showError }: Props) {
  const [config, setConfig] = useState<Payment10Config>(DEFAULT_PAYMENT10_CONFIG);
  const [useProxyApi, setUseProxyApi] = useState(() =>
    isProxyPayment10ApiConfig({
      unifiedOrderApi: DEFAULT_PAYMENT10_CONFIG.unifiedOrderApi,
      queryOrderApi: DEFAULT_PAYMENT10_CONFIG.queryOrderApi,
      queryBalanceApi: DEFAULT_PAYMENT10_CONFIG.queryBalanceApi
    })
  );
  const [showKey, setShowKey] = useState(false);
  const [orderForm, setOrderForm] = useState({
    amount: "10000",
    outTradeNo: "",
    subject: "商品标题测试",
    body: "",
    extParam: "",
    clientIp: "8.8.8.8"
  });
  const [queryForm, setQueryForm] = useState({ outTradeNo: "" });
  const [orderLoading, setOrderLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [callbacksLoading, setCallbacksLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<Payment10ApiResult<UnifiedOrderResponse> | null>(null);
  const [queryResult, setQueryResult] = useState<Payment10ApiResult<QueryOrderResponse> | null>(null);
  const [balanceResult, setBalanceResult] = useState<Payment10ApiResult<QueryBalanceResponse> | null>(null);
  const [callbacks, setCallbacks] = useState<Payment10Callback[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [counter, setCounter] = useState(0);
  const [selectedApiDoc, setSelectedApiDoc] = useState<ApiDocInterface>(payment10ApiDocs[0]);

  useEffect(() => {
    const urls = getDefaultPayment10CallbackUrls();
    setConfig((p) => ({ ...p, notifyUrl: urls.notifyUrl, returnUrl: urls.returnUrl }));
    void refreshCallbacks();
  }, []);

  function addLog(action: string, request?: unknown, response?: unknown, error?: string) {
    setLogs((list) => [
      {
        id: counter,
        timestamp: new Date().toLocaleString("zh-CN"),
        action,
        request,
        response,
        error
      },
      ...list
    ].slice(0, 100));
    setCounter((n) => n + 1);
  }

  async function refreshCallbacks() {
    setCallbacksLoading(true);
    try {
      const result = await fetchPayment10Callbacks(50);
      setCallbacks(result.data ?? []);
    } catch (error) {
      console.error("Failed to fetch payment10 callbacks:", error);
    } finally {
      setCallbacksLoading(false);
    }
  }

  async function clearCallbacks() {
    try {
      await clearPayment10Callbacks();
      setCallbacks([]);
      showSuccess("接单测试10回调记录已清空");
    } catch (error) {
      showError(error);
    }
  }

  async function onCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config.merchantKey.trim()) return showError(new Error("请先填写商户密钥"));
    if (!config.wayCode.trim()) return showError(new Error("请先填写通道编码"));
    if (!isValidFenAmount(orderForm.amount)) return showError(new Error("请输入整数金额（分）"));
    if (!orderForm.subject.trim()) return showError(new Error("请填写商品标题"));
    if (!orderForm.clientIp.trim()) return showError(new Error("请填写客户端IP"));
    if (!config.notifyUrl.trim()) return showError(new Error("请先配置异步回调地址"));

    setOrderLoading(true);
    setOrderResult(null);
    try {
      const result = await createUnifiedOrder(config, {
        amount: orderForm.amount.trim(),
        outTradeNo: orderForm.outTradeNo.trim() || undefined,
        subject: orderForm.subject.trim(),
        body: orderForm.body.trim() || undefined,
        extParam: orderForm.extParam.trim() || undefined,
        clientIp: orderForm.clientIp.trim()
      });
      setOrderResult(result);
      addLog("统一下单", orderForm, result);
      if (result.code === 0) {
        const outTradeNo = result.data?.outTradeNo ?? orderForm.outTradeNo;
        if (outTradeNo) setQueryForm({ outTradeNo });
        showSuccess(`统一下单成功，商户订单号：${outTradeNo || "-"}`);
      } else {
        showError(new Error(result.message || "统一下单失败"));
      }
    } catch (error) {
      addLog("统一下单", orderForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setOrderLoading(false);
    }
  }

  async function onQueryOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config.merchantKey.trim()) return showError(new Error("请先填写商户密钥"));
    if (!queryForm.outTradeNo.trim()) return showError(new Error("请输入商户订单号"));

    setQueryLoading(true);
    setQueryResult(null);
    try {
      const result = await queryOrder(config, queryForm.outTradeNo.trim());
      setQueryResult(result);
      addLog("查询订单", queryForm, result);
      result.code === 0 ? showSuccess("订单查询成功") : showError(new Error(result.message || "订单查询失败"));
    } catch (error) {
      addLog("查询订单", queryForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setQueryLoading(false);
    }
  }

  async function onQueryBalance() {
    if (!config.merchantKey.trim()) return showError(new Error("请先填写商户密钥"));
    setBalanceLoading(true);
    setBalanceResult(null);
    try {
      const result = await queryBalance(config);
      setBalanceResult(result);
      addLog("余额查询", { mchId: config.mchId }, result);
      result.code === 0 ? showSuccess("余额查询成功") : showError(new Error(result.message || "余额查询失败"));
    } catch (error) {
      addLog("余额查询", { mchId: config.mchId }, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setBalanceLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-2xl font-bold">接单测试10</CardTitle>
          <CardDescription className="text-sm text-stone-600">完整能力：下单、查单、余额、回调验签、日志、文档。</CardDescription>
        </CardHeader>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-xl font-bold">配置面板</CardTitle>
          <CardDescription className="text-sm text-stone-600">默认 wayCode=1100，默认金额10000（分）。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="商户号"><Input value={config.mchId} onChange={(e) => setConfig((p) => ({ ...p, mchId: e.currentTarget.value }))} /></Field>
            <Field label="商户密钥">
              <div className="flex gap-2">
                <Input className="flex-1" type={showKey ? "text" : "password"} value={config.merchantKey} onChange={(e) => setConfig((p) => ({ ...p, merchantKey: e.currentTarget.value }))} />
                <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700" type="button" onClick={() => setShowKey((v) => !v)}>{showKey ? "隐藏" : "显示"}</button>
              </div>
            </Field>
            <Field label="通道编码(wayCode)"><Input value={config.wayCode} onChange={(e) => setConfig((p) => ({ ...p, wayCode: e.currentTarget.value }))} /></Field>
            <Field label="异步通知地址"><Input value={config.notifyUrl} onChange={(e) => setConfig((p) => ({ ...p, notifyUrl: e.currentTarget.value }))} /></Field>
            <Field label="同步跳转地址"><Input value={config.returnUrl} onChange={(e) => setConfig((p) => ({ ...p, returnUrl: e.currentTarget.value }))} /></Field>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm">
            <div>
              <p className="font-semibold text-stone-800">使用本地代理重签名</p>
              <p className="text-xs text-stone-500">/api/payment10-proxy → pay.fqavxqzt.xyz</p>
            </div>
            <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={useProxyApi} onChange={(e) => { const checked = e.currentTarget.checked; setUseProxyApi(checked); setConfig((p) => ({ ...p, ...getPayment10ApiConfig(checked) })); }} />
          </div>

          <div className="flex gap-3">
            <button className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700" type="button" onClick={() => { const u = getDefaultPayment10CallbackUrls(); setConfig((p) => ({ ...p, notifyUrl: u.notifyUrl, returnUrl: u.returnUrl })); showSuccess("已自动填充回调地址"); }}>自动填充回调地址</button>
          </div>

          <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-4 text-sm text-stone-600">
            <p><strong>商户后台：</strong>https://mch-tevoh.fqavxqzt.xyz</p>
            <p><strong>账号/密码：</strong>yaoyang / abc123</p>
            <p><strong>商户号：</strong>M1776937137</p>
            <p><strong>密钥预览：</strong><span className="font-mono">{maskKey(config.merchantKey)}</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="soft-panel rounded-[32px] border-0"><CardHeader><CardTitle className="display-font text-xl font-bold">统一下单</CardTitle></CardHeader><CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onCreateOrder}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="金额(分)"><Input value={orderForm.amount} onChange={(e) => setOrderForm((p) => ({ ...p, amount: e.currentTarget.value }))} /></Field>
              <Field label="商户订单号"><div className="flex gap-2"><Input className="flex-1" value={orderForm.outTradeNo} onChange={(e) => setOrderForm((p) => ({ ...p, outTradeNo: e.currentTarget.value }))} /><button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700" type="button" onClick={() => setOrderForm((p) => ({ ...p, outTradeNo: generateOrderNo() }))}>生成</button></div></Field>
              <Field label="商品标题"><Input value={orderForm.subject} onChange={(e) => setOrderForm((p) => ({ ...p, subject: e.currentTarget.value }))} /></Field>
              <Field label="商品描述"><Input value={orderForm.body} onChange={(e) => setOrderForm((p) => ({ ...p, body: e.currentTarget.value }))} /></Field>
              <Field label="扩展参数"><Input value={orderForm.extParam} onChange={(e) => setOrderForm((p) => ({ ...p, extParam: e.currentTarget.value }))} /></Field>
              <Field label="客户端IP"><Input value={orderForm.clientIp} onChange={(e) => setOrderForm((p) => ({ ...p, clientIp: e.currentTarget.value }))} /></Field>
            </div>
            <p className="text-sm text-stone-600">折合：¥ {formatFenToYuan(orderForm.amount)}</p>
            <LoadingButton className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white" loading={orderLoading} loadingLabel="下单中..." type="submit">发起统一下单</LoadingButton>
          </form>
          {orderResult ? <Json value={orderResult} /> : null}
        </CardContent></Card>

        <Card className="soft-panel rounded-[32px] border-0"><CardHeader><CardTitle className="display-font text-xl font-bold">查询订单</CardTitle></CardHeader><CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onQueryOrder}>
            <Field label="商户订单号"><Input value={queryForm.outTradeNo} onChange={(e) => setQueryForm({ outTradeNo: e.currentTarget.value })} /></Field>
            <LoadingButton className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white" loading={queryLoading} loadingLabel="查询中..." type="submit">查询订单</LoadingButton>
          </form>
          {queryResult?.data ? <div className="rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-700">
            <p>订单状态：{PAYMENT10_STATE_MAP[queryResult.data.state] ?? queryResult.data.state}</p>
            <p>通知状态：{PAYMENT10_NOTIFY_STATE_MAP[queryResult.data.notifyState] ?? queryResult.data.notifyState}</p>
            <p>金额：{queryResult.data.amount} 分（¥ {formatFenToYuan(queryResult.data.amount)}）</p>
          </div> : null}
          {queryResult ? <Json value={queryResult} /> : null}
        </CardContent></Card>
      </div>

      <Card className="soft-panel rounded-[32px] border-0"><CardHeader><CardTitle className="display-font text-xl font-bold">余额查询</CardTitle></CardHeader><CardContent className="space-y-4">
        <LoadingButton className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white" loading={balanceLoading} loadingLabel="查询中..." onPress={onQueryBalance}>查询余额</LoadingButton>
        {balanceResult ? <Json value={balanceResult} /> : null}
      </CardContent></Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="soft-panel rounded-[32px] border-0"><CardHeader><div className="flex w-full items-start justify-between"><CardTitle className="display-font text-xl font-bold">回调记录</CardTitle><div className="flex gap-2"><button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm" type="button" onClick={() => void refreshCallbacks()}>{callbacksLoading ? "刷新中..." : "刷新"}</button><button className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700" type="button" onClick={() => void clearCallbacks()}>清空</button></div></div></CardHeader><CardContent className="space-y-4">
          {callbacks.length === 0 ? <p className="text-sm text-stone-500">暂无回调记录。</p> : callbacks.map((item) => <div key={item.id} className="space-y-2 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm">
            <div className="flex gap-2">
              <Chip className={item.verified ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}>{item.verified ? "签名通过" : "签名失败"}</Chip>
              <Chip className={item.state === 1 ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700"}>{PAYMENT10_STATE_MAP[item.state] ?? item.state}</Chip>
            </div>
            <p>商户订单号：{item.out_trade_no}</p>
            <p>支付订单号：{item.trade_no}</p>
            <p>金额：{item.amount} 分（¥ {formatFenToYuan(item.amount)}）</p>
            <p>通知时间：{item.notify_time}</p>
            <p>记录时间：{formatDate(item.created_at)}</p>
            <Json value={safeParse(item.raw_data)} />
          </div>)}
        </CardContent></Card>

        <Card className="soft-panel rounded-[32px] border-0"><CardHeader><div className="flex w-full items-start justify-between"><CardTitle className="display-font text-xl font-bold">操作日志</CardTitle><button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm" type="button" onClick={() => setLogs([])}>清空</button></div></CardHeader><CardContent className="space-y-4">
          {logs.length === 0 ? <p className="text-sm text-stone-500">暂无操作日志。</p> : logs.map((log) => <div key={log.id} className="rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm"><p className="font-semibold text-stone-800">{log.action}</p><p className="text-xs text-stone-500">{log.timestamp}</p>{log.error ? <p className="text-rose-600">{log.error}</p> : null}<Json value={{ request: log.request, response: log.response }} /></div>)}
        </CardContent></Card>
      </div>

      <Card className="soft-panel rounded-[32px] border-0"><CardHeader><CardTitle className="display-font text-xl font-bold">接口文档</CardTitle><CardDescription className="text-sm text-stone-600">提现能力仅做文档展示，不提供操作表单。</CardDescription></CardHeader><CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-4">{payment10InterfaceRules.map((rule) => <div key={rule.name} className="rounded-2xl border border-stone-200 bg-white/80 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{rule.name}</p><p className="mt-2 text-sm font-semibold text-stone-900">{rule.value}</p></div>)}</div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5"><h3 className="text-base font-semibold text-stone-900">签名规则</h3><div className="mt-4 space-y-2 text-sm text-stone-600">{payment10SignRules.map((rule) => <div key={rule} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 rounded-full bg-emerald-500" /><span>{rule}</span></div>)}</div></div>
          <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5"><h3 className="text-base font-semibold text-stone-900">状态说明</h3><div className="mt-4 grid gap-2 sm:grid-cols-2">{payment10OrderStates.map((s) => <div key={`o-${s.code}`} className="rounded-xl bg-stone-50 px-4 py-3 text-sm"><span className="mr-2 rounded bg-stone-200 px-2 py-1 text-xs">{s.code}</span>{s.desc}</div>)}{payment10NotifyStates.map((s) => <div key={`n-${s.code}`} className="rounded-xl bg-stone-50 px-4 py-3 text-sm"><span className="mr-2 rounded bg-blue-200 px-2 py-1 text-xs">N{s.code}</span>{s.desc}</div>)}</div></div>
        </div>
        <ApiDocSelector apis={payment10ApiDocs} selectedApi={selectedApiDoc} onSelect={setSelectedApiDoc} />
        <ApiDocPanel apiDoc={selectedApiDoc} />
      </CardContent></Card>
    </div>
  );
}
