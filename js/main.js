/**
 * 腾冲旅游网站 - 主脚本
 * 滚动动画、通用交互
 */

document.addEventListener('DOMContentLoaded', function() {
    // 滚动显示动画
    initRevealAnimation();
    
    // 导航栏滚动效果
    initNavScroll();

    // 首页宣传片：本地视频选择播放
    initPromoVideo();
});

/**
 * 滚动时元素淡入显示
 */
function initRevealAnimation() {
    const revealElements = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

/**
 * 导航栏滚动时背景变化
 */
function initNavScroll() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.boxShadow = '0 4px 20px rgba(45, 90, 61, 0.2)';
        } else {
            nav.style.boxShadow = '0 4px 20px rgba(45, 90, 61, 0.15)';
        }
    });
}

/**
 * 首页宣传片：选择本地视频并播放
 */
function initPromoVideo() {
    const fileInput = document.getElementById('promoVideoFile');
    const video = document.getElementById('promoVideo');
    if (!fileInput || !video) return;

    let objectUrl = null;

    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;

        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(file);

        video.src = objectUrl;
        video.load();
        video.play().catch(() => {});
    });

    window.addEventListener('beforeunload', () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    });
}


/**
 * 1. 回到顶部按钮功能
 * 工作量体现：滚动事件监听、平滑滚动、DOM动态生成
 */
function initBackToTop() {
    const btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.innerHTML = '↑';
    btn.setAttribute('title', '回到顶部');
    document.body.appendChild(btn);

    // 监听滚动显示/隐藏按钮
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });

    // 点击平滑滚动到顶部
    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * 2. 图片点击放大查看 (Lightbox)
 * 工作量体现：DOM动态生成、事件代理、CSS3状态联动
 */
function initLightbox() {
    const selector = '.card-img img, .carousel-item img, .moment-images img, .moments-preview-item img';

    // 创建（或复用）遮罩层 DOM
    let overlay = document.querySelector('.lightbox-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML = `
            <span class="lightbox-close">&times;</span>
            <img src="" alt="放大预览">
        `;
        document.body.appendChild(overlay);
    }

    const lightboxImg = overlay.querySelector('img');
    const closeBtn = overlay.querySelector('.lightbox-close');
    if (!lightboxImg || !closeBtn) return;

    // 关闭逻辑
    const closeLightbox = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    // 事件代理：支持后续动态渲染出来的图片（比如“美好瞬间”列表）
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target) return;
        const img = target.closest ? target.closest(selector) : null;
        if (!img) return;

        lightboxImg.src = img.src;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        // 点击背景区域也能关闭
        if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
}

// 确保在 DOM 加载完成后执行这两个功能
document.addEventListener('DOMContentLoaded', () => {
    initBackToTop();
    initLightbox();
});


document.addEventListener('DOMContentLoaded', () => {
    // 只有在首页才会执行以下特效
    if (document.body.getAttribute('data-page') === 'index') {
        initTypewriter();
        initNumberCounter();
        init3DTilt();
    }
});

/**
 * 1. 打字机特效
 * 工作量体现：定时器、字符串截取渲染
 */
function initTypewriter() {
    const textElement = document.getElementById('typewriter-text');
    if (!textElement) return;
    
    const fullText = textElement.getAttribute('data-text');
    let index = 0;
    
    // 清空原本内容
    textElement.innerText = '';
    
    function type() {
        if (index < fullText.length) {
            textElement.innerText += fullText.charAt(index);
            index++;
            setTimeout(type, 100); // 100ms 敲击一个字
        }
    }
    
    // 延迟 500ms 开始打字，等页面加载一下
    setTimeout(type, 500);
}

/**
 * 2. 数字滚动增长特效
 * 工作量体现：IntersectionObserver 可视区侦测、requestAnimationFrame 动画渲染
 */
function initNumberCounter() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;

    // 动画函数：让数字从 0 增加到 target
    const animateCountUp = (el) => {
        const target = +el.getAttribute('data-target');
        const duration = 2000; // 动画时长 2 秒
        let startTimestamp = null;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // 使用 easeOutExpo 缓动效果：前面快，后面慢
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            el.innerText = Math.floor(easeProgress * target);
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                el.innerText = target; // 确保最终数字准确
            }
        };
        window.requestAnimationFrame(step);
    };

    // 监听元素是否进入屏幕可视区
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCountUp(entry.target);
                observer.unobserve(entry.target); // 执行一次后取消监听
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

/**
 * 3. 卡片 3D 悬浮倾斜特效
 * 工作量体现：鼠标坐标数学计算、CSS3 Transform 3D属性动态修改
 */
function init3DTilt() {
    const cards = document.querySelectorAll('.card-grid .card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            // 计算鼠标在卡片内的相对 X 和 Y 位置 (中心点为 0)
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // 计算旋转角度 (系数越大倾斜越明显)
            const rotateX = (y / rect.height) * -20; 
            const rotateY = (x / rect.width) * 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        // 鼠标离开时恢复原状，加点平滑过渡
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease';
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            
            // 动画结束后移除 transition，避免影响 mousemove 时的跟手感
            setTimeout(() => {
                card.style.transition = '';
            }, 500);
        });
    });
}