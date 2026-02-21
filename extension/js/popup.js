const API_URL = "https://api.mail.gw";

// State
let currentAccount = null;
let pollInterval = null;
let knownMessageIds = new Set();
let isFirstFetch = true;

// DOM Elements
const stateLoading = document.getElementById("stateLoading");
const stateNoAccount = document.getElementById("stateNoAccount");
const stateActive = document.getElementById("stateActive");
const stateMessageDetail = document.getElementById("stateMessageDetail");

const btnCreate = document.getElementById("btnCreate");
const emailAddressInput = document.getElementById("emailAddress");
const btnCopy = document.getElementById("btnCopy");
const btnRefresh = document.getElementById("btnRefresh");
const btnDelete = document.getElementById("btnDelete");
const msgCount = document.getElementById("msgCount");
const messageList = document.getElementById("messageList");
const btnBackToInbox = document.getElementById("btnBackToInbox");

const detailFrom = document.getElementById("detailFrom");
const detailSubject = document.getElementById("detailSubject");
const detailLoading = document.getElementById("detailLoading");
const detailFrame = document.getElementById("detailFrame");

// Helpers
const showState = (stateNode) => {
    stateLoading.classList.add("hidden");
    stateNoAccount.classList.add("hidden");
    stateActive.classList.add("hidden");
    stateMessageDetail.classList.add("hidden");
    stateNode.classList.remove("hidden");
};

const generateRandomString = (length = 10) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
};

const extractOTP = (text) => {
    if (!text) return null;
    const match = text.match(/\b\d{4,8}\b|\b[A-Z0-9]{6}\b/);
    return match ? match[0] : null;
};

