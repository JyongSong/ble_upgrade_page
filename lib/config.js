const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_WARRANTY_H5_PATH = "/Users/zhiyongsong/warranty-h5";

function loadEnvironment() {
  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env")
  ];

  const sharedProjectPath = process.env.WARRANTY_H5_PATH || DEFAULT_WARRANTY_H5_PATH;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    candidates.push(path.join(sharedProjectPath, ".env.local"));
    candidates.push(path.join(sharedProjectPath, ".env"));
  }

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
    }
  }
}

loadEnvironment();

module.exports = {
  DEFAULT_WARRANTY_H5_PATH,
  config: {
    supabaseUrl: String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, ""),
    supabaseServiceRoleKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || ""),
    warrantyProjectPath: process.env.WARRANTY_H5_PATH || DEFAULT_WARRANTY_H5_PATH,
    thirdPartyApiKey: String(process.env.THIRD_PARTY_API_KEY || "")
  }
};
