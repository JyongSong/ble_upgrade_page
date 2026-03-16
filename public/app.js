const form = document.querySelector("#upgrade-form");
const snInput = document.querySelector("#sn");
const contactInput = document.querySelector("#contact");
const message = document.querySelector("#message");
const summary = document.querySelector("#device-summary");
const modal = document.querySelector("#payment-modal");
const scannerModal = document.querySelector("#scanner-modal");
const purchaseButton = document.querySelector("#purchase-button");
const confirmPaymentButton = document.querySelector("#confirm-payment");
const cancelPaymentButton = document.querySelector("#cancel-payment");
const scanButton = document.querySelector("#scan-button");
const closeScannerButton = document.querySelector("#close-scanner");
const scannerVideo = document.querySelector("#scanner-video");
const scannerFallback = document.querySelector("#scanner-fallback");
const scannerMessage = document.querySelector("#scanner-message");

let validatedPayload = null;
let isSubmitting = false;
let scannerStream = null;
let scannerIntervalId = null;
let barcodeDetector = null;

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function setScannerMessage(text) {
  scannerMessage.textContent = text;
}

function setLoadingState(loading) {
  isSubmitting = loading;
  purchaseButton.disabled = loading;
  confirmPaymentButton.disabled = loading;
  purchaseButton.textContent = loading ? "처리 중..." : "유료 업그레이드 결제";
}

function isValidContact(value) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?[0-9\-()\s]{7,20}$/;
  return emailPattern.test(value) || phonePattern.test(value);
}

function normalizePayload() {
  return {
    sn: snInput.value.trim().toUpperCase(),
    contact: contactInput.value.trim()
  };
}

function renderSummary(device) {
  summary.innerHTML = `
    <strong>기기 확인 완료</strong><br />
    SN: ${device.sn}<br />
    현재 구매 상태: ${device.purchaseStatus === "paid" ? "결제 완료" : "미결제"}
  `;
  summary.classList.remove("hidden");
}

function hideSummary() {
  summary.classList.add("hidden");
  summary.innerHTML = "";
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "요청 처리에 실패했습니다.");
  }

  return result;
}

function openModal() {
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

function openScannerModal() {
  scannerModal.classList.remove("hidden");
}

function closeScannerModal() {
  scannerModal.classList.add("hidden");
}

function cleanupScanner() {
  if (scannerIntervalId) {
    window.clearInterval(scannerIntervalId);
    scannerIntervalId = null;
  }

  if (scannerStream) {
    scannerStream.getTracks().forEach((track) => track.stop());
    scannerStream = null;
  }

  scannerVideo.srcObject = null;
}

async function startScanner() {
  cleanupScanner();
  scannerFallback.classList.add("hidden");
  setScannerMessage("카메라를 준비 중입니다...");

  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !("BarcodeDetector" in window)) {
    scannerFallback.classList.remove("hidden");
    setScannerMessage("이 브라우저에서는 실시간 QR 스캔을 지원하지 않습니다. SN을 직접 입력해 주세요.");
    return;
  }

  try {
    if (!barcodeDetector) {
      barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
    }

    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    scannerVideo.srcObject = scannerStream;
    await scannerVideo.play();
    setScannerMessage("QR 코드를 화면 중앙에 맞춰 주세요.");

    scannerIntervalId = window.setInterval(async () => {
      try {
        const codes = await barcodeDetector.detect(scannerVideo);
        if (!codes.length) {
          return;
        }

        const rawValue = String(codes[0].rawValue || "").trim();
        if (!rawValue) {
          return;
        }

        snInput.value = rawValue.toUpperCase();
        validatedPayload = null;
        hideSummary();
        setMessage("QR 스캔이 완료되었습니다. 연락처를 확인한 뒤 결제를 진행해 주세요.", "success");
        cleanupScanner();
        closeScannerModal();
      } catch {
        setScannerMessage("QR 인식 중입니다...");
      }
    }, 600);
  } catch {
    scannerFallback.classList.remove("hidden");
    setScannerMessage("카메라에 접근할 수 없습니다. 브라우저 권한을 확인하거나 SN을 직접 입력해 주세요.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSubmitting) {
    return;
  }

  const payload = normalizePayload();
  hideSummary();
  validatedPayload = null;

  if (!payload.sn) {
    setMessage("기기 SN을 입력해 주세요.", "error");
    return;
  }

  if (!payload.contact || !isValidContact(payload.contact)) {
    setMessage("유효한 휴대폰 번호 또는 이메일을 입력해 주세요.", "error");
    return;
  }

  try {
    setLoadingState(true);
    const result = await postJson("/api/validate", payload);
    validatedPayload = payload;
    renderSummary(result.device);
    setMessage(result.message, "success");
    openModal();
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    setLoadingState(false);
  }
});

confirmPaymentButton.addEventListener("click", async () => {
  if (!validatedPayload || isSubmitting) {
    return;
  }

  try {
    setLoadingState(true);
    const result = await postJson("/api/purchase", validatedPayload);
    renderSummary(result.device);
    setMessage(result.message, "success");
    closeModal();
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    setLoadingState(false);
  }
});

cancelPaymentButton.addEventListener("click", () => {
  closeModal();
  setMessage("결제가 취소되어 업그레이드 상태는 변경되지 않았습니다.");
});

scanButton.addEventListener("click", async () => {
  openScannerModal();
  await startScanner();
});

closeScannerButton.addEventListener("click", () => {
  cleanupScanner();
  closeScannerModal();
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

scannerModal.addEventListener("click", (event) => {
  if (event.target === scannerModal) {
    cleanupScanner();
    closeScannerModal();
  }
});

[snInput, contactInput].forEach((input) => {
  input.addEventListener("input", () => {
    validatedPayload = null;
    hideSummary();
    setMessage("");
  });
});

window.addEventListener("beforeunload", cleanupScanner);
