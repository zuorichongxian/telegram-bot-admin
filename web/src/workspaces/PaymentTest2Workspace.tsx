import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Chip, Input } from "@heroui/react";

import { Field, formatDate } from "../components/AppPrimitives";
import { ApiDocPanel, ApiDocSelector } from "../components/ApiDocPanel";
import { LoadingButton } from "../components/LoadingButton";
import type { ApiDocInterface } from "../lib/paymentApiDocs";
import {
  clearPayment2Callbacks,
  createUnifiedOrder,
  DEFAULT_PAYMENT2_CONFIG,
  fetchPayment2Callbacks,
  formatFenToYuan,
  generateOrderNo,
  getDefaultPayment2CallbackUrls,
  getPayment2ApiConfig,
  isProxyPayment2ApiConfig,
  isValidFenAmount,
  maskKey,
  PAYMENT2_STATE_MAP,
  queryBalance,
  queryOrder,
  type Payment2ApiResult,
  type Payment2Callback,
  type Payment2Config,
  type QueryBalanceResponse,
  type QueryOrderResponse,
  type UnifiedOrderResponse
} from "../lib/paymentApi2";
import { payment2ApiDocs, payment2InterfaceRules, payment2OrderStates, payment2SignRules } from "../lib/paymentApi2Docs";

