/**
 * 腾冲旅游网站 - 轮播图功能
 */
class Carousel {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.items = this.container.querySelectorAll('.carousel-item');
        this.dots = this.container.querySelectorAll('.carousel-dot');
        this.prevBtn = this.container.querySelector('.carousel-arrow.prev');
        this.nextBtn = this.container.querySelector('.carousel-arrow.next');
        
        this.currentIndex = 0;
        this.autoPlay = options.autoPlay !== false;
        this.interval = options.interval || 5000;
        this.timer = null;

        // 交互：拖拽/滑动切换
        this.dragging = false;
        this.dragStartX = 0;
        this.dragDeltaX = 0;
        this.dragThreshold = 60; // px

        // 交互：鼠标视差
        this.parallaxEnabled = options.parallax !== false;

        this.init();
    }

    init() {
        if (this.items.length === 0) return;

        this.showSlide(0);

        // 自动播放
        if (this.autoPlay) {
            this.startAutoPlay();
        }

        // 点击切换
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goTo(index));
        });

        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prev());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.next());
        }

        // 鼠标悬停暂停
        this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.container.addEventListener('mouseleave', () => {
            if (this.autoPlay) this.startAutoPlay();
        });

        // 键盘左右键切换（可访问性）
        this.container.setAttribute('tabindex', '0');
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        // 拖拽/滑动：Pointer Events（同时支持鼠标与触摸）
        this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));
        window.addEventListener('pointercancel', (e) => this.onPointerUp(e));

        // 视差：轻量鼠标跟随（仅桌面端有意义）
        if (this.parallaxEnabled) {
            this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.container.addEventListener('mouseleave', () => this.resetParallax());
        }
    }

    showSlide(index) {
        this.currentIndex = (index + this.items.length) % this.items.length;
        
        this.items.forEach((item, i) => {
            item.classList.toggle('active', i === this.currentIndex);
        });
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }

    next() {
        this.showSlide(this.currentIndex + 1);
        if (this.autoPlay) {
            this.resetAutoPlay();
        }
    }

    prev() {
        this.showSlide(this.currentIndex - 1);
        if (this.autoPlay) {
            this.resetAutoPlay();
        }
    }

    goTo(index) {
        this.showSlide(index);
        if (this.autoPlay) {
            this.resetAutoPlay();
        }
    }

    startAutoPlay() {
        this.stopAutoPlay();
        this.timer = setInterval(() => this.next(), this.interval);
    }

    stopAutoPlay() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    resetAutoPlay() {
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    // ========== 拖拽/滑动 ==========
    onPointerDown(e) {
        // 只响应主键
        if (e.button !== undefined && e.button !== 0) return;
        // 点击到控制按钮/圆点时，不进入拖拽逻辑，避免影响点击
        const t = e.target;
        if (t && t.closest && t.closest('.carousel-arrow, .carousel-dot')) return;
        this.dragging = true;
        this.dragStartX = e.clientX;
        this.dragDeltaX = 0;
        this.container.classList.add('is-dragging');
        this.stopAutoPlay();
        try { this.container.setPointerCapture(e.pointerId); } catch {}
    }

    onPointerMove(e) {
        if (!this.dragging) return;
        this.dragDeltaX = e.clientX - this.dragStartX;
        // 给当前 slide 一个轻微跟随位移（更“动态”）
        const active = this.items[this.currentIndex];
        if (!active) return;
        active.style.transition = 'none';
        active.style.transform = `translateX(${this.dragDeltaX * 0.38}px)`;
    }

    onPointerUp(e) {
        if (!this.dragging) return;
        this.dragging = false;
        this.container.classList.remove('is-dragging');

        const dx = this.dragDeltaX;
        this.dragDeltaX = 0;

        // 恢复 active transform
        const active = this.items[this.currentIndex];
        if (active) {
            active.style.transition = '';
            active.style.transform = '';
        }

        if (Math.abs(dx) > this.dragThreshold) {
            if (dx < 0) this.next();
            else this.prev();
        } else {
            // 没达到阈值：如果开启自动播放就继续
            if (this.autoPlay) this.startAutoPlay();
        }
        try { this.container.releasePointerCapture(e.pointerId); } catch {}
    }

    // ========== 视差 ==========
    onMouseMove(e) {
        // 拖拽中不做视差，避免冲突
        if (this.dragging) return;
        const rect = this.container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / rect.width;  // -0.5 ~ 0.5
        const dy = (e.clientY - cy) / rect.height; // -0.5 ~ 0.5

        const active = this.items[this.currentIndex];
        if (!active) return;
        const img = active.querySelector('img');
        const cap = active.querySelector('.carousel-caption');
        // 视差幅度调大一些：图片更明显、标题轻微跟随
        if (img) img.style.transform = `scale(1.06) translate(${dx * -26}px, ${dy * -18}px)`;
        if (cap) cap.style.transform = `translate(calc(-50% + ${dx * 18}px), calc(${dy * 10}px))`;
    }

    resetParallax() {
        const active = this.items[this.currentIndex];
        if (!active) return;
        const img = active.querySelector('img');
        const cap = active.querySelector('.carousel-caption');
        if (img) img.style.transform = '';
        if (cap) cap.style.transform = '';
    }
}
