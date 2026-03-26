# Telegram Admin Console MVP

一个最小可运行的 Telegram 管理后台，支持：

- 通过手机号 + 验证码登录 Telegram 用户账号
- 保存 gramjs session
- 创建多套 identity（昵称 + 头像 + 消息模板）
- 一键切换 identity
- 发送消息
- 切换 identity 后再发送消息
- 查看操作日志

## 技术栈

- 前端：React + TailwindCSS + HeroUI v3 + Vite
- 后端：Node.js + Express + TypeScript
- Telegram：gramjs（npm 包名为 `telegram`）
- 数据存储：SQLite（通过 `sql.js` 持久化到本地 `.sqlite` 文件）

## 项目结构

```text
.
├─ server/                  # Express + TypeScript + TelegramService
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ middleware/
│  │  └─ db/
│  └─ storage/
│     ├─ data.sqlite        # SQLite 数据文件
│     └─ uploads/           # identity 头像上传目录
├─ web/                     # React + Tailwind + HeroUI 控制台
└─ .env.example
```

## 环境准备

1. 在 [https://my.telegram.org](https://my.telegram.org) 创建应用，拿到 `api_id` 和 `api_hash`
2. 复制根目录环境文件

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. 填写 `.env`

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
TELEGRAM_APP_ID=123456
TELEGRAM_APP_HASH=your_telegram_app_hash
LOG_LIMIT=50
```

4. 前端默认请求 `http://localhost:3001`

如果你需要自定义前端 API 地址，可额外创建 `web/.env.local`：

```env
VITE_API_BASE_URL=http://localhost:3001
```

## 启动方式

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`

生产构建：

```bash
npm run build
```

启动后端构建产物：

```bash
npm run start
```

## 登录流程

1. 在页面的 `Telegram 会话` 面板输入手机号
2. 点击 `发送验证码`
3. 收到 Telegram 验证码后，填写 `验证码`
4. 如果账号启用了二步验证，再填写 `二步验证密码`
5. 点击 `提交验证码 / 密码`

登录成功后，session 会持久化到 SQLite。重启后端后仍可继续使用。

## Identity 使用方式

每个 identity 包含：

- `name`：展示昵称，会在切换时拆分为 `firstName` / `lastName`
- `avatar`：切换身份时同步为 Telegram 头像
- `messageTemplate`：默认消息模板

常见操作：

- `创建身份`：保存昵称、头像、消息模板
- `一键切换`：调用 Telegram `account.UpdateProfile` + `photos.UploadProfilePhoto`
- `切换并发送`：先切换身份，再调用 `client.sendMessage`

## API 列表

### Session

- `POST /session/login`
- `GET /session/status`

`POST /session/login` 支持三种请求体：

1. 请求验证码

```json
{
  "phoneNumber": "+8613800138000"
}
```

2. 提交验证码

```json
{
  "phoneNumber": "+8613800138000",
  "phoneCode": "12345"
}
```

3. 提交二步验证密码

```json
{
  "phoneNumber": "+8613800138000",
  "password": "your_password"
}
```

### Identity CRUD

- `GET /identities`
- `GET /identities/:id`
- `POST /identities`
- `PUT /identities/:id`
- `DELETE /identities/:id`

`POST /identities` 和 `PUT /identities/:id` 使用 `multipart/form-data`：

- `name`
- `messageTemplate`
- `avatar` 可选
- `removeAvatar=true` 可选，仅更新时使用

### Control

- `POST /control/switch`
- `POST /control/send`
- `POST /control/switch-and-send`

示例：

```json
{
  "identityId": 1
}
```

```json
{
  "target": "@target_user",
  "message": "Hello from admin console"
}
```

```json
{
  "identityId": 1,
  "target": "@target_user",
  "message": "Optional override message"
}
```

### Logs

- `GET /logs`

## gramjs 实现说明

核心逻辑都封装在 [server/src/services/telegram/TelegramService.ts](server/src/services/telegram/TelegramService.ts)：

- 修改昵称：`Api.account.UpdateProfile`
- 修改头像：`Api.photos.UploadProfilePhoto`
- 发送消息：`client.sendMessage`
- session 保存：`StringSession`

Controller 只负责接收请求和返回响应，Telegram 逻辑没有写在 controller 中。

## MVP 已实现功能

- Telegram 登录
- Session 状态检查
- Session 持久化
- Identity CRUD
- 身份切换
- 消息发送
- 切换并发送
- 操作日志
- 前端 loading 状态
- 清晰错误返回

## 当前限制

- 这是一个 MVP，未实现后台登录鉴权
- 未实现 Telegram 会话登出接口
- 切换头像时会新增 Telegram 资料照片，不会自动清理历史头像
- 消息目标依赖 Telegram 可解析的对话对象

