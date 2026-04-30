const { config } = require("./config");

function normalizeSn(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeContact(value) {
  return String(value || "").trim();
}

function validateContact(contact) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?[0-9\-()\s]{7,20}$/;
  return emailPattern.test(contact) || phonePattern.test(contact);
}

function getBearerToken(headers = {}) {
  const authHeader = String(headers.authorization || headers.Authorization || "");
  const prefix = "Bearer ";

  if (!authHeader.startsWith(prefix)) {
    return "";
  }

  return authHeader.slice(prefix.length).trim();
}

function ensureThirdPartyAuthorized(headers) {
  if (!config.thirdPartyApiKey) {
    return {
      ok: false,
      status: 500,
      message: "THIRD_PARTY_API_KEY is not configured."
    };
  }

  const token = getBearerToken(headers);
  if (!token || token !== config.thirdPartyApiKey) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized."
    };
  }

  return { ok: true };
}

function ensureSupabaseConfigured() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    const missing = [];
    if (!config.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!config.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

    const sourceHint = config.warrantyProjectPath
      ? `或确认 ${config.warrantyProjectPath} 下的 .env/.env.local 可用`
      : "请在当前项目提供 .env";

    throw new Error(`缺少 Supabase 配置: ${missing.join(", ")}。请在当前项目配置环境变量，${sourceHint}。`);
  }
}

function getSupabaseHeaders(extraHeaders = {}) {
  return {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    "Content-Type": "application/json",
    ...extraHeaders
  };
}

async function supabaseRequest(tablePath, options = {}) {
  ensureSupabaseConfigured();

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${tablePath}`, {
    ...options,
    headers: getSupabaseHeaders(options.headers)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Supabase request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function getShippedDevice(sn) {
  const rows = await supabaseRequest(
    `shipped_devices?sn=eq.${encodeURIComponent(sn)}&select=id,sn,model,shipped_date,batch_id&limit=1`
  );

  return rows[0] || null;
}

async function getUpgradeRecord(sn) {
  const rows = await supabaseRequest(
    `device_feature_upgrades?sn=eq.${encodeURIComponent(sn)}&select=sn,contact,purchase_status,feature_code,payment_provider,paid_at,last_hub_bound_at,updated_at&limit=1`
  );

  return rows[0] || null;
}

async function upsertUpgradeRecord(sn, contact) {
  const payload = [
    {
      sn,
      contact,
      purchase_status: "paid",
      payment_provider: "demo",
      feature_code: "zigbee",
      paid_at: new Date().toISOString()
    }
  ];

  const rows = await supabaseRequest("device_feature_upgrades?on_conflict=sn", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(payload)
  });

  return rows[0] || null;
}

async function upsertHubBindingTimestamp(sn, lastHubBoundAt) {
  const payload = [
    {
      sn,
      last_hub_bound_at: lastHubBoundAt
    }
  ];

  const rows = await supabaseRequest("device_feature_upgrades?on_conflict=sn", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(payload)
  });

  return rows[0] || null;
}

async function getMergedDevice(sn) {
  const shippedDevice = await getShippedDevice(sn);
  if (!shippedDevice) {
    return null;
  }

  let upgradeRecord = null;

  try {
    upgradeRecord = await getUpgradeRecord(sn);
  } catch (error) {
    if (String(error.message).includes("device_feature_upgrades")) {
      throw new Error(
        "Supabase 中还没有升级表。请先执行项目里的 SQL 建表脚本：supabase/device_feature_upgrades.sql"
      );
    }
    throw error;
  }

  return {
    sn: shippedDevice.sn,
    model: shippedDevice.model,
    batchId: shippedDevice.batch_id,
    shippedDate: shippedDevice.shipped_date,
    contact: upgradeRecord?.contact || null,
    purchaseStatus: upgradeRecord?.purchase_status || "pending",
    featureCode: upgradeRecord?.feature_code || "zigbee",
    paymentProvider: upgradeRecord?.payment_provider || null,
    upgradedAt: upgradeRecord?.paid_at || null,
    lastHubBoundAt: upgradeRecord?.last_hub_bound_at || null,
    updatedAt: upgradeRecord?.updated_at || null
  };
}

module.exports = {
  config,
  ensureThirdPartyAuthorized,
  getMergedDevice,
  normalizeContact,
  normalizeSn,
  upsertHubBindingTimestamp,
  upsertUpgradeRecord,
  validateContact
};
