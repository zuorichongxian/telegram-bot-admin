import { useState } from "react";

import { MetricCard } from "./components/AppPrimitives";
import { API_BASE_URL } from "./lib/api";
import { BotManagementWorkspace } from "./workspaces/BotManagementWorkspace";
import { UserIdentityWorkspace } from "./workspaces/UserIdentityWorkspace";

type FlashState = {
  type: "success" | "error";
  message: string;
};

type WorkspaceTab = "user" | "bot";

const tabs: Array<{ id: WorkspaceTab; label: string; description: string }> = [
  {
    id: "user",
    label: "用户身份",
    description: "保留现有用户登录、Identity 切换和发消息能力。"
  },
  {
    id: "bot",
    label: "Bot 管理",
    description: "接入多个 Bot，并将资料模板一键应用到指定 Bot。"
  }
];

export default function App() {
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

  return (
    <div className="min-h-screen grid-pattern px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="soft-panel relative overflow-hidden rounded-[32px] p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-72 translate-x-14 rounded-full bg-emerald-200/30 blur-3xl lg:block" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Telegram Admin MVP</p>
              <h1 className="display-font mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-5xl">
                用网页控制台管理 Telegram 身份和 Bot 资料
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                当前控制台保留原有用户身份工作区，并新增 Bot 管理工作区。Bot 需先通过 @BotFather 创建，再录入
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
                onClick={() => setActiveTab(tab.id)}
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
        ) : (
          <BotManagementWorkspace showError={showError} showSuccess={showSuccess} />
        )}
      </div>
    </div>
  );
}
