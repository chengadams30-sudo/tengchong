/**
 * 通用工具：提示消息、转义、防 XSS、登录态
 */
(() => {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showMessage(text, type = "success") {
    const existing = document.querySelector(".feedback-message");
    if (existing) existing.remove();

    const msg = document.createElement("div");
    msg.className = `feedback-message feedback-${type}`;
    msg.textContent = text;
    msg.style.cssText = `
      position: fixed;
      top: 92px;
      left: 50%;
      transform: translateX(-50%);
      padding: 14px 22px;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      z-index: 9999;
      max-width: calc(100vw - 32px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.18);
      animation: feedbackFadeIn 0.25s ease;
    `;
    msg.style.background = type === "success" ? "#2d7a5a" : "#c0392b";

    document.body.appendChild(msg);

    window.setTimeout(() => {
      msg.style.opacity = "0";
      msg.style.transition = "opacity 0.25s";
      window.setTimeout(() => msg.remove(), 250);
    }, 2600);
  }

  function formatDateTime(ts) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString("zh-CN");
    } catch {
      return "";
    }
  }

  const AUTH_KEY = "tc_auth";

  function getAuth() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setAuth(auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    window.dispatchEvent(new CustomEvent("tc-auth-changed"));
  }

  function clearAuth() {
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new CustomEvent("tc-auth-changed"));
  }

  function requireLogin(redirectTo = location.href) {
    const auth = getAuth();
    // 兼容两种登录态：
    // 1) token 登录（Bearer）
    // 2) 仅保存 user（你的后端 login-user 返回 data:user）
    if (auth && (auth.token || auth.user)) return auth;
    location.href = `auth.html?redirect=${encodeURIComponent(redirectTo)}`;
    return null;
  }

  window.TCUtils = {
    escapeHtml,
    showMessage,
    formatDateTime,
    getAuth,
    setAuth,
    clearAuth,
    requireLogin,
  };
})();

