document.addEventListener("DOMContentLoaded", () => {
  const tabs = Array.from(document.querySelectorAll(".auth-tab"));
  const panels = Array.from(document.querySelectorAll(".auth-panel"));

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loggedInBox = document.getElementById("loggedInBox");
  const loggedInUser = document.getElementById("loggedInUser");
  const logoutBtn = document.getElementById("logoutBtn");

  const redirect = new URLSearchParams(location.search).get("redirect") || "moments.html";

  function setTab(name) {
    tabs.forEach((t) => {
      const active = t.getAttribute("data-tab") === name;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach((p) => {
      const isTarget = p.getAttribute("data-panel") === name;
      p.style.display = isTarget ? "" : "none";
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => setTab(t.getAttribute("data-tab"))));

  function updateLoggedInUI() {
    const auth = window.TCUtils.getAuth() || null;
    const isLogin = !!(auth && (auth.token || auth.user));
    if (!loggedInBox) return;
    loggedInBox.style.display = isLogin ? "" : "none";

    if (isLogin && loggedInUser) {
      const u = auth.user || {};
      const name = u.name || u.username || "用户";
      loggedInUser.textContent = `用户：${name}`;
    }

    // 已登录时不显示登录/注册表单（只保留退出按钮）
    if (isLogin) {
      const tabsEl = document.querySelector(".auth-tabs");
      if (tabsEl) tabsEl.style.display = "none";
      panels.forEach((p) => (p.style.display = "none"));
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.TCUtils.clearAuth();
      window.TCUtils.showMessage("已退出登录", "success");
      // 退出后回到登录页
      location.href = "auth.html";
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = (document.getElementById("loginUsername")?.value || "").trim();
    const password = (document.getElementById("loginPassword")?.value || "").trim();

    if (!username) return window.TCUtils.showMessage("请输入用户名", "error");
    if (!password || password.length < 6) return window.TCUtils.showMessage("密码不能小于6位", "error");

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const oldText = submitBtn.textContent;
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "登录中...";

      // 直接对接后台：/login-user
      const data = await window.TCApi.post("/login-user", { username, password });
      if (data.error) return window.TCUtils.showMessage(data.error, "error");
      if (!data.ok) return window.TCUtils.showMessage(data.msg || "登录失败", "error");

      const user = data.data || data.user || { username };
      window.TCUtils.setAuth({
        // 兼容：有 token 就存 token；没有 token 也允许只存 user
        token: data.token || "",
        user,
      });
      window.TCUtils.showMessage("登录成功", "success");
      updateLoggedInUI();
      window.setTimeout(() => (location.href = redirect), 400);
    } catch (err) {
      console.error(err);
      window.TCUtils.showMessage("网络错误或服务器异常", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = oldText;
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const username = (document.getElementById("regUsername")?.value || "").trim();
    const password = (document.getElementById("regPassword")?.value || "").trim();

    if (!username) return window.TCUtils.showMessage("请输入用户名", "error");
    if (!password || password.length < 6) return window.TCUtils.showMessage("密码不能小于6位", "error");

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const oldText = submitBtn.textContent;
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "注册中...";

      const data = await window.TCApi.post("/register-user", {
        username,
        password,
      });
      if (data.error) return window.TCUtils.showMessage(data.error, "error");
      if (!data.ok) return window.TCUtils.showMessage(data.msg || "注册失败", "error");

      window.TCUtils.showMessage("注册成功，请使用账号登录", "success");
      setTab("login");
      const loginUsername = document.getElementById("loginUsername");
      const loginPassword = document.getElementById("loginPassword");
      if (loginUsername) loginUsername.value = username;
      if (loginPassword) loginPassword.value = password;
    } catch (err) {
      console.error(err);
      window.TCUtils.showMessage("网络错误或服务器异常", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = oldText;
    }
  }

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (registerForm) registerForm.addEventListener("submit", handleRegister);

  window.addEventListener("tc-auth-changed", updateLoggedInUI);
  updateLoggedInUI();
});

