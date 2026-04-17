/**
 * AGL Company — script.js
 * Módulos: Partículas, Cursor, Header, Navegação,
 * Animações, Contadores, Planos, Forms, Login, utils.
 */

'use strict';

/* =====================================================
   UTILITÁRIOS
===================================================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Throttle de alta perf via rAF */
function rafThrottle(fn) {
  let ticking = false;
  return (...args) => {
    if (!ticking) {
      requestAnimationFrame(() => { fn(...args); ticking = false; });
      ticking = true;
    }
  };
}

/** Debounce simples */
function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* =====================================================
   CANVAS DE PARTÍCULAS
===================================================== */
(function initParticles() {
  const canvas = $('#particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: -9999, y: -9999 };

  const CONFIG = {
    count:      70,
    maxR:       1.8,
    speed:      0.25,
    connectDist: 110,
    mouseRadius: 130,
    color:      '108, 99, 255',
    colorAlt:   '0, 212, 255',
  };

  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : (Math.random() < 0.5 ? -10 : H + 10);
      this.r  = Math.random() * CONFIG.maxR + 0.3;
      this.vx = (Math.random() - 0.5) * CONFIG.speed;
      this.vy = (Math.random() - 0.5) * CONFIG.speed;
      this.alpha = Math.random() * 0.5 + 0.15;
      this.alt   = Math.random() > 0.7;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      const col = this.alt ? CONFIG.colorAlt : CONFIG.color;
      ctx.fillStyle = `rgba(${col}, ${this.alpha})`;
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function buildParticles() {
    particles = Array.from({ length: CONFIG.count }, () => new Particle());
  }

  function connect() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.hypot(dx, dy);

        if (d < CONFIG.connectDist) {
          const mx = particles[i].x - mouse.x;
          const my = particles[i].y - mouse.y;
          const md = Math.hypot(mx, my);
          const boost = md < CONFIG.mouseRadius ? 1.8 : 1;

          const alpha = (1 - d / CONFIG.connectDist) * 0.18 * boost;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${CONFIG.color}, ${alpha})`;
          ctx.lineWidth   = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    connect();
    requestAnimationFrame(loop);
  }

  document.addEventListener('mousemove', rafThrottle(e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }));

  window.addEventListener('resize', debounce(() => { resize(); buildParticles(); }));

  resize();
  buildParticles();
  loop();
})();

/* =====================================================
   CURSOR GLOW (desktop only)
===================================================== */
(function initCursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const glow = $('#cursorGlow');
  if (!glow) return;

  let cx = 0, cy = 0;
  let tx = 0, ty = 0;

  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

  function tick() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    glow.style.transform = `translate(${cx - 250}px, ${cy - 250}px)`;
    requestAnimationFrame(tick);
  }
  tick();
})();

/* =====================================================
   HEADER — scroll e active link
===================================================== */
(function initHeader() {
  const header  = $('#header');
  const links   = $$('.nav__link');
  const sections = $$('section[id]');

  // Adiciona/remove classe scrolled
  const handleScroll = rafThrottle(() => {
    header.classList.toggle('scrolled', window.scrollY > 20);

    // Scroll-to-top button
    const scrollBtn = $('#scrollTop');
    if (scrollBtn) scrollBtn.classList.toggle('visible', window.scrollY > 400);

    // Active nav link via IntersectionObserver é mais performático,
    // mas aqui usamos scroll para robustez em mobile
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) {
        current = sec.id;
      }
    });
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  });

  window.addEventListener('scroll', handleScroll, { passive: true });
})();

/* =====================================================
   NAV MOBILE — hamburguer
===================================================== */
(function initMobileNav() {
  const toggle  = $('#navToggle');
  const menu    = $('#navMenu');
  const links   = $$('.nav__link', menu);

  if (!toggle || !menu) return;

  function open()  {
    menu.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    menu.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? close() : open();
  });

  links.forEach(link => link.addEventListener('click', close));

  // Fecha ao clicar fora
  document.addEventListener('click', e => {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
      close();
    }
  });

  // Fecha com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
})();

/* =====================================================
   SCROLL-TO-TOP
===================================================== */
(function initScrollTop() {
  const btn = $('#scrollTop');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* =====================================================
   INTERSECTION OBSERVER — animações de entrada
===================================================== */
(function initReveal() {
  const els = $$('.reveal-up, .reveal-left, .reveal-right');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = parseInt(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
})();

/* =====================================================
   CONTADORES ANIMADOS (hero stats)
===================================================== */
(function initCounters() {
  const counters = $$('[data-count]');
  if (!counters.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.count);
      const dur    = 1800;
      const step   = 16; // ~60fps
      const steps  = dur / step;
      let current  = 0;

      const timer = setInterval(() => {
        current++;
        const progress = current / steps;
        // ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (current >= steps) {
          el.textContent = target;
          clearInterval(timer);
        }
      }, step);

      obs.unobserve(el);
    });
  }, { threshold: 0.8 });

  counters.forEach(c => obs.observe(c));
})();

/* =====================================================
   BARRAS DE PROGRESSO / INDICADORES
===================================================== */
(function initBars() {
  const fills = $$('.indicator__fill, .tech-item__fill');
  if (!fills.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('animated');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  fills.forEach(f => obs.observe(f));
})();

/* =====================================================
   TOGGLE PLANOS (mensal / anual)
===================================================== */
(function initPlanToggle() {
  const btnMonthly = $('#planMonthly');
  const btnAnnual  = $('#planAnnual');
  const prices     = $$('.price__value');

  if (!btnMonthly || !btnAnnual) return;

  function setMode(annual) {
    btnMonthly.classList.toggle('active', !annual);
    btnAnnual.classList.toggle('active', annual);
    btnMonthly.setAttribute('aria-pressed', String(!annual));
    btnAnnual.setAttribute('aria-pressed', String(annual));

    prices.forEach(el => {
      const val = annual ? el.dataset.annual : el.dataset.monthly;
      if (!val) return;
      // Anima a troca
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => {
        el.textContent = Number(val).toLocaleString('pt-BR');
        el.style.transition = 'opacity 0.25s, transform 0.25s';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 180);
    });
  }

  btnMonthly.addEventListener('click', () => setMode(false));
  btnAnnual.addEventListener('click',  () => setMode(true));
})();

/* =====================================================
   FORMULÁRIO DE CONTATO
===================================================== */
(function initContactForm() {
  const form    = $('#contactForm');
  const success = $('#formSuccess');
  const btnText = $('#formBtnText');

  if (!form) return;

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(id, msg) {
    const el = $(`#${id}`);
    if (el) el.textContent = msg;
  }

  function clearErrors() {
    $$('.form-error', form).forEach(el => el.textContent = '');
  }

  function setLoading(loading) {
    const btn = $('#formSubmit');
    if (!btn) return;
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.7' : '';
    if (btnText) btnText.textContent = loading ? 'Enviando...' : 'Agendar Demonstração';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name  = $('#formName')?.value.trim();
    const email = $('#formEmail')?.value.trim();
    let valid   = true;

    if (!name || name.length < 2) {
      showError('errorName', 'Por favor, insira seu nome completo.');
      valid = false;
    }

    if (!email || !validateEmail(email)) {
      showError('errorEmail', 'Por favor, insira um e-mail válido.');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    // Simulação de envio (substituir por fetch real)
    await new Promise(r => setTimeout(r, 1500));

    setLoading(false);
    form.reset();
    if (success) {
      success.hidden = false;
      success.style.display = 'flex';
      // Oculta após 6 segundos
      setTimeout(() => { 
        success.hidden = true; 
        success.style.display = 'none';
      }, 6000);
    }
  });

  // Limpa erro ao digitar
  $$('input, textarea', form).forEach(input => {
    input.addEventListener('input', () => {
      const errId = input.id.replace('form', 'error');
      const errEl = $(`#error${input.id.charAt(4).toUpperCase() + input.id.slice(5)}`);
      if (errEl) errEl.textContent = '';
    });
  });
})();

