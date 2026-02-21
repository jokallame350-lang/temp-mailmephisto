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
        if (active && active.tagName === "INPUT" && active.type !== "hidden") {
            targetInput = active;
        }

        if (!targetInput) {
            // Find all text/number inputs that are visually present
            const inputs = Array.from(document.querySelectorAll("input")).filter(i => {
                const type = i.type.toLowerCase();
                return (type === "text" || type === "number" || type === "tel" || type === "") &&
                    i.offsetParent !== null; // element is visually rendered
            });

            // 1. Check for specific keywords in attributes
            for (const input of inputs) {
                const attrs = (
                    (input.name || "") + " " +
                    (input.id || "") + " " +
                    (input.placeholder || "") + " " +
                    (input.getAttribute("aria-label") || "")
                ).toLowerCase();

                // This covers Turkish "onay kodu" (Instagram screenshot default) 
                // as well as international options like code, otp, verify.
                if (
                    attrs.includes("code") || attrs.includes("kod") ||
                    attrs.includes("otp") || attrs.includes("pin") ||
                    attrs.includes("verify") || attrs.includes("onay") ||
                    attrs.includes("doğrula") || attrs.includes("dogrula") ||
                    attrs.includes("token")
                ) {
                    targetInput = input;
                    break;
                }
            }

            // 2. Fallback: if there's exactly 1 visible type=tel or type=number on the screen, just fill it.
            if (!targetInput) {
                const numberInputs = inputs.filter(i => i.type.toLowerCase() === 'number' || i.type.toLowerCase() === 'tel');
                if (numberInputs.length === 1) targetInput = numberInputs[0];
            }

            // 3. Last resort: if there's exactly 1 empty visible text input on the entire page
            if (!targetInput) {
                const emptyInputs = inputs.filter(i => i.value === "" && i.type !== "submit" && i.type !== "button");
                if (emptyInputs.length === 1) targetInput = emptyInputs[0];
            }
        }

        if (targetInput) {
            targetInput.focus();
            targetInput.value = otp;

            // React / Vue / Angular change execution hacks
            // Simulating manual typing essentially
            targetInput.dispatchEvent(new Event("input", { bubbles: true }));
            targetInput.dispatchEvent(new Event("change", { bubbles: true }));
            targetInput.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));

            console.log("[MephistoMail] OTP Auto-Filled!");
            sendResponse({ status: "success", filled: true });
        } else {
            console.warn("[MephistoMail] Could not find any OTP field to fill.");
            sendResponse({ status: "failed", filled: false });
        }
    }

    // Return true to keep message channel open for async responses if needed
    return true;
});
