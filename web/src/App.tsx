import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { MetricCard } from "./components/AppPrimitives";
import { API_BASE_URL } from "./lib/api";
import { PaymentResultPage } from "./pages/PaymentResultPage";
import { BotManagementWorkspace } from "./workspaces/BotManagementWorkspace";
import { PaymentTest2Workspace } from "./workspaces/PaymentTest2Workspace";
import { PaymentTest3Workspace } from "./workspaces/PaymentTest3Workspace";
import { PaymentTest4Workspace } from "./workspaces/PaymentTest4Workspace";
import { PaymentTest5Workspace } from "./workspaces/PaymentTest5Workspace";
import { PaymentTest6Workspace } from "./workspaces/PaymentTest6Workspace";
import { PaymentTestWorkspace } from "./workspaces/PaymentTestWorkspace";
import { UserIdentityWorkspace } from "./workspaces/UserIdentityWorkspace";

type FlashState = {
  type: "success" | "error";
  message: string;
};

type WorkspaceTab = "user" | "bot" | "payment" | "payment2" | "payment3" | "payment4" | "payment5" | "payment6";

const tabs: Array<{ id: WorkspaceTab; label: string; description: string }> = [
  {
    id: "user",
    label: "用户身份",
    description: "保留现有用户登录、Identity 切换和消息发送能力。"
  },
  {
    id: "bot",
    label: "Bot 管理",
    description: "接入多个 Bot，并将资料模板一键应用到指定 Bot。"
  },
  {
    id: "payment",
    label: "接单测试1",
    description: "支付接口可视化测试工具，支持代收/代付下单和订单查询。"
  },
  {
    id: "payment2",
    label: "接单测试2",
    description: "盛兴通道测试页，支持统一下单、查单、余额查询和回调验签。"
  },
  {
    id: "payment3",
    label: "接单测试3",
    description: "四方支付新网关测试页，支持下单、查单、回调验签和文档查看。"
  },
  {
    id: "payment4",
    label: "接单测试4",
    description: "鲨鱼支付通道测试页，支持下单、旧/新查单、回调验签和文档查看。"
  },
  {
    id: "payment5",
    label: "接单测试5",
    description: "繁星支付通道测试页，支持下单、查单、余额查询、回调验签和文档查看。"
  },
  {
    id: "payment6",
    label: "接单测试6",
    description: "万盛通道测试页，支持下单、查单、余额查询、回调验签和文档查看。"
  }
];

function MainApp() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("user");
  const [flash, setFlash] = useState<FlashState | null>(null);

  function showSuccess(message: string) {
    setFlash({
      type: "success",
      message
    });
  }

  function showError(error: unknown) {
    const message = error instanceof Error ? error.message : "发生了未知错误。";

    setFlash({
      type: "error",
      message
    });
  }

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  function handleTabChange(tabId: WorkspaceTab) {
    setActiveTab(tabId);
    setFlash(null);
  }

  return (
    <div className="min-h-screen grid-pattern px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="soft-panel relative overflow-hidden rounded-[32px] p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-72 translate-x-14 rounded-full bg-emerald-200/30 blur-3xl lg:block" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Telegram Admin MVP</p>
              <h1 className="display-font mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-5xl">
                用网页控制台管理 Telegram 身份、Bot 和支付测试页
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                当前控制台保留用户身份工作区和 Bot 管理工作区，并新增四套支付测试面板。Bot 需先通过 @BotFather 创建，再录入
                Token 到系统中。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="后端地址"
                value={API_BASE_URL.replace(/^https?:\/\//, "")}
                hint="Express + SQLite + gramjs"
              />
              <MetricCard label="当前工作区" value={currentTab.label} hint={currentTab.description} />
            </div>
          </div>
        </header>

        <nav className="soft-panel flex flex-wrap gap-3 rounded-[28px] p-3">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                className={`rounded-[22px] px-5 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10"
                    : "bg-white/80 text-stone-700 hover:bg-white"
                }`}
                type="button"
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {flash ? (
          <div
            className={`rounded-3xl border px-5 py-4 text-sm font-medium ${
              flash.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {flash.message}
          </div>
        ) : null}

        {activeTab === "user" ? (
          <UserIdentityWorkspace showError={showError} showSuccess={showSuccess} />
        ) : activeTab === "bot" ? (
          <BotManagementWorkspace showError={showError} showSuccess={showSuccess} />
        ) : activeTab === "payment" ? (
          <PaymentTestWorkspace showError={showError} showSuccess={showSuccess} />
        ) : activeTab === "payment2" ? (
          <PaymentTest2Workspace showError={showError} showSuccess={showSuccess} />
        ) : activeTab === "payment3" ? (
          <PaymentTest3Workspace showError={showError} showSuccess={showSuccess} />
        ) : activeTab === "payment4" ? (
          <PaymentTest4Workspace showError={showError} showSuccess={showSuccess} />
        ) : activeTab === "payment5" ? (
          <PaymentTest5Workspace showError={showError} showSuccess={showSuccess} />
        ) : activeTab === "payment6" ? (
          <PaymentTest6Workspace showError={showError} showSuccess={showSuccess} />
        ) : (
          <PaymentTest4Workspace showError={showError} showSuccess={showSuccess} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}
