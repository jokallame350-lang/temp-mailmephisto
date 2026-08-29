const API_URL = "https://api.mail.gw";

let currentAccount = null;
let pollInterval = null;
let knownMessageIds = new Set();
let isFirstFetch = true;

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

const showState = (stateNode) => {
    stateLoading.classList.add("hidden");
    stateNoAccount.classList.add("hidden");
    stateActive.classList.add("hidden");
    stateMessageDetail.classList.add("hidden");
    stateNode.classList.remove("hidden");
};

const generateRandomString = (length = 10) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, value => chars[value % chars.length]).join("");
};

const extractOTP = (text) => {
    if (!text) return null;
    const match = String(text).match(/\b\d{4,8}\b|\b[A-Z0-9]{6}\b/);
    return match ? match[0] : null;
};

const createAccount = async () => {
    showState(stateLoading);
    try {
        const domainRes = await fetch(`${API_URL}/domains`);
        if (!domainRes.ok) throw new Error("Failed to load domains");
        const domainsData = await domainRes.json();
        const members = domainsData['hydra:member'];
        if (!Array.isArray(members) || !members[0]?.domain) throw new Error("No domain available");
        const domain = members[0].domain;
        const address = `${generateRandomString()}@${domain}`;
        const password = generateRandomString(18);

        const accRes = await fetch(`${API_URL}/accounts`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });
        const accData = await accRes.json().catch(() => ({}));
        if (!accRes.ok) throw new Error(accData.message || "Failed to create account");

        const tokenRes = await fetch(`${API_URL}/token`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ address, password })
        });
        const tokenData = await tokenRes.json().catch(() => ({}));
        if (!tokenRes.ok || !tokenData.token) throw new Error("Failed to authenticate");

        currentAccount = { id: accData.id, address, password, token: tokenData.token };
        await chrome.storage.session.set({ mephistoAccount: currentAccount });
        isFirstFetch = true;
        knownMessageIds.clear();
        renderActiveState();
        fetchMessages();
        startPolling();
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
        await fetch(`${API_URL}/accounts/${encodeURIComponent(currentAccount.id)}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${currentAccount.token}` }
        });
    } catch (err) { console.warn("Account deletion request failed", err); }
    await chrome.storage.session.remove(["mephistoAccount"]);
    currentAccount = null;
    chrome.action.setBadgeText({ text: "" });
    showState(stateNoAccount);
};

const fetchMessages = async () => {
    if (!currentAccount) return;
    try {
        const res = await fetch(`${API_URL}/messages`, { headers: { 'Authorization': `Bearer ${currentAccount.token}` } });
        if (res.ok) {
            const data = await res.json();
            const activeMsgs = Array.isArray(data['hydra:member']) ? data['hydra:member'].filter(m => !m.isDeleted) : [];
            renderMessages(activeMsgs);
        }
    } catch (err) { console.warn("Message fetch failed", err); }
};

const fetchMessageDetail = async (id) => {
    detailLoading.classList.remove("hidden");
    detailFrame.classList.add("hidden");
    showState(stateMessageDetail);
    try {
        const res = await fetch(`${API_URL}/messages/${encodeURIComponent(id)}`, { headers: { 'Authorization': `Bearer ${currentAccount.token}` } });
        if (!res.ok) throw new Error("Unable to load message");
        const msg = await res.json();
        detailFrom.textContent = `From: ${msg.from?.name || ''} <${msg.from?.address || ''}>`;
        detailSubject.textContent = msg.subject || '';

        const doc = detailFrame.contentDocument;
        if (!doc) throw new Error("Message frame unavailable");
        doc.open();
        const body = msg.html?.[0] || `<pre style="white-space:pre-wrap;font-family:sans-serif;padding:12px;"></pre>`;
        doc.write(`<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline';"><style>body{font-family:sans-serif;padding:12px;word-break:break-word}img{max-width:100%;height:auto}</style></head><body></body></html>`);
        doc.close();
        const bodyNode = doc.body;
        if (msg.html?.[0]) {
            const template = doc.createElement('template');
            template.innerHTML = String(body);
            template.content.querySelectorAll('script,iframe,object,embed,form,input,textarea,button').forEach(node => node.remove());
            template.content.querySelectorAll('*').forEach(node => {
                [...node.attributes].forEach(attr => {
                    if (/^on/i.test(attr.name) || /^(javascript|data|file|blob|chrome|resource):/i.test(attr.value.trim())) node.removeAttribute(attr.name);
                });
            });
            bodyNode.replaceChildren(template.content.cloneNode(true));
        } else {
            const pre = doc.createElement('pre');
            pre.style.cssText = 'white-space:pre-wrap;font-family:sans-serif;padding:12px;';
            pre.textContent = msg.text || '';
            bodyNode.replaceChildren(pre);
        }
        detailLoading.classList.add("hidden");
        detailFrame.classList.remove("hidden");
    } catch (err) {
        detailLoading.textContent = "Error loading message.";
    }
};

