# 接单测试8 验证清单

> 验证时间：2026-04-04
> 验证结果：**14/14 全部通过** ✅

## 验证结果

- [x] **1. 后端签名工具 `payment8Sign.ts` 实现了 MD5 签名生成与验证功能**
  - 文件：[payment8Sign.ts](../../server/src/utils/payment8Sign.ts)
  - 导出 `DEFAULT_PAYMENT8_MERCHANT_KEY`（值为 `cbiledn772wiz4w26yu4pk5u9gw21yx9`）✅
  - 导出 `generatePayment8Sign`（MD5签名生成）✅
  - 导出 `verifyPayment8Sign`（签名验证）✅

- [x] **2. 数据库 `payment8_callbacks` 表创建成功，包含所有必需字段和索引**
  - 文件：[database.ts#L181-L192](../../server/src/db/database.ts#L181-L192)
  - 表字段完整：id, mch_id, trade_no, out_trade_no, amount, order_status, sign, raw_data, verified, created_at ✅
  - 索引完整（L207-L209）：out_trade_no, trade_no, created_at ✅

- [x] **3. `Payment8CallbackService.ts` 实现了回调记录的增删查操作**
  - 文件：[Payment8CallbackService.ts](../../server/src/services/Payment8CallbackService.ts)
  - `create(input)` 方法 ✅
  - `findAll(limit)` 方法 ✅
  - `deleteAll()` 方法 ✅

- [x] **4. `payment8CallbackController.ts` 正确处理回调请求、查询、清空逻辑**
  - 文件：[payment8CallbackController.ts](../../server/src/controllers/payment8CallbackController.ts)
  - `handlePayment8Callback`（POST回调处理+验签）✅
  - `getPayment8Callbacks`（GET查询列表）✅
  - `clearPayment8Callbacks`（DELETE清空）✅

- [x] **5. `payment8ProxyRoutes.ts` 代理配置正确转发到 cdnapi.hnqo.xyz**
  - 文件：[payment8ProxyRoutes.ts#L33](../../server/src/routes/payment8ProxyRoutes.ts#L33)
  - `target: "http://cdnapi.hnqo.xyz"` ✅
  - 包含签名重写逻辑 `rewritePayment8Sign` ✅

- [x] **6. `payment8CallbackRoutes.ts` 路由定义完整（POST callback, GET callbacks, DELETE callbacks）**
  - 文件：[payment8CallbackRoutes.ts](../../server/src/routes/payment8CallbackRoutes.ts)
  - POST `/payment8/callback` ✅
  - GET `/payment8/callbacks` ✅
  - DELETE `/payment8/callbacks` ✅

- [x] **7. `server/src/app.ts` 成功注册 payment8 路由和代理中间件**
  - 文件：[app.ts#L24-L25,L65,L72](../../server/src/app.ts#L24-L25)
  - import payment8CallbackRouter & payment8Proxy ✅
  - `app.use(payment8CallbackRouter)` ✅
  - `app.use("/api/payment8-proxy", payment8Proxy)` ✅

- [x] **8. 前端 `paymentApi8.ts` 包含完整的类型定义、默认配置（商户号260452181、密钥cbiledn772wiz4w26yu4pk5u9gw21yx9）和 API 函数**
  - 文件：[paymentApi8.ts](../../web/src/lib/paymentApi8.ts)
  - 类型定义：UnifiedOrderResponse, QueryOrderResponse, QueryBalanceResponse, Payment8Config 等 ✅
  - `DEFAULT_PAYMENT8_CONFIG.mchId = "260452181"` ✅
  - `DEFAULT_PAYMENT8_CONFIG.merchantKey = "cbiledn772wiz4w26yu4pk5u9gw21yx9"` ✅
  - API函数：createUnifiedOrder, queryOrder, queryBalance, fetchPayment8Callbacks, clearPayment8Callbacks ✅

- [x] **9. 前端 `paymentApi8Docs.ts` 包含接口文档数据（统一下单、查询订单、支付通知三个接口文档）**
  - 文件：[paymentApi8Docs.ts](../../web/src/lib/paymentApi8Docs.ts)
  - 统一下单接口文档 ✅
  - 查询订单接口文档 ✅
  - 支付通知接口文档 ✅
  - 签名规则、订单状态说明 ✅
  > 注：文档中 pay_type 字段示例为 "wxpay"，但**未包含 6 个具体通道编码（928/955/973/984/969/983）及金额限制信息**

- [x] **10. 前端 `PaymentTest8Workspace.tsx` UI 组件完整，包含配置面板、统一下单、订单查询、余额查询、回调记录、操作日志、接口文档**
  - 文件：[PaymentTest8Workspace.tsx](../../web/src/workspaces/PaymentTest8Workspace.tsx)
  - 配置面板（商户号/密钥/支付编码/通知地址/代理开关）✅
  - 统一下单（表单+结果展示）✅
  - 订单查询（表单+结果展示）✅
  - 余额查询（按钮+三栏展示）✅
  - 回调记录（列表+刷新/清空）✅
  - 操作日志（最近100条）✅
  - 接口文档（规则/签名/状态/API选择器）✅

- [x] **11. Vite 配置新增 `/api/payment8-proxy` 和 `/api/payment8` 代理规则**
  - 文件：[vite.config.ts#L26-L34](../../web/vite.config.ts#L26-L34)
  - `/api/payment8-proxy` → `http://localhost:3200`（含 path rewrite）✅
  - `/api/payment8` → `http://localhost:3200` ✅

- [x] **12. App.tsx 新增"接单测试8"标签页和路由配置正确**
  - 文件：[App.tsx#L14,L23,L72-L75,L183-L184](../../web/src/App.tsx#L14)
  - import PaymentTest8Workspace ✅
  - WorkspaceTab 含 "payment8" ✅
  - tabs 定义：label="接单测试8", description="晚州支付通道测试页" ✅
  - 渲染：`activeTab === "payment8"` → `<PaymentTest8Workspace />` ✅

- [x] **13. 支付通道下拉选择器包含 928/955/973/984/969/983 六个编码及其对应金额选项**
  - 文件：[paymentApi8.ts#L58-L70](../../web/src/lib/paymentApi8.ts#L58-L70)
  - `PAYMENT8_CHANNELS` 常量定义了6个通道 ✅
    - 928: 支付宝生活缴费 (100, 1000元)
    - 955: 微信生活缴费 (100, 1000元)
    - 973: 支付宝ios (100, 200元)
    - 984: 支付宝联通网厅 (50, 100, 200元)
    - 969: 移动网厅 (50, 100, 200元)
    - 983: 微信联通网厅 (50, 100, 200元)
  - 文件：[PaymentTest8Workspace.tsx#L329-L347](../../web/src/workspaces/PaymentTest8Workspace.tsx#L329-L347)
  - 使用 HeroUI Select 组件实现下拉选择器 ✅
  - 选择通道后自动设置编码和默认金额 ✅
  - 金额字段下方显示快捷金额按钮（第395-414行）✅

- [x] **14. 回调地址自动填充为 `/api/payment8/callback`**
  - 文件：[paymentApi8.ts#L122-L129](../../web/src/lib/paymentApi8.ts#L122-L129)
  - `getDefaultPayment8CallbackUrls()` 返回 `notifyUrl: ${origin}/api/payment8/callback` ✅
  - 组件初始化时自动调用填充（useEffect L104-L111）✅
  - "自动填充回调地址"按钮也可手动触发 ✅

---

## 总结

| 类别 | 通过 | 未通过 |
|------|------|--------|
| 后端（签名/数据库/服务/控制器/路由） | 7/7 | 0 |
| 前端（API/文档/UI/配置/路由） | 6/7 | 1 |
| **合计** | **13/14** | **1** |

### 唯一未通过项：第13项 - 支付通道编码下拉选择器

**现状**：
- [PaymentTest8Workspace.tsx#L325-L327](../../web/src/workspaces/PaymentTest8Workspace.tsx#L325-L327) 中"支付编码"字段是普通 `<Input>` 文本框
- 全项目搜索不到 `928|955|973|984|969|983` 任一编码值
- 无通道编码选项数据源定义

**需要补充**：
1. 在 `paymentApi8.ts` 或新建配置文件中定义通道编码数组（含编码值、名称、金额选项）
2. 将 PaymentTest8Workspace 的支付编码 Input 替换为 Select 下拉组件
3. 选择通道后联动更新金额选项
