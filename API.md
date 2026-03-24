# 设备升级状态查询 API

本文档说明 `device upgrade status` 查询接口的使用方式，供第三方集成开发参考。

当前版本：`v1`。响应字段结构保持稳定，如有破坏性变更将提前通知或新增版本。

## 接口概览

- Base URL：`https://www.aqaralife-service.kr`
- 用途：查询指定设备是否已完成 Zigbee 付费升级
- 方法：`GET`
- 路径：`/ble_upgrade/api/device-upgrade-status`
- 版本：`v1`
- 认证方式：`Bearer Token`
- 返回格式：`application/json`

## 请求说明

### HTTP 示例

```http
GET /ble_upgrade/api/device-upgrade-status?sn=A01460/LS1ELU01801 HTTP/1.1
Host: www.aqaralife-service.kr
Authorization: Bearer YOUR_API_KEY
Accept: application/json
```

### Query 参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `sn` | string | 是 | 设备序列号 |

### Header

| Header | 必填 | 说明 |
| --- | --- | --- |
| `Authorization` | 是 | 格式：`Bearer <API_KEY>` |
| `Accept` | 否 | 建议传 `application/json` |

## 成功响应

### 状态码

`200 OK`

### 返回示例

```json
{
  "sn": "A01460/LS1ELU01801",
  "purchaseStatus": "paid",
  "featureCode": "zigbee",
  "paidAt": "2026-03-13T06:03:50.035+00:00",
  "updatedAt": "2026-03-13T06:03:50.035+00:00"
}
```

### 字段说明

| 字段名 | 类型 | 可空 | 说明 |
| --- | --- | --- | --- |
| `sn` | string | 否 | 设备序列号 |
| `purchaseStatus` | string | 否 | 购买状态（见下方状态定义） |
| `featureCode` | string | 否 | 升级功能编码，当前固定为 `zigbee` |
| `paidAt` | string（ISO 8601） | 是 | 支付完成时间，未购买时为 `null` |
| `updatedAt` | string（ISO 8601） | 是 | 最近一次状态更新时间 |

## 购买状态定义

| 值 | 含义 |
| --- | --- |
| `pending` | 尚未完成购买 |
| `paid` | 已完成购买 |

## 错误响应

### `400 Bad Request`

请求参数缺失或不合法。

```json
{
  "message": "Missing required query parameter: sn."
}
```

### `401 Unauthorized`

未提供 API Key 或 API Key 无效。

```json
{
  "message": "Unauthorized."
}
```

### `404 Not Found`

数据库中不存在对应的设备 SN。

```json
{
  "message": "Device not found."
}
```

### `500 Internal Server Error`

服务端发生临时错误。

```json
{
  "message": "Internal server error."
}
```

## 接口约定

- 该接口为第三方只读查询接口，不能修改购买状态。
- 查询唯一依据是 `sn`。
- 如果设备存在但尚未生成升级购买记录，接口会返回 `purchaseStatus: "pending"`。
- 时间字段统一使用 ISO 8601 格式。

## 集成流程

1. 保存 Base URL 和 API Key。
2. 在需要判断设备是否已开通 Zigbee 升级时，按设备 SN 调用接口。
3. 根据 `purchaseStatus` 字段处理业务逻辑（当前只有 `pending` 和 `paid` 两种状态）。
4. 如果后续增加新的状态值，将通过版本更新或提前通知的方式处理。

## cURL 调用示例

```bash
curl -X GET \
  "https://www.aqaralife-service.kr/ble_upgrade/api/device-upgrade-status?sn=A01460/LS1ELU01801" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: application/json"
```

## 变更记录

| 日期 | 版本 | 说明 |
| --- | --- | --- |
| 2026-03-13 | v1 | 初始版本，开发联调 |
| 2026-03-24 | v1 | 正式上线，域名切换至 `www.aqaralife-service.kr` |
