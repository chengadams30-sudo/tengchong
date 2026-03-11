document.addEventListener("DOMContentLoaded", () => {
  const goLoginBtn = document.getElementById("goLoginBtn");
  const publishBtn = document.getElementById("publishBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const listEl = document.getElementById("momentsList");
  const form = document.getElementById("momentForm");
  const textEl = document.getElementById("momentText");
  const imagesEl = document.getElementById("momentImages");
  const previewEl = document.getElementById("imagePreview");

  let selectedFiles = [];
  let previews = [];

  function updateComposeState() {
    const a = window.TCUtils.getAuth();
    const isLogin = !!(a && (a.token || a.user));
    goLoginBtn.style.display = isLogin ? "none" : "";
    publishBtn.disabled = !isLogin;
    publishBtn.style.opacity = isLogin ? "1" : "0.6";
    publishBtn.style.cursor = isLogin ? "pointer" : "not-allowed";
  }

  function renderPreview() {
    previewEl.innerHTML = "";
    previews.forEach((src, idx) => {
      const wrap = document.createElement("div");
      wrap.className = "moments-preview-item";
      wrap.innerHTML = `
        <img src="${src}" alt="预览图" />
        <button type="button" class="moments-preview-remove" data-idx="${idx}" aria-label="移除图片">×</button>
      `;
      previewEl.appendChild(wrap);
    });
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function compressImageToJpegDataUrl(file, maxW = 1280, quality = 0.78) {
    const dataUrl = await fileToDataUrl(file);
    const img = new Image();
    img.src = dataUrl;
    await new Promise((r, j) => {
      img.onload = r;
      img.onerror = j;
    });

    const ratio = Math.min(1, maxW / img.width);
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  }

  async function loadList() {
    listEl.innerHTML = `<div class="moments-empty">加载中…</div>`;
    const auth = window.TCUtils.getAuth() || null;
    const data = await window.TCApi.post("/moments", {
      action: "list",
      limit: 30,
      // 让后端按当前用户过滤，只返回“自己的动态”
      user: auth && (auth.user || null),
    });
    if (data.error) {
      listEl.innerHTML = `<div class="moments-empty">${window.TCUtils.escapeHtml(data.error)}</div>`;
      return;
    }
    const list = Array.isArray(data.data) ? data.data : [];
    renderList(list);
  }

  function renderList(list) {
    listEl.innerHTML = "";
    if (!list.length) {
      listEl.innerHTML = `<div class="moments-empty">还没有动态，快来发布第一条吧。</div>`;
      return;
    }

    const auth = window.TCUtils.getAuth() || {};
    const me = auth.user || {};
    const myUsername = me.username || "";
    const myUserId = me._id || me.id || "";

    list.forEach((m) => {
      const card = document.createElement("div");
      card.className = "moment-card";

      const name = window.TCUtils.escapeHtml(m.userName || m.username || "匿名用户");
      const time = window.TCUtils.escapeHtml(window.TCUtils.formatDateTime(m.createTime));
      const text = window.TCUtils.escapeHtml(m.text || "");
      const imgs = Array.isArray(m.images) ? m.images : [];
      const momentId = m._id || m.id || "";
      const isMine =
        (myUserId && String(m.userId || "") === String(myUserId)) ||
        (myUsername && String(m.username || "") === String(myUsername));

      const imgsHtml = imgs.length
        ? `<div class="moment-images">${imgs
            .slice(0, 9)
            .map((src) => `<img src="${src}" alt="动态图片" loading="lazy" />`)
            .join("")}</div>`
        : "";

      card.innerHTML = `
        <div class="moment-head">
          <div class="moment-user">
            <div class="moment-avatar">${name.slice(0, 1) || "M"}</div>
            <div>
              <div class="moment-name">${name}</div>
              <div class="moment-time">${time}</div>
            </div>
          </div>
          ${isMine ? `<button class="btn btn-sm moment-del" type="button" data-id="${window.TCUtils.escapeHtml(momentId)}">删除</button>` : ``}
        </div>
        <div class="moment-text">${text || "<span class='moments-sub'>（无文字）</span>"}</div>
        ${imgsHtml}
      `;
      listEl.appendChild(card);
    });
  }

  async function deleteMoment(id) {
    const a = window.TCUtils.requireLogin("moments.html");
    if (!a) return;
    if (!id) return;
    if (!confirm("确定要删除这条动态吗？")) return;

    const data = await window.TCApi.post("/moments", {
      action: "delete",
      id,
      user: a.user || null,
    });
    if (data.error) return window.TCUtils.showMessage(data.error, "error");
    if (!data.ok) return window.TCUtils.showMessage(data.msg || "删除失败", "error");
    window.TCUtils.showMessage("已删除", "success");
    await loadList();
  }

  async function publish(e) {
    e.preventDefault();
    const a = window.TCUtils.requireLogin("moments.html");
    if (!a) return;

    const text = (textEl.value || "").trim();
    if (!text && !selectedFiles.length) return window.TCUtils.showMessage("请至少输入文字或选择图片", "error");
    if (text.length > 300) return window.TCUtils.showMessage("文字最多 300 字", "error");
    if (selectedFiles.length > 3) return window.TCUtils.showMessage("最多选择 3 张图片", "error");

    const oldText = publishBtn.textContent;
    try {
      publishBtn.disabled = true;
      publishBtn.textContent = "发布中...";

      const images = [];
      for (const f of selectedFiles.slice(0, 3)) {
        // 压缩为 JPEG dataURL
        const jpeg = await compressImageToJpegDataUrl(f);
        images.push(jpeg);
      }

      const data = await window.TCApi.post("/moments", {
        action: "add",
        text,
        images,
        // token 模式走 Authorization；如果后端是“仅用户名登录”，用 user 兜底
        user: a.user || null,
      });
      if (data.error) return window.TCUtils.showMessage(data.error, "error");
      if (!data.ok) return window.TCUtils.showMessage(data.msg || "发布失败", "error");

      window.TCUtils.showMessage("发布成功", "success");
      textEl.value = "";
      imagesEl.value = "";
      selectedFiles = [];
      previews = [];
      renderPreview();
      await loadList();
    } catch (err) {
      console.error(err);
      window.TCUtils.showMessage("网络错误或服务器异常", "error");
    } finally {
      publishBtn.disabled = false;
      publishBtn.textContent = oldText;
      updateComposeState();
    }
  }

  if (goLoginBtn) {
    goLoginBtn.addEventListener("click", () => {
      location.href = `auth.html?redirect=${encodeURIComponent("moments.html")}`;
    });
  }

  if (refreshBtn) refreshBtn.addEventListener("click", loadList);
  if (form) form.addEventListener("submit", publish);

  if (listEl) {
    listEl.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button.moment-del");
      if (!btn) return;
      const id = btn.getAttribute("data-id") || "";
      deleteMoment(id);
    });
  }

  if (imagesEl) {
    imagesEl.addEventListener("change", async () => {
      const files = Array.from(imagesEl.files || []);
      if (!files.length) {
        selectedFiles = [];
        previews = [];
        renderPreview();
        return;
      }
      if (files.length > 3) window.TCUtils.showMessage("最多选择 3 张图片", "error");
      selectedFiles = files.slice(0, 3);
      previews = [];
      for (const f of selectedFiles) {
        try {
          previews.push(await compressImageToJpegDataUrl(f, 800, 0.72));
        } catch {
          previews.push(await fileToDataUrl(f));
        }
      }
      renderPreview();
    });
  }

  if (previewEl) {
    previewEl.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button[data-idx]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-idx"));
      if (!Number.isFinite(idx)) return;
      selectedFiles.splice(idx, 1);
      previews.splice(idx, 1);
      renderPreview();
    });
  }

  window.addEventListener("tc-auth-changed", updateComposeState);

  updateComposeState();
  loadList();
});

