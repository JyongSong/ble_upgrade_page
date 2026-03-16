# BLE Upgrade Page

一个最小可运行的 BLE 设备付费升级页面示例。

当前版本使用 Supabase，并可复用 `/Users/zhiyongsong/warranty-h5` 里的连接配置和已存在的 `shipped_devices` 数据。
这个项目对 `shipped_devices` 只读，不会写入或修改 `warranty-h5` 的业务表。
项目结构同时支持本地 `node server.js` 启动和 Vercel 的 `api/*` Serverless Functions 部署。

## 启动

```bash
npm start
```

默认启动地址：

```text
http://localhost:3000
```

## 部署到 Vercel

Vercel 环境变量至少需要配置：

```text
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
THIRD_PARTY_API_KEY=...
```

说明：

- 直接在 Vercel 项目里配置 `NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`THIRD_PARTY_API_KEY`
- `WARRANTY_H5_PATH` 仅用于本地开发时复用其他项目的 `.env`，不属于 Vercel 部署必填项

启动前请先确保以下任一条件成立：

1. 当前项目有 `.env.local` 或 `.env`
2. `/Users/zhiyongsong/warranty-h5/.env.local` 或 `.env` 存在，且包含：

```text
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
THIRD_PARTY_API_KEY=...
```

如果你的 Supabase 里还没有升级表，先执行 [supabase/device_feature_upgrades.sql](/Users/zhiyongsong/ble_upgrade_page/supabase/device_feature_upgrades.sql)。

SN 校验来源是你已有库里的 `public.shipped_devices` 表。
升级购买状态单独存放在 `public.device_feature_upgrades`，不与 `warranty-h5` 的表建立外键约束。

## 购买流程

1. 输入设备 SN。
2. 输入用户电话或邮箱。
3. 点击“购买升级”后，前端会先调用校验接口。
4. 校验成功后进入模拟支付弹窗。
5. 点击“模拟支付成功”后，Supabase `public.device_feature_upgrades` 中该 SN 的 `purchase_status` 会更新为 `paid`。

## 第三方查询接口

推荐把下面这些内容发给第三方，而不是直接给数据库访问权限。

- Endpoint: `GET /api/device-upgrade-status?sn=<DEVICE_SN>`
- Auth: `Authorization: Bearer <THIRD_PARTY_API_KEY>`
- Purpose: 查询某个设备是否已购买 Zigbee 升级

请求示例：

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://127.0.0.1:3000/api/device-upgrade-status?sn=A01460/LS1ELU01801"
```

成功响应示例：

```json
{
  "sn": "A01460/LS1ELU01801",
  "purchaseStatus": "paid",
  "featureCode": "zigbee",
  "paidAt": "2026-03-13T06:03:50.035+00:00",
  "updatedAt": "2026-03-13T06:03:50.035+00:00"
}
```

错误码：

- `200`: 查询成功
- `400`: 缺少 `sn`
- `401`: API Key 无效
- `404`: 设备不存在
- `500`: 服务端错误
