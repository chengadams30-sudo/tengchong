/**
 * 腾冲旅游网站 - 联系我们留言功能
 * 前端表单验证与提交处理（需后端接口支持实际存储）
 */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('feedbackForm');
    if (!form) return;

    // 地图：在部分网络/浏览器下可能无法正常加载（外链被拦截/资源不可达）
    // 这里提供“加载中 + 超时提示 + 可点开新窗口”的降级体验，避免空白区域。
    (function initContactMapFallback() {
        const iframe = document.getElementById('contactMapIframe');
        const fallback = document.getElementById('contactMapFallback');
        if (!iframe || !fallback) return;

        let loaded = false;
        const hideFallback = () => {
            if (loaded) return;
            loaded = true;
            fallback.classList.add('is-hidden');
        };

        iframe.addEventListener('load', hideFallback);

        // 兜底：如果 4 秒仍未触发 load，则提示用户手动打开地图
        window.setTimeout(() => {
            if (!loaded) {
                // 保持 fallback 显示即可（里面已包含外部打开按钮）
            }
        }, 4000);
    })();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nameEl = document.getElementById('name');
        const contactEl = document.getElementById('contact');
        const typeEl = document.getElementById('type');
        const contentEl = document.getElementById('content');

        const name = nameEl.value.trim();
        const contact = contactEl.value.trim();
        const type = typeEl.value;
        const content = contentEl.value.trim();

        // 基础验证（前端）
        if (!name) {
            showMessage('请输入您的姓名', 'error');
            return;
        }
        if (!contact) {
            showMessage('请输入联系方式', 'error');
            return;
        }
        if (!content) {
            showMessage('请输入留言内容', 'error');
            return;
        }
        if (content.length < 10) {
            showMessage('留言内容至少10个字符', 'error');
            return;
        }

        const typeText = {
            suggestion: '建议',
            complaint: '投诉',
            consult: '咨询',
            praise: '表扬',
            other: '其他'
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // 组装后端需要的字段：nickname / contact / content
        const payload = {
            nickname: name,
            contact: contact,
            // 把类型一起写进内容前缀，方便后台查看
            content: `【${typeText[type] || '其他'}】${content}`
            // 如需验证码，可在此补充 code / uuid 字段
        };

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';

            const res = await axios.post(
                'https://mpp24fkiwk.sealoshzh.site/message',
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            const data = res && res.data ? res.data : {};

            if (data.error) {
                showMessage(data.error || '提交失败，请稍后重试', 'error');
            } else if (data.ok) {
                showMessage(data.msg || `感谢您的${typeText[type]}！我们已收到您的留言，将尽快处理并回复。`, 'success');
                form.reset();
            } else {
                showMessage('提交失败，请稍后重试', 'error');
            }
        } catch (err) {
            console.error('留言提交失败:', err);
            showMessage('网络错误或服务器异常，请稍后重试', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});

/**
 * 显示提示消息
 */
function showMessage(text, type) {
    const existing = document.querySelector('.feedback-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = `feedback-message feedback-${type}`;
    msg.textContent = text;
    msg.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 32px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: feedbackFadeIn 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    `;
    msg.style.background = type === 'success' ? '#2d7a5a' : '#c0392b';

    document.body.appendChild(msg);

    setTimeout(() => {
        msg.style.opacity = '0';
        msg.style.transition = 'opacity 0.3s';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}
