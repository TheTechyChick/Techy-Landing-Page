(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----------------------------------------------------------
       Globe particle generation: 280 specks spanning a 3D sphere
       ---------------------------------------------------------- */
    const confettiContainer = document.querySelector('.confetti');
    if (confettiContainer) {
        const PARTICLE_COUNT = 280;
        const PALETTE = ['#4285f4', '#ea4335', '#fbbc04', '#9c27b0'];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const s = document.createElement('span');
            s.style.background = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            confettiContainer.appendChild(s);
        }
    }

    /* ----------------------------------------------------------
       Mobile menu toggle (small screens / no-hover devices)
       ---------------------------------------------------------- */
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('mobile-menu');

    if (toggle && menu) {
        const setOpen = (open) => {
            toggle.setAttribute('aria-expanded', String(open));
            menu.hidden = !open;
        };

        toggle.addEventListener('click', () => {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            setOpen(!isOpen);
        });

        menu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setOpen(false));
        });
    }

    /* ----------------------------------------------------------
       Footer year
       ---------------------------------------------------------- */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ----------------------------------------------------------
       Contact form, intercept submit, post to Web3Forms via fetch,
       show inline success or error so the user stays on the page.
       ---------------------------------------------------------- */
    const form = document.getElementById('contact-form');
    if (form) {
        const submitBtn = form.querySelector('.form-submit');
        const status = form.querySelector('.form-status');

        /* ------------------------------------------------------
           Phone, US-format mask: (XXX) XXX-XXXX
           - beforeinput blocks single-character letter typing
           - input event re-formats digits into the mask, handling
             paste, replacement, and middle-of-string edits
           - backspace/delete over a formatter (space, paren, dash)
             removes the adjacent digit so the user never gets stuck
           - caret is restored by digit-position, not raw index
           ------------------------------------------------------ */
        const phone = form.querySelector('input[name="phone"]');
        if (phone) {
            phone.setAttribute('inputmode', 'numeric');
            phone.setAttribute('maxlength', '14');
            phone.setAttribute('autocomplete', 'tel-national');

            const formatPhone = (digits) => {
                digits = digits.slice(0, 10);
                const n = digits.length;
                if (n === 0) return '';
                if (n <= 3) return '(' + digits;
                if (n <= 6) return '(' + digits.slice(0, 3) + ') ' + digits.slice(3);
                return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
            };

            const isDigit = (c) => c >= '0' && c <= '9';

            // How many digit characters appear in str[0 .. pos).
            const countDigits = (str, pos) => {
                const end = Math.min(pos, str.length);
                let n = 0;
                for (let i = 0; i < end; i++) if (isDigit(str[i])) n++;
                return n;
            };

            // Index in str just after its nth digit (1-indexed); 0 returns 0.
            const posAfterNthDigit = (str, n) => {
                if (n <= 0) return 0;
                let count = 0;
                for (let i = 0; i < str.length; i++) {
                    if (isDigit(str[i])) {
                        count++;
                        if (count === n) return i + 1;
                    }
                }
                return str.length;
            };

            let prev = phone.value;

            // Block letter / symbol single-key insertion before it ever lands.
            phone.addEventListener('beforeinput', (e) => {
                if (e.inputType === 'insertText' && e.data && /\D/.test(e.data)) {
                    e.preventDefault();
                }
            });

            phone.addEventListener('input', (e) => {
                const oldVal = prev;
                const newVal = phone.value;
                const caret  = phone.selectionStart != null ? phone.selectionStart : newVal.length;
                const type   = e.inputType || '';
                const isBack = type === 'deleteContentBackward';
                const isFwd  = type === 'deleteContentForward';
                const removedOne = oldVal.length - newVal.length === 1;

                let digits = newVal.replace(/\D/g, '');
                let caretShift = 0;

                // If a delete key just removed a formatter character (space, paren,
                // dash), the user's intent was to delete a digit — drop one extra.
                if (removedOne && (isBack || isFwd)) {
                    const deletedChar = oldVal[caret];
                    if (deletedChar && !isDigit(deletedChar)) {
                        const dBefore = countDigits(newVal, caret);
                        if (isBack && dBefore > 0) {
                            digits = digits.slice(0, dBefore - 1) + digits.slice(dBefore);
                            caretShift = -1;
                        } else if (isFwd && dBefore < digits.length) {
                            digits = digits.slice(0, dBefore) + digits.slice(dBefore + 1);
                        }
                    }
                }

                const formatted = formatPhone(digits);
                phone.value = formatted;
                prev = formatted;

                // Place the caret after the same digit the user was on.
                const targetDigit = Math.max(0, countDigits(newVal, caret) + caretShift);
                const newCaret = posAfterNthDigit(formatted, targetDigit);
                phone.setSelectionRange(newCaret, newCaret);
            });
        }

        const setStatus = (kind, title, message) => {
            if (!status) return;
            status.classList.remove('is-success', 'is-error');
            if (kind) {
                status.classList.add('is-' + kind);
                status.innerHTML = '<strong>' + title + '</strong>' + message;
            } else {
                status.textContent = '';
            }
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Native validation feedback first.
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            setStatus(null);
            if (submitBtn) {
                submitBtn.classList.add('is-loading');
                submitBtn.disabled = true;
            }

            const data = new FormData(form);

            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    body: data,
                    headers: { Accept: 'application/json' }
                });
                const json = await res.json().catch(() => ({}));

                if (res.ok && json.success) {
                    form.reset();
                    setStatus(
                        'success',
                        "Thanks, your message is on its way.",
                        " I'll get back to you within one business day."
                    );
                } else {
                    setStatus(
                        'error',
                        'Something went wrong.',
                        ' ' + (json.message || 'Please try again, or email contactme@thattechychick.com.')
                    );
                }
            } catch (err) {
                setStatus(
                    'error',
                    'Network error.',
                    ' Please try again, or email contactme@thattechychick.com.'
                );
            } finally {
                if (submitBtn) {
                    submitBtn.classList.remove('is-loading');
                    submitBtn.disabled = false;
                }
            }
        });
    }

    /* ----------------------------------------------------------
       Header, hover-reveal dropdown (desktop / hover devices)
       ---------------------------------------------------------- */
    const header = document.querySelector('.site-header');
    const trigger = document.querySelector('.header-trigger');
    const supportsHover = window.matchMedia('(hover: hover)').matches;
    const desktopMQ = window.matchMedia('(min-width: 961px)');

    let hideTimer = null;
    const reveal = () => {
        clearTimeout(hideTimer);
        if (header) header.classList.add('is-revealed');
    };
    const scheduleHide = () => {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            if (!header) return;
            const overHeader = header.matches(':hover');
            const overTrigger = trigger && trigger.matches(':hover');
            if (!overHeader && !overTrigger) {
                header.classList.remove('is-revealed');
            }
        }, 240);
    };

    if (header && supportsHover) {
        if (trigger) {
            trigger.addEventListener('mouseenter', reveal);
            trigger.addEventListener('mouseleave', scheduleHide);
        }
        header.addEventListener('mouseenter', reveal);
        header.addEventListener('mouseleave', scheduleHide);

        // Keyboard accessibility, keep open while focused inside.
        header.addEventListener('focusin', reveal);
        header.addEventListener('focusout', (e) => {
            if (!header.contains(e.relatedTarget)) scheduleHide();
        });

        // If viewport drops below desktop breakpoint, ensure header is shown.
        const syncForBreakpoint = () => {
            if (!desktopMQ.matches) header.classList.remove('is-revealed');
        };
        desktopMQ.addEventListener('change', syncForBreakpoint);
    }

    // Track scroll state for mobile sticky styling (no-op on hover-reveal)
    if (header) {
        const onScroll = () => {
            header.classList.toggle('is-scrolled', window.scrollY > 8);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ----------------------------------------------------------
       Confetti, fade out past the hero so it never covers reading
       content. Opacity is driven by scroll position relative to the
       hero's bottom edge: full at the top, gone by the time the
       hero scrolls offscreen.
       ---------------------------------------------------------- */
    const confettiEl = document.querySelector('.confetti');
    const heroEl = document.querySelector('.hero');

    if (confettiEl && heroEl) {
        let heroBottom = heroEl.offsetTop + heroEl.offsetHeight;

        const measureHero = () => {
            heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
        };
        window.addEventListener('resize', measureHero);
        window.addEventListener('load', measureHero);
        // Re-measure once layout settles (fonts, images).
        setTimeout(measureHero, 300);

        const updateConfettiOpacity = () => {
            const sy = window.scrollY;
            const fadeStart = heroBottom * 0.45;
            const fadeEnd = heroBottom * 0.92;
            let op;
            if (sy <= fadeStart) op = 1;
            else if (sy >= fadeEnd) op = 0;
            else op = 1 - (sy - fadeStart) / (fadeEnd - fadeStart);
            confettiEl.style.opacity = op.toFixed(3);
        };

        window.addEventListener('scroll', updateConfettiOpacity, { passive: true });
        updateConfettiOpacity();
    }

    /* ----------------------------------------------------------
       3D globe: Fibonacci sphere + continuous rotation + cursor warp
       Particles sit on a unit sphere distributed via the golden-angle
       (Fibonacci) method for uniform surface coverage. Each frame the
       globe rotates on its X and Y axes; depth cues (opacity + scale)
       sell the 3D illusion. Cursor applies a screen-space magnetic warp
       that decays back to the orbital position over ~10 frames.
       ---------------------------------------------------------- */
    const globeSpans = Array.from(document.querySelectorAll('.confetti span'));

    if (globeSpans.length && !reduceMotion) {
        let viewW  = window.innerWidth;
        let viewH  = window.innerHeight;
        let globeR = Math.min(viewW, viewH) * 0.42;
        let cx     = viewW / 2;
        let cy     = viewH / 2;

        // Fibonacci (golden-angle) sphere — maximally even surface distribution
        const N           = globeSpans.length;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const globeState  = globeSpans.map((el, i) => {
            const y3  = 1 - (i / (N - 1)) * 2;
            const r   = Math.sqrt(Math.max(0, 1 - y3 * y3));
            const phi = goldenAngle * i;
            return { el, x3: r * Math.cos(phi), y3, z3: r * Math.sin(phi), offsetX: 0, offsetY: 0 };
        });

        let mx = -10000;
        let my = -10000;
        window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
        document.addEventListener('mouseleave', () => { mx = -10000; my = -10000; });
        window.addEventListener('resize', () => {
            viewW  = window.innerWidth;
            viewH  = window.innerHeight;
            globeR = Math.min(viewW, viewH) * 0.42;
            cx     = viewW / 2;
            cy     = viewH / 2;
        });

        let rotX = 0;
        let rotY = 0;
        const dRotX    = 0.0006;  // slow polar tilt per frame
        const dRotY    = 0.0012;  // slow equatorial spin per frame
        const CURSOR_R = 200;     // cursor influence radius (px)
        const startTime = performance.now();

        const frameGlobe = (now) => {
            const elapsed    = (now - startTime) / 1000;
            const globalFade = Math.min(elapsed / 1.4, 1);  // 1.4 s fade-in on load

            rotX += dRotX;
            rotY += dRotY;

            const cosX      = Math.cos(rotX);
            const sinX      = Math.sin(rotX);
            const cosY      = Math.cos(rotY);
            const sinY      = Math.sin(rotY);
            const hasCursor = mx !== -10000;

            for (let i = 0; i < globeState.length; i++) {
                const p = globeState[i];

                // Y-axis rotation then X-axis rotation
                const rx  =  p.x3 * cosY + p.z3 * sinY;
                const ry  =  p.y3;
                const rz  = -p.x3 * sinY + p.z3 * cosY;

                const fx  =  rx;
                const fy  =  ry * cosX - rz * sinX;
                const fz  =  ry * sinX + rz * cosX;  // -1 = rear, +1 = front

                // Orthographic 2D projection
                const px  = cx + fx * globeR;
                const py  = cy + fy * globeR;

                // Depth cues: front hemisphere is brighter + slightly larger
                const depth   = (fz + 1) * 0.5;
                const opacity = (0.12 + depth * 0.78) * globalFade;
                const scale   = 0.35 + depth * 0.65;

                // Cursor magnetic warp: push particles away from cursor
                if (hasCursor) {
                    const wx   = px + p.offsetX - mx;
                    const wy   = py + p.offsetY - my;
                    const dist = Math.hypot(wx, wy);
                    if (dist < CURSOR_R && dist > 0.5) {
                        const ang = Math.atan2(wy, wx);
                        const mag = (1 - dist / CURSOR_R) * 1.4;
                        p.offsetX += Math.cos(ang) * mag;
                        p.offsetY += Math.sin(ang) * mag;
                    }
                }
                // Spring decay back toward the orbital position
                p.offsetX *= 0.90;
                p.offsetY *= 0.90;

                const finalX = (px + p.offsetX).toFixed(1);
                const finalY = (py + p.offsetY).toFixed(1);

                p.el.style.transform = 'translate3d(' + finalX + 'px,' + finalY + 'px,0) scale(' + scale.toFixed(3) + ')';
                p.el.style.opacity   = opacity.toFixed(3);
            }

            requestAnimationFrame(frameGlobe);
        };

        requestAnimationFrame(frameGlobe);
    } else if (globeSpans.length) {
        // Reduced motion: render globe statically at resting orientation
        const N           = globeSpans.length;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const R           = Math.min(window.innerWidth, window.innerHeight) * 0.42;
        const scx         = window.innerWidth  / 2;
        const scy         = window.innerHeight / 2;
        globeSpans.forEach((el, i) => {
            const y3  = 1 - (i / (N - 1)) * 2;
            const r   = Math.sqrt(Math.max(0, 1 - y3 * y3));
            const phi = goldenAngle * i;
            el.style.transform = 'translate3d(' + (scx + r * Math.cos(phi) * R).toFixed(1) + 'px,' + (scy + y3 * R).toFixed(1) + 'px,0)';
            el.style.opacity   = '0.5';
        });
    }


    /* ----------------------------------------------------------
       Typing animation for service headers
       Single textNode approach: all chars share one layout context
       so kerning/letter-spacing apply correctly — no per-char bleed.
       ---------------------------------------------------------- */
    const typeHeaders = document.querySelectorAll('.service-title');
    if (typeHeaders.length) {
        typeHeaders.forEach(el => {
            el.dataset.originalText = el.textContent.trim();
            el.textContent = '';
        });

        if (reduceMotion) {
            typeHeaders.forEach(el => {
                el.textContent = el.dataset.originalText || '';
            });
        } else {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    if (el.dataset.typed) return;
                    el.dataset.typed = 'true';
                    observer.unobserve(el);

                    const text     = el.dataset.originalText;
                    const textNode = document.createTextNode('');
                    const cursor   = document.createElement('span');
                    cursor.className = 'typing-cursor';
                    el.appendChild(textNode);
                    el.appendChild(cursor);

                    let i = 0;
                    const typeChar = () => {
                        if (i < text.length) {
                            textNode.textContent = text.substring(0, ++i);
                            setTimeout(typeChar, 38 + Math.random() * 52);
                        }
                    };
                    setTimeout(typeChar, 180);
                });
            }, { threshold: 0.3 });
            typeHeaders.forEach(h => observer.observe(h));
        }
    }

})();

