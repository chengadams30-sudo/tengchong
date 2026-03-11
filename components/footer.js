/**
 * 腾冲旅游网站 - 页脚组件
 * 在所有页面复用
 */
document.addEventListener('DOMContentLoaded', function() {
    const footerHTML = `
        <div class="footer-banner">
            <p class="footer-banner-text">极边第一城 · 温泉之乡 · 翡翠之都 —— 欢迎您走进腾冲，感受自然奇观与人文底蕴交融的独特魅力</p>
        </div>
        <footer class="main-footer">
            <div class="footer-container">
                <div class="footer-content">
                    <div class="footer-brand">
                        <div class="footer-brand-header">
                            <img class="footer-logo" src="images/logo.png" alt="魅力腾冲">
                            <h3>魅力腾冲</h3>
                        </div>
                        <p>云南腾冲，极边第一城，温泉之乡，翡翠之都</p>
                    </div>
                    <div class="footer-links">
                        <h4>快速导航</h4>
                        <ul>
                            <li><a href="index.html">首页</a></li>
                            <li><a href="attractions.html">景点介绍</a></li>
                            <li><a href="heritage.html">文化遗产</a></li>
                            <li><a href="guide.html">旅游攻略</a></li>
                            <li><a href="transport.html">交通指南</a></li>
                            <li><a href="contact.html">联系我们</a></li>
                            <li><a href="moments.html">美好瞬间</a></li>
                            <li><a href="auth.html">登录/注册</a></li>
                        </ul>
                    </div>
                    <div class="footer-contact">
                        <h4>联系方式</h4>
                        <p>📍 云南省保山市腾冲市</p>
                        <p>📞 0885-XXXXXXX</p>
                        <p>📧 tengchong@example.com</p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>© 2025 腾冲旅游文化宣传网 | 传承极边文化，共享自然之美</p>
                </div>
            </div>
        </footer>
    `;
    
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHTML;
    }
});