const renderActiveState = () => {
    showState(stateActive);
    emailAddressInput.value = currentAccount?.address || '';
};

const renderMessages = (activeMsgs) => {
    msgCount.textContent = String(activeMsgs.length);
    chrome.action.setBadgeText({ text: activeMsgs.length > 0 ? String(activeMsgs.length) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
    messageList.replaceChildren();
    if (activeMsgs.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.textContent = 'No emails yet. Waiting for email...';
        messageList.appendChild(empty);
        return;
    }

    activeMsgs.forEach(msg => {
        const li = document.createElement("li");
        li.className = "msg-item";
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;';
        const textWrap = document.createElement('div');
        textWrap.style.cssText = 'flex:1;min-width:0;overflow:hidden;';
        const from = document.createElement('div');
        from.className = 'msg-from';
        from.textContent = msg.from?.name || msg.from?.address || 'Unknown sender';
        const subject = document.createElement('div');
        subject.className = 'msg-subject';
        subject.style.cssText = 'max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        subject.textContent = msg.subject || '(No subject)';
        textWrap.append(from, subject);
        row.appendChild(textWrap);

        const otpMatch = extractOTP(msg.subject) || extractOTP(msg.intro);
        if (otpMatch) {
            const copyButton = document.createElement('button');
            copyButton.className = 'btn-icon copy-otp-btn';
            copyButton.type = 'button';
            copyButton.textContent = `Copy ${otpMatch}`;
            copyButton.dataset.otp = otpMatch;
            copyButton.title = 'Copy OTP';
            copyButton.style.cssText = 'padding:4px 8px;border:1px solid var(--border-color);border-radius:6px;font-size:12px;font-weight:600;background:var(--bg-dark);color:var(--text-primary);transition:all .2s;';
            row.appendChild(copyButton);
        }
        li.appendChild(row);
        li.addEventListener('click', async (e) => {
            const copyBtn = e.target.closest('.copy-otp-btn');
            if (copyBtn) {
                try { await navigator.clipboard.writeText(copyBtn.dataset.otp || ''); } catch {}
                const previous = copyBtn.textContent;
                copyBtn.textContent = 'Copied';
                copyBtn.style.color = 'var(--success, #22c55e)';
                setTimeout(() => { copyBtn.textContent = previous; copyBtn.style.color = 'var(--text-primary)'; }, 1500);
                return;
            }
            fetchMessageDetail(msg.id);
        });
        messageList.appendChild(li);
    });
};

const startPolling = () => {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(fetchMessages, 5000);
};
const stopPolling = () => { if (pollInterval) clearInterval(pollInterval); };

btnCreate.addEventListener('click', createAccount);
btnDelete.addEventListener('click', deleteAccount);
btnBackToInbox.addEventListener('click', renderActiveState);
btnRefresh.addEventListener('click', () => {
    const icon = btnRefresh.querySelector("svg");
    icon?.classList.add("spinner");
    fetchMessages().finally(() => icon?.classList.remove("spinner"));
});
btnCopy.addEventListener('click', async () => {
    if (!currentAccount?.address) return;
    try { await navigator.clipboard.writeText(currentAccount.address); } catch {}
    const original = btnCopy.innerHTML;
    btnCopy.textContent = 'Copied';
    setTimeout(() => { btnCopy.innerHTML = original; }, 1500);
});

chrome.storage.session.get(["mephistoAccount"]).then(result => {
    if (result.mephistoAccount?.token) {
        currentAccount = result.mephistoAccount;
        renderActiveState();
        fetchMessages();
        startPolling();
    } else {
        showState(stateNoAccount);
    }
}).catch(() => showState(stateNoAccount));
