// ============================================================
// GEOLYTICS — js/common/core.js  ·  núcleo compartido (estado + ruteo + chrome + boot)
// ------------------------------------------------------------
// Estado global, router (render/navigate), sidebar, topbar, tweaks y boot().
// Carga ÚLTIMO (después de data.js y de todas las pantallas).
// ⚠️ Núcleo compartido: lo usan todas las pantallas.
// ============================================================

function initExtraState() {
  Object.assign(state, {
    onboardingStep: state.onboardingStep || 1,
    detailScenario: state.detailScenario || 'crisis',
    profileTab: state.profileTab || 'account',
    authMode: state.authMode || 'login',
    registerStep: state.registerStep || 1,
    register: state.register || {
      first: '', last: '', email: '', password: '', confirm: '',
      role: '', institution: '', level: '',
      interests: [], terms: false, newsletter: true
    },
    profile: state.profile || {
      first: 'Tomás',
      last: 'Fernández',
      email: 'tomas@geolytics.io',
      occupation: 'Estudiante',
      interests: ['Crisis económica', 'Commodities']
    },
    // Preferencias y notificaciones (persistidas; arrancan con defaults).
    prefs: state.prefs || { autosave: true, language: 'Español (AR)', timezone: 'America/Buenos_Aires (GMT-3)', numfmt: '1.234,56' },
    notifs: state.notifs || { newScenarios: true, weekly: true, product: false, edu: false },
    compareCount: state.compareCount || 0,
    loginError: '',
    registerError: ''
  });
}
window.initExtraState = initExtraState;


// WIRING — attached after each render via wireExtraEvents()
// ============================================================
function wireExtraEvents() {
  // Auth mode switch
  document.querySelectorAll('[data-auth-mode]').forEach(el => el.addEventListener('click', () => {
    state.authMode = el.getAttribute('data-auth-mode');
    if (state.authMode === 'register') state.registerStep = 1;
    state.loginError = ''; state.registerError = '';
    render();
  }));

  // Login real (email + contraseña vía Supabase)
  document.querySelectorAll('[data-action="login-submit"]').forEach(el => el.addEventListener('click', async () => {
    // Sin Supabase → flujo demo (entra directo).
    if (!window.DB || !DB.enabled()) { navigate('home'); return; }
    const email = (document.getElementById('login-email')?.value || '').trim();
    const pass = document.getElementById('login-password')?.value || '';
    if (!email || !pass) { state.loginError = 'Completá email y contraseña.'; render(); return; }
    const orig = el.innerHTML;
    el.disabled = true; el.style.opacity = '0.6'; el.style.cursor = 'wait';
    el.innerHTML = 'Ingresando…';
    const res = await DB.auth.signInPassword(email, pass);
    if (!res.ok) {
      el.disabled = false; el.style.opacity = ''; el.style.cursor = '';
      el.innerHTML = orig;
      state.loginError = /invalid login/i.test(res.reason) ? 'Email o contraseña incorrectos.'
        : /not confirmed/i.test(res.reason) ? 'Tenés que confirmar tu email antes de entrar.'
        : ('No se pudo iniciar sesión: ' + res.reason);
      render(); return;
    }
    state.loginError = '';
    if (res.user) { applyAuthUser(res.user); }
    state.onboardingStep = 1;
    navigate(res.user ? 'onboarding' : 'home');
  }));
  // Register form inputs
  document.querySelectorAll('[data-reg-key]').forEach(el => {
    const key = el.getAttribute('data-reg-key');
    el.addEventListener('input', () => { state.register[key] = el.value; if (['password','confirm'].includes(key)) render(); });
    el.addEventListener('change', () => { state.register[key] = el.value; });
    if (key === 'email') el.addEventListener('blur', () => { state.register[key] = el.value; render(); });
  });
  document.querySelectorAll('[data-reg-toggle]').forEach(el => el.addEventListener('click', (e) => {
    e.preventDefault();
    const k = el.getAttribute('data-reg-toggle');
    state.register[k] = !state.register[k];
    render();
  }));
  document.querySelectorAll('[data-reg-role]').forEach(el => el.addEventListener('click', () => {
    state.register.role = el.getAttribute('data-reg-role');
    render();
  }));
  document.querySelectorAll('[data-reg-interest]').forEach(el => el.addEventListener('click', () => {
    const name = el.getAttribute('data-reg-interest');
    const arr = state.register.interests;
    const i = arr.indexOf(name);
    if (i >= 0) arr.splice(i, 1); else arr.push(name);
    render();
  }));
  document.querySelectorAll('[data-reg-next]').forEach(el => el.addEventListener('click', () => {
    if (el.hasAttribute('disabled')) return;
    state.registerStep = Math.min(2, state.registerStep + 1);
    render();
  }));
  document.querySelectorAll('[data-reg-prev]').forEach(el => el.addEventListener('click', () => {
    state.registerStep = Math.max(1, state.registerStep - 1);
    render();
  }));
  document.querySelectorAll('[data-reg-finish]').forEach(el => el.addEventListener('click', async () => {
    if (el.hasAttribute('disabled')) return;
    const r = state.register;
    const occupation = ({student:'Estudiante',teacher:'Docente',pro:'Profesional',curious:'Curioso'})[r.role] || 'Estudiante';
    // Sin Supabase → flujo demo (como antes).
    if (!window.DB || !DB.enabled()) {
      state.profile = {
        first: r.first || state.profile.first, last: r.last || state.profile.last,
        email: r.email || state.profile.email, occupation, interests: state.profile.interests
      };
      state.registerStep = 3; render(); return;
    }
    const orig = el.innerHTML;
    el.disabled = true; el.style.opacity = '0.6'; el.style.cursor = 'wait';
    el.innerHTML = 'Creando cuenta…';
    const fullName = (r.first + ' ' + r.last).trim();
    const res = await DB.auth.signUp(r.email, r.password, { first: r.first, last: r.last, full_name: fullName, occupation });
    if (!res.ok) {
      el.disabled = false; el.style.opacity = ''; el.style.cursor = ''; el.innerHTML = orig;
      state.registerError = /already registered|already exists/i.test(res.reason)
        ? 'Ese email ya está registrado. Probá iniciar sesión.'
        : ('No se pudo crear la cuenta: ' + res.reason);
      render(); return;
    }
    // Cuenta creada. Si Supabase exige confirmar email, no hay sesión todavía.
    state.profile = { first: r.first, last: r.last, email: r.email, occupation, interests: state.profile.interests, avatar: '' };
    if (!res.session) {
      el.disabled = false; el.style.opacity = ''; el.style.cursor = ''; el.innerHTML = orig;
      state.registerError = 'Cuenta creada. Confirmá tu email para poder iniciar sesión.';
      render(); return;
    }
    if (res.user) { applyAuthUser(res.user); DB.profiles.upsert(res.user.id, state.profile); }
    state.registerError = '';
    state.registerStep = 3;
    render();
  }));

  // Onboarding
  document.querySelectorAll('[data-onb-next]').forEach(el => el.addEventListener('click', () => { state.onboardingStep = Math.min(4, state.onboardingStep + 1); render(); }));
  document.querySelectorAll('[data-onb-prev]').forEach(el => el.addEventListener('click', () => { state.onboardingStep = Math.max(1, state.onboardingStep - 1); render(); }));
  // Terminar / saltar onboarding → marcarlo como visto (en la cuenta) e ir al panel.
  document.querySelectorAll('[data-action="onb-done"]').forEach(el => el.addEventListener('click', () => { markOnboarded(); navigate('home'); }));

  // Profile
  document.querySelectorAll('[data-profile-tab]').forEach(el => el.addEventListener('click', () => { state.profileTab = el.getAttribute('data-profile-tab'); render(); }));
  document.querySelectorAll('[data-profile-key]').forEach(el => {
    el.addEventListener('input', () => { state.profile[el.getAttribute('data-profile-key')] = el.value; });
    el.addEventListener('change', () => { state.profile[el.getAttribute('data-profile-key')] = el.value; });
  });
  document.querySelectorAll('[data-profile-interest]').forEach(el => el.addEventListener('click', () => {
    const name = el.getAttribute('data-profile-interest');
    const arr = state.profile.interests;
    const i = arr.indexOf(name);
    if (i >= 0) arr.splice(i, 1); else arr.push(name);
    render();
  }));

  // Scenario cards → open detail (on scenarios screen, shift-click or dedicated button)
  document.querySelectorAll('[data-detail-scenario]').forEach(el => el.addEventListener('click', (e) => {
    e.stopPropagation();
    state.detailScenario = el.getAttribute('data-detail-scenario');
    navigate('detail');
  }));

  // Simulate from detail
  document.querySelectorAll('[data-action="sim-from-detail"]').forEach(el => el.addEventListener('click', () => {
    state.selectedScenario = state.detailScenario;
    navigate('config');
  }));

  // Profile link in user footer
  document.querySelectorAll('[data-user-action]').forEach(el => el.addEventListener('click', async () => {
    const action = el.getAttribute('data-user-action');
    if (action === 'profile') navigate('profile');
    if (action === 'logout') {
      if (window.DB && DB.enabled()) { await DB.auth.signOut(); }
      navigate('login');
    }
  }));

  // Botones "Continuar con Google" (login + registro) → Supabase OAuth.
  // Preferencias (selects) + autoguardar (toggle) + notificaciones (toggles).
  // Estado en state.prefs / state.notifs; se persiste en localStorage.
  document.querySelectorAll('[data-pref-select]').forEach(el => el.addEventListener('change', () => {
    state.prefs[el.getAttribute('data-pref-select')] = el.value;
    saveState();
  }));
  document.querySelectorAll('[data-pref-toggle]').forEach(el => el.addEventListener('click', () => {
    const k = el.getAttribute('data-pref-toggle');
    state.prefs[k] = !state.prefs[k];
    el.classList.toggle('on', state.prefs[k]);
    saveState();
  }));
  document.querySelectorAll('[data-notif-toggle]').forEach(el => el.addEventListener('click', () => {
    const k = el.getAttribute('data-notif-toggle');
    state.notifs[k] = !state.notifs[k];
    el.classList.toggle('on', state.notifs[k]);
    saveState();
  }));

  document.querySelectorAll('.auth-oauth-btn').forEach(el => el.addEventListener('click', async () => {
    // Supabase apagado → degradar al flujo demo sin romper.
    if (!window.DB || !DB.enabled()) { navigate('home'); return; }
    const original = el.innerHTML;
    el.disabled = true;
    el.style.opacity = '0.6';
    el.style.cursor = 'wait';
    el.innerHTML = `${GOOGLE_SVG} Conectando con Google…`;
    const res = await DB.auth.signInGoogle(homeUrl());
    if (!res || !res.ok) {
      // signInWithOAuth normalmente redirige y nunca vuelve acá; si volvió,
      // es que falló (proveedor mal configurado o redirect no permitido).
      el.disabled = false;
      el.style.opacity = '';
      el.style.cursor = '';
      el.innerHTML = original;
      alert('No se pudo conectar con Google.\n\nVerificá que el proveedor Google esté habilitado en Supabase (Authentication → Providers) y que esta URL esté en la lista de Redirect URLs.');
    }
  }));
}


