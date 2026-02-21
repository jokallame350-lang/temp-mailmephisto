// background.js
const API_BASE = "https://api.mail.gw";

chrome.runtime.onInstalled.addListener(() => {
    // Create Context Menu for easy insertion
    chrome.contextMenus.create({
        id: "insert-mephisto",
        title: "Insert MephistoMail Address",
        contexts: ["editable"] // Only shows up when right-clicking on input fields/textareas
    });

    // Setup alarm for inbox checking every minute
    chrome.alarms.create("checkInbox", { periodInMinutes: 1 });
});

// Handle Context Menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "insert-mephisto" && tab.id) {
        chrome.storage.local.get(["mephistoAccount"], (result) => {
            const account = result.mephistoAccount;
            if (account && account.address) {
                // Send address to content script to type it in
                chrome.tabs.sendMessage(tab.id, {
                    action: "insertEmail",
                    email: account.address
                });
            } else {
                // Notify user they need to create an account first
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "../popup.html",
                    title: "MephistoMail Error",
                    message: "No active email found. Please click the extension icon to generate one first."
                });
            }
        });
    }
});

// Background polling for unread messages
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "checkInbox") {
        checkNewEmails();
    }
});

async function checkNewEmails() {
    chrome.storage.local.get(["mephistoAccount"], async (result) => {
        const acc = result.mephistoAccount;
        if (!acc || !acc.token) return;

        try {
            const res = await fetch(`${API_BASE}/messages`, {
                headers: { "Authorization": `Bearer ${acc.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Calculate unseen count
                const unseen = data['hydra:member'].filter(m => !m.isDeleted).length; // For simplicity, just count total non-deleted 
                // Real logic usually tracks "seen" state, but badge text is simple

                if (unseen > 0) {
                    chrome.action.setBadgeText({ text: unseen.toString() });
                    chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
                } else {
                    chrome.action.setBadgeText({ text: "" });
                }
            }
        } catch (err) {
            console.error("MephistoMail auto-check failed", err);
        }
    });
}
