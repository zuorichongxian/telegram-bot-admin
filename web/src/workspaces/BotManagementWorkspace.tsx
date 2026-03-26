import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  Avatar,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Chip,
  Input,
  Spinner
} from "@heroui/react";
import { TextArea } from "@heroui/react";

import { Field, formatDate } from "../components/AppPrimitives";
import { LoadingButton } from "../components/LoadingButton";
import {
  type BotAccount,
  type BotGroup,
  type BotGroupDiagnostics,
  type BotGroupSendResult,
  type BotProfile,
  apiRequest,
  resolveAssetUrl
} from "../lib/api";

type BotProfileFormState = {
  id: number | null;
  name: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  existingAvatarPath: string | null;
  removeAvatar: boolean;
};

type BotManagementWorkspaceProps = {
  showSuccess: (message: string) => void;
  showError: (error: unknown) => void;
};

const emptyBotProfileForm: BotProfileFormState = {
  id: null,
  name: "",
  avatarFile: null,
  avatarPreview: null,
  existingAvatarPath: null,
  removeAvatar: false
};

export function BotManagementWorkspace({ showSuccess, showError }: BotManagementWorkspaceProps) {
  const [bots, setBots] = useState<BotAccount[]>([]);
  const [profiles, setProfiles] = useState<BotProfile[]>([]);
  const [botGroups, setBotGroups] = useState<BotGroup[]>([]);
  const [botGroupDiagnostics, setBotGroupDiagnostics] = useState<BotGroupDiagnostics | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [botSubmitting, setBotSubmitting] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupSending, setGroupSending] = useState(false);
  const [applyingProfileId, setApplyingProfileId] = useState<number | null>(null);
  const [deletingBotId, setDeletingBotId] = useState<number | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<number | null>(null);

  const [botToken, setBotToken] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [profileForm, setProfileForm] = useState<BotProfileFormState>(emptyBotProfileForm);

  useEffect(() => {
    void bootstrap();
  }, []);

  const selectedBot = bots.find((bot) => bot.id === selectedBotId) ?? null;

  useEffect(() => {
    if (!selectedBot) {
      setBotGroups([]);
      setBotGroupDiagnostics(null);
      setSelectedGroupIds([]);
      return;
    }

    setBotGroups([]);
    setBotGroupDiagnostics(null);
    setSelectedGroupIds([]);
    void refreshBotGroups(selectedBot.id);
  }, [selectedBot?.id]);

  async function bootstrap() {
    setPageLoading(true);

    try {
      await Promise.all([refreshBots(), refreshProfiles()]);
    } catch (error) {
      showError(error);
    } finally {
      setPageLoading(false);
    }
  }

  async function refreshBots(preferredSelectedBotId?: number | null) {
    const response = await apiRequest<BotAccount[]>("/bots");
    const nextBots = response.data;

    setBots(nextBots);
    setSelectedBotId((current) => {
      const nextSelectedId = preferredSelectedBotId ?? current;

      if (nextSelectedId && nextBots.some((bot) => bot.id === nextSelectedId)) {
        return nextSelectedId;
      }

      return nextBots[0]?.id ?? null;
    });
  }

  async function refreshProfiles() {
    const response = await apiRequest<BotProfile[]>("/bot-profiles");
    setProfiles(response.data);
  }

  async function refreshBotGroups(botId: number) {
    setGroupsLoading(true);

    try {
      const response = await apiRequest<BotGroupDiagnostics>(`/bot-control/diagnostics/${botId}`);
      const diagnostics = response.data;
      const nextGroups = diagnostics.mergedGroups;

      setBotGroupDiagnostics(diagnostics);
      setBotGroups(nextGroups);
      setSelectedGroupIds((current) => current.filter((groupId) => nextGroups.some((group) => group.id === groupId)));
    } catch (error) {
      setBotGroupDiagnostics(null);
      showError(error);
    } finally {
      setGroupsLoading(false);
    }
  }

  function resetProfileForm() {
    setProfileForm((current) => {
      if (current.avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(current.avatarPreview);
      }

      return emptyBotProfileForm;
    });
  }

  function startEditing(profile: BotProfile) {
    resetProfileForm();
    setProfileForm({
      id: profile.id,
      name: profile.name,
      avatarFile: null,
      avatarPreview: resolveAssetUrl(profile.avatarPath),
      existingAvatarPath: profile.avatarPath,
      removeAvatar: false
    });
  }

  function handleAvatarSelect(file: File | null) {
    setProfileForm((current) => {
      if (current.avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(current.avatarPreview);
      }

      return {
        ...current,
        avatarFile: file,
        avatarPreview: file
          ? URL.createObjectURL(file)
          : current.existingAvatarPath
            ? resolveAssetUrl(current.existingAvatarPath)
            : null,
        removeAvatar: false
      };
    });
  }

  async function handleConnectBot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!botToken.trim()) {
      showError(new Error("请输入 Bot Token。"));
      return;
    }

    setBotSubmitting(true);

    try {
      const response = await apiRequest<BotAccount>("/bots", {
        method: "POST",
        body: JSON.stringify({
          token: botToken.trim()
        })
      });

      setBotToken("");
      showSuccess(response.message);
      await refreshBots(response.data.id);
    } catch (error) {
      showError(error);
    } finally {
      setBotSubmitting(false);
    }
  }

  async function handleDeleteBot(bot: BotAccount) {
    if (!window.confirm(`确认删除 Bot “${bot.displayName}”吗？`)) {
      return;
    }

    setDeletingBotId(bot.id);

    try {
      const response = await apiRequest(`/bots/${bot.id}`, {
        method: "DELETE"
      });

      showSuccess(response.message);
      await refreshBots(selectedBotId === bot.id ? null : selectedBotId);
    } catch (error) {
      showError(error);
    } finally {
      setDeletingBotId(null);
    }
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      showError(new Error("模板名称不能为空。"));
      return;
    }

    setProfileSubmitting(true);

    const formData = new FormData();
    formData.append("name", profileForm.name.trim());

    if (profileForm.avatarFile && !profileForm.removeAvatar) {
      formData.append("avatar", profileForm.avatarFile);
    }

    if (profileForm.removeAvatar) {
      formData.append("removeAvatar", "true");
    }

    try {
      const path = profileForm.id ? `/bot-profiles/${profileForm.id}` : "/bot-profiles";
      const method = profileForm.id ? "PUT" : "POST";
      const response = await apiRequest<BotProfile>(path, {
        method,
        body: formData
      });

      showSuccess(response.message);
      resetProfileForm();
      await refreshProfiles();
    } catch (error) {
      showError(error);
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handleDeleteProfile(profile: BotProfile) {
    if (!window.confirm(`确认删除资料模板“${profile.name}”吗？`)) {
      return;
    }

    setDeletingProfileId(profile.id);

    try {
      const response = await apiRequest(`/bot-profiles/${profile.id}`, {
        method: "DELETE"
      });

      showSuccess(response.message);
      if (profileForm.id === profile.id) {
        resetProfileForm();
      }
      await Promise.all([refreshProfiles(), refreshBots(selectedBotId)]);
    } catch (error) {
      showError(error);
    } finally {
      setDeletingProfileId(null);
    }
  }

  async function handleApplyProfile(profile: BotProfile) {
    if (!selectedBot) {
      showError(new Error("请先在 Bot 列表中选择当前操作 Bot。"));
      return;
    }

    setApplyingProfileId(profile.id);

    try {
      const response = await apiRequest("/bot-control/apply-profile", {
        method: "POST",
        body: JSON.stringify({
          botId: selectedBot.id,
          profileId: profile.id
        })
      });

      showSuccess(response.message);
      await refreshBots(selectedBot.id);
    } catch (error) {
      showError(error);
    } finally {
      setApplyingProfileId(null);
    }
  }

  function toggleGroupSelection(groupId: string) {
    setSelectedGroupIds((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]
    );
  }

  function selectAllGroups() {
    setSelectedGroupIds(botGroups.map((group) => group.id));
  }

  function clearSelectedGroups() {
    setSelectedGroupIds([]);
  }

  async function handleSendGroupMessage() {
    if (!selectedBot) {
      showError(new Error("请先在 Bot 列表中选择当前操作 Bot。"));
      return;
    }

    if (!selectedGroupIds.length) {
      showError(new Error("请至少勾选一个群组。"));
      return;
    }

    if (!groupMessage.trim()) {
      showError(new Error("请输入要发送到群组的内容。"));
      return;
    }

    setGroupSending(true);

    try {
      const response = await apiRequest<BotGroupSendResult>("/bot-control/send-groups", {
        method: "POST",
        body: JSON.stringify({
          botId: selectedBot.id,
          groupIds: selectedGroupIds,
          message: groupMessage
        })
      });

      setGroupMessage("");
      showSuccess(response.message);
    } catch (error) {
      showError(error);
    } finally {
      setGroupSending(false);
    }
  }

  const profilePreviewUrl = profileForm.removeAvatar ? null : profileForm.avatarPreview;

  if (pageLoading) {
    return (
      <div className="soft-panel flex min-h-80 items-center justify-center rounded-[32px]">
        <div className="inline-flex items-center gap-3 text-stone-700">
          <Spinner className="size-5" />
          正在加载 Bot 数据...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="display-font text-2xl font-bold">Bot 管理</CardTitle>
            <CardDescription className="mt-1 text-sm text-stone-600">
              先在 @BotFather 创建 Bot，再将 Token 接入当前系统。接入后可选择一个 Bot，并把资料模板一键应用到该 Bot。
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Chip className="border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700">
              已接入 {bots.length} 个 Bot
            </Chip>
            <Chip className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              模板 {profiles.length} 套
            </Chip>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader>
            <div>
              <CardTitle className="display-font text-2xl font-bold">接入 Bot</CardTitle>
              <CardDescription className="text-sm text-stone-600">
                这里只录入 Bot Token。系统会立即校验 Token 并读取 Bot 的昵称和用户名。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={(event) => void handleConnectBot(event)}>
              <Field label="Bot Token">
                <Input
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  placeholder="123456789:AA..."
                  value={botToken}
                  onChange={(event) => setBotToken(event.currentTarget.value)}
                />
              </Field>
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-4 text-sm leading-7 text-stone-600">
                当前版本不自动创建 Bot。请先在 Telegram 中通过 @BotFather 创建好 Bot，再把生成的 Token 粘贴到这里。
              </div>
              <LoadingButton
                className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                loading={botSubmitting}
                loadingLabel="正在接入 Bot..."
                type="submit"
              >
                接入 Bot
              </LoadingButton>
            </form>
          </CardContent>
        </Card>

        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="display-font text-2xl font-bold">Bot 列表</CardTitle>
              <CardDescription className="text-sm text-stone-600">
                先选择一个当前操作 Bot，再对下方资料模板执行一键应用。
              </CardDescription>
            </div>
            <Chip className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              {selectedBot ? `当前操作：${selectedBot.displayName}` : "尚未选择 Bot"}
            </Chip>
          </CardHeader>
          <CardContent>
            {bots.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {bots.map((bot) => {
                  const isSelected = bot.id === selectedBotId;
                  const currentProfile = profiles.find((profile) => profile.id === bot.currentProfileId) ?? null;

                  return (
                    <Card key={bot.id} className="rounded-[28px] border border-stone-200 bg-white/80 shadow-none">
                      <CardHeader className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="display-font text-xl font-bold">{bot.displayName}</CardTitle>
                          <CardDescription className="mt-1 text-sm text-stone-500">
                            {bot.username ? `@${bot.username}` : "无用户名"} · 接入于 {formatDate(bot.createdAt)}
                          </CardDescription>
                        </div>
                        {isSelected ? (
                          <Chip className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                            当前操作
                          </Chip>
                        ) : null}
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm text-stone-600">
                        <div className="rounded-[24px] bg-stone-100/80 p-4">
                          <p>Token 片段：{bot.tokenPreview}</p>
                          <p className="mt-2">当前模板：{currentProfile?.name ?? "未应用模板"}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-3">
                        <LoadingButton
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                            isSelected
                              ? "border border-emerald-600 bg-emerald-500 text-white"
                              : "border border-stone-300 bg-white text-stone-700"
                          }`}
                          loading={false}
                          onPress={() => setSelectedBotId(bot.id)}
                        >
                          {isSelected ? "当前 Bot" : "设为当前"}
                        </LoadingButton>
                        <LoadingButton
                          className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                          loading={deletingBotId === bot.id}
                          loadingLabel="正在删除..."
                          onPress={() => void handleDeleteBot(bot)}
                        >
                          删除
                        </LoadingButton>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm text-stone-500">
                还没有接入任何 Bot。先在左侧粘贴一个有效的 Bot Token。
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="display-font text-2xl font-bold">群组群发</CardTitle>
            <CardDescription className="text-sm text-stone-600">
              获取当前 Bot 所在的所有群组，勾选目标群组后，把同一条消息批量发送到这些群聊。
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Chip className="border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700">
              {selectedBot ? `当前 Bot：${selectedBot.displayName}` : "请先选择 Bot"}
            </Chip>
            <Chip className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              已选 {selectedGroupIds.length} / {botGroups.length}
            </Chip>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <LoadingButton
                className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
                isDisabled={!selectedBot}
                loading={groupsLoading}
                loadingLabel="正在刷新群组..."
                onPress={() => {
                  if (selectedBot) {
                    void refreshBotGroups(selectedBot.id);
                  }
                }}
              >
                刷新群组
              </LoadingButton>
              <LoadingButton
                className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
                isDisabled={!botGroups.length}
                loading={false}
                onPress={selectAllGroups}
              >
                全选
              </LoadingButton>
              <LoadingButton
                className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
                isDisabled={!selectedGroupIds.length}
                loading={false}
                onPress={clearSelectedGroups}
              >
                清空
              </LoadingButton>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {!selectedBot ? (
                <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-6 text-center text-sm text-stone-500">
                  先在上方 Bot 列表中选择一个当前操作 Bot，随后才能拉取它所在的群组。
                </div>
              ) : groupsLoading ? (
                <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-6 text-center text-sm text-stone-500">
                  正在同步当前 Bot 的群组列表...
                </div>
              ) : botGroups.length ? (
                botGroups.map((group) => {
                  const checked = selectedGroupIds.includes(group.id);

                  return (
                    <label
                      key={group.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-[24px] border p-4 transition ${
                        checked
                          ? "border-emerald-300 bg-emerald-50/80"
                          : "border-stone-200 bg-white/80 hover:border-stone-300"
                      }`}
                    >
                      <input
                        checked={checked}
                        className="mt-1 size-4 accent-emerald-600"
                        type="checkbox"
                        onChange={() => toggleGroupSelection(group.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-stone-800">{group.title}</p>
                          <Chip className="border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-semibold text-stone-600">
                            {group.type === "supergroup" ? "超级群组" : "群组"}
                          </Chip>
                        </div>
                        <p className="mt-2 text-xs text-stone-500">
                          {group.username ? `@${group.username}` : `群组 ID：${group.id}`}
                        </p>
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-6 text-center text-sm text-stone-500">
                  当前 Bot 暂未发现任何群组对话，或者它还没有被拉入任何群聊。
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Field label="群发内容">
              <TextArea
                className="min-h-[280px] w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                placeholder="输入后会由当前 Bot 发送到左侧勾选的所有群组。"
                value={groupMessage}
                onChange={(event) => setGroupMessage(event.currentTarget.value)}
              />
            </Field>
            <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-4 text-sm leading-7 text-stone-600">
              Bot 会按当前勾选的群组逐个发送消息。若部分群组发送失败，接口会返回已成功和失败的数量汇总。
            </div>
            <div className="rounded-[28px] border border-stone-200 bg-white/80 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-stone-900">Diagnostics</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Shows getDialogs counts, getUpdates hits, and webhook conflicts for the selected bot.
                  </p>
                </div>
                <Chip className="border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] font-semibold text-stone-700">
                  {selectedBot ? "Updated with refresh" : "No bot selected"}
                </Chip>
              </div>
              {!selectedBot ? (
                <div className="mt-4 rounded-[20px] border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-stone-500">
                  Select a bot first to view discovery diagnostics.
                </div>
              ) : groupsLoading && !botGroupDiagnostics ? (
                <div className="mt-4 rounded-[20px] border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-stone-500">
                  Loading diagnostics...
                </div>
              ) : botGroupDiagnostics ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] bg-stone-100/80 p-4 text-sm text-stone-700">
                      <p className="font-semibold text-stone-900">MTProto / getDialogs</p>
                      <p className="mt-2">Total dialogs: {botGroupDiagnostics.mtproto.totalDialogs}</p>
                      <p className="mt-1">Group dialogs: {botGroupDiagnostics.mtproto.groupDialogsCount}</p>
                      <p className="mt-1 break-all">Error: {botGroupDiagnostics.mtproto.error ?? "none"}</p>
                    </div>
                    <div className="rounded-[20px] bg-stone-100/80 p-4 text-sm text-stone-700">
                      <p className="font-semibold text-stone-900">Bot API / getUpdates</p>
                      <p className="mt-2">Updates fetched: {botGroupDiagnostics.botApi.totalUpdatesFetched}</p>
                      <p className="mt-1">Candidate groups hit: {botGroupDiagnostics.botApi.candidateGroupHitCount}</p>
                      <p className="mt-1">Confirmed groups: {botGroupDiagnostics.botApi.confirmedGroupCount}</p>
                      <p className="mt-1">Pending updates: {botGroupDiagnostics.botApi.pendingUpdateCount}</p>
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-stone-700">
                    <p className="font-semibold text-stone-900">Webhook and API status</p>
                    <p className="mt-2 break-all">Webhook URL: {botGroupDiagnostics.botApi.webhookUrl ?? "not set"}</p>
                    <p className="mt-1 break-all">
                      getUpdates conflict: {botGroupDiagnostics.botApi.getUpdatesConflictReason ?? "none"}
                    </p>
                    <p className="mt-1 break-all">Webhook last error: {botGroupDiagnostics.botApi.lastErrorMessage ?? "none"}</p>
                    <p className="mt-1 break-all">Bot API error: {botGroupDiagnostics.botApi.error ?? "none"}</p>
                    <p className="mt-1">Merged groups: {botGroupDiagnostics.mergedGroups.length}</p>
                  </div>
                  <div className="rounded-[20px] border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-stone-700">
                    <p className="font-semibold text-stone-900">Hints</p>
                    {botGroupDiagnostics.hints.length ? (
                      <div className="mt-2 space-y-2">
                        {botGroupDiagnostics.hints.map((hint) => (
                          <p key={hint} className="leading-6">
                            {hint}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2">No extra hints.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[20px] border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-stone-500">
                  Diagnostics are not available yet. Click Refresh to fetch them again.
                </div>
              )}
            </div>
            <LoadingButton
              className="w-full rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
              isDisabled={!selectedBot || !selectedGroupIds.length || !groupMessage.trim()}
              loading={groupSending}
              loadingLabel="正在群发..."
              onPress={() => void handleSendGroupMessage()}
            >
              发送到已勾选群组
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <Card className="soft-panel rounded-[32px] border-0">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="display-font text-2xl font-bold">
                {profileForm.id ? "编辑 Bot 资料模板" : "创建 Bot 资料模板"}
              </CardTitle>
              <CardDescription className="text-sm text-stone-600">
                模板只包含网名和头像，创建后可反复应用到任意已接入的 Bot。
              </CardDescription>
            </div>
            {profileForm.id ? (
              <Chip className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                正在编辑 #{profileForm.id}
              </Chip>
            ) : null}
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={(event) => void handleSaveProfile(event)}>
              <div className="grid gap-4 md:grid-cols-[1fr_0.68fr]">
                <Field label="模板网名">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="例如：客服助手"
                    value={profileForm.name}
                    onChange={(event) => {
                      const name = event.currentTarget.value;

                      setProfileForm((current) => ({
                        ...current,
                        name
                      }));
                    }}
                  />
                </Field>
                <div className="rounded-[28px] border border-stone-200 bg-white/80 p-5">
                  <p className="text-sm font-semibold text-stone-800">头像预览</p>
                  <div className="mt-5 flex items-center gap-4">
                    <Avatar className="size-20 border border-stone-200 bg-stone-100">
                      {profilePreviewUrl ? <Avatar.Image alt="bot profile preview" src={profilePreviewUrl} /> : null}
                      <Avatar.Fallback className="text-lg font-bold text-stone-600">
                        {(profileForm.name.trim()[0] ?? "B").toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="text-sm text-stone-600">
                      <p>支持常见图片格式，建议使用方形头像。</p>
                      <p className="mt-1">模板不带头像时，应用到 Bot 不会清空该 Bot 的现有头像。</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <input
                      className="block w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-sm text-stone-700"
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleAvatarSelect(event.currentTarget.files?.[0] ?? null)}
                    />
                    {profileForm.existingAvatarPath || profileForm.avatarFile ? (
                      <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                        <input
                          checked={profileForm.removeAvatar}
                          type="checkbox"
                          onChange={(event) => {
                            const removeAvatar = event.currentTarget.checked;

                            setProfileForm((current) => ({
                              ...current,
                              removeAvatar
                            }));
                          }}
                        />
                        提交时移除头像
                      </label>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <LoadingButton
                  className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                  loading={profileSubmitting}
                  loadingLabel={profileForm.id ? "正在保存..." : "正在创建..."}
                  type="submit"
                >
                  {profileForm.id ? "保存修改" : "创建模板"}
                </LoadingButton>
                <LoadingButton
                  className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700"
                  loading={false}
                  onPress={resetProfileForm}
                  type="button"
                >
                  重置表单
                </LoadingButton>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.length ? (
            profiles.map((profile) => {
              const avatarUrl = resolveAssetUrl(profile.avatarPath);
              const isActiveOnSelectedBot = selectedBot?.currentProfileId === profile.id;

              return (
                <Card key={profile.id} className="soft-panel rounded-[30px] border-0">
                  <CardHeader className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-16 border border-stone-200 bg-stone-100">
                        {avatarUrl ? <Avatar.Image alt={profile.name} src={avatarUrl} /> : null}
                        <Avatar.Fallback className="text-lg font-bold text-stone-600">
                          {(profile.name.trim()[0] ?? "B").toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                      <div>
                        <CardTitle className="display-font text-xl font-bold">{profile.name}</CardTitle>
                        <CardDescription className="mt-1 text-sm text-stone-500">
                          更新于 {formatDate(profile.updatedAt)}
                        </CardDescription>
                      </div>
                    </div>
                    {isActiveOnSelectedBot ? (
                      <Chip className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        已应用
                      </Chip>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-[24px] bg-stone-100/80 p-4 text-sm text-stone-700">
                      <p>网名：{profile.name}</p>
                      <p className="mt-2">{profile.avatarPath ? "包含头像模板" : "仅切换网名，不改头像"}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="grid gap-3">
                    <LoadingButton
                      className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
                      isDisabled={!selectedBot}
                      loading={applyingProfileId === profile.id}
                      loadingLabel="正在应用..."
                      onPress={() => void handleApplyProfile(profile)}
                    >
                      {selectedBot ? `应用到 ${selectedBot.displayName}` : "请先选择 Bot"}
                    </LoadingButton>
                    <div className="flex flex-wrap gap-3">
                      <LoadingButton
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
                        loading={false}
                        onPress={() => startEditing(profile)}
                      >
                        编辑
                      </LoadingButton>
                      <LoadingButton
                        className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                        loading={deletingProfileId === profile.id}
                        loadingLabel="正在删除..."
                        onPress={() => void handleDeleteProfile(profile)}
                      >
                        删除
                      </LoadingButton>
                    </div>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="soft-panel col-span-full rounded-[28px] border-0 p-8 text-center text-stone-600">
              还没有任何 Bot 资料模板。先创建一套网名和头像配置吧。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