// Expose for app.js router
window.EXTRA_SCREENS = {
  login: loginHTML,
  onboarding: onboardingHTML,
  profile: profileHTML,
  detail: detailHTML,
  about: aboutHTML,
  loading: loadingHTML,
  teachers: teachersHTML,
  glossary: glossaryHTML,
  forgot: forgotHTML,
  aula: aulaHTML,
  institucion: institucionHTML
};
window.STANDALONE_SCREENS = new Set(['login', 'onboarding', 'loading', 'forgot']);
window.EXTRA_TITLES = {
  login: 'Iniciar sesión',
  onboarding: 'Bienvenida',
  profile: 'Perfil',
  detail: 'Detalle de escenario',
  about: 'Acerca de',
  loading: 'Simulando',
  teachers: 'Para docentes',
  glossary: 'Glosario',
  forgot: 'Recuperar contraseña',
  aula: 'Mi aula',
  institucion: 'Institución'
};
window.wireExtraEvents = wireExtraEvents;

// ===== Núcleo: datos, escenarios, simulación, ruteo, eventos, tweaks, boot =====


// ---- Icons ----
const icon = (name, size=16) => {
  const paths = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    bars: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    compare: '<line x1="12" y1="2" x2="12" y2="22"/><polyline points="17 7 12 2 7 7"/><polyline points="7 17 12 22 17 17"/>',
    logo: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    arrowR: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    arrowL: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    wand: '<path d="M15 4V2m0 14v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9h0M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/>',
    sparkle: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>'
  };
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
};

// ---- Logo de marca (barras en tono de marca + flecha de acento) ----
// Las barras usan currentColor (= var(--brand) dentro de .brand-mark) y la
// flecha var(--accent), así se adapta solo a los 4 temas.
const brandLogo = (size = 20) => `<svg viewBox="18 22 66 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="24" y="54" width="14" height="28" rx="2.5" fill="currentColor" opacity="0.5"/>
  <rect x="43" y="42" width="14" height="40" rx="2.5" fill="currentColor" opacity="0.75"/>
  <rect x="62" y="26" width="14" height="56" rx="2.5" fill="currentColor"/>
  <path d="M22 80 L74 42" stroke="var(--accent)" stroke-width="7" stroke-linecap="round"/>
  <path d="M64 36 L80 34 L74 49 Z" fill="var(--accent)"/>
</svg>`;