type PaymentTest2WorkspaceProps = {
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

export function PaymentTest2Workspace({ showSuccess, showError }: PaymentTest2WorkspaceProps) {
  const [config, setConfig] = useState<Payment2Config>(DEFAULT_PAYMENT2_CONFIG);
  const [useProxyApi, setUseProxyApi] = useState(() =>
    isProxyPayment2ApiConfig({
      unifiedOrderApi: DEFAULT_PAYMENT2_CONFIG.unifiedOrderApi,
      queryOrderApi: DEFAULT_PAYMENT2_CONFIG.queryOrderApi,
      queryBalanceApi: DEFAULT_PAYMENT2_CONFIG.queryBalanceApi
    })
  );
  const [showKey, setShowKey] = useState(false);
  const [orderForm, setOrderForm] = useState({
    amount: "100",
    outTradeNo: "",
    userId: "",
    userName: "",
    userIp: ""
  });
  const [queryForm, setQueryForm] = useState({
    outTradeNo: ""
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [callbacksLoading, setCallbacksLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<Payment2ApiResult<UnifiedOrderResponse> | null>(null);
  const [queryResult, setQueryResult] = useState<Payment2ApiResult<QueryOrderResponse> | null>(null);
  const [balanceResult, setBalanceResult] = useState<Payment2ApiResult<QueryBalanceResponse> | null>(null);
  const [callbacks, setCallbacks] = useState<Payment2Callback[]>([]);
  const [selectedApiDoc, setSelectedApiDoc] = useState<ApiDocInterface>(payment2ApiDocs[0]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logIdCounter, setLogIdCounter] = useState(0);

  useEffect(() => {
    const urls = getDefaultPayment2CallbackUrls();
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
      const response = await fetchPayment2Callbacks(50);
      setCallbacks(response.data ?? []);
    } catch (error) {
      console.error("Failed to fetch payment2 callbacks:", error);
    } finally {
      setCallbacksLoading(false);
    }
  }

  async function handleClearCallbacks() {
    try {
      await clearPayment2Callbacks();
      setCallbacks([]);
      showSuccess("拉单测试2回调记录已清空");
    } catch (error) {
      showError(error);
    }
  }

  function updateConfig(key: keyof Payment2Config, value: string) {
    setConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function fillDefaultCallbackUrls() {
    const urls = getDefaultPayment2CallbackUrls();
    setConfig((prev) => ({
      ...prev,
      notifyUrl: urls.notifyUrl,
      returnUrl: urls.returnUrl
    }));
    showSuccess("已自动填充拉单测试2回调地址");
  }

  function handleToggleProxyApi(checked: boolean) {
    setUseProxyApi(checked);
    setConfig((prev) => ({
      ...prev,
      ...getPayment2ApiConfig(checked)
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

    if (!isValidFenAmount(orderForm.amount)) {
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
      const result = await createUnifiedOrder(config, {
        amount: orderForm.amount.trim(),
        outTradeNo: orderForm.outTradeNo.trim() || undefined,
        userId: orderForm.userId.trim() || undefined,
        userName: orderForm.userName.trim() || undefined,
        userIp: orderForm.userIp.trim() || undefined
      });

      setOrderResult(result);
      addLog("统一下单", orderForm, result);

      if (result.code === 0) {
        const latestOutTradeNo = result.data?.outTradeNo || orderForm.outTradeNo;
        if (latestOutTradeNo) {
          setQueryForm({ outTradeNo: latestOutTradeNo });
        }
        showSuccess(`统一下单成功，商户订单号：${result.data?.outTradeNo ?? latestOutTradeNo}`);
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

  async function handleQueryOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!config.merchantKey.trim()) {
      showError(new Error("请先填写商户密钥"));
      return;
    }

    if (!queryForm.outTradeNo.trim()) {
      showError(new Error("请输入商户订单号"));
      return;
    }

    setQueryLoading(true);
    setQueryResult(null);

    try {
      const result = await queryOrder(config, queryForm.outTradeNo.trim());
      setQueryResult(result);
      addLog("查询订单", queryForm, result);

      if (result.code === 0) {
        showSuccess("订单查询成功");
      } else {
        showError(new Error(result.message || "订单查询失败"));
      }
    } catch (error) {
      addLog("查询订单", queryForm, undefined, error instanceof Error ? error.message : "未知错误");
      showError(error);
    } finally {
      setQueryLoading(false);
    }
  }

  async function handleQueryBalance() {
    if (!config.merchantKey.trim()) {
      showError(new Error("请先填写商户密钥"));
      return;
    }

    setBalanceLoading(true);
    setBalanceResult(null);

    try {
      const result = await queryBalance(config);
      setBalanceResult(result);
      addLog("余额查询", { mchId: config.mchId }, result);

      if (result.code === 0) {
        showSuccess("余额查询成功");
      } else {
        showError(new Error(result.message || "余额查询失败"));
      }
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
          <div>
            <CardTitle className="display-font text-2xl font-bold">拉单测试2</CardTitle>
            <CardDescription className="mt-1 text-sm text-stone-600">
              盛兴通道的可视化测试页，支持统一下单、订单查询、余额查询、回调记录和静态文档查看。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-xl font-bold">配置面板</CardTitle>
          <CardDescription className="text-sm text-stone-600">金额单位统一为分，默认使用测试编码 T888。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="商户号">
              <Input value={config.mchId} onChange={(e) => updateConfig("mchId", e.currentTarget.value)} />
            </Field>
            <Field label="商户密钥">
              <div className="flex gap-2">
                <Input className="flex-1" type={showKey ? "text" : "password"} value={config.merchantKey} onChange={(e) => updateConfig("merchantKey", e.currentTarget.value)} />
                <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => setShowKey((current) => !current)}>
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </Field>
            <Field label="支付编码">
              <Input value={config.productId} onChange={(e) => updateConfig("productId", e.currentTarget.value)} />
            </Field>
            <Field label="异步通知地址">
              <Input value={config.notifyUrl} onChange={(e) => updateConfig("notifyUrl", e.currentTarget.value)} placeholder="https://example.com/notify" />
            </Field>
            <Field label="跳转通知地址">
              <Input value={config.returnUrl} onChange={(e) => updateConfig("returnUrl", e.currentTarget.value)} placeholder="留空则不传" />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white/80 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-stone-800">是否使用本地代理</p>
              <p className="text-xs text-stone-500">开启后经由 /api/payment2-proxy 转发到盛兴支付域名。</p>
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
            <p><strong>商户名称：</strong><span className="ml-2">1024YLC</span></p>
            <p><strong>商户后台：</strong><span className="ml-2 break-all">https://jkmch-shengxing.jkcbb.com</span></p>
            <p><strong>登录账号：</strong><span className="ml-2">c188888</span></p>
            <p><strong>测试编码：</strong><span className="ml-2">T888（测试金额 1 ~ 2000，单位按分传入）</span></p>
            <p><strong>当前密钥预览：</strong><span className="ml-2 font-mono">{maskKey(config.merchantKey)}</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <CardTitle className="display-font text-xl font-bold">统一下单</CardTitle>
            <CardDescription className="text-sm text-stone-600">金额单位为分，例如 100 表示 1.00 元。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleCreateOrder}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="支付金额（分）">
                  <Input value={orderForm.amount} onChange={(e) => updateOrderForm("amount", e.currentTarget.value)} placeholder="100" />
                </Field>
                <Field label="商户订单号">
                  <div className="flex gap-2">
                    <Input className="flex-1" value={orderForm.outTradeNo} onChange={(e) => updateOrderForm("outTradeNo", e.currentTarget.value)} placeholder="留空则自动生成" />
                    <button className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50" type="button" onClick={() => updateOrderForm("outTradeNo", generateOrderNo())}>
                      生成
                    </button>
                  </div>
                </Field>
                <Field label="商户用户 ID">
                  <Input value={orderForm.userId} onChange={(e) => updateOrderForm("userId", e.currentTarget.value)} placeholder="USER_001" />
                </Field>
                <Field label="商户用户姓名">
                  <Input value={orderForm.userName} onChange={(e) => updateOrderForm("userName", e.currentTarget.value)} placeholder="小明" />
                </Field>
                <Field label="商户用户 IP">
                  <Input value={orderForm.userIp} onChange={(e) => updateOrderForm("userIp", e.currentTarget.value)} placeholder="1.1.1.1" />
                </Field>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-600">
                当前金额折合：<span className="font-semibold text-stone-900">¥ {formatFenToYuan(orderForm.amount)}</span>
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
                    <p className="text-xs text-stone-500">code: {orderResult.code}</p>
                  </div>
                  <ResultStatus ok={orderResult.code === 0} />
                </div>
                <p className="text-sm text-stone-600">{orderResult.message}</p>
                {orderResult.data ? (
                  <div className="grid gap-2 text-sm text-stone-700">
                    <p>支付订单号：{orderResult.data.tradeNo}</p>
                    <p>商户订单号：{orderResult.data.outTradeNo}</p>
                    <p>订单金额：{orderResult.data.amount} 分（¥ {formatFenToYuan(orderResult.data.amount)}）</p>
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
            <CardTitle className="display-font text-xl font-bold">查询订单</CardTitle>
            <CardDescription className="text-sm text-stone-600">使用商户订单号查询订单最新状态。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleQueryOrder}>
              <Field label="商户订单号">
                <Input value={queryForm.outTradeNo} onChange={(e) => setQueryForm({ outTradeNo: e.currentTarget.value })} placeholder="请输入 outTradeNo" />
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
                  <ResultStatus ok={queryResult.code === 0} />
                </div>
                <p className="text-sm text-stone-600">{queryResult.message}</p>
                {queryResult.data ? (
                  <div className="grid gap-2 text-sm text-stone-700">
                    <p>支付订单号：{queryResult.data.tradeNo}</p>
                    <p>商户订单号：{queryResult.data.outTradeNo}</p>
                    <p>订单金额：{queryResult.data.amount} 分（¥ {formatFenToYuan(queryResult.data.amount)}）</p>
                    <p>支付金额：{queryResult.data.payAmount ?? "-"}{queryResult.data.payAmount !== undefined ? ` 分（¥ ${formatFenToYuan(queryResult.data.payAmount)}）` : ""}</p>
                    <p>订单状态：{PAYMENT2_STATE_MAP[queryResult.data.state] || queryResult.data.state}</p>
                    <p>下单时间：{queryResult.data.createTime}</p>
                    {queryResult.data.payTime ? <p>支付时间：{queryResult.data.payTime}</p> : null}
                    <p className="break-all">支付链接：{queryResult.data.payUrl}</p>
                  </div>
                ) : null}
                <JsonBlock value={queryResult} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <CardTitle className="display-font text-xl font-bold">余额查询</CardTitle>
          <CardDescription className="text-sm text-stone-600">查询商户余额、预付和净预付，单位为分。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoadingButton className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800" loading={balanceLoading} loadingLabel="查询中..." onPress={handleQueryBalance}>
            查询余额
          </LoadingButton>

          {balanceResult ? (
            <div className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-800">余额查询响应</p>
                  <p className="text-xs text-stone-500">code: {balanceResult.code}</p>
                </div>
                <ResultStatus ok={balanceResult.code === 0} />
              </div>
              <p className="text-sm text-stone-600">{balanceResult.message}</p>
              {balanceResult.data ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">余额</p>
                    <p className="mt-2 text-lg font-bold text-stone-900">¥ {formatFenToYuan(balanceResult.data.balance)}</p>
                    <p className="mt-1 text-xs text-stone-500">{balanceResult.data.balance} 分</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">预付</p>
                    <p className="mt-2 text-lg font-bold text-stone-900">¥ {formatFenToYuan(balanceResult.data.earnestBalance)}</p>
                    <p className="mt-1 text-xs text-stone-500">{balanceResult.data.earnestBalance} 分</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">净预付</p>
                    <p className="mt-2 text-lg font-bold text-stone-900">¥ {formatFenToYuan(balanceResult.data.pureEarnestBalance)}</p>
                    <p className="mt-1 text-xs text-stone-500">{balanceResult.data.pureEarnestBalance} 分</p>
                  </div>
                </div>
              ) : null}
              <JsonBlock value={balanceResult} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <div className="flex w-full items-start justify-between gap-4">
              <div>
                <CardTitle className="display-font text-xl font-bold">支付通知记录</CardTitle>
                <CardDescription className="text-sm text-stone-600">本地记录 notifyUrl 回调，核对签名、状态和实付金额。</CardDescription>
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
                const isPaid = callback.state === 1;
                const amountMatches = callback.amount === callback.pay_amount;

                return (
                  <div key={callback.id} className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip className={`px-3 py-1 text-xs font-semibold ${callback.verified ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                        {callback.verified ? "签名通过" : "签名失败"}
                      </Chip>
                      <Chip className={`px-3 py-1 text-xs font-semibold ${isPaid ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {PAYMENT2_STATE_MAP[callback.state] || `状态 ${callback.state}`}
                      </Chip>
                      <Chip className={`px-3 py-1 text-xs font-semibold ${amountMatches ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {amountMatches ? "实付金额匹配" : "实付金额不匹配"}
                      </Chip>
                    </div>

                    <div className="grid gap-2 text-sm text-stone-700 md:grid-cols-2">
                      <p>商户订单号：{callback.out_trade_no}</p>
                      <p>支付订单号：{callback.trade_no}</p>
                      <p>通道 ID：{callback.product_id}</p>
                      <p>订单金额：{callback.amount} 分（¥ {formatFenToYuan(callback.amount)}）</p>
                      <p>实付金额：{callback.pay_amount} 分（¥ {formatFenToYuan(callback.pay_amount)}）</p>
                      <p>创建时间：{callback.create_time}</p>
                      <p>支付时间：{callback.pay_time || "-"}</p>
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
            {payment2InterfaceRules.map((rule) => (
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
                {payment2SignRules.map((rule) => (
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
                {payment2OrderStates.map((state) => (
                  <div key={state.code} className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
                    <span className="rounded-lg bg-stone-200 px-2 py-1 text-xs font-semibold text-stone-700">{state.code}</span>
                    <span className="text-sm text-stone-700">{state.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ApiDocSelector apis={payment2ApiDocs} selectedApi={selectedApiDoc} onSelect={setSelectedApiDoc} />
          <ApiDocPanel apiDoc={selectedApiDoc} />
        </CardContent>
      </Card>
    </div>
  );
}
