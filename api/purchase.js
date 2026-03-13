const {
  getMergedDevice,
  normalizeContact,
  normalizeSn,
  upsertUpgradeRecord,
  validateContact
} = require("../lib/upgrade-service");
const { parseJsonBody, sendJson } = require("../lib/response");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { message: "Method not allowed." });
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const sn = normalizeSn(body.sn);
    const contact = normalizeContact(body.contact);

    if (!sn) {
      sendJson(res, 400, { message: "기기 SN을 입력해 주세요." });
      return;
    }

    if (!contact || !validateContact(contact)) {
      sendJson(res, 400, { message: "유효한 휴대폰 번호 또는 이메일을 입력해 주세요." });
      return;
    }

    const existingDevice = await getMergedDevice(sn);

    if (!existingDevice) {
      sendJson(res, 404, { message: "해당 기기 정보 조회할 수 없습니다. 기기 SN을 다시 확인하세요" });
      return;
    }

    if (existingDevice.purchaseStatus === "paid") {
      sendJson(res, 409, {
        message: "이미 결제가 완료된 기기입니다. 중복 결제할 수 없습니다.",
        device: existingDevice
      });
      return;
    }

    await upsertUpgradeRecord(sn, contact);
    const updatedDevice = await getMergedDevice(sn);

    sendJson(res, 200, {
      message: "결제가 완료되었습니다. Zigbee 기능이 활성화되었습니다.",
      device: updatedDevice
    });
  } catch (error) {
    sendJson(res, 400, { message: error.message });
  }
};