// ---- Estado vacío (reutilizable: comparación, historial, etc.) ----
function emptyState(opts) {
  opts = opts || {};
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon(opts.icon || 'info', 26)}</div>
      <h3 class="empty-state-title">${opts.title || ''}</h3>
      <p class="empty-state-text">${opts.text || ''}</p>
      ${opts.actions ? `<div class="empty-state-actions">${opts.actions}</div>` : ''}
    </div>`;
}

// ---- Multi-page routing ----
const PAGE_MAP = {
  home:        'Geolytics.html',
  scenarios:   'escenarios.html',
  config:      'configuracion.html',
  loading:     'loading.html',
  results:     'resultados.html',
  history:     'historial.html',
  compare:     'comparar.html',
  profile:     'perfil.html',
  about:       'acerca.html',
  teachers:    'docentes.html',
  login:       'login.html',
  detail:      'detalle.html',
  onboarding:  'onboarding.html',
  glossary:    'glosario.html',
  forgot:      'recuperar.html',
  aula:        'aula.html',
  institucion: 'institucion.html',
};

// ---- Persistent state (sobrevive entre páginas) ----
const SAVED = (() => {
  try { return JSON.parse(localStorage.getItem('geolytics-state') || '{}'); }
  catch { return {}; }
})();

// ---- State ----
const state = {
  screen: window.__INITIAL_SCREEN || 'home',
  selectedScenario: 'crisis',
  country: 'AR',
  intensity: 75, // 0-100
  duration: 50,  // 0-100 (3mo, 6mo, 12mo, 24mo)
  vars: { sp500: true, usdars: true, commodities: true, inflation: false, unemployment: false },
  history: [
    { id: 1, scenario: 'crisis', intensityPct: 85, durIdx: 2, date: '05/04/2026', saved: true, name: 'Crisis económica' },
    { id: 2, scenario: 'conflict', intensityPct: 55, durIdx: 1, date: '03/04/2026', saved: false, name: 'Conflicto internacional' },
    { id: 3, scenario: 'pandemic', intensityPct: 80, durIdx: 3, date: '01/04/2026', saved: true, name: 'Pandemia' },
    { id: 4, scenario: 'oil', intensityPct: 95, durIdx: 0, date: '28/03/2026', saved: false, name: 'Shock petrolero' },
    { id: 5, scenario: 'rates', intensityPct: 60, durIdx: 2, date: '22/03/2026', saved: false, name: 'Suba de tasas' }
  ],
  compareA: 1,
  compareB: 2,
  chartMode: 'line',
  chartModes: {},
  histFilter: 'all',
  histSearch: ''
};

// Merge persisted state from localStorage (sobrevive entre páginas)
Object.assign(state, SAVED);
if (window.__INITIAL_SCREEN) state.screen = window.__INITIAL_SCREEN;


// SIDEBAR
// ============================================================
function sidebarHTML() {
  const items = [
    { id: 'home', label: 'Inicio', icon: 'home' },
    { id: 'scenarios', label: 'Escenarios', icon: 'grid', count: SCENARIOS.length },
    { id: 'config', label: 'Configuración', icon: 'sliders' },
    { id: 'results', label: 'Resultados', icon: 'bars' },
    { id: 'history', label: 'Mis simulaciones', icon: 'clock', count: state.history.length },
    { id: 'compare', label: 'Comparación', icon: 'compare' }
  ];
  const helpItems = [
    { id: 'glossary', label: 'Glosario', icon: 'book' },
    { id: 'about', label: 'Acerca de', icon: 'info' },
    { id: 'teachers', label: 'Para docentes', icon: 'sparkle' }
  ];
  const __av = state.profile && state.profile.avatar;
  const __avStyle = __av
    ? `cursor:pointer; background-image:url('${__av}'); background-size:cover; background-position:center; color:transparent; text-indent:-9999px;`
    : 'cursor:pointer;';
  return `
    <aside class="side" data-screen-label="Sidebar">
      <div class="brand">
        <div class="brand-mark">${brandLogo(20)}</div>
        <div>
          <div class="brand-name" style="font-size:22px; letter-spacing:-0.02em; line-height:1;">Geolytics</div>
        </div>
      </div>
      <nav class="nav">
        <div class="nav-heading">Navegación</div>
        ${items.map(it => `
          <button class="nav-item ${state.screen === it.id ? 'active' : ''}" data-nav="${it.id}">
            ${icon(it.icon, 16)}
            <span>${it.label}</span>
            ${it.count ? `<span class="nav-count">${it.count}</span>` : ''}
          </button>
        `).join('')}
        <div class="nav-heading" style="margin-top:18px;">Ayuda</div>
        ${helpItems.map(it => `
          <button class="nav-item ${state.screen === it.id ? 'active' : ''}" data-nav="${it.id}">
            ${icon(it.icon, 16)}
            <span>${it.label}</span>
          </button>
        `).join('')}
        <div class="nav-heading" style="margin-top:18px;">Recientes</div>
        ${state.history.slice(0, 3).map(h => {
          const sc = getScenario(h.scenario);
          return `<button class="nav-item" data-nav-history="${h.id}" style="font-size:12.5px;">
            <span style="font-size:14px;">${sc.glyph}</span>
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${h.name}</span>
          </button>`;
        }).join('')}
      </nav>
      <div class="side-footer">
        <div class="user-row">
          <div class="avatar" data-user-action="profile" style="${__avStyle}">${(state.profile?.first?.[0] || 'T') + (state.profile?.last?.[0] || 'F')}</div>
          <div data-user-action="profile" style="cursor:pointer; flex:1; min-width:0;">
            <div class="user-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${state.profile?.first || 'Tomás'} ${(state.profile?.last || 'Fernández')[0]}.</div>
            <div class="user-role">${state.profile?.occupation || 'Estudiante'}</div>
          </div>
          <button class="icon-btn" data-user-action="logout" title="Cerrar sesión" style="width:28px; height:28px; margin-left:auto; background:transparent; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>
  `;
}

// ============================================================
// TOPBAR
// ============================================================
const TITLES = {
  home: 'Inicio',
  scenarios: 'Escenarios',
  config: 'Configuración',
  results: 'Resultados',
  history: 'Mis simulaciones',
  compare: 'Comparación',
  profile: 'Perfil',
  detail: 'Detalle de escenario',
  about: 'Acerca de',
  teachers: 'Para docentes'
};

function topbarHTML() {
  const crumbs = {
    home: ['Panel'],
    scenarios: ['Simulación', 'Escenarios'],
    config: ['Simulación', 'Escenarios', 'Configuración'],
    results: ['Simulación', 'Resultados'],
    history: ['Biblioteca', 'Mis simulaciones'],
    compare: ['Biblioteca', 'Comparación'],
    profile: ['Cuenta', 'Perfil'],
    detail: ['Simulación', 'Escenarios', 'Detalle'],
    about: ['Ayuda', 'Acerca de'],
    glossary: ['Ayuda', 'Glosario'],
    teachers: ['Ayuda', 'Para docentes'],
    aula: ['Para docentes', 'Mi aula'],
    institucion: ['Para docentes', 'Institución']
  }[state.screen] || ['Panel'];
  return `
    <div class="topbar">
      <button class="mobile-menu-btn" data-action="toggle-sidebar" aria-label="Abrir menú">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div class="crumbs">
        ${crumbs.map((c, i) => i === crumbs.length - 1
          ? `<strong>${c}</strong>`
          : `<span>${c}</span><span class="slash">/</span>`).join('')}
      </div>
      <div class="top-actions">
        <button class="icon-btn" data-action="toggle-dark" aria-label="Cambiar modo claro/oscuro" title="Modo claro / oscuro">${icon(isDark() ? 'sun' : 'moon', 15)}</button>
        <div class="search" data-action="open-search">
          ${icon('search', 14)}
          <span>Buscar escenario, variable…</span>
        </div>
        <div class="notif-wrap" style="position:relative;">
          <button class="icon-btn" aria-label="Notificaciones" data-action="toggle-notif">
            ${icon('bell', 15)}
            <span class="pip"></span>
          </button>
          <div id="notif-panel" style="display:none; position:absolute; top:calc(100% + 10px); right:0; width:344px; background:var(--surface,#fff); border:1px solid var(--line); border-radius:14px; box-shadow:0 14px 44px rgba(0,0,0,0.16); z-index:300; overflow:hidden;">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:13px 15px; border-bottom:1px solid var(--line);">
              <strong style="font-size:14px;">Notificaciones</strong>
              <button data-action="mark-read-notif" style="font:inherit; font-size:12px; color:var(--brand); background:none; border:none; cursor:pointer; padding:0;">Marcar como leídas</button>
            </div>
            <div style="max-height:380px; overflow-y:auto;">
              ${NOTIFICATIONS.map(n => `
                <div ${n.unread ? 'data-unread-row="1"' : ''} style="display:flex; gap:11px; padding:12px 15px; border-bottom:1px solid var(--line); ${n.unread ? 'background:rgba(0,0,0,0.025);' : ''}">
                  <div style="flex-shrink:0; width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.05); color:${n.color};">${icon(n.icon, 15)}</div>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:13px; font-weight:600;">${n.title}</div>
                    <div style="font-size:12px; color:var(--muted); margin-top:2px; line-height:1.4;">${n.body}</div>
                    <div style="font-size:10.5px; color:var(--muted); margin-top:4px; font-family:var(--font-mono);">${n.time}</div>
                  </div>
                  ${n.unread ? '<span data-unread-dot="1" style="flex-shrink:0; width:7px; height:7px; border-radius:50%; background:var(--brand); margin-top:5px;"></span>' : ''}
                </div>`).join('')}
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" data-action="new-sim">
          ${icon('sparkle', 14)}
          Nueva simulación
        </button>
      </div>
    </div>
  `;
}


// ROUTER
// ============================================================
function render() {
  // Recordamos el scroll del canvas para conservarlo en re-renders dentro de la
  // MISMA pantalla (ej. cambiar el tipo de gráfico). navigate()/popstate lo
  // resetean a 0 al cambiar de pantalla, así que esto no afecta esos casos.
  const __prevCanvas = document.querySelector('.canvas');
  const __prevScroll = __prevCanvas ? __prevCanvas.scrollTop : 0;
  const builtins = {
    home: homeHTML,
    scenarios: scenariosHTML,
    config: configHTML,
    results: resultsHTML,
    history: historyHTML,
    compare: compareHTML
  };
  const extra = window.EXTRA_SCREENS || {};
  const builder = builtins[state.screen] || extra[state.screen] || homeHTML;
  const screenHTML = builder();

  const standalone = window.STANDALONE_SCREENS || new Set();
  if (standalone.has(state.screen)) {
    document.getElementById('app').innerHTML = `<main class="main main-standalone"><div class="canvas standalone-canvas">${screenHTML}</div></main>`;
    document.getElementById('app').classList.add('app-standalone');
  } else {
    document.getElementById('app').classList.remove('app-standalone');
    document.getElementById('app').innerHTML = sidebarHTML() + `
      <main class="main">
        ${topbarHTML()}
        <div class="canvas">${screenHTML}</div>
      </main>
      <div class="side-backdrop" data-action="close-sidebar"></div>
    `;
  }
  wireEvents();
  if (window.wireExtraEvents) window.wireExtraEvents();
  // Restaurar la posición de scroll (ver arriba): evita el "salto al tope" al
  // cambiar de tipo de gráfico u otras actualizaciones in situ.
  if (__prevScroll) {
    const __newCanvas = document.querySelector('.canvas');
    if (__newCanvas) __newCanvas.scrollTop = __prevScroll;
  }
  // Título de la pestaña según la pantalla. Antes de entrar (login/registro/
  // recuperar/bienvenida) mostramos solo "Geolytics".
  try {
    var __noSuffix = ['login', 'forgot', 'onboarding', 'loading'];
    var __pretty = (window.EXTRA_TITLES && window.EXTRA_TITLES[state.screen]) || TITLES[state.screen];
    document.title = (__noSuffix.indexOf(state.screen) !== -1 || !__pretty) ? 'Geolytics' : ('Geolytics — ' + __pretty);
  } catch (e) {}
  // persist screen (legacy key, only useful when no __INITIAL_SCREEN)
  if (!window.__INITIAL_SCREEN) {
    try { localStorage.setItem('geolytics.screen', state.screen); } catch(e) {}
  }
}

// Re-render DIFERIDO para hidrataciones asíncronas (Supabase).
// Problema: si un render() asíncrono reconstruye #app justo entre el mousedown
// y el mouseup de un click, el botón se reemplaza bajo el cursor y el click se
// pierde → "a veces el botón Inicio no responde". Solución: si el usuario está
// presionando, esperamos a que suelte para re-renderizar.
let __pendingAsyncRender = false;
window.__pointerHeld = false;
document.addEventListener('pointerdown', () => { window.__pointerHeld = true; }, true);
function __flushAsyncRender() {
  window.__pointerHeld = false;
  if (__pendingAsyncRender) { __pendingAsyncRender = false; render(); }
}
document.addEventListener('pointerup', __flushAsyncRender, true);
document.addEventListener('pointercancel', __flushAsyncRender, true);
function renderAsync() {
  if (window.__pointerHeld) { __pendingAsyncRender = true; return; }
  render();
}

function navigate(screen) {
  // Persist state before switching
  saveState();
  // Empezar siempre el flujo de recuperación desde el formulario (no en éxito)
  if (screen === 'forgot') { state.forgotSent = false; }
  // Contar comparaciones reales (para el resumen del perfil), solo al entrar.
  if (screen === 'compare' && state.screen !== 'compare') { state.compareCount = (state.compareCount || 0) + 1; }
  // SPA: todas las pantallas existen como builder en este archivo, así que
  // cambiamos de pantalla EN MEMORIA (sin recargar la página) → sin parpadeo.
  // La URL se sincroniza con pushState para que el botón Atrás y el refresco
  // sigan funcionando (cada archivo .html bootea en su pantalla correspondiente).
  state.screen = screen;
  render();
  document.querySelector('.canvas')?.scrollTo({ top: 0 });
  const url = PAGE_MAP[screen];
  if (url && url !== location.pathname.split('/').pop()) {
    try { history.pushState({ screen: screen }, '', url); } catch (e) {}
  }
  if (screen === 'loading') {
    setTimeout(() => { if (state.screen === 'loading') navigate('results'); }, 1500);
  }
}

// Botón Atrás / Adelante del navegador → cambiar de pantalla sin recargar
const FILE_TO_SCREEN = Object.fromEntries(
  Object.entries(PAGE_MAP).map(([s, f]) => [f, s])
);
window.addEventListener('popstate', (e) => {
  const file = location.pathname.split('/').pop();
  const screen = (e.state && e.state.screen) || FILE_TO_SCREEN[file] || state.screen;
  state.screen = screen;
  render();
  document.querySelector('.canvas')?.scrollTo({ top: 0 });
});

function saveState() {
  try {
    const persist = {
      selectedScenario: state.selectedScenario,
      country: state.country,
      intensity: state.intensity,
      duration: state.duration,
      variables: state.variables,
      history: state.history,
      profile: state.profile,
      profileTab: state.profileTab,
      authMode: state.authMode,
      detailScenario: state.detailScenario,
      compareA: state.compareA,
      compareB: state.compareB,
      chartMode: state.chartMode,
      chartModes: state.chartModes,
      histFilter: state.histFilter,
      prefs: state.prefs,
      notifs: state.notifs,
      compareCount: state.compareCount,
    };
    localStorage.setItem('geolytics-state', JSON.stringify(persist));
  } catch {}
}
window.addEventListener('beforeunload', saveState);

// ============================================================
// EVENT WIRING
// ============================================================
function wireEvents() {
  // Navigation buttons
  // Navegación por DELEGACIÓN (un solo listener en document, una sola vez).
  // Sobrevive a los re-render: aunque el DOM se reconstruya en medio de un
  // click (p.ej. por un evento de sesión de Supabase), el click igual funciona.
  if (!window.__navDelegated) {
    window.__navDelegated = true;
    document.addEventListener('click', (e) => {
      const navEl = e.target.closest('[data-nav]');
      if (navEl) {
        e.preventDefault();
        navigate(navEl.getAttribute('data-nav'));
        return;
      }
      const histEl = e.target.closest('[data-nav-history]');
      if (histEl) {
        const id = parseInt(histEl.getAttribute('data-nav-history'));
        const h = state.history.find(x => x.id === id);
        if (h) {
          state.selectedScenario = h.scenario;
          state.intensity = h.intensityPct;
          state.duration = h.durIdx * 25;
          navigate('results');
        }
      }
    });
  }

  // Scenario picks (from scenarios screen or home strip)
  document.querySelectorAll('[data-pick-scenario]').forEach(el => {
    el.addEventListener('click', () => {
      state.selectedScenario = el.getAttribute('data-pick-scenario');
      // If on home, jump to config; if on scenarios, just update
      if (state.screen === 'scenarios') {
        render();
      } else {
        navigate('config');
      }
    });
  });

  // Run simulation
  document.querySelectorAll('[data-action="run-sim"]').forEach(el => {
    el.addEventListener('click', () => {
      // add to history
      const sc = getScenario(state.selectedScenario);
      const rec = {
        id: Date.now(),
        scenario: state.selectedScenario,
        country: state.country,
        intensityPct: state.intensity,
        durIdx: durIdx(state.duration),
        date: new Date().toLocaleDateString('es-AR'),
        saved: false,
        name: sc.name
      };
      state.history.unshift(rec);
      // Sync a Supabase (fire-and-forget; si falla, queda en localStorage)
      if (window.DB) DB.simulations.add(rec);
      navigate('loading');
    });
  });

  document.querySelectorAll('[data-action="new-sim"]').forEach(el => {
    el.addEventListener('click', () => navigate('scenarios'));
  });

  // Mobile sidebar toggle
  document.querySelectorAll('[data-action="toggle-sidebar"]').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelector('.side')?.classList.add('open');
      document.querySelector('.side-backdrop')?.classList.add('show');
    });
  });
  document.querySelectorAll('[data-action="close-sidebar"]').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelector('.side')?.classList.remove('open');
      document.querySelector('.side-backdrop')?.classList.remove('show');
    });
  });

  // Modo claro / oscuro (botón sol/luna del topbar)
  document.querySelectorAll('[data-action="toggle-dark"]').forEach(el => el.addEventListener('click', toggleDark));

  // Sliders (config)
  const intSlider = document.getElementById('intensity-slider');
  if (intSlider) {
    intSlider.addEventListener('input', (e) => {
      state.intensity = parseInt(e.target.value);
      e.target.style.setProperty('--val', state.intensity + '%');
      document.getElementById('intensity-chip').textContent = intensityLabel(state.intensity);
      updatePreview();
    });
  }
  const durSlider = document.getElementById('duration-slider');
  if (durSlider) {
    durSlider.addEventListener('input', (e) => {
      state.duration = parseInt(e.target.value);
      const idx = durIdx(state.duration);
      e.target.style.setProperty('--val', ((idx / 3) * 100) + '%');
      document.getElementById('duration-chip').textContent = DURATIONS[idx] + ' meses';
      updatePreview();
    });
  }

  // Country selector (config) — datos reales World Bank API
  const countrySel = document.getElementById('country-select');
  if (countrySel) {
    countrySel.addEventListener('change', (e) => {
      state.country = e.target.value;
      updateWBPanel();
    });
    updateWBPanel(); // carga inicial
  }

  // Resultados: anclar la proyección a los datos reales del país
  updateResultsRealData();

  // Recuperar contraseña
  document.querySelectorAll('[data-action="forgot-send"]').forEach(el => {
    el.addEventListener('click', () => {
      const input = document.getElementById('forgot-email');
      state.forgotEmail = (input && input.value.trim()) || '';
      state.forgotSent = true;
      render();
    });
  });
  document.querySelectorAll('[data-action="forgot-resend"]').forEach(el => {
    el.addEventListener('click', () => { state.forgotSent = true; render(); });
  });

  // Notificaciones (campanita del topbar)
  const notifBtn = document.querySelector('[data-action="toggle-notif"]');
  const notifPanel = document.getElementById('notif-panel');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.style.display = notifPanel.style.display === 'block' ? 'none' : 'block';
    });
    const markRead = notifPanel.querySelector('[data-action="mark-read-notif"]');
    if (markRead) markRead.addEventListener('click', () => {
      notifPanel.querySelectorAll('[data-unread-dot]').forEach(d => d.remove());
      notifPanel.querySelectorAll('[data-unread-row]').forEach(r => { r.style.background = 'transparent'; });
      const pip = notifBtn.querySelector('.pip');
      if (pip) pip.style.display = 'none';
    });
  }
  // Cerrar el panel al hacer click afuera (se cablea una sola vez)
  if (!window.__notifOutsideWired) {
    window.__notifOutsideWired = true;
    document.addEventListener('click', (e) => {
      const p = document.getElementById('notif-panel');
      const b = document.querySelector('[data-action="toggle-notif"]');
      if (p && b && !p.contains(e.target) && !b.contains(e.target)) p.style.display = 'none';
    });
  }

  // Variable toggle
  document.querySelectorAll('[data-toggle-var]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-toggle-var');
      state.vars[id] = !state.vars[id];
      el.classList.toggle('on', state.vars[id]);
      el.querySelector('.vtrend').textContent = state.vars[id] ? 'OBSERVANDO' : '—';
      // update count
      const head = document.querySelector('.var-list');
      if (head) {
        const counter = head.closest('.config-section').querySelector('.config-section-head span');
        if (counter) counter.textContent = Object.values(state.vars).filter(Boolean).length + ' de ' + VARIABLES.length;
      }
    });
  });

  // Chart mode toggle (por gráfico si trae data-chart-key; si no, global)
  document.querySelectorAll('[data-chart-mode]').forEach(el => {
    el.addEventListener('click', () => {
      const mode = el.getAttribute('data-chart-mode');
      const key = el.getAttribute('data-chart-key');
      if (key) {
        state.chartModes = state.chartModes || {};
        state.chartModes[key] = mode;
      } else {
        state.chartMode = mode;
      }
      saveState();
      render();
    });
  });

  // Comparar: elegir libremente qué simulación va en A y en B
  document.querySelectorAll('[data-compare-pick]').forEach(el => {
    el.addEventListener('change', () => {
      const which = el.getAttribute('data-compare-pick');
      const id = parseInt(el.value);
      if (which === 'a') state.compareA = id;
      else state.compareB = id;
      saveState();
      render();
    });
  });

  // History bookmark
  document.querySelectorAll('[data-hist-save]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(el.getAttribute('data-hist-save'));
      const h = state.history.find(x => x.id === id);
      if (h) {
        h.saved = !h.saved;
        if (window.DB) DB.simulations.setSaved(h.id, h.saved);
        saveState();
        render();
      }
    });
  });
  // History filter
  document.querySelectorAll('[data-hist-filter]').forEach(el => {
    el.addEventListener('click', () => {
      state.histFilter = el.getAttribute('data-hist-filter');
      render();
    });
  });
  // History search — filtra en vivo a medida que se escribe
  const histSearchEl = document.getElementById('hist-search');
  if (histSearchEl) {
    histSearchEl.addEventListener('input', () => {
      state.histSearch = histSearchEl.value;
      const caret = histSearchEl.selectionStart;
      render();
      const again = document.getElementById('hist-search');
      if (again) { again.focus(); try { again.setSelectionRange(caret, caret); } catch (e) {} }
    });
  }
  // History open -> results
  document.querySelectorAll('[data-hist-open]').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt(el.getAttribute('data-hist-open'));
      const h = state.history.find(x => x.id === id);
      if (h) {
        state.selectedScenario = h.scenario;
        state.intensity = h.intensityPct;
        state.duration = h.durIdx * 25;
        navigate('results');
      }
    });
  });
  // History compare -> compare screen with that as A, another as B
  document.querySelectorAll('[data-hist-compare]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(el.getAttribute('data-hist-compare'));
      state.compareA = id;
      state.compareB = state.history.find(h => h.id !== id)?.id || state.compareB;
      navigate('compare');
    });
  });

  // ===== Exportar resultados (PDF / JPG / PNG) =====
  const exportBtn = document.querySelector('[data-action="toggle-export"]');
  const exportMenu = document.getElementById('export-menu');
  if (exportBtn && exportMenu) {
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle('open');
    });
    if (!window.__exportOutsideWired) {
      window.__exportOutsideWired = true;
      document.addEventListener('click', (e) => {
        const m = document.getElementById('export-menu');
        const b = document.querySelector('[data-action="toggle-export"]');
        if (m && b && !m.contains(e.target) && !b.contains(e.target)) m.classList.remove('open');
      });
    }
  }
  document.querySelectorAll('[data-action="export-pdf"]').forEach(el => el.addEventListener('click', () => {
    exportMenu?.classList.remove('open');
    exportResultsPDF();
  }));
  document.querySelectorAll('[data-action="export-jpg"]').forEach(el => el.addEventListener('click', () => {
    exportMenu?.classList.remove('open');
    exportResultsImage('jpg');
  }));
  document.querySelectorAll('[data-action="export-png"]').forEach(el => el.addEventListener('click', () => {
    exportMenu?.classList.remove('open');
    exportResultsImage('png');
  }));

  // Guardar resultado actual en el historial (marca favorito).
  document.querySelectorAll('[data-action="save-result"]').forEach(el => el.addEventListener('click', () => {
    const sc = getScenario(state.selectedScenario);
    const di = durIdx(state.duration);
    // ¿Ya existe una simulación con estos mismos parámetros?
    let rec = state.history.find(h => h.scenario === state.selectedScenario
      && h.intensityPct === state.intensity && h.durIdx === di && (h.country || 'AR') === state.country);
    if (rec) {
      rec.saved = true;
      if (window.DB) DB.simulations.setSaved(rec.id, true);
    } else {
      rec = {
        id: Date.now(), scenario: state.selectedScenario, country: state.country,
        intensityPct: state.intensity, durIdx: di,
        date: new Date().toLocaleDateString('es-AR'), saved: true, name: sc.name
      };
      state.history.unshift(rec);
      if (window.DB) DB.simulations.add(rec);
    }
    saveState();
    el.innerHTML = `${icon('check', 14)} Guardada`;
    el.disabled = true;
    el.style.opacity = '0.85';
    exportToast('Simulación guardada en “Mis simulaciones”');
  }));

  // Perfil — guardar / cancelar
  document.querySelectorAll('[data-action="profile-save"]').forEach(el => el.addEventListener('click', async () => {
    // Los valores ya están en state.profile (data-profile-key los actualiza al tipear).
    saveState();
    if (window.DB && DB.enabled() && window.geoUser) {
      const ok = await DB.profiles.upsert(window.geoUser.id, state.profile);
      exportToast(ok ? 'Perfil guardado en tu cuenta' : 'Guardado en este dispositivo (no se pudo sincronizar)');
    } else {
      exportToast('Cambios de perfil guardados');
    }
  }));
  document.querySelectorAll('[data-action="profile-cancel"]').forEach(el => el.addEventListener('click', () => {
    // Revertir a lo último persistido en localStorage.
    try {
      const saved = JSON.parse(localStorage.getItem('geolytics-state') || '{}');
      if (saved.profile) state.profile = saved.profile;
    } catch (e) {}
    render();
  }));

  // Buscador (topbar) + atajo Cmd/Ctrl+K
  document.querySelectorAll('[data-action="open-search"]').forEach(el => el.addEventListener('click', openSearch));
  if (!window.__searchKeyWired) {
    window.__searchKeyWired = true;
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openSearch();
      }
    });
  }
}

// ---- Buscador / paleta de comandos ----
function openSearch() {
  if (document.getElementById('cmd-overlay')) return;
  const PAGES = [
    { id: 'home', label: 'Inicio', icon: 'home' },
    { id: 'scenarios', label: 'Escenarios', icon: 'grid' },
    { id: 'config', label: 'Configuración', icon: 'sliders' },
    { id: 'results', label: 'Resultados', icon: 'bars' },
    { id: 'history', label: 'Mis simulaciones', icon: 'clock' },
    { id: 'compare', label: 'Comparación', icon: 'compare' },
    { id: 'glossary', label: 'Glosario', icon: 'book' },
    { id: 'about', label: 'Acerca de', icon: 'info' },
    { id: 'teachers', label: 'Para docentes', icon: 'sparkle' },
    { id: 'profile', label: 'Perfil', icon: 'home' }
  ];
  const overlay = document.createElement('div');
  overlay.id = 'cmd-overlay';
  overlay.className = 'cmd-overlay';
  overlay.innerHTML = `
    <div class="cmd-box" role="dialog" aria-label="Buscar">
      <div class="cmd-input-row">
        ${icon('search', 16)}
        <input id="cmd-input" class="cmd-input" placeholder="Buscar escenario o sección…" autocomplete="off" spellcheck="false">
        <kbd class="cmd-esc">esc</kbd>
      </div>
      <div class="cmd-results" id="cmd-results"></div>
    </div>`;
  document.body.appendChild(overlay);
  const input = overlay.querySelector('#cmd-input');
  const resultsEl = overlay.querySelector('#cmd-results');
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') { const first = resultsEl.querySelector('.cmd-item'); if (first) first.click(); }
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);

  function renderResults(q) {
    q = (q || '').trim().toLowerCase();
    const match = (s) => !q || (s || '').toLowerCase().includes(q);
    const scen = SCENARIOS.filter(s => match(s.name) || match(s.desc) || match(s.tag));
    const pages = PAGES.filter(p => match(p.label));
    let html = '';
    if (scen.length) {
      html += `<div class="cmd-group">Escenarios</div>` + scen.map(s => `
        <button class="cmd-item" data-cmd-scenario="${s.id}">
          <span class="cmd-glyph">${s.glyph}</span>
          <span class="cmd-item-main"><strong>${s.name}</strong><em>${s.desc || ''}</em></span>
          <span class="cmd-tag">${s.tag || ''}</span>
        </button>`).join('');
    }
    if (pages.length) {
      html += `<div class="cmd-group">Ir a</div>` + pages.map(p => `
        <button class="cmd-item" data-cmd-nav="${p.id}">
          <span class="cmd-glyph cmd-glyph-icon">${icon(p.icon, 15)}</span>
          <span class="cmd-item-main"><strong>${p.label}</strong></span>
        </button>`).join('');
    }
    if (!html) html = `<div class="cmd-empty">Sin resultados para “${q}”</div>`;
    resultsEl.innerHTML = html;
    resultsEl.querySelectorAll('[data-cmd-scenario]').forEach(b => b.addEventListener('click', () => {
      state.selectedScenario = b.getAttribute('data-cmd-scenario');
      state.detailScenario = state.selectedScenario;
      close();
      navigate('detail');
    }));
    resultsEl.querySelectorAll('[data-cmd-nav]').forEach(b => b.addEventListener('click', () => {
      close();
      navigate(b.getAttribute('data-cmd-nav'));
    }));
  }
  input.addEventListener('input', () => renderResults(input.value));
  renderResults('');
  setTimeout(() => input.focus(), 30);
}


// EXPORTAR RESULTADOS (PDF / JPG / PNG)
// ============================================================
// Nombre de archivo legible: geolytics-<escenario>-<fecha>.<ext>
function exportFilename(ext) {
  const sc = getScenario(state.selectedScenario);
  const slug = (sc?.name || 'simulacion').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return `geolytics-${slug}-${stamp}.${ext}`;
}

// Mini-aviso efímero (sin librerías) para feedback de exportación.
function exportToast(msg) {
  let t = document.getElementById('export-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'export-toast';
    t.className = 'export-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__exportToastTimer);
  window.__exportToastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// Carga html2canvas-pro bajo demanda (solo cuando se exporta una imagen).
// Usamos la variante "pro" porque soporta funciones de color modernas
// (oklab / oklch / color-mix) que el CSS de Geolytics usa — la versión clásica
// tira "unsupported color function oklab" y aborta la captura.
function ensureHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (window.__h2cPromise) return window.__h2cPromise;
  window.__h2cPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.8/dist/html2canvas-pro.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => reject(new Error('No se pudo cargar html2canvas-pro'));
    document.head.appendChild(s);
  });
  return window.__h2cPromise;
}

// Construye una tarjeta-resumen COMPACTA para exportar como imagen.
// (El PDF sigue siendo el documento completo; la imagen es el resumen.)
function buildExportCard() {
  const sc = getScenario(state.selectedScenario);
  const months = DURATIONS[durIdx(state.duration)];
  const sim = simulate(state.selectedScenario, state.intensity, months);
  const ctry = getCountry(state.country);
  const exInfo = exchangeInfo(state.country);
  const fxDigits = (exInfo.rate != null && exInfo.rate < 100) ? 2 : 0;
  const KPI_BY_VAR = {
    sp500:        [{ key: 'sp500', label: 'S&P 500', unit: '', digits: 0 }],
    usdars:       [{ key: 'usdars', label: exInfo.label, unit: '', digits: fxDigits }],
    commodities:  [{ key: 'wti', label: 'Petróleo WTI', unit: '$', digits: 0 }, { key: 'gold', label: 'Oro (oz)', unit: '$', digits: 0 }],
    inflation:    [{ key: 'inflation', label: 'Inflación', unit: '', digits: 1, pct: true }],
    unemployment: [{ key: 'unemployment', label: 'Desempleo', unit: '', digits: 1, pct: true }]
  };
  const kpis = VARIABLES.filter(v => state.vars[v.id]).flatMap(v => KPI_BY_VAR[v.id] || []);
  const dateStr = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Contexto real del país (Banco Mundial): punto de partida de la proyección.
  // Solo incluimos las métricas que estén disponibles en caché (sin nulos).
  const realInflPct = (typeof wbCachedLatest === 'function') ? wbCachedLatest(state.country, WB_INDICATORS.inflation) : null;
  const realGdpVal = (typeof wbCachedLatest === 'function') ? wbCachedLatest(state.country, WB_INDICATORS.gdp) : null;
  const realUnemplPct = (typeof wbCachedLatest === 'function') ? wbCachedLatest(state.country, WB_INDICATORS.unemployment) : null;
  const realMetrics = [];
  if (realGdpVal != null) realMetrics.push(['PIB', fmtGdp(realGdpVal)]);
  if (realInflPct != null) realMetrics.push(['Inflación', realInflPct.toFixed(1) + '%']);
  if (realUnemplPct != null) realMetrics.push(['Desempleo', realUnemplPct.toFixed(1) + '%']);
  const realHTML = realMetrics.length ? `
    <div class="exp-real">
      <div class="exp-real-head">${ctry.flag} Punto de partida · ${ctry.name} <span>Banco Mundial</span></div>
      <div class="exp-real-row">
        ${realMetrics.map(([l, v]) => `<div><span class="exp-real-l">${l}</span><span class="exp-real-v">${v}</span></div>`).join('')}
      </div>
    </div>` : '';

  // Respaldo histórico: qué ocurrió de verdad en el país el año del evento de
  // referencia del escenario (ej. crisis 2008). Solo si hay datos para ese año.
  const ref = sc.reference;
  let histHTML = '';
  if (ref && typeof wbValueAtYear === 'function') {
    const gAt = wbValueAtYear(state.country, WB_INDICATORS.gdpGrowth, ref.year);
    const uAt = wbValueAtYear(state.country, WB_INDICATORS.unemployment, ref.year);
    const iAt = wbValueAtYear(state.country, WB_INDICATORS.inflation, ref.year);
    const hm = [];
    if (gAt != null) hm.push(['Crec. PIB', (gAt >= 0 ? '+' : '') + gAt.toFixed(1) + '%', gAt < 0 ? 'neg' : 'pos']);
    if (uAt != null) hm.push(['Desempleo', uAt.toFixed(1) + '%', '']);
    if (iAt != null) hm.push(['Inflación', iAt.toFixed(1) + '%', iAt > 10 ? 'neg' : '']);
    if (hm.length) {
      histHTML = `
        <div class="exp-hist">
          <div class="exp-real-head">Respaldo histórico · ${ref.name} <span>${ref.year}</span></div>
          <div class="exp-real-row">
            ${hm.map(([l, v, c]) => `<div><span class="exp-real-l">${l} ${ref.year}</span><span class="exp-real-v ${c}">${v}</span></div>`).join('')}
          </div>
        </div>`;
    }
  }

  const kpiHTML = kpis.length ? kpis.map(k => {
    const s = sim[k.key];
    const pos = s.delta >= 0;
    const valStr = k.pct ? fmtNum(s.final * 100, 1) + '%' : (k.unit || '') + fmtNum(s.final, k.digits);
    return `<div class="exp-kpi">
      <div class="exp-kpi-l">${k.label}</div>
      <div class="exp-kpi-v">${valStr}</div>
      <div class="exp-kpi-d ${pos ? 'pos' : 'neg'}">${pos ? '▲' : '▼'} ${fmtPct(s.delta)}</div>
    </div>`;
  }).join('') : `<div class="exp-kpi" style="grid-column:1/-1;"><div class="exp-kpi-l">Sin variables seleccionadas</div></div>`;

  const node = document.createElement('div');
  node.className = 'export-card';
  node.innerHTML = `
    <div class="exp-top">
      <div class="exp-brand"><div class="brand-mark" style="width:30px;height:30px;">${brandLogo(18)}</div><span>Geolytics</span></div>
      <div class="exp-date">${dateStr}</div>
    </div>
    <div class="exp-eyebrow">Resumen de simulación</div>
    <div class="exp-title">${sc.glyph} ${sc.name}</div>
    <div class="exp-pills">
      <span class="exp-pill exp-pill-brand">${sc.tag}</span>
      <span class="exp-pill">Intensidad: ${intensityLabel(state.intensity)}</span>
      <span class="exp-pill">Duración: ${months} meses</span>
      <span class="exp-pill">${ctry.flag} ${ctry.name}</span>
    </div>
    <div class="exp-kpis" style="grid-template-columns:repeat(${Math.min(3, Math.max(1, kpis.length || 1))}, 1fr);">
      ${kpiHTML}
    </div>
    ${realHTML}
    ${histHTML}
    <div class="exp-foot">Generado con Geolytics · Proyección educativa, no constituye asesoramiento financiero.</div>
  `;
  return node;
}

// Captura la tarjeta-resumen y descarga como JPG o PNG.
async function exportResultsImage(format) {
  exportToast('Generando imagen…');
  let h2c;
  try { h2c = await ensureHtml2Canvas(); }
  catch (e) { exportToast('No se pudo cargar el exportador (¿sin conexión?)'); return; }

  const card = buildExportCard();
  // Montar fuera de pantalla para que tenga layout real pero no se vea.
  card.style.position = 'fixed';
  card.style.left = '-10000px';
  card.style.top = '0';
  card.style.pointerEvents = 'none';
  document.body.appendChild(card);
  const bg = (getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#ffffff').trim();

  try {
    const canvas = await h2c(card, {
      backgroundColor: bg,
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'png' ? undefined : 0.95;
    const url = canvas.toDataURL(mime, quality);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename(format);
    document.body.appendChild(a);
    a.click();
    a.remove();
    exportToast(`Imagen ${format.toUpperCase()} descargada`);
  } catch (e) {
    console.warn('[Geolytics] Falló la exportación de imagen:', e);
    exportToast('No se pudo generar la imagen');
  } finally {
    card.remove();
  }
}

// PDF: usa el diálogo de impresión del navegador con CSS de impresión
// (definido en styles.css) que aísla la pantalla de resultados.
function exportResultsPDF() {
  document.body.classList.add('printing-results');
  exportToast('Abriendo diálogo de impresión → elegí “Guardar como PDF”');
  const cleanup = () => {
    document.body.classList.remove('printing-results');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => { window.print(); }, 60);
  // Respaldo por si 'afterprint' no dispara en algún navegador.
  setTimeout(cleanup, 1500);
}


// TWEAKS (theme + density + grid)
// ============================================================
const THEMES = [
  { id: 'forest',  label: 'FRST', color: '#0F3D2E', accent: '#C4703B' },
  { id: 'midnight',label: 'NIGT', color: '#151A21', accent: '#347C58' }
];

function renderTweaks() {
  const cont = document.getElementById('tw-themes');
  if (!cont) return;
  cont.innerHTML = THEMES.map(t => `
    <div class="tw-swatch ${TWEAKS.theme === t.id ? 'on' : ''}" data-theme-pick="${t.id}"
      style="background:linear-gradient(135deg, ${t.color} 0%, ${t.color} 55%, ${t.accent} 55%, ${t.accent} 100%); color:#fff;">
      <span>${t.label}</span>
    </div>
  `).join('');
  cont.querySelectorAll('[data-theme-pick]').forEach(el => {
    el.addEventListener('click', () => {
      TWEAKS.theme = el.getAttribute('data-theme-pick');
      try {
        localStorage.setItem('geolytics-theme', TWEAKS.theme);
        if (TWEAKS.theme !== 'midnight') localStorage.setItem('geolytics-theme-light', TWEAKS.theme);
      } catch (e) {}
      applyTheme();
      renderTweaks();
      persistTweaks({ theme: TWEAKS.theme });
      document.querySelectorAll('[data-action="toggle-dark"]').forEach(b => { b.innerHTML = icon(TWEAKS.theme === 'midnight' ? 'sun' : 'moon', 15); });
    });
  });
  document.getElementById('tw-grid').classList.toggle('on', TWEAKS.showGrid);
  document.getElementById('tw-density').classList.toggle('on', TWEAKS.density === 'compact');
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', TWEAKS.theme);
  document.body.setAttribute('data-grid', TWEAKS.showGrid ? 'on' : 'off');
  document.body.setAttribute('data-density', TWEAKS.density);
}

// ---- Modo claro / oscuro (para usuarios finales) ----
// El tema oscuro ya existe (data-theme="midnight"). Acá lo exponemos como un
// toggle real: la elección se guarda en localStorage ('geolytics-theme') y se
// lee en el <head> de cada página (anti-parpadeo) y en boot(). Recordamos el
// último tema CLARO usado para volver a él al salir del modo oscuro.
function activeTheme() {
  try { return localStorage.getItem('geolytics-theme') || TWEAKS.theme; }
  catch (e) { return TWEAKS.theme; }
}
function isDark() { return activeTheme() === 'midnight'; }
function setTheme(t) {
  TWEAKS.theme = t;
  try {
    localStorage.setItem('geolytics-theme', t);
    if (t !== 'midnight') localStorage.setItem('geolytics-theme-light', t);
  } catch (e) {}
  applyTheme();
  document.querySelectorAll('[data-action="toggle-dark"]').forEach(b => { b.innerHTML = icon(t === 'midnight' ? 'sun' : 'moon', 15); });
  if (document.getElementById('tw-themes')) renderTweaks();
}
function toggleDark() {
  if (isDark()) {
    var light = 'forest';
    try { light = localStorage.getItem('geolytics-theme-light') || 'forest'; } catch (e) {}
    setTheme(light);
  } else {
    setTheme('midnight');
  }
}

function toggleGrid() {
  TWEAKS.showGrid = !TWEAKS.showGrid;
  applyTheme();
  renderTweaks();
  persistTweaks({ showGrid: TWEAKS.showGrid });
}
function toggleDensity() {
  TWEAKS.density = TWEAKS.density === 'compact' ? 'comfortable' : 'compact';
  applyTheme();
  renderTweaks();
  persistTweaks({ density: TWEAKS.density });
}
function closeTweaks() {
  document.getElementById('tweaks').classList.remove('on');
  window.parent.postMessage({ type: '__deactivate_edit_mode' }, '*');
}
function persistTweaks(partial) {
  window.parent.postMessage({ type: '__edit_mode_set_keys', edits: partial }, '*');
}

// listen for edit mode activation
window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === '__activate_edit_mode') {
    document.getElementById('tweaks').classList.add('on');
    renderTweaks();
  }
  if (e.data.type === '__deactivate_edit_mode') {
    document.getElementById('tweaks').classList.remove('on');
  }
});

// ============================================================
// BOOT
// ============================================================
function boot() {
  // Si la página define __INITIAL_SCREEN, usar eso; sino, restaurar del storage
  if (!window.__INITIAL_SCREEN) {
    try {
      const saved = localStorage.getItem('geolytics.screen');
      if (saved && TITLES[saved]) state.screen = saved;
    } catch(e) {}
  } else {
    // limpiar clave vieja, el nuevo sistema usa 'geolytics-state'
    try { localStorage.removeItem('geolytics.screen'); } catch(e) {}
  }
  if (window.initExtraState) window.initExtraState();
  // Tema elegido por el usuario (modo claro/oscuro) manda sobre el default.
  try { var __st = localStorage.getItem('geolytics-theme'); if (__st) TWEAKS.theme = __st; } catch (e) {}
  applyTheme();
  // Gate de sesión: si Supabase está activo y NO hay sesión guardada, mandamos
  // a login antes del primer render (evita el flash de contenido protegido).
  // 'login' y 'forgot' son públicas. Sin Supabase configurado, no se aplica gate.
  window.__gateBounced = false;
  if (window.SUPABASE_ENABLED && !hasSupabaseSession()
      && !new Set(['login', 'forgot']).has(state.screen)) {
    // Recordamos a dónde quería ir el usuario: si la comprobación async de
    // sesión confirma que SÍ está logueado, lo devolvemos acá (ver bootstrapSession).
    window.__intendedScreen = state.screen;
    state.screen = 'login';
    window.__gateBounced = true;
  }
  render();
  // Hidratar desde Supabase (si está configurado). No bloquea el primer render.
  bootstrapSession();
  // Registrar la pantalla inicial en el historial del navegador (para Atrás)
  try { history.replaceState({ screen: state.screen }, '', location.pathname.split('/').pop() || undefined); } catch (e) {}
  // Auto-advance from loading screen (when arriving via direct URL)
  if (state.screen === 'loading') {
    setTimeout(() => { if (state.screen === 'loading') navigate('results'); }, 1500);
  }
  // announce tweaks availability
  setTimeout(() => {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  }, 100);
}

// ¿El usuario ya completó (o saltó) el onboarding? Se decide por los metadatos
// de la cuenta (cross-device) con respaldo en localStorage por si updateUser
// tarda o falla.
function isOnboarded(u) {
  if (u && u.user_metadata && u.user_metadata.onboarded) return true;
  try { return !!(u && localStorage.getItem('geolytics-onb-' + u.id) === '1'); } catch (e) { return false; }
}
// Marca el onboarding como visto: en la cuenta (Supabase) y en el dispositivo.
function markOnboarded() {
  try { if (window.geoUser) localStorage.setItem('geolytics-onb-' + window.geoUser.id, '1'); } catch (e) {}
  if (window.geoUser && window.geoUser.user_metadata) window.geoUser.user_metadata.onboarded = true;
  if (window.DB && DB.auth && DB.auth.markOnboarded) DB.auth.markOnboarded();
}

// ---- Sesión / Google Auth ----
// ¿Hay una sesión de Supabase persistida en localStorage? (chequeo sincrónico
// para decidir el gate antes del primer render, sin esperar a la red.)
function hasSupabaseSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('-auth-token') !== -1) {
        const v = localStorage.getItem(k);
        if (v && v.length > 20) return true;
      }
    }
  } catch (e) {}
  return false;
}

// URL absoluta a la RAÍZ del sitio, destino del redirect de OAuth.
// Volvemos a "/" (no a Geolytics.html) porque la raíz la sirve siempre el
// hosting sin problemas de mayúsculas ni extensión .html. El index.html
// captura la sesión y entra a la app.
function homeUrl() {
  const parts = location.pathname.split('/');
  parts[parts.length - 1] = '';
  return location.origin + parts.join('/');
}

// Vuelca los datos del usuario de Supabase (Google) sobre state.profile.
function applyAuthUser(user) {
  window.geoUser = user || null;
  if (!user) return;
  const m = user.user_metadata || {};
  const full = (m.full_name || m.name || '').trim();
  const parts = full ? full.split(/\s+/) : [];
  const emailName = (user.email || '').split('@')[0];
  state.profile = Object.assign({}, state.profile, {
    first: m.first || parts[0] || emailName || state.profile.first,
    last: m.last || parts.slice(1).join(' ') || state.profile.last,
    email: user.email || m.email || state.profile.email,
    occupation: m.occupation || state.profile.occupation,
    avatar: m.avatar_url || m.picture || state.profile.avatar || ''
  });
}

// Trae el perfil guardado en la tabla `profiles` y lo fusiona sobre el local.
async function loadProfile(uid) {
  if (!uid || !window.DB) return;
  try {
    const row = await DB.profiles.get(uid);
    if (row) {
      state.profile = Object.assign({}, state.profile, {
        first: row.first || state.profile.first,
        last: row.last || state.profile.last,
        email: row.email || state.profile.email,
        occupation: row.occupation || state.profile.occupation,
        interests: Array.isArray(row.interests) ? row.interests : state.profile.interests,
        avatar: row.avatar || state.profile.avatar || ''
      });
    }
  } catch (e) {}
}

// Restaura la sesión al cargar la página y escucha cambios (login/logout).
async function bootstrapSession() {
  if (!window.DB || !DB.enabled()) { bootstrapSupabase(); return; }
  const user = await DB.auth.getUser();
  if (user) {
    applyAuthUser(user);
    await loadProfile(user.id);
    // Pantalla a la que el usuario realmente quiere entrar (el gate síncrono pudo
    // rebotarlo a 'login'; en ese caso el destino real está en __intendedScreen).
    const __entry = window.__gateBounced ? (window.__intendedScreen || 'home') : state.screen;
    if (__entry === 'home' || !isOnboarded(user)) {
      // El onboarding aparece SIEMPRE al entrar al inicio (con opción de Saltar),
      // y también la primera vez que un usuario nuevo entra a cualquier pantalla.
      state.onboardingStep = 1;
      navigate('onboarding');
    } else if (window.__gateBounced && new Set(['login', 'forgot']).has(state.screen)) {
      // El gate sincrónico nos pudo mandar a 'login' por no ver el token en
      // localStorage, aunque la sesión sea válida. Confirmada la sesión, volvemos
      // a la pantalla que el usuario pidió (home u otra). Esto arregla el bug de
      // "a veces entra al home, a veces se queda en login".
      navigate(window.__intendedScreen || 'home');
    } else {
      renderAsync();
    }
  } else if (!new Set(['login', 'forgot']).has(state.screen)) {
    // Sin sesión en una pantalla protegida → al login.
    navigate('login');
  }
  DB.auth.onChange(async (u) => {
    const prevId = window.geoUser && window.geoUser.id;
    const newId = u && u.id;
    // Mismo usuario (refresh de token, volver a la pestaña…) → no re-renderizar.
    if (prevId === newId) { window.geoUser = u || null; return; }
    const wasLogged = !!prevId;
    applyAuthUser(u);
    if (u) await loadProfile(u.id);
    renderAsync();
    // Recargar historial bajo la identidad del usuario (user.id)
    bootstrapSupabase();
    // Si recién inició sesión estando en la pantalla de login, ir al panel
    // (o al onboarding si es su primer ingreso).
    if (!wasLogged && u && state.screen === 'login') {
      state.onboardingStep = 1;
      navigate('onboarding');
    }
    // Logout (incluso desde otra pestaña) → al login.
    if (wasLogged && !u) navigate('login');
  });
  // Ahora cid() ya refleja al usuario → cargar catálogo + historial.
  await bootstrapSupabase();
}

// Trae el catálogo de escenarios y el historial desde Supabase (si hay credenciales)
// y re-renderiza. Si Supabase no está activo o falla, la app sigue con localStorage.
async function bootstrapSupabase() {
  if (!window.DB || !DB.enabled()) return;
  let changed = false;
  // Catálogo de escenarios → FUSIONA los datos de la base sobre los locales.
  // Conserva los campos que solo viven en el código (ej. `reference`, el evento
  // histórico) y descarta valores null/undefined que devuelva la base.
  try {
    const scen = await DB.scenarios.list();
    if (scen && scen.length) {
      scen.forEach(remote => {
        const local = SCENARIOS.find(s => s.id === remote.id);
        if (local) {
          Object.keys(remote).forEach(k => { if (remote[k] != null) local[k] = remote[k]; });
        } else {
          SCENARIOS.push(remote);
        }
      });
      changed = true;
    }
  } catch (e) {}
  // Historial → si hay sesión, refleja EXACTAMENTE lo que hay en Supabase
  // (incluso vacío, para que un usuario nuevo no vea las simulaciones demo).
  try {
    const sims = await DB.simulations.list();
    if (sims) {  // [] cuando no hay filas; null solo si falló la consulta
      if (window.geoUser || sims.length) { state.history = sims; changed = true; }
    }
  } catch (e) {}
  if (changed) renderAsync();
}

boot();
