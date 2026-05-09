/* ============================================================
   La Placita Rooftop — app.js
   Vanilla JS interactivity layer
   ============================================================ */
(function () {
    'use strict';

    /* Respect users that ask for reduced motion. */
    const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const IS_TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    /* ----------------------------------------------------------
       Helpers
    ---------------------------------------------------------- */
    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    const onReady = (fn) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    };

    /* ----------------------------------------------------------
       1. Page Preloader — fade out after content loads
    ---------------------------------------------------------- */
    function initPreloader() {
        const preloader = document.createElement('div');
        preloader.className = 'preloader';
        preloader.setAttribute('aria-hidden', 'true');
        preloader.innerHTML = `
            <div class="preloader-inner">
                <div class="preloader-logo">La <span>Placita</span></div>
                <div class="preloader-bar"><div class="preloader-bar-fill"></div></div>
            </div>
        `;
        document.body.appendChild(preloader);

        const hide = () => {
            preloader.classList.add('preloader--hidden');
            setTimeout(() => preloader.remove(), 700);
        };

        if (document.readyState === 'complete') {
            setTimeout(hide, 400);
        } else {
            window.addEventListener('load', () => setTimeout(hide, 400), { once: true });
        }
        // Safety net — never trap user behind preloader
        setTimeout(hide, 4000);
    }

    /* ----------------------------------------------------------
       2. Parallax on hero background circles
    ---------------------------------------------------------- */
    function initParallax() {
        if (PREFERS_REDUCED_MOTION) return;
        const circles = $$('.hero-bg-circle');
        if (!circles.length) return;

        let ticking = false;
        const update = () => {
            const y = window.scrollY;
            circles.forEach((c, i) => {
                const speed = (i + 1) * 0.18;
                c.style.transform = `translate3d(0, ${y * speed}px, 0)`;
            });
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });
    }

    /* ----------------------------------------------------------
       3. Animated number counters
    ---------------------------------------------------------- */
    function injectStatsSection() {
        // Inject a stats strip just after the about section if not present
        if ($('.stats-strip')) return;
        const aboutSection = $('#about');
        if (!aboutSection) return;

        const stats = document.createElement('section');
        stats.className = 'stats-strip';
        stats.innerHTML = `
            <div class="stats-strip-inner">
                <div class="stat reveal">
                    <div class="stat-num" data-target="5" data-suffix="">0</div>
                    <div class="stat-label">Years Above Brooklyn</div>
                </div>
                <div class="stat reveal reveal-delay-1">
                    <div class="stat-num" data-target="200" data-suffix="+">0</div>
                    <div class="stat-label">Signature Cocktails</div>
                </div>
                <div class="stat reveal reveal-delay-2">
                    <div class="stat-num" data-target="50000" data-suffix="+" data-format="comma">0</div>
                    <div class="stat-label">Happy Guests</div>
                </div>
                <div class="stat reveal reveal-delay-3">
                    <div class="stat-num" data-target="365" data-suffix="">0</div>
                    <div class="stat-label">Sunsets a Year</div>
                </div>
            </div>
        `;
        aboutSection.parentNode.insertBefore(stats, aboutSection.nextSibling);
    }

    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10) || 0;
        const suffix = el.dataset.suffix || '';
        const format = el.dataset.format;
        const duration = 1800;
        const start = performance.now();

        const fmt = (n) => {
            const rounded = Math.floor(n);
            return format === 'comma'
                ? rounded.toLocaleString('en-US')
                : String(rounded);
        };

        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = fmt(target * eased) + suffix;
            if (t < 1) requestAnimationFrame(tick);
            else el.textContent = fmt(target) + suffix;
        };
        requestAnimationFrame(tick);
    }

    function initCounters() {
        const nums = $$('.stat-num');
        if (!nums.length) return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    animateCounter(e.target);
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.4 });
        nums.forEach((n) => obs.observe(n));
    }

    /* ----------------------------------------------------------
       4. Image lightbox / modal for the gallery section
    ---------------------------------------------------------- */
    function initLightbox() {
        const items = $$('.gallery-item');
        if (!items.length) return;

        const slides = items.map((it) => {
            const placeholder = it.querySelector('.gallery-placeholder');
            const caption = it.querySelector('.gallery-caption');
            return {
                visual: placeholder ? placeholder.innerHTML : '',
                caption: caption ? caption.textContent : '',
            };
        });

        const lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.setAttribute('aria-hidden', 'true');
        lb.setAttribute('role', 'dialog');
        lb.innerHTML = `
            <button class="lightbox-close" aria-label="Close gallery">&times;</button>
            <button class="lightbox-prev" aria-label="Previous image">&#8249;</button>
            <button class="lightbox-next" aria-label="Next image">&#8250;</button>
            <div class="lightbox-stage">
                <div class="lightbox-visual"></div>
                <div class="lightbox-caption"></div>
                <div class="lightbox-counter"></div>
            </div>
        `;
        document.body.appendChild(lb);

        const visual = $('.lightbox-visual', lb);
        const caption = $('.lightbox-caption', lb);
        const counter = $('.lightbox-counter', lb);
        let index = 0;

        const render = () => {
            visual.style.opacity = '0';
            setTimeout(() => {
                const s = slides[index];
                visual.innerHTML = s.visual;
                caption.textContent = s.caption;
                counter.textContent = `${index + 1} / ${slides.length}`;
                visual.style.opacity = '1';
            }, 120);
        };

        const open = (i) => {
            index = i;
            render();
            lb.classList.add('lightbox--open');
            lb.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };
        const close = () => {
            lb.classList.remove('lightbox--open');
            lb.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };
        const next = () => { index = (index + 1) % slides.length; render(); };
        const prev = () => { index = (index - 1 + slides.length) % slides.length; render(); };

        items.forEach((it, i) => {
            it.setAttribute('tabindex', '0');
            it.setAttribute('role', 'button');
            it.setAttribute('aria-label', `Open image: ${slides[i].caption || 'gallery item'}`);
            it.addEventListener('click', () => open(i));
            it.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
            });
        });

        $('.lightbox-close', lb).addEventListener('click', close);
        $('.lightbox-prev', lb).addEventListener('click', prev);
        $('.lightbox-next', lb).addEventListener('click', next);
        lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

        document.addEventListener('keydown', (e) => {
            if (!lb.classList.contains('lightbox--open')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') next();
            else if (e.key === 'ArrowLeft') prev();
        });
    }

    /* ----------------------------------------------------------
       5. Smooth scroll with custom easing
    ---------------------------------------------------------- */
    function smoothScrollTo(targetY, duration = 900) {
        if (PREFERS_REDUCED_MOTION) {
            window.scrollTo(0, targetY);
            return;
        }
        const startY = window.scrollY;
        const diff = targetY - startY;
        const start = performance.now();
        // easeInOutCubic
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

        const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            window.scrollTo(0, startY + diff * ease(t));
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function initSmoothScroll() {
        // Disable native to take full control
        document.documentElement.style.scrollBehavior = 'auto';

        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const navOffset = 80;
            const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
            smoothScrollTo(top);
            // Close mobile menu if scrolling within
            const mm = $('#mobileMenu');
            if (mm && mm.classList.contains('open')) closeMobileMenu();
        });
    }

    /* ----------------------------------------------------------
       6. Typewriter effect on hero subtitle
    ---------------------------------------------------------- */
    function initTypewriter() {
        const el = $('.hero-subtitle');
        if (!el) return;
        const phrases = [
            'R O O F T O P',
            'B R O O K L Y N',
            'L A T I N  S O U L',
            'I S L A N D  V I B E S',
        ];
        if (PREFERS_REDUCED_MOTION) { el.textContent = phrases[0]; return; }

        el.textContent = '';
        el.classList.add('typewriter');
        let phraseIdx = 0;
        let charIdx = 0;
        let deleting = false;

        const tick = () => {
            const phrase = phrases[phraseIdx];
            if (!deleting) {
                charIdx++;
                el.textContent = phrase.slice(0, charIdx);
                if (charIdx === phrase.length) {
                    deleting = true;
                    return setTimeout(tick, 1800);
                }
                setTimeout(tick, 80);
            } else {
                charIdx--;
                el.textContent = phrase.slice(0, charIdx);
                if (charIdx === 0) {
                    deleting = false;
                    phraseIdx = (phraseIdx + 1) % phrases.length;
                    return setTimeout(tick, 300);
                }
                setTimeout(tick, 40);
            }
        };
        setTimeout(tick, 1400);
    }

    /* ----------------------------------------------------------
       7. Mobile menu — slide-in animation
    ---------------------------------------------------------- */
    let _mobileMenuOpen = false;
    function openMobileMenu() {
        const mm = $('#mobileMenu');
        const tg = $('#menuToggle');
        if (!mm) return;
        mm.classList.add('open', 'mobile-menu--slide');
        if (tg) tg.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        _mobileMenuOpen = true;
        // focus first link for keyboard users
        const first = mm.querySelector('a');
        if (first) setTimeout(() => first.focus(), 200);
    }
    function closeMobileMenu() {
        const mm = $('#mobileMenu');
        const tg = $('#menuToggle');
        if (!mm) return;
        mm.classList.remove('open');
        if (tg) tg.classList.remove('is-open');
        document.body.style.overflow = '';
        _mobileMenuOpen = false;
    }
    // expose to window since the existing markup uses inline onclick
    window.closeMobileMenu = closeMobileMenu;

    function initMobileMenu() {
        const mm = $('#mobileMenu');
        const tg = $('#menuToggle');
        if (!mm || !tg) return;
        mm.classList.add('mobile-menu--slide');
        tg.addEventListener('click', () => {
            if (_mobileMenuOpen) closeMobileMenu();
            else openMobileMenu();
        });
    }

    /* ----------------------------------------------------------
       8. Sticky nav active-section highlighter
    ---------------------------------------------------------- */
    function initSectionSpy() {
        const links = $$('.nav-links a[href^="#"]');
        const sections = links
            .map((l) => ({ link: l, section: document.querySelector(l.getAttribute('href')) }))
            .filter((s) => s.section);
        if (!sections.length) return;

        const setActive = (link) => {
            sections.forEach((s) => s.link.classList.remove('is-active'));
            if (link) link.classList.add('is-active');
        };

        const update = () => {
            const fromTop = window.scrollY + window.innerHeight * 0.35;
            let current = null;
            for (const s of sections) {
                if (s.section.offsetTop <= fromTop) current = s.link;
            }
            setActive(current);
        };
        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /* ----------------------------------------------------------
       9. Reservation form validation w/ animated errors
    ---------------------------------------------------------- */
    function showFieldError(field, message) {
        clearFieldError(field);
        field.classList.add('field-invalid');
        const err = document.createElement('div');
        err.className = 'field-error';
        err.textContent = message;
        field.parentNode.appendChild(err);
        // trigger animation
        requestAnimationFrame(() => err.classList.add('field-error--show'));
    }
    function clearFieldError(field) {
        field.classList.remove('field-invalid');
        const existing = field.parentNode.querySelector('.field-error');
        if (existing) existing.remove();
    }

    function validateReservation(form) {
        let valid = true;
        const get = (n) => form.querySelector(`[name="${n}"]`);

        const name = get('name');
        if (name && name.value.trim().length < 2) {
            showFieldError(name, 'Please enter your name');
            valid = false;
        } else if (name) clearFieldError(name);

        const email = get('email');
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRe.test(email.value.trim())) {
            showFieldError(email, 'Please enter a valid email');
            valid = false;
        } else if (email) clearFieldError(email);

        const date = get('date');
        if (date && !date.value) {
            showFieldError(date, 'Pick a date');
            valid = false;
        } else if (date) {
            const today = new Date(); today.setHours(0,0,0,0);
            const picked = new Date(date.value);
            if (picked < today) { showFieldError(date, 'Date must be in the future'); valid = false; }
            else clearFieldError(date);
        }

        const time = get('time');
        if (time && !time.value) { showFieldError(time, 'Choose a time'); valid = false; }
        else if (time) clearFieldError(time);

        const guests = get('guests');
        if (guests && !guests.value) { showFieldError(guests, 'How many guests?'); valid = false; }
        else if (guests) clearFieldError(guests);

        const phone = get('phone');
        if (phone && phone.value && !/[\d\-\(\)\+\s]{7,}/.test(phone.value)) {
            showFieldError(phone, 'Enter a valid phone number');
            valid = false;
        } else if (phone) clearFieldError(phone);

        return valid;
    }

    function initReservationForm() {
        const form = $('#reservationForm');
        if (!form) return;

        // Set min date
        const dateInput = $('#date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }

        // Live-clear errors on input
        form.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) clearFieldError(e.target);
        });

        // Replace inline onsubmit handler
        form.removeAttribute('onsubmit');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!validateReservation(form)) {
                showToast('Please fix the highlighted fields', 'error');
                return;
            }
            const btnSpan = form.querySelector('button[type="submit"] span');
            const btn = btnSpan ? btnSpan.closest('button') : null;
            if (btnSpan) btnSpan.textContent = 'Request Sent!';
            if (btn) btn.style.background = 'var(--coral)';
            showToast('Reservation request received — we will be in touch shortly.', 'success');
            setTimeout(() => {
                if (btnSpan) btnSpan.textContent = 'Request Reservation';
                if (btn) btn.style.background = '';
                form.reset();
            }, 3000);
        });
    }

    // Compatibility: site originally used inline onsubmit="handleReservation(event)"
    window.handleReservation = function (e) { e.preventDefault(); };

    /* ----------------------------------------------------------
       10. Lazy loading images with fade-in
    ---------------------------------------------------------- */
    function initLazyImages() {
        const imgs = $$('img');
        imgs.forEach((img) => {
            if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
            if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
            img.classList.add('lazy-img');
            if (img.complete && img.naturalWidth > 0) {
                img.classList.add('lazy-img--loaded');
            } else {
                img.addEventListener('load', () => img.classList.add('lazy-img--loaded'), { once: true });
                img.addEventListener('error', () => img.classList.add('lazy-img--loaded'), { once: true });
            }
        });
    }

    /* ----------------------------------------------------------
       11. Back-to-top button
    ---------------------------------------------------------- */
    function initBackToTop() {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Back to top');
        btn.innerHTML = '<span aria-hidden="true">&uarr;</span>';
        document.body.appendChild(btn);

        const onScroll = () => {
            btn.classList.toggle('back-to-top--visible', window.scrollY > 600);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        btn.addEventListener('click', () => smoothScrollTo(0, 800));
        onScroll();
    }

    /* ----------------------------------------------------------
       12. Toast notifications
    ---------------------------------------------------------- */
    function showToast(message, kind = 'info') {
        let container = $('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast toast--${kind}`;
        toast.innerHTML = `
            <span class="toast-icon" aria-hidden="true">${kind === 'success' ? '&#10003;' : kind === 'error' ? '&#9888;' : '&#9432;'}</span>
            <span class="toast-msg"></span>
        `;
        toast.querySelector('.toast-msg').textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast--show'));
        setTimeout(() => {
            toast.classList.remove('toast--show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
    window.showToast = showToast;

    /* ----------------------------------------------------------
       13. Cursor trail / glow (desktop only)
    ---------------------------------------------------------- */
    function initCursorGlow() {
        if (IS_TOUCH || PREFERS_REDUCED_MOTION) return;
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        glow.setAttribute('aria-hidden', 'true');
        document.body.appendChild(glow);

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let glowX = mouseX;
        let glowY = mouseY;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            glow.classList.add('cursor-glow--visible');
        }, { passive: true });

        document.addEventListener('mouseleave', () => glow.classList.remove('cursor-glow--visible'));

        const tick = () => {
            // ease toward mouse position
            glowX += (mouseX - glowX) * 0.14;
            glowY += (mouseY - glowY) * 0.14;
            glow.style.transform = `translate3d(${glowX - 150}px, ${glowY - 150}px, 0)`;
            requestAnimationFrame(tick);
        };
        tick();

        // Subtle hover-grow on interactive elements
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('a, button, .gallery-item, .menu-category, .event-card, input, select, textarea')) {
                glow.classList.add('cursor-glow--hover');
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a, button, .gallery-item, .menu-category, .event-card, input, select, textarea')) {
                glow.classList.remove('cursor-glow--hover');
            }
        });
    }

    /* ----------------------------------------------------------
       14. Intersection Observer stagger animations
    ---------------------------------------------------------- */
    function initStaggerReveal() {
        // Auto-stagger groups of children inside common containers
        const groups = [
            '.menu-grid', '.events-grid', '.gallery-grid',
            '.about-features', '.stats-strip-inner', '.footer-grid',
        ];
        groups.forEach((sel) => {
            const grp = $(sel);
            if (!grp) return;
            Array.from(grp.children).forEach((child, i) => {
                child.classList.add('stagger-item');
                child.style.setProperty('--stagger-delay', `${i * 90}ms`);
            });
        });

        const all = $$('.reveal, .stagger-item');
        if (!all.length) return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible', 'stagger-item--in');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
        all.forEach((el) => obs.observe(el));
    }

    /* ----------------------------------------------------------
       15. Keyboard navigation
    ---------------------------------------------------------- */
    function initKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (_mobileMenuOpen) closeMobileMenu();
            }
            // detect tab usage to enable visible focus rings
            if (e.key === 'Tab') document.body.classList.add('user-is-tabbing');
        });
        document.addEventListener('mousedown', () => document.body.classList.remove('user-is-tabbing'));
    }

    /* ----------------------------------------------------------
       Nav scroll-shadow (preserved from original)
    ---------------------------------------------------------- */
    function initNavScroll() {
        const nav = $('#nav');
        if (!nav) return;
        const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ----------------------------------------------------------
       16. Newsletter form
    ---------------------------------------------------------- */
    function initNewsletterForm() {
        const form = document.querySelector('#newsletter form, .newsletter-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            if (!btn) return;
            const original = btn.textContent;
            btn.textContent = 'Welcome to the island!';
            btn.style.background = 'var(--coral)';
            if (window.showToast) window.showToast('You\'re on the list! Welcome to La Placita.', 'success');
            setTimeout(() => {
                btn.textContent = original;
                btn.style.background = '';
                form.reset();
            }, 3000);
        });
    }

    /* ----------------------------------------------------------
       Boot
    ---------------------------------------------------------- */
    initPreloader();
    onReady(() => {
        injectStatsSection();
        initNavScroll();
        initParallax();
        initCounters();
        initLightbox();
        initSmoothScroll();
        initTypewriter();
        initMobileMenu();
        initSectionSpy();
        initReservationForm();
        initLazyImages();
        initBackToTop();
        initCursorGlow();
        initStaggerReveal();
        initKeyboardNav();
        initNewsletterForm();
    });
})();
