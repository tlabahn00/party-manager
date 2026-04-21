const TOKEN_KEY = 'pm_token';
function getToken()    { return localStorage.getItem(TOKEN_KEY); }
function setToken(t)   { localStorage.setItem(TOKEN_KEY, t); }
function removeToken() { localStorage.removeItem(TOKEN_KEY); }

function isLoggedIn() {
    const t = getToken();
    if (!t) return false;
    try {
        const p = JSON.parse(atob(t.split('.')[1]));
        return p.exp * 1000 > Date.now();
    } catch { return false; }
}
function requireAuth() { if (!isLoggedIn()) window.location.href = '/index.html'; }
function logout()      { removeToken(); window.location.href = '/index.html'; }

// Auto-Logout nach 30 Min Inaktivität
let _timer;
function _reset() {
    clearTimeout(_timer);
    _timer = setTimeout(() => { if (isLoggedIn()) { logout(); } }, 30 * 60 * 1000);
}
['mousemove','keypress','click','touchstart'].forEach(e => document.addEventListener(e, _reset));
_reset();
