import { useEffect, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";

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
  Spinner,
  TextArea
} from "@heroui/react";

import { Field, SessionInfo, formatDate } from "../components/AppPrimitives";
import { LoadingButton } from "../components/LoadingButton";
import { type Identity, type OperationLog, type SessionStatus, apiRequest, resolveAssetUrl } from "../lib/api";

type IdentityFormState = {
  id: number | null;
  name: string;
  messageTemplate: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  existingAvatarPath: string | null;
  removeAvatar: boolean;
};

type UserIdentityWorkspaceProps = {
  showSuccess: (message: string) => void;
  showError: (error: unknown) => void;
};

const emptyIdentityForm: IdentityFormState = {
  id: null,
  name: "",
  messageTemplate: "",
  avatarFile: null,
  avatarPreview: null,
  existingAvatarPath: null,
  removeAvatar: false
};

export function UserIdentityWorkspace({ showSuccess, showError }: UserIdentityWorkspaceProps) {
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [identitySubmitting, setIdentitySubmitting] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);
  const [switchAndSendId, setSwitchAndSendId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [loginForm, setLoginForm] = useState({
    phoneNumber: "",
    phoneCode: "",
    password: ""
  });
  const [sendForm, setSendForm] = useState({
    target: "",
    message: ""
  });
  const [identityForm, setIdentityForm] = useState<IdentityFormState>(emptyIdentityForm);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    setPageLoading(true);

    try {
      const [sessionResponse, identitiesResponse, logsResponse] = await Promise.all([
        apiRequest<SessionStatus>("/session/status"),
        apiRequest<Identity[]>("/identities"),
        apiRequest<OperationLog[]>("/logs")
      ]);

      setSession(sessionResponse.data);
      setIdentities(identitiesResponse.data);
      setLogs(logsResponse.data);
      setLoginForm((current) => ({
        ...current,
        phoneNumber: sessionResponse.data.phoneNumber ?? current.phoneNumber
      }));
    } catch (error) {
      showError(error);
    } finally {
      setPageLoading(false);
    }
  }

  async function refreshStatus() {
    const response = await apiRequest<SessionStatus>("/session/status");
    setSession(response.data);
    setLoginForm((current) => ({
      ...current,
      phoneNumber: response.data.phoneNumber ?? current.phoneNumber
    }));
  }

  async function refreshIdentities() {
    const response = await apiRequest<Identity[]>("/identities");
    setIdentities(response.data);
  }

  async function refreshLogs(showLoader = false) {
    if (showLoader) {
      setLogsLoading(true);
    }

    try {
      const response = await apiRequest<OperationLog[]>("/logs");
      setLogs(response.data);
    } finally {
      if (showLoader) {
        setLogsLoading(false);
      }
    }
  }

  function resetIdentityForm() {
    setIdentityForm((current) => {
      if (current.avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(current.avatarPreview);
      }

      return emptyIdentityForm;
    });
  }

  function startEditing(identity: Identity) {
    resetIdentityForm();
    setIdentityForm({
      id: identity.id,
      name: identity.name,
      messageTemplate: identity.messageTemplate,
      avatarFile: null,
      avatarPreview: resolveAssetUrl(identity.avatarPath),
      existingAvatarPath: identity.avatarPath,
      removeAvatar: false
    });
  }

  function handleAvatarSelect(file: File | null) {
    setIdentityForm((current) => {
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

  async function handleRequestCode() {
    if (!loginForm.phoneNumber.trim()) {
      showError(new Error("请先填写手机号。"));
      return;
    }

    setSessionLoading(true);

    try {
      const response = await apiRequest("/session/login", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: loginForm.phoneNumber.trim()
        })
      });

      showSuccess(response.message);
      await Promise.all([refreshStatus(), refreshLogs()]);
    } catch (error) {
      showError(error);
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleCompleteLogin() {
    if (!loginForm.phoneNumber.trim()) {
      showError(new Error("请先填写手机号。"));
      return;
    }

    if (session?.pendingStage !== "password_required" && !loginForm.phoneCode.trim()) {
      showError(new Error("请输入验证码。"));
      return;
    }

    if (session?.pendingStage === "password_required" && !loginForm.password.trim()) {
      showError(new Error("当前账号需要二步验证密码。"));
      return;
    }

    setSessionLoading(true);

    try {
      const response = await apiRequest("/session/login", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: loginForm.phoneNumber.trim(),
          phoneCode: loginForm.phoneCode.trim() || undefined,
          password: loginForm.password.trim() || undefined
        })
      });

      showSuccess(response.message);
      await Promise.all([refreshStatus(), refreshLogs()]);
    } catch (error) {
      showError(error);
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleLogout() {
    if (!session?.authorized) {
      showError(new Error("当前没有已登录的 Telegram 账号。"));
      return;
    }

    if (!window.confirm("确认退出当前 Telegram 账号吗？")) {
      return;
    }

    setLogoutLoading(true);

    try {
      const response = await apiRequest("/session/logout", {
        method: "POST"
      });

      setLoginForm((current) => ({
        ...current,
        phoneNumber: "",
        phoneCode: "",
        password: ""
      }));
      showSuccess(response.message);
      await Promise.all([refreshStatus(), refreshLogs()]);
    } catch (error) {
      showError(error);
    } finally {
      setLogoutLoading(false);
    }
  }

  async function handleSaveIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!identityForm.name.trim()) {
      showError(new Error("身份名称不能为空。"));
      return;
    }

    setIdentitySubmitting(true);

    const formData = new FormData();
    formData.append("name", identityForm.name.trim());
    formData.append("messageTemplate", identityForm.messageTemplate);

    if (identityForm.avatarFile && !identityForm.removeAvatar) {
      formData.append("avatar", identityForm.avatarFile);
    }

    if (identityForm.removeAvatar) {
      formData.append("removeAvatar", "true");
    }

    try {
      const path = identityForm.id ? `/identities/${identityForm.id}` : "/identities";
      const method = identityForm.id ? "PUT" : "POST";
      const response = await apiRequest<Identity>(path, {
        method,
        body: formData
      });

      showSuccess(response.message);
      resetIdentityForm();
      await Promise.all([refreshIdentities(), refreshLogs()]);
    } catch (error) {
      showError(error);
    } finally {
      setIdentitySubmitting(false);
    }
  }

  async function handleDeleteIdentity(identity: Identity) {
    if (!window.confirm(`确认删除身份“${identity.name}”吗？`)) {
      return;
    }

    setDeletingId(identity.id);

    try {
      const response = await apiRequest(`/identities/${identity.id}`, {
        method: "DELETE"
      });

      showSuccess(response.message);
      if (identityForm.id === identity.id) {
        resetIdentityForm();
      }
      await Promise.all([refreshIdentities(), refreshStatus(), refreshLogs()]);
    } catch (error) {
      showError(error);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSwitchIdentity(identity: Identity) {
    setSwitchingId(identity.id);

    try {
      const response = await apiRequest("/control/switch", {
        method: "POST",
        body: JSON.stringify({
          identityId: identity.id
        })
      });

      showSuccess(response.message);
      await Promise.all([refreshStatus(), refreshLogs()]);
    } catch (error) {
      showError(error);
    } finally {
      setSwitchingId(null);
    }
  }

  async function handleSendMessage() {
    if (!sendForm.target.trim() || !sendForm.message.trim()) {
      showError(new Error("发送消息时必须填写目标和消息内容。"));
      return;
    }

    setSendLoading(true);

    try {
      const response = await apiRequest("/control/send", {
        method: "POST",
        body: JSON.stringify({
          target: sendForm.target.trim(),
          message: sendForm.message
        })
      });

      showSuccess(response.message);
      await refreshLogs();
    } catch (error) {
      showError(error);
    } finally {
      setSendLoading(false);
    }
  }

  async function handleSwitchAndSend(identity: Identity) {
    if (!sendForm.target.trim()) {
      showError(new Error("请先在发送面板里填写目标聊天。"));
      return;
    }

    setSwitchAndSendId(identity.id);

    try {
      const response = await apiRequest("/control/switch-and-send", {
        method: "POST",
        body: JSON.stringify({
          identityId: identity.id,
          target: sendForm.target.trim(),
          message: sendForm.message
        })
      });

      showSuccess(response.message);
      await Promise.all([refreshStatus(), refreshLogs()]);
    } catch (error) {
      showError(error);
    } finally {
      setSwitchAndSendId(null);
    }
  }

  const previewUrl = identityForm.removeAvatar ? null : identityForm.avatarPreview;

  if (pageLoading) {
    return (
      <div className="soft-panel flex min-h-80 items-center justify-center rounded-[32px]">
        <div className="inline-flex items-center gap-3 text-stone-700">
          <Spinner className="size-5" />
          正在加载后台数据...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderSessionCard({
        session,
        loginForm,
        setLoginForm,
        sessionLoading,
        logoutLoading,
        handleRequestCode,
        handleCompleteLogin,
        handleLogout,
        refreshStatus
      })}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        {renderIdentityPanel({
          session,
          identities,
          identityForm,
          setIdentityForm,
          previewUrl,
          identitySubmitting,
          switchingId,
          switchAndSendId,
          deletingId,
          handleAvatarSelect,
          handleSaveIdentity,
          handleDeleteIdentity,
          handleSwitchIdentity,
          handleSwitchAndSend,
          resetIdentityForm,
          startEditing
        })}
        {renderSidePanel({
          sendForm,
          setSendForm,
          sendLoading,
          handleSendMessage,
          logs,
          refreshLogs,
          logsLoading
        })}
      </div>
    </div>
  );
}

function renderSessionCard({
  session,
  loginForm,
  setLoginForm,
  sessionLoading,
  logoutLoading,
  handleRequestCode,
  handleCompleteLogin,
  handleLogout,
  refreshStatus
}: {
  session: SessionStatus | null;
  loginForm: { phoneNumber: string; phoneCode: string; password: string };
  setLoginForm: Dispatch<SetStateAction<{ phoneNumber: string; phoneCode: string; password: string }>>;
  sessionLoading: boolean;
  logoutLoading: boolean;
  handleRequestCode: () => Promise<void>;
  handleCompleteLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}) {
  return (
    <Card className="soft-panel rounded-[32px] border-0">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="display-font text-2xl font-bold">Telegram 会话</CardTitle>
          <CardDescription className="text-sm text-stone-600">
            使用手机号和验证码登录 Telegram 用户账号，session 会自动持久化到 SQLite。
          </CardDescription>
        </div>
        <Chip className="border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700">
          {session?.authorized ? "Session Ready" : session?.pendingStage ? "Waiting For Verify" : "No Session"}
        </Chip>
      </CardHeader>
      <CardContent className="grid gap-5">
        {session?.authorized ? (
          <div className="grid gap-4 rounded-[28px] bg-stone-900 px-5 py-5 text-stone-50 md:grid-cols-3">
            <SessionInfo label="当前账号" value={session.me?.displayName ?? "-"} />
            <SessionInfo label="手机号" value={session.phoneNumber ?? "-"} />
            <SessionInfo label="用户名" value={session.me?.username ? `@${session.me.username}` : "-"} />
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="手机号">
            <Input
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="+8613800138000"
              value={loginForm.phoneNumber}
              onChange={(event) => {
                const phoneNumber = event.currentTarget.value;

                setLoginForm((current) => ({
                  ...current,
                  phoneNumber
                }));
              }}
            />
          </Field>
          <Field label="验证码">
            <Input
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder={session?.pendingStage ? "输入收到的验证码" : "请求验证码后填写"}
              value={loginForm.phoneCode}
              onChange={(event) => {
                const phoneCode = event.currentTarget.value;

                setLoginForm((current) => ({
                  ...current,
                  phoneCode
                }));
              }}
            />
          </Field>
          <Field label="二步验证密码">
            <Input
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              type="password"
              placeholder="账号启用 2FA 时填写"
              value={loginForm.password}
              onChange={(event) => {
                const password = event.currentTarget.value;

                setLoginForm((current) => ({
                  ...current,
                  password
                }));
              }}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-3">
          <LoadingButton
            className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
            loading={sessionLoading}
            loadingLabel="正在请求验证码..."
            onPress={() => void handleRequestCode()}
          >
            发送验证码
          </LoadingButton>
          <LoadingButton
            className="rounded-2xl border border-emerald-600 bg-emerald-500 px-5 py-3 text-sm font-semibold text-white"
            loading={sessionLoading}
            loadingLabel="正在提交登录..."
            onPress={() => void handleCompleteLogin()}
          >
            提交验证码 / 密码
          </LoadingButton>
          <LoadingButton
            className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700"
            loading={sessionLoading}
            loadingLabel="正在刷新..."
            onPress={() => void refreshStatus()}
          >
            刷新状态
          </LoadingButton>
          <LoadingButton
            className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700"
            isDisabled={!session?.authorized}
            loading={logoutLoading}
            loadingLabel="正在退出..."
            onPress={() => void handleLogout()}
          >
            退出当前账号
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  );
}

function renderIdentityPanel({
  session,
  identities,
  identityForm,
  setIdentityForm,
  previewUrl,
  identitySubmitting,
  switchingId,
  switchAndSendId,
  deletingId,
  handleAvatarSelect,
  handleSaveIdentity,
  handleDeleteIdentity,
  handleSwitchIdentity,
  handleSwitchAndSend,
  resetIdentityForm,
  startEditing
}: {
  session: SessionStatus | null;
  identities: Identity[];
  identityForm: IdentityFormState;
  setIdentityForm: Dispatch<SetStateAction<IdentityFormState>>;
  previewUrl: string | null;
  identitySubmitting: boolean;
  switchingId: number | null;
  switchAndSendId: number | null;
  deletingId: number | null;
  handleAvatarSelect: (file: File | null) => void;
  handleSaveIdentity: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleDeleteIdentity: (identity: Identity) => Promise<void>;
  handleSwitchIdentity: (identity: Identity) => Promise<void>;
  handleSwitchAndSend: (identity: Identity) => Promise<void>;
  resetIdentityForm: () => void;
  startEditing: (identity: Identity) => void;
}) {
  return (
    <section className="space-y-6">
      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="display-font text-2xl font-bold">
              {identityForm.id ? "编辑 Identity" : "创建 Identity"}
            </CardTitle>
            <CardDescription className="text-sm text-stone-600">
              Identity 包含昵称、头像和默认消息模板，可用于快速切换人设。
            </CardDescription>
          </div>
          {identityForm.id ? (
            <Chip className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              正在编辑 #{identityForm.id}
            </Chip>
          ) : null}
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={(event) => void handleSaveIdentity(event)}>
            <div className="grid gap-4 md:grid-cols-[1fr_0.68fr]">
              <div className="grid gap-4">
                <Field label="显示昵称">
                  <Input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="例如：Amy Support"
                    value={identityForm.name}
                    onChange={(event) => {
                      const name = event.currentTarget.value;

                      setIdentityForm((current) => ({
                        ...current,
                        name
                      }));
                    }}
                  />
                </Field>
                <Field label="消息模板">
                  <TextArea
                    className="min-h-36 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="例如：你好，我这边已收到，稍后给你回复。"
                    value={identityForm.messageTemplate}
                    onChange={(event) => {
                      const messageTemplate = event.currentTarget.value;

                      setIdentityForm((current) => ({
                        ...current,
                        messageTemplate
                      }));
                    }}
                  />
                </Field>
              </div>
              <div className="rounded-[28px] border border-stone-200 bg-white/80 p-5">
                <p className="text-sm font-semibold text-stone-800">头像预览</p>
                <div className="mt-5 flex items-center gap-4">
                  <Avatar className="size-20 border border-stone-200 bg-stone-100">
                    {previewUrl ? <Avatar.Image alt="avatar preview" src={previewUrl} /> : null}
                    <Avatar.Fallback className="text-lg font-bold text-stone-600">
                      {(identityForm.name.trim()[0] ?? "I").toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="text-sm text-stone-600">
                    <p>支持常见图片格式，建议使用方形头像。</p>
                    <p className="mt-1">上传后将保存到本地存储，并在切换身份时同步到 Telegram。</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  <input
                    className="block w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-sm text-stone-700"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleAvatarSelect(event.currentTarget.files?.[0] ?? null)}
                  />
                  {identityForm.existingAvatarPath || identityForm.avatarFile ? (
                    <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                      <input
                        checked={identityForm.removeAvatar}
                        type="checkbox"
                        onChange={(event) => {
                          const removeAvatar = event.currentTarget.checked;

                          setIdentityForm((current) => ({
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
                loading={identitySubmitting}
                loadingLabel={identityForm.id ? "正在保存..." : "正在创建..."}
                type="submit"
              >
                {identityForm.id ? "保存修改" : "创建身份"}
              </LoadingButton>
              <LoadingButton
                className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700"
                loading={false}
                onPress={resetIdentityForm}
                type="button"
              >
                重置表单
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {identities.length ? (
          identities.map((identity) => {
            const isCurrent = session?.currentIdentityId === identity.id;
            const avatarUrl = resolveAssetUrl(identity.avatarPath);

            return (
              <Card key={identity.id} className="soft-panel rounded-[30px] border-0">
                <CardHeader className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16 border border-stone-200 bg-stone-100">
                      {avatarUrl ? <Avatar.Image alt={identity.name} src={avatarUrl} /> : null}
                      <Avatar.Fallback className="text-lg font-bold text-stone-600">
                        {(identity.name.trim()[0] ?? "I").toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>
                    <div>
                      <CardTitle className="display-font text-xl font-bold">{identity.name}</CardTitle>
                      <CardDescription className="mt-1 text-sm text-stone-500">
                        更新于 {formatDate(identity.updatedAt)}
                      </CardDescription>
                    </div>
                  </div>
                  {isCurrent ? (
                    <Chip className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      当前身份
                    </Chip>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[24px] bg-stone-100/80 p-4 text-sm leading-7 text-stone-700">
                    {identity.messageTemplate || "该 identity 暂未配置默认消息模板。"}
                  </div>
                  <div className="grid gap-2 text-xs uppercase tracking-[0.2em] text-stone-400">
                    <span>Identity #{identity.id}</span>
                    <span>{identity.avatarPath ? "已配置头像" : "未配置头像"}</span>
                  </div>
                </CardContent>
                <CardFooter className="grid gap-3">
                  <div className="flex flex-wrap gap-3">
                    <LoadingButton
                      className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
                      loading={switchingId === identity.id}
                      loadingLabel="正在切换..."
                      onPress={() => void handleSwitchIdentity(identity)}
                    >
                      一键切换
                    </LoadingButton>
                    <LoadingButton
                      className="rounded-2xl border border-emerald-600 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"
                      loading={switchAndSendId === identity.id}
                      loadingLabel="正在切换并发送..."
                      onPress={() => void handleSwitchAndSend(identity)}
                    >
                      切换并发送
                    </LoadingButton>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <LoadingButton
                      className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
                      loading={false}
                      onPress={() => startEditing(identity)}
                    >
                      编辑
                    </LoadingButton>
                    <LoadingButton
                      className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                      loading={deletingId === identity.id}
                      loadingLabel="正在删除..."
                      onPress={() => void handleDeleteIdentity(identity)}
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
            还没有任何 identity。先在上方创建一套昵称、头像和消息模板吧。
          </div>
        )}
      </div>
    </section>
  );
}

function renderSidePanel({
  sendForm,
  setSendForm,
  sendLoading,
  handleSendMessage,
  logs,
  refreshLogs,
  logsLoading
}: {
  sendForm: { target: string; message: string };
  setSendForm: Dispatch<SetStateAction<{ target: string; message: string }>>;
  sendLoading: boolean;
  handleSendMessage: () => Promise<void>;
  logs: OperationLog[];
  refreshLogs: (showLoader?: boolean) => Promise<void>;
  logsLoading: boolean;
}) {
  return (
    <section className="space-y-6">
      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader>
          <div>
            <CardTitle className="display-font text-2xl font-bold">发送消息</CardTitle>
            <CardDescription className="text-sm text-stone-600">
              单独发送消息使用当前 Telegram 账号；点击身份卡上的“切换并发送”时，会优先使用这里的目标和消息内容。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="目标聊天">
            <Input
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="@username、手机号联系人或可识别的对话对象"
              value={sendForm.target}
              onChange={(event) => {
                const target = event.currentTarget.value;

                setSendForm((current) => ({
                  ...current,
                  target
                }));
              }}
            />
          </Field>
          <Field label="发送内容">
            <TextArea
              className="min-h-40 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="如果卡片上点“切换并发送”且这里留空，将自动使用 identity 的 message_template。"
              value={sendForm.message}
              onChange={(event) => {
                const message = event.currentTarget.value;

                setSendForm((current) => ({
                  ...current,
                  message
                }));
              }}
            />
          </Field>
        </CardContent>
        <CardFooter>
          <LoadingButton
            className="w-full rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
            loading={sendLoading}
            loadingLabel="正在发送..."
            onPress={() => void handleSendMessage()}
          >
            发送消息
          </LoadingButton>
        </CardFooter>
      </Card>

      <Card className="soft-panel rounded-[32px] border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="display-font text-2xl font-bold">操作日志</CardTitle>
            <CardDescription className="text-sm text-stone-600">
              展示登录、身份管理、切换和发送消息的最近操作记录。
            </CardDescription>
          </div>
          <LoadingButton
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
            loading={logsLoading}
            loadingLabel="正在刷新日志..."
            onPress={() => void refreshLogs(true)}
          >
            刷新日志
          </LoadingButton>
        </CardHeader>
        <CardContent>
          <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {logs.length ? (
              logs.map((log) => (
                <div key={log.id} className="rounded-[24px] border border-stone-200 bg-white/80 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      className={`px-3 py-2 text-xs font-semibold ${
                        log.status === "success"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : log.status === "error"
                            ? "border border-rose-200 bg-rose-50 text-rose-700"
                            : "border border-sky-200 bg-sky-50 text-sky-700"
                      }`}
                    >
                      {log.status}
                    </Chip>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                      {log.action}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-stone-800">{log.message}</p>
                  <p className="mt-2 text-xs text-stone-500">{formatDate(log.createdAt)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-6 text-center text-sm text-stone-500">
                暂无操作日志，完成一次登录或身份切换后会出现在这里。
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
