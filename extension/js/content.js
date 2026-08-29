// MephistoMail content bridge.
// This file is intentionally not a persistent <all_urls> content script.
// background.js injects it only when the user explicitly requests insertion.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || typeof request.action !== "string") return;

    if (request.action === "insertEmail") {
        const email = typeof request.email === "string" ? request.email : "";
        const active = document.activeElement;
        if (!email || !active ||
            (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA") ||
            active.readOnly || active.disabled) {
            sendResponse({ status: "failed", reason: "invalid input" });
            return;
        }
        active.value = email;
        active.dispatchEvent(new Event("input", { bubbles: true }));
        active.dispatchEvent(new Event("change", { bubbles: true }));
        sendResponse({ status: "success" });
        return;
    }

    if (request.action === "autoFillOTP") {
        const otp = typeof request.otp === "string" ? request.otp.trim() : "";
        if (!/^\d{4,8}$/.test(otp)) {
            sendResponse({ status: "failed", filled: false });
            return;
        }

        let targetInput = null;
        const active = document.activeElement;
        if (active && active.tagName === "INPUT" && !active.disabled && !active.readOnly && active.type !== "hidden") {
            const activeAttrs = `${active.name || ""} ${active.id || ""} ${active.placeholder || ""} ${active.getAttribute("aria-label") || ""}`.toLowerCase();
            if (/code|kod|otp|pin|verify|onay|doğrula|dogrula|token/.test(activeAttrs) || /number|tel/.test(active.type)) {
                targetInput = active;
            }
        }

        if (!targetInput) {
            const inputs = Array.from(document.querySelectorAll("input")).filter(i => {
                const type = i.type.toLowerCase();
                return ["text", "number", "tel"].includes(type) && i.offsetParent !== null && !i.disabled && !i.readOnly;
            });
            const matches = inputs.filter(i => /code|kod|otp|pin|verify|onay|doğrula|dogrula|token/.test(
                `${i.name || ""} ${i.id || ""} ${i.placeholder || ""} ${i.getAttribute("aria-label") || ""}`.toLowerCase()
            ));
            if (matches.length === 1) targetInput = matches[0];
        }

        if (targetInput) {
            targetInput.focus();
            targetInput.value = otp;
            targetInput.dispatchEvent(new Event("input", { bubbles: true }));
            targetInput.dispatchEvent(new Event("change", { bubbles: true }));
            sendResponse({ status: "success", filled: true });
        } else {
            sendResponse({ status: "failed", filled: false });
        }
    }
});
