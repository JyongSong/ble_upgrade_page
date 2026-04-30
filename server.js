const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const validateHandler = require("./api/validate");
const purchaseHandler = require("./api/purchase");
const statusHandler = require("./api/status");
const thirdPartyStatusHandler = require("./api/device-upgrade-status");
const { config } = require("./lib/config");
const { sendJson } = require("./lib/response");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const BASE_PATH = "/ble_upgrade";

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { message: "Resource not found." });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8"
    };

    res.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream"
    });
    res.end(content);
  });
}

function stripBase(pathname) {
  if (pathname === BASE_PATH) return "/";
  if (pathname.startsWith(BASE_PATH + "/")) return pathname.slice(BASE_PATH.length);
  return null;
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    req.query = Object.fromEntries(url.searchParams.entries());

    const stripped = stripBase(url.pathname);
    if (stripped === null) {
      sendJson(res, 404, { message: "Not found." });
      return;
    }

    if (req.method === "POST" && stripped === "/api/validate") {
      validateHandler(req, res);
      return;
    }

    if (req.method === "POST" && stripped === "/api/purchase") {
      purchaseHandler(req, res);
      return;
    }

    if (req.method === "GET" && stripped === "/api/status") {
      statusHandler(req, res);
      return;
    }

    if ((req.method === "GET" || req.method === "PATCH" || req.method === "POST") && stripped === "/api/device-upgrade-status") {
      thirdPartyStatusHandler(req, res);
      return;
    }

    if (req.method === "GET") {
      const requestPath = stripped === "/" ? "/index.html" : stripped;
      const filePath = path.normalize(path.join(PUBLIC_DIR, requestPath));

      if (!filePath.startsWith(PUBLIC_DIR)) {
        sendJson(res, 403, { message: "Forbidden." });
        return;
      }

      sendFile(res, filePath);
      return;
    }

    sendJson(res, 405, { message: "Method not allowed." });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`BLE upgrade page running at http://${HOST}:${PORT}${BASE_PATH}`);
    console.log(`Supabase project: ${config.supabaseUrl || "missing config"}`);
  });
}

module.exports = {
  createServer
};
