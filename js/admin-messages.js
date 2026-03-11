document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('adminPassword');
    const unlockBtn = document.getElementById('unlockBtn');
    const messagesSection = document.getElementById('messagesSection');
    const messagesTbody = document.getElementById('messagesTbody');

    if (!passwordInput || !unlockBtn || !messagesSection || !messagesTbody) return;

    let adminPassword = '123456';

    const notify = (text, type) => {
        try {
            if (window.TCUtils && typeof window.TCUtils.showMessage === 'function') {
                window.TCUtils.showMessage(text, type);
                return;
            }
        } catch {}
        alert(text);
    };

    // 输入密码后加载留言
    unlockBtn.addEventListener('click', function () {
        const pwd = passwordInput.value.trim();
        if (!pwd) {
            notify('请输入密码', 'error');
            return;
        }
        adminPassword = pwd;
        loadMessages();
    });

    // 加载留言列表
    async function loadMessages() {
        try {
            const res = await axios.post(
                'https://mpp24fkiwk.sealoshzh.site/message-admin',
                { password: adminPassword, action: 'list' },
                { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
            );

            const data = res && res.data ? res.data : {};
            if (data.error) {
                notify(data.error, 'error');
                messagesSection.style.display = 'none';
                return;
            }
            const list = Array.isArray(data.data) ? data.data : [];
            renderMessages(list);
            messagesSection.style.display = 'block';
        } catch (e) {
            console.error('加载留言失败:', e);
            notify('网络错误或服务器异常', 'error');
            messagesSection.style.display = 'none';
        }
    }

    // 渲染留言
    function renderMessages(list) {
        messagesTbody.innerHTML = '';
        if (!list.length) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 6;
            td.textContent = '暂无留言记录';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            messagesTbody.appendChild(tr);
            return;
        }

        list.forEach((item) => {
            const tr = document.createElement('tr');
            const isProcessed = item.status === 1;
            const statusText = isProcessed ? '已处理' : '未处理';
            const createdAt = item.createdAt
                ? new Date(item.createdAt).toLocaleString('zh-CN')
                : '';

            tr.innerHTML = `
                <td>${escapeHtml(item.nickname || '')}</td>
                <td>${escapeHtml(item.contact || '')}</td>
                <td class="msg-content">${escapeHtml(item.content || '')}</td>
                <td>${createdAt}</td>
                <td class="msg-status">${statusText}</td>
                <td class="msg-actions">
                    <button class="btn btn-sm" data-action="process" data-id="${item._id}" ${isProcessed ? 'disabled style="opacity:0.6;cursor:default;margin-bottom:4px;"' : 'style="margin-bottom:4px;"'}>
                        ${isProcessed ? '已处理' : '处理'}
                    </button>
                    <button class="btn btn-sm" data-action="delete" data-id="${item._id}" style="margin-left: 4px; background: #c0392b; color: #fff;">
                        删除
                    </button>
                </td>
            `;

            messagesTbody.appendChild(tr);
        });
    }

    // 处理“标记已发布 / 删除”点击
    messagesTbody.addEventListener('click', function (e) {
        const target = e.target;
        if (!target) return;

        // 兼容点击到按钮内部文本节点等情况
        const btn = target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (!action || !id) return;

        if (action === 'process') {
            // 立即在界面上标记为已处理
            const row = btn.closest('tr');
            const statusCell = row ? row.querySelector('.msg-status') : null;
            if (statusCell) {
                statusCell.textContent = '已处理';
            }
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'default';
            btn.textContent = '已处理';
            updateStatus(id, 1);
        } else if (action === 'delete') {
            if (!confirm('确定要删除这条留言吗？')) return;
            // 立即从界面移除该行
            const row = btn.closest('tr');
            if (row && row.parentElement) {
                row.parentElement.removeChild(row);
            }
            updateStatus(id, -1);
        }
    });

    // 更新留言状态
    async function updateStatus(id, status) {
        try {
            const res = await axios.post(
                'https://mpp24fkiwk.sealoshzh.site/message-admin',
                { password: adminPassword, action: 'updateStatus', id, status },
                { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
            );

            const data = res && res.data ? res.data : {};
            if (data.error) {
                notify(data.error, 'error');
                return;
            }
            if (!data.ok) {
                notify('操作失败，请稍后重试', 'error');
                return;
            }

            notify(data.msg || '操作成功', 'success');
        } catch (e) {
            console.error('更新状态失败:', e);
            notify('网络错误或服务器异常', 'error');
        }
    }

    // 简单转义，防止 XSS
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
});
