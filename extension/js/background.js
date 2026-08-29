const API_BASE = "https://api.mail.gw";
const WEB_ORIGIN = "https://mephistomail.site";

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "insert-mephisto",
        title: "Insert MephistoMail Address",
        contexts: ["editable"]
    });
    chrome.alarms.create("checkInbox", { periodInMinutes: 1 });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "insert-mephisto" || !tab?.id) return;
    const [{ result: isAllowed }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => Boolean(document.activeElement &&
            (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") &&
            !document.activeElement.readOnly && !document.activeElement.disabled)
    }).catch(() => [{ result: false }]);
    if (!isAllowed) return;

    chrome.storage.local.get(["mephistoAccount"], (result) => {
        const account = result.mephistoAccount;
        if (account?.address) {
            chrome.tabs.sendMessage(tab.id, { action: "insertEmail", email: account.address }).catch(() => {});
        } else {
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icons/icon128.png",
                title: "MephistoMail",
                message: "Create an active mailbox first."
            });
        }
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkInbox") checkNewEmails();
});

async function checkNewEmails() {
    chrome.storage.local.get(["mephistoAccount"], async (result) => {
        const acc = result.mephistoAccount;
        if (!acc?.token) return;
        try {
            const res = await fetch(`${API_BASE}/messages`, {
                headers: { "Authorization": `Bearer ${acc.token}`, "Accept": "application/ld+json" }
            });
            if (!res.ok) return;
            const data = await res.json();
            const messages = Array.isArray(data?.["hydra:member"]) ? data["hydra:member"] : [];
            const unread = messages.filter(m => m.seen === false || m.seen === undefined).length;
            chrome.action.setBadgeText({ text: unread > 0 ? String(Math.min(unread, 99)) : "" });
        } catch {}
    });
}
