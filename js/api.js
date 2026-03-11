/**
 * 统一 API 调用封装（axios）
 */
(() => {
  // 可配置：localStorage 里设置 tc_base_url
  // - 推荐值（根地址）：https://mpp24fkiwk.sealoshzh.site
  // - 如果你只有单一接口也可写全路径，例如：https://mpp24fkiwk.sealoshzh.site/user-db
  const DEFAULT_BASE_URL = "https://mpp24fkiwk.sealoshzh.site";

  function getBaseUrl() {
    try {
      return localStorage.getItem("tc_base_url") || DEFAULT_BASE_URL;
    } catch {
      return DEFAULT_BASE_URL;
    }
  }

  function joinUrl(base, path) {
    if (!path) return base;
    // 允许直接传绝对 URL
    if (/^https?:\/\//i.test(path)) return path;
    if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
    if (!base.endsWith("/") && !path.startsWith("/")) return base + "/" + path;
    return base + path;
  }

  async function post(path, data, options = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});

    const auth = window.TCUtils && window.TCUtils.getAuth ? window.TCUtils.getAuth() : null;
    if (auth && auth.token) headers.Authorization = `Bearer ${auth.token}`;

    const baseUrl = getBaseUrl();
    const url = joinUrl(baseUrl, path);

    try {
      const res = await axios.post(url, data, {
        headers,
        timeout: options.timeout || 10000,
      });
      return res && res.data ? res.data : {};
    } catch (err) {
      // 尽量把“真实原因”返回给页面展示
      const e = err || {};
      const resp = e.response;
      if (resp) {
        const payload = resp.data || {};
        const msg =
          payload.error ||
          payload.msg ||
          `服务器返回错误：HTTP ${resp.status}${resp.statusText ? " " + resp.statusText : ""}`;
        return { error: msg, _debug: { status: resp.status, url } };
      }

      // 多数情况：CORS 被拦截 / file:// 直接打开 / 网络断开
      const m = e.message || "";
      return {
        error: `网络错误：${m || "请求被拦截或服务器不可达"}（建议用本地服务器方式打开页面，而不是直接双击 html）`,
        _debug: { url },
      };
    }
  }

  window.TCApi = { BASE_URL: DEFAULT_BASE_URL, post, getBaseUrl };
})();

