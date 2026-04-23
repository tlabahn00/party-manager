const BASE = '';
let _cfg = null;

async function apiFetch(path, opts = {}) {
    const token = getToken();
    const res = await fetch(BASE + path, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
            ...(opts.headers || {})
        }
    });
    if (res.status === 401) { logout(); return null; }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'HTTP ' + res.status);
    }
    return res.json();
}

async function loadConfig() {
    if (!_cfg) _cfg = await apiFetch('/api/config');
    return _cfg;
}

function formatDate(s) {
    if (!s) return '–';
    return new Date(s).toLocaleString('de-DE', {
        day:'2-digit', month:'2-digit', year:'numeric',
        hour:'2-digit', minute:'2-digit'
    });
}

function formatEuro(v) {
    return Number(v || 0).toLocaleString('de-DE', { style:'currency', currency:'EUR' });
}

function showToast(msg, type = 'error') {
    let el = document.getElementById('pm-toast');
    if (!el) { el = document.createElement('div'); el.id = 'pm-toast'; document.body.appendChild(el); }
    const colors = {
        error:   { bg:'#fde8e8', color:'#a02020', border:'#f8c0c0' },
        success: { bg:'#e0f5ea', color:'#1a7a44', border:'#a8dfc0' },
        warning: { bg:'#fef3d4', color:'#9a6800', border:'#f5d880' },
        info:    { bg:'#e0eeff', color:'#1050a0', border:'#a0c8ff' }
    };
    const c = colors[type] || colors.error;
    Object.assign(el.style, {
        background: c.bg, color: c.color,
        border: '1.5px solid ' + c.border,
        display: 'block'
    });
    el.textContent = msg;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = 'none'; }, 4500);
}

function statusBadge(s) {
    const m = { OFFEN:'warning', BEZAHLT:'success', STORNIERT:'danger' };
    return `<span class="badge badge-${m[s]||'light'}">${s}</span>`;
}
function typBadge(t) {
    const m = { STANDARD:'info', ABENDKASSE:'purple', MITGLIED:'success' };
    return `<span class="badge badge-${m[t]||'light'}">${t}</span>`;
}