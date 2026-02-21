// content.js
// Listens for context menu events and inserts the MephistoMail address or OTP.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "insertEmail") {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
            activeElement.value = request.email;
            activeElement.dispatchEvent(new Event("input", { bubbles: true }));
            activeElement.dispatchEvent(new Event("change", { bubbles: true }));
            console.log("[MephistoMail] Temp email injected cleanly.");
            sendResponse({ status: "success" });
        } else {
            console.warn("[MephistoMail] Active element is not an input field. Can't inject.");
            sendResponse({ status: "failed", reason: "no input selected" });
        }
    }
    else if (request.action === "autoFillOTP") {
        const otp = request.otp;
        console.log("[MephistoMail] Received OTP from extension:", otp);

        let targetInput = null;

        // Check if the currently focused element is an input
        const active = document.activeElement;
        if (active && active.tagName === "INPUT") {
            targetInput = active;
        }
        // Fallback search
        if (!targetInput) {
            const inputs = document.querySelectorAll("input");
            for (const input of inputs) {
                const nameAndId = (input.name + " " + input.id).toLowerCase();
                if (
                    nameAndId.includes("code") ||
                    nameAndId.includes("otp") ||
                    nameAndId.includes("pin") ||
                    nameAndId.includes("verify") ||
                    nameAndId.includes("verification")
                ) {
                    if (input.type !== "hidden" && input.style.display !== "none" && input.type !== "submit") {
                        targetInput = input;
                        break;
                    }
                }
            }
        }

        if (targetInput) {
            targetInput.focus();
            targetInput.value = otp;
            targetInput.dispatchEvent(new Event("input", { bubbles: true }));
            targetInput.dispatchEvent(new Event("change", { bubbles: true }));
            console.log("[MephistoMail] OTP Auto-Filled!");

            // Sometimes OTPs are automatically submitted on React forms when filled. 
            sendResponse({ status: "success", filled: true });
        } else {
            console.warn("[MephistoMail] Could not find any OTP field to fill.");
            sendResponse({ status: "failed", filled: false });
        }
    }
});