// API Functions
const createAccount = async () => {
    showState(stateLoading);
    try {
        const domainRes = await fetch(`${API_URL}/domains`);
        const domainsData = await domainRes.json();
        const domain = domainsData['hydra:member'][0].domain;

        const address = `${generateRandomString()}@${domain}`;
        const password = generateRandomString(12);

        const accRes = await fetch(`${API_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });
        const accData = await accRes.json();
        if (!accRes.ok) throw new Error(accData.message || "Failed to create account");

        const tokenRes = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ address, password })
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error("Failed to authenticate");

        currentAccount = {
            id: accData.id,
            address,
            password,
            token: tokenData.token
        };

        chrome.storage.local.set({ mephistoAccount: currentAccount }, () => {
            isFirstFetch = true;
            knownMessageIds.clear();
            renderActiveState();
            fetchMessages();
            startPolling();
        });
    } catch (err) {
        console.error("Account creation failed:", err);
        showState(stateNoAccount);
    }
};

const deleteAccount = async () => {
    if (!currentAccount) return;
    showState(stateLoading);
    stopPolling();
    try {
        await fetch(`${API_URL}/accounts/${currentAccount.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentAccount.token}` }
        });
    } catch (err) { }

    chrome.storage.local.remove(["mephistoAccount"], () => {
        currentAccount = null;
        chrome.action.setBadgeText({ text: "" });
        showState(stateNoAccount);
    });
};

const fetchMessages = async () => {
    if (!currentAccount) return;
    try {
        const res = await fetch(`${API_URL}/messages`, {
            headers: { 'Authorization': `Bearer ${currentAccount.token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const activeMsgs = data['hydra:member'].filter(m => !m.isDeleted);
            renderMessages(activeMsgs);
        }
    } catch (err) { }
};

const fetchMessageDetail = async (id) => {
    detailLoading.classList.remove("hidden");
    detailFrame.classList.add("hidden");
    showState(stateMessageDetail);

    try {
        const res = await fetch(`${API_URL}/messages/${id}`, {
            headers: { 'Authorization': `Bearer ${currentAccount.token}` }
        });
        if (res.ok) {
            const msg = await res.json();
            detailFrom.innerText = `From: ${msg.from.name || ''} <${msg.from.address}>`;
            detailSubject.innerText = msg.subject;

            const doc = detailFrame.contentWindow.document;
            doc.open();
            // Injecting basic text/html safely inside the iframe sandbox
            doc.write(msg.html ? msg.html[0] : `<pre style="white-space:pre-wrap; font-family:sans-serif; padding:12px;">${msg.text || ''}</pre>`);
            doc.close();

            detailLoading.classList.add("hidden");
            detailFrame.classList.remove("hidden");
        }
    } catch (err) {
        detailLoading.innerText = "Error loading message.";
    }
};

// Rendering
const renderActiveState = () => {
    showState(stateActive);
    emailAddressInput.value = currentAccount.address;
};

const renderMessages = (activeMsgs) => {
    msgCount.innerText = activeMsgs.length;
    chrome.action.setBadgeText({ text: activeMsgs.length > 0 ? activeMsgs.length.toString() : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });

    if (activeMsgs.length === 0) {
        messageList.innerHTML = `<li class="empty-state">No emails yet. Waiting for victims...</li>`;
        return;
    }

    messageList.innerHTML = "";
    activeMsgs.forEach(msg => {
        const li = document.createElement("li");
        li.className = "msg-item";

        // Extract OTP for interactive copy button
        const otpMatch = extractOTP(msg.subject) || extractOTP(msg.intro);

        const copyButtonHTML = otpMatch
            ? `<button class="btn-icon copy-otp-btn" data-otp="${otpMatch}" title="Copy OTP" style="padding:4px 8px; border:1px solid var(--border-color); border-radius:6px; font-size:12px; font-weight:600; background:var(--bg-dark); color:var(--text-primary); transition:all 0.2s;">Copy ${otpMatch}</button>`
            : '';

        li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
         <div style="flex:1; min-width:0; overflow:hidden;">
           <div class="msg-from">${msg.from.name || msg.from.address}</div>
           <div class="msg-subject" style="max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${msg.subject}</div>
         </div>
         ${copyButtonHTML}
      </div>
    `;

        // Click handler for viewing message or clicking the copy OTP button
        li.addEventListener('click', (e) => {
            // Don't open mail detail if clicked on copy OTP
            const copyBtn = e.target.closest('.copy-otp-btn');
            if (copyBtn) {
                navigator.clipboard.writeText(copyBtn.dataset.otp);
                const prevHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = `<svg style="width:14px;height:14px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied`;
                copyBtn.style.color = "#22c55e";
                setTimeout(() => {
                    copyBtn.innerHTML = prevHtml;
                    copyBtn.style.color = "var(--text-primary)";
                }, 1500);
                return; // exit
            }

            // otherwise, view the email details
            fetchMessageDetail(msg.id);
        });

        messageList.appendChild(li);
    });
};

const startPolling = () => {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => {
        fetchMessages();
    }, 3000);
};

const stopPolling = () => {
    if (pollInterval) clearInterval(pollInterval);
};

// Event Listeners
btnCreate.addEventListener('click', createAccount);
btnDelete.addEventListener('click', deleteAccount);
btnBackToInbox.addEventListener('click', renderActiveState);
btnRefresh.addEventListener('click', () => {
    const icon = btnRefresh.querySelector("svg");
    icon.classList.add("spinner");
    fetchMessages().finally(() => icon.classList.remove("spinner"));
});
btnCopy.addEventListener('click', () => {
    if (currentAccount && currentAccount.address) {
        navigator.clipboard.writeText(currentAccount.address);
        const originalSvg = btnCopy.innerHTML;
        btnCopy.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => { btnCopy.innerHTML = originalSvg; }, 1500);
    }
});

// Initialization
chrome.storage.local.get(["mephistoAccount"], (result) => {
    if (result.mephistoAccount && result.mephistoAccount.token) {
        currentAccount = result.mephistoAccount;
        renderActiveState();
        fetchMessages();
        startPolling();
    } else {
        showState(stateNoAccount);
    }
});
