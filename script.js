(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
       Confetti, free-floating viewport drift + mouse repulsion
       Each particle carries position + velocity. Ambient meandering
       acceleration nudges direction over time. Cursor adds a velocity
       impulse so particles glide away and keep drifting (no snap-back).
       Particles wrap around viewport edges for continuous motion.
       ---------------------------------------------------------- */
    const particles = Array.from(document.querySelectorAll('.confetti span'));

    if (particles.length && !reduceMotion) {
        let viewW = window.innerWidth;
        let viewH = window.innerHeight;

        const state = particles.map((el, i) => {
            const cs = getComputedStyle(el);
            const xPct = parseFloat(cs.getPropertyValue('--x')) || (Math.random() * 100);
            const yPct = parseFloat(cs.getPropertyValue('--y')) || (Math.random() * 100);
            const rot = parseFloat(cs.getPropertyValue('--r')) || 0;

            return {
                el,
                x: (xPct / 100) * viewW,
                y: (yPct / 100) * viewH,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                rot,
                rotV: (Math.random() - 0.5) * 0.25,
                seedA: Math.random() * Math.PI * 2,
                seedB: Math.random() * Math.PI * 2,
                freqA: 0.18 + Math.random() * 0.14,
                freqB: 0.09 + Math.random() * 0.09,
            };
        });

        // Paint initial positions immediately so particles don't flash at 0,0.
        const paint = (p) => {
            p.el.style.transform =
                'translate3d(' + p.x.toFixed(2) + 'px,' + p.y.toFixed(2) + 'px,0) ' +
                'rotate(' + p.rot.toFixed(2) + 'deg)';
        };
        state.forEach(paint);

        let mx = -10000;
        let my = -10000;

        window.addEventListener('mousemove', (e) => {
            mx = e.clientX;
            my = e.clientY;
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            mx = -10000;
            my = -10000;
        });

        window.addEventListener('resize', () => {
            const newW = window.innerWidth;
            const newH = window.innerHeight;
            // Scale positions proportionally so particles stay relatively placed.
            state.forEach((p) => {
                p.x = (p.x / viewW) * newW;
                p.y = (p.y / viewH) * newH;
            });
            viewW = newW;
            viewH = newH;
        });

        const RADIUS    = 170;   // px, cursor influence radius
        const PUSH      = 1.45;  // velocity impulse strength near cursor
        const AMBIENT   = 0.040; // ambient acceleration magnitude
        const DAMPING   = 0.985; // per-frame velocity damping (60fps reference)
        const ROT_DAMP  = 0.992;
        const MAX_SPEED = 6.5;   // velocity cap so a fast cursor sweep doesn't fling
        const MARGIN    = 40;    // px past edge before wrapping

        let lastT = performance.now();

        const frame = (now) => {
            // Frame-rate-normalized step (1 = 60fps).
            const dt = Math.min(2.5, Math.max(0.5, (now - lastT) / 16.6667));
            lastT = now;
            const t = now / 1000;

            const damp = Math.pow(DAMPING, dt);
            const rdmp = Math.pow(ROT_DAMP, dt);

            for (let i = 0; i < state.length; i++) {
                const p = state[i];

                // 1) Ambient meandering, two layered sine waves give an
                //    irregular, non-repeating-feeling acceleration vector.
                const ax =
                    (Math.sin(t * p.freqA + p.seedA) +
                     Math.sin(t * p.freqB * 0.93 + p.seedB * 1.7)) * AMBIENT;
                const ay =
                    (Math.cos(t * p.freqA * 1.07 + p.seedA * 1.3) +
                     Math.cos(t * p.freqB + p.seedB * 0.6)) * AMBIENT;

                p.vx += ax * dt;
                p.vy += ay * dt;

                // 2) Cursor repulsion as a velocity impulse, particle
                //    accelerates away from cursor and KEEPS that momentum
                //    when the cursor moves on (no spring-back).
                const dx = p.x - mx;
                const dy = p.y - my;
                const d2 = dx * dx + dy * dy;
                const r2 = RADIUS * RADIUS;
                if (d2 < r2 && d2 > 0.25) {
                    const dist = Math.sqrt(d2);
                    const falloff = 1 - dist / RADIUS;
                    const impulse = falloff * falloff * PUSH;
                    p.vx += (dx / dist) * impulse * dt;
                    p.vy += (dy / dist) * impulse * dt;
                    // A tiny rotational kick gives an organic tumble.
                    p.rotV += (Math.random() - 0.5) * impulse * 0.6;
                }

                // 3) Damping, keeps motion graceful without ever halting.
                p.vx *= damp;
                p.vy *= damp;
                p.rotV *= rdmp;

                // 4) Speed cap.
                const speed = Math.hypot(p.vx, p.vy);
                if (speed > MAX_SPEED) {
                    p.vx = (p.vx / speed) * MAX_SPEED;
                    p.vy = (p.vy / speed) * MAX_SPEED;
                }

                // 5) Integrate.
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.rot += p.rotV * dt;

                // 6) Toroidal wrap, exit one edge, re-enter the other.
                if (p.x < -MARGIN)         p.x = viewW + MARGIN;
                else if (p.x > viewW + MARGIN) p.x = -MARGIN;
                if (p.y < -MARGIN)         p.y = viewH + MARGIN;
                else if (p.y > viewH + MARGIN) p.y = -MARGIN;

                paint(p);
            }
            requestAnimationFrame(frame);
        };

        requestAnimationFrame(frame);
    } else if (particles.length) {
        // Reduced motion, distribute statically across viewport.
        particles.forEach((el) => {
            const cs = getComputedStyle(el);
            const xPct = parseFloat(cs.getPropertyValue('--x')) || 50;
            const yPct = parseFloat(cs.getPropertyValue('--y')) || 50;
            const rot = parseFloat(cs.getPropertyValue('--r')) || 0;
            const x = (xPct / 100) * window.innerWidth;
            const y = (yPct / 100) * window.innerHeight;
            el.style.transform =
                'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rot + 'deg)';
        });
    }

})();