/* =====================================================
   AUTENTICAÇÃO SIMULADA (LocalStorage)
===================================================== */
const Auth = (() => {
  const STORAGE_KEY = 'agl_users';
  const SESSION_KEY = 'agl_session';

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function hashPassword(pwd) {
    // Hashing simples para demo. Em produção usar bcrypt via backend.
    let hash = 0;
    for (const c of pwd) hash = (hash << 5) - hash + c.charCodeAt(0);
    return hash.toString(36);
  }

  return {
    register(name, email, password) {
      const users = getUsers();
      if (users[email]) return { ok: false, msg: 'Este e-mail já está cadastrado.' };
      users[email] = { name, email, password: hashPassword(password), createdAt: Date.now() };
      saveUsers(users);
      setSession({ name, email });
      return { ok: true };
    },

    login(email, password, remember) {
      const users = getUsers();
      const user  = users[email];
      if (!user) return { ok: false, msg: 'E-mail não encontrado.' };
      if (user.password !== hashPassword(password)) return { ok: false, msg: 'Senha incorreta.' };
      setSession({ name: user.name, email });
      if (remember) localStorage.setItem('agl_remember', email);
      return { ok: true, name: user.name };
    },

    logout() { clearSession(); },
    getSession,
  };
})();

/* =====================================================
   MODAL DE LOGIN
===================================================== */
(function initLoginModal() {
  const overlay         = $('#loginOverlay');
  const openBtns        = $$('#btnLoginOpen, #navCTA, #heroCtaPrimary');
  const closeBtn        = $('#loginClose');
  const tabLogin        = $('#tabLogin');
  const tabRegister     = $('#tabRegister');
  const panelLogin      = $('#panelLogin');
  const panelRegister   = $('#panelRegister');
  const loginForm       = $('#loginForm');
  const registerForm    = $('#registerForm');
  const loginError      = $('#loginError');
  const registerError   = $('#registerError');
  const loginSuccess    = $('#loginSuccess');
  const successName     = $('#successName');
  const successClose    = $('#loginSuccessClose');
  const togglePassword  = $('#togglePassword');
  const passwordInput   = $('#loginPassword');

  if (!overlay) return;

  /* ── Abrir/fechar ── */
  function openModal() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#loginEmail')?.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    clearErrors();
  }

  openBtns.forEach(btn => btn?.addEventListener('click', e => {
    // Para CTAs que são links de ancoragem, mantém o comportamento padrão
    if (btn.tagName === 'A' && btn.getAttribute('href').startsWith('#contact')) return;
    e.preventDefault();
    openModal();
  }));

  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeModal(); });

  /* ── Tabs ── */
  function switchTab(active, inactive, activePanel, inactivePanel) {
    active.classList.add('active');
    inactive.classList.remove('active');
    active.setAttribute('aria-selected', 'true');
    inactive.setAttribute('aria-selected', 'false');
    activePanel.hidden   = false;
    inactivePanel.hidden = true;
    clearErrors();
  }

  tabLogin?.addEventListener('click',    () => switchTab(tabLogin, tabRegister, panelLogin, panelRegister));
  tabRegister?.addEventListener('click', () => switchTab(tabRegister, tabLogin, panelRegister, panelLogin));

  /* ── Toggle password ── */
  togglePassword?.addEventListener('click', () => {
    const isText = passwordInput.type === 'text';
    passwordInput.type = isText ? 'password' : 'text';
    togglePassword.setAttribute('aria-label', isText ? 'Mostrar senha' : 'Ocultar senha');
  });

  /* ── Error handling ── */
  function clearErrors() {
    if (loginError)    loginError.textContent    = '';
    if (registerError) registerError.textContent = '';
  }

  function setFormLoading(form, loading) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.7' : '';
    const btnText = btn.querySelector('span');
    if (btnText) btnText.textContent = loading ? 'Aguarde...' : btn.dataset.defaultText || btn.textContent;
  }

  /* ── Nav user state helpers ── */
  const navAuthBtns  = $('#navAuthBtns');
  const navUser      = $('#navUser');
  const navUserAvatar = $('#navUserAvatar');
  const navUserName  = $('#navUserName');
  const navLogout    = $('#navLogout');

  function getInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  function setLoggedIn(name) {
    if (navUserAvatar) navUserAvatar.textContent = getInitials(name);
    if (navUserName)   navUserName.textContent   = name.split(' ')[0]; // primeiro nome
    if (navAuthBtns)   { navAuthBtns.hidden = true;  navAuthBtns.style.display = 'none'; }
    if (navUser)       { navUser.hidden = false; navUser.style.display = 'flex'; }
  }

  function setLoggedOut() {
    if (navAuthBtns) { navAuthBtns.hidden = false; navAuthBtns.style.display = 'flex'; }
    if (navUser)     { navUser.hidden = true;  navUser.style.display = 'none'; }
    Auth.logout();
  }

  navLogout?.addEventListener('click', () => {
    setLoggedOut();
  });

  // Restaura sessão ativa ao carregar a página
  const activeSession = Auth.getSession();
  if (activeSession) setLoggedIn(activeSession.name);

  function showSuccess(name) {
    panelLogin.hidden      = true;
    panelRegister.hidden   = true;
    if (successName) successName.textContent = `Bem-vindo, ${name}!`;
    if (loginSuccess) loginSuccess.hidden = false;
    // Atualiza o header imediatamente
    setLoggedIn(name);
  }

  /* ── Login form ── */
  loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();

    const email    = $('#loginEmail')?.value.trim();
    const password = $('#loginPassword')?.value;
    const remember = $('#rememberMe')?.checked;

    if (!email || !password) {
      if (loginError) loginError.textContent = 'Preencha todos os campos.';
      return;
    }

    setFormLoading(loginForm, true);
    await new Promise(r => setTimeout(r, 800)); // simula latência
    const result = Auth.login(email, password, remember);
    setFormLoading(loginForm, false);

    if (!result.ok) {
      if (loginError) loginError.textContent = result.msg;
      return;
    }

    showSuccess(result.name);
  });

  /* ── Registro form ── */
  registerForm?.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();

    const name     = $('#registerName')?.value.trim();
    const email    = $('#registerEmail')?.value.trim();
    const password = $('#registerPassword')?.value;
    const confirm  = $('#registerPasswordConfirm')?.value;

    if (!name || !email || !password || !confirm) {
      if (registerError) registerError.textContent = 'Preencha todos os campos.';
      return;
    }

    if (password.length < 8) {
      if (registerError) registerError.textContent = 'A senha deve ter pelo menos 8 caracteres.';
      return;
    }

    if (password !== confirm) {
      if (registerError) registerError.textContent = 'As senhas não coincidem.';
      return;
    }

    setFormLoading(registerForm, true);
    await new Promise(r => setTimeout(r, 900));
    const result = Auth.register(name, email, password);
    setFormLoading(registerForm, false);

    if (!result.ok) {
      if (registerError) registerError.textContent = result.msg;
      return;
    }

    showSuccess(name);
  });

  /* ── Fechar success ── */
  successClose?.addEventListener('click', closeModal);
})();

/* =====================================================
   FOOTER — ano atual
===================================================== */
(function initFooterYear() {
  const el = $('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
})();

/* =====================================================
   SMOOTH SCROLL para links âncora
===================================================== */
(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const target = $(link.getAttribute('href'));
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

/* =====================================================
   HERO MOCKUP — atualiza valores em tempo real
===================================================== */
(function initMockupAnimation() {
  // Simula oscilação nos valores do mockup para dar vida
  const efficiencyEl = document.querySelector('.metric:first-child .metric__value');
  if (!efficiencyEl) return;

  let base = 34.2;
  setInterval(() => {
    base += (Math.random() - 0.5) * 0.4;
    base  = clamp(base, 32, 36);
    efficiencyEl.textContent = `+${base.toFixed(1)}%`;
  }, 2500);
})();
