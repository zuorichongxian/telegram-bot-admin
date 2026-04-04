# 接单测试8（晚州支付通道）Spec

## Why

需要新增一个支付通道测试页"接单测试8"，对接晚州支付网关（cdnapi.hnqo.xyz），复用"接单测试5"的全部功能模式（统一下单、订单查询、余额查询、回调记录、操作日志、接口文档），使用新的商户信息和网关地址。

## What Changes

- 新增前端 API 层：`paymentApi8.ts`（类型定义、配置、签名、请求函数）
- 新增前端文档层：`paymentApi8Docs.ts`（静态接口文档）
- 新增前端工作区：`PaymentTest8Workspace.tsx`（UI 组件）
- 新增后端代理路由：`payment8ProxyRoutes.ts`（转发到 cdnapi.hnqo.xyz 网关）
- 新增后端回调路由：`payment8CallbackRoutes.ts`（Express 路由）
- 新增后端回调控制器：`payment8CallbackController.ts`（回调处理逻辑）
- 新增后端服务层：`Payment8CallbackService.ts`（数据库 CRUD）
- 新增后端签名工具：`payment8Sign.ts`（签名生成与验证）
- 修改数据库初始化：新增 `payment8_callbacks` 表及索引
- 修改服务器入口：注册 payment8 路由和代理中间件
- 修改 Vite 配置：新增 `/api/payment8-proxy` 和 `/api/payment8` 代理规则
- 修改 App.tsx：新增"接单测试8"标签页和路由

## Impact

- Affected specs: 无（独立新模块）
- Affected code:
    - 前端：`web/src/lib/`、`web/src/workspaces/`、`web/src/App.tsx`
    - 后端：`server/src/routes/`、`server/src/controllers/`、`server/src/services/`、`server/src/utils/`、`server/src/db/database.ts`、`server/src/app.ts`
    - 构建配置：`web/vite.config.ts`

## ADDED Requirements

### Requirement: 接单测试8 - 晚州支付通道完整功能

系统 SHALL 提供与"接单测试5"功能对等的"接单测试8"工作区，对接晚州支付网关。

#### 对接信息

| 项目             | 值                                                   |
| ---------------- | ---------------------------------------------------- |
| 下单网关         | `http://cdnapi.hnqo.xyz/Pay_Index.html?pay_format=json`       |
| 查询网关         | `http://cdnapi.hnqo.xyz/Pay_Trade_query.html` |
| 商户后台登录名   | 晚州                                               |
| 登录密码         | 123456                                               |
| 回调 IP          | 34.97.3.253            |
| 商户编号         | 260452181                                            |
| 商户密钥         | cbiledn772wiz4w26yu4pk5u9gw21yx9                     |

#### 支付通道编码及金额限制

| 编码   | 通道名称     | 可选金额（元） |
| ------ | ------------ | -------------- |
| 928    | 支付宝生活缴费 | 100, 1000      |
| 955    | 微信生活缴费   | 100, 1000      |
| 973    | 支付宝ios     | 100, 200       |
| 984    | 支付宝联通网厅 | 50, 100, 200   |
| 969    | 移动网厅      | 50, 100, 200   |
| 983    | 微信联通网厅   | 50, 100, 200   |

#### Scenario: 统一下单

- **WHEN** 用户在配置面板填写商户号、秘钥、支付编码等参数后，输入金额并点击"发起统一下单"
- **THEN** 系统通过代理或直连向晚州支付下单网关发送请求，返回支付链接和订单信息

#### Scenario: 订单查询

- **WHEN** 用户输入商户订单号并点击"查询订单"
- **THEN** 系统向查询网关发送请求，返回订单最新状态和支付结果

#### Scenario: 余额查询

- **WHEN** 用户点击"查询余额"按钮
- **THEN** 系统返回商户余额信息

#### Scenario: 回调记录

- **WHEN** 晚州支付网关向 `/api/payment8/callback` 发起异步通知
- **THEN** 后端验证签名后将回调数据存入数据库，前端可查看回调列表（含签名验证状态）

#### Scenario: 接口文档展示

- **WHEN** 用户滚动到页面底部的"接口文档"区域
- **THEN** 展示晚州支付的接口字段说明、签名规则、状态码说明

### Requirement: 签名算法

系统 SHALL 使用 MD5 签名算法，规则为：所有非空参数按 ASCII 升序排列 → key=value&key2=value2 格式拼接 → 末尾追加 &key=商户密钥 → MD5(32位大写)

### Requirement: 数据库表结构

系统 SHALL 创建 `payment8_callbacks` 表存储回调记录，包含以下字段：

- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- mch_id (TEXT NOT NULL) — 商户号
- trade_no (TEXT NOT NULL) — 支付订单号
- out_trade_no (TEXT NOT NULL) — 商户订单号
- amount (TEXT NOT NULL) — 订单金额
- order_status (INTEGER NOT NULL) — 订单状态
- sign (TEXT NOT NULL) — 签名
- raw_data (TEXT NOT NULL) — 原始请求数据
- verified (INTEGER NOT NULL DEFAULT 0) — 签名验证结果
- created_at (TEXT NOT NULL) — 记录创建时间
