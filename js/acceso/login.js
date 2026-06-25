const GOOGLE_SVG = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.5 12.3c0-.78-.07-1.53-.2-2.25H12v4.26h5.88c-.25 1.37-1.03 2.53-2.19 3.3v2.74h3.54c2.07-1.91 3.27-4.72 3.27-8.05z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.74c-.98.66-2.23 1.05-3.74 1.05-2.87 0-5.29-1.94-6.16-4.54H2.18v2.84A10.99 10.99 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.13 5.38 12 5.38z"/></svg>';

const GITHUB_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.1.63-1.35-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.66.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.56 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>';

/*Genera el panel visual izquierdo que va con las pantallas de acceso*/

function authBrandHTML() {
  return `
    <aside class="auth-brand">
      <div class="auth-brand-inner">
        <div class="auth-logo">
          <div class="brand-mark">${brandLogo(20)}</div>
          <div>
            <div class="brand-name" style="color:#fff; font-size:27px; letter-spacing:-0.02em; line-height:1;">Geolytics</div>
          </div>
        </div>
        <h2 class="auth-pitch">Entendé el <em>mundo</em><br>a través de sus<br>variables económicas.</h2>
        <p class="auth-pitch-sub">Una plataforma educativa que transforma eventos globales en escenarios interactivos y explicables.</p>
        <div class="auth-stats">
          <div><div class="auth-stat-n">6</div><div class="auth-stat-l">Escenarios</div></div>
          <div><div class="auth-stat-n">12</div><div class="auth-stat-l">Variables</div></div>
          <div><div class="auth-stat-n">∞</div><div class="auth-stat-l">Combinaciones</div></div>
        </div>
      </div>
    </aside>
  `;
}

/* Formulario de inicio de sesión */

function loginFormHTML() {
  return `
    <div class="auth-form">
      <div class="auth-form-head">
        <h3 class="auth-form-h">Bienvenido de vuelta</h3>
        <p class="auth-form-s">Ingresá para continuar con tus simulaciones.</p>
      </div>
      <div class="auth-tabs">
        <button class="auth-tab active" data-auth-mode="login">Iniciar sesión</button>
        <button class="auth-tab" data-auth-mode="register">Registrarse</button>
      </div>
      <div class="auth-field">
        <label>Email</label>
        <input type="email" id="login-email" placeholder="tu@email.com" value="">
      </div>
      <div class="auth-field">
        <label>Contraseña</label>
        <input type="password" id="login-password" placeholder="••••••••" value="">
      </div>
      <div class="auth-row">
        <label class="auth-check">
          <span class="auth-checkbox on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
          Recordarme
        </label>
        <a class="auth-link" data-nav="forgot">¿Olvidaste tu contraseña?</a>
      </div>
      ${state.loginError ? `<div class="auth-error" style="margin-bottom:10px;">${state.loginError}</div>` : ''}
      <button class="btn btn-primary auth-submit" data-action="login-submit">${icon('arrowR', 14)} Ingresar</button>
      <div class="auth-divider"><span>o continuá con</span></div>
      <div class="auth-oauth auth-oauth-single">
        <button class="btn btn-ghost auth-oauth-btn">${GOOGLE_SVG} Continuar con Google</button>
      </div>
      <div class="auth-foot">
        ¿No tenés cuenta? <a class="auth-link" data-auth-mode="register">Registrate gratis</a>
      </div>
    </div>
  `;
}

/* Genera el fomulario de registro y controla sus pasos */

function registerFormHTML() {
  const r = state.register;
  const step = state.registerStep;
  const stepLabels = ['Cuenta', 'Perfil'];

  // Calcula la seguridad de la contraseña que se ingresó
  const pw = r.password || '';
  let strength = 0;
  if (pw.length >= 6) strength++;
  if (pw.length >= 10) strength++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) strength++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) strength++;
  const strengthLabel = ['—', 'Débil', 'Aceptable', 'Buena', 'Muy fuerte'][strength];
  const strengthColor = ['var(--line-strong)', 'var(--neg)', 'var(--accent)', 'var(--accent)', 'var(--pos)'][strength];

  // Opciones de rol que se indican en el segundo paso del registro
  const roles = [
    { id: 'student', glyph: '🎓', label: 'Estudiante', sub: 'Secundario, terciario o universitario' },
    { id: 'teacher', glyph: '👩‍🏫', label: 'Docente',   sub: 'Doy clases o capacitaciones' },
    { id: 'pro',     glyph: '📈', label: 'Profesional', sub: 'Analista, periodista, consultor' },
    { id: 'curious', glyph: '🌎', label: 'Curioso',    sub: 'Aprendo por mi cuenta' }
  ];
  const levels = ['Secundario', 'Universitario', 'Posgrado', 'Otro'];

  // Validaciones mínimas para habilitar el avance entre los pasos
  const canStep1 = r.first.trim() && r.last.trim() && /\S+@\S+\.\S+/.test(r.email) && pw.length >= 6 && pw === r.confirm && r.terms;
  const canStep2 = r.role;

  let body = '';
  // Paso 1: Datos principales de la cuenta
  if (step === 1) {
    body = `
      <div class="auth-form-head">
        <h3 class="auth-form-h">Creá tu cuenta</h3>
      </div>
      <div class="reg-oauth-row reg-oauth-single">
        <button class="btn btn-ghost auth-oauth-btn">${GOOGLE_SVG} Continuar con Google</button>
      </div>
      <div class="auth-divider"><span>o con tu email</span></div>
      <div class="reg-grid">
        <div class="auth-field">
          <label>Nombre</label>
          <input data-reg-key="first" value="${r.first}" placeholder="Tu nombre">
        </div>
        <div class="auth-field">
          <label>Apellido</label>
          <input data-reg-key="last" value="${r.last}" placeholder="Tu apellido">
        </div>
      </div>
      <div class="auth-field">
        <label>Email</label>
        <input data-reg-key="email" type="email" value="${r.email}" placeholder="tu@email.com">
        ${r.email.includes('@') && !/\S+@\S+\.\S+/.test(r.email) ? '<div class="auth-error">Email inválido</div>' : ''}
      </div>
      <div class="auth-field">
        <label>Contraseña</label>
        <input data-reg-key="password" type="password" value="${r.password}" placeholder="Mínimo 6 caracteres">
        <div class="pw-meter">
          <div class="pw-meter-track">
            ${[0,1,2,3].map(i => `<div class="pw-meter-seg ${i < strength ? 'on' : ''}" style="${i < strength ? `background:${strengthColor}` : ''}"></div>`).join('')}
          </div>
          <span class="pw-meter-label" style="color:${strength > 0 ? strengthColor : 'var(--muted)'}">${strengthLabel}</span>
        </div>
      </div>
      <div class="auth-field">
        <label>Confirmar contraseña</label>
        <input data-reg-key="confirm" type="password" value="${r.confirm}" placeholder="Repetí la contraseña">
        ${r.confirm && r.confirm !== r.password ? '<div class="auth-error">Las contraseñas no coinciden</div>' : ''}
      </div>
      <label class="auth-check reg-terms" data-reg-toggle="terms">
        <span class="auth-checkbox ${r.terms ? 'on' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
        Acepto los <a class="auth-link">Términos</a> y la <a class="auth-link">Política de privacidad</a>
      </label>
      <label class="auth-check reg-terms" data-reg-toggle="newsletter">
        <span class="auth-checkbox ${r.newsletter ? 'on' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
        Quiero recibir novedades educativas (opcional)
      </label>
      <button class="btn btn-primary auth-submit" data-reg-next ${canStep1 ? '' : 'disabled style="opacity:.45;cursor:not-allowed"'}>Continuar ${icon('arrowR', 14)}</button>
    `;

    // Paso 2: Selección de rol y datos del perfil
  } else if (step === 2) {
    body = `
      <div class="auth-form-head">
        <h3 class="auth-form-h">Contanos sobre vos</h3>
        <p class="auth-form-s">Vamos a personalizar tu experiencia.</p>
      </div>
      <div class="reg-section-l">¿Cuál es tu rol?</div>
      <div class="reg-roles">
        ${roles.map(role => `
          <button class="reg-role ${r.role === role.id ? 'on' : ''}" data-reg-role="${role.id}">
            <div class="reg-role-glyph">${role.glyph}</div>
            <div>
              <div class="reg-role-name">${role.label}</div>
              <div class="reg-role-sub">${role.sub}</div>
            </div>
            <div class="reg-role-check">${icon('check', 12)}</div>
          </button>
        `).join('')}
      </div>
      ${r.role === 'student' || r.role === 'teacher' ? `
        <div class="reg-grid" style="margin-top:18px;">
          <div class="auth-field">
            <label>Institución</label>
            <input data-reg-key="institution" value="${r.institution}" placeholder="${r.role === 'teacher' ? 'Universidad, colegio...' : 'Tu institución'}">
          </div>
          <div class="auth-field">
            <label>Nivel</label>
            <select data-reg-key="level" class="profile-select" style="max-width:none">
              <option value="">Seleccionar...</option>
              ${levels.map(l => `<option ${r.level === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </div>
        </div>
      ` : ''}
      <div class="reg-actions">
        <button class="btn btn-ghost" data-reg-prev>${icon('arrowL', 14)} Atrás</button>
        <button class="btn btn-primary" data-reg-finish ${canStep2 ? '' : 'disabled style="opacity:.45;cursor:not-allowed"'}>${icon('sparkle', 14)} Crear cuenta</button>
      </div>
      ${state.registerError ? `<div class="auth-error" style="margin-top:12px;">${state.registerError}</div>` : ''}
    `;

    // Paso 3: Confirmación final del registro
  } else if (step === 3) {

    body = `
      <div class="reg-success">
        <div class="reg-success-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 class="auth-form-h" style="text-align:center; margin-top:18px;">¡Bienvenido a Geolytics, ${r.first || 'analista'}!</h3>
        <p class="auth-form-s" style="text-align:center;">Tu cuenta está lista. Vamos a darte un tour rápido por el simulador.</p>
        <button class="btn btn-primary auth-submit" data-nav="onboarding" style="margin-top:24px;">Empezar tour ${icon('arrowR', 14)}</button>
        <button class="btn btn-ghost auth-submit" data-action="onb-done" style="margin-top:8px;">Ir directo al panel</button>
      </div>
    `;
  }

  return `
    <div class="auth-form">
      ${step < 3 ? `
        <div class="auth-tabs">
          <button class="auth-tab" data-auth-mode="login">Iniciar sesión</button>
          <button class="auth-tab active" data-auth-mode="register">Registrarse</button>
        </div>
        <div class="reg-stepper">
          ${stepLabels.map((label, i) => {
            const n = i + 1;
            const status = n < step ? 'done' : n === step ? 'active' : '';
            return `
              <div class="reg-step ${status}">
                <div class="reg-step-circle">${n < step ? icon('check', 12) : n}</div>
                <span class="reg-step-label">${label}</span>
              </div>
              ${i < stepLabels.length - 1 ? `<div class="reg-step-line ${n < step ? 'done' : ''}"></div>` : ''}
            `;
          }).join('')}
        </div>
      ` : ''}
      ${body}
      ${step < 3 ? `
        <div class="auth-foot">
          ¿Ya tenés cuenta? <a class="auth-link" data-auth-mode="login">Iniciá sesión</a>
        </div>
      ` : ''}
    </div>
  `;
}

/* Renderiza la pantalla de login o registro según el modo activo */

function loginHTML() {
  return `
    <section class="screen active auth-screen" data-screen-label="${state.authMode === 'register' ? 'Register' : 'Login'}">
      <div class="auth-grid">
        ${authBrandHTML()}
        <div class="auth-panel">
          ${state.authMode === 'register' ? registerFormHTML() : loginFormHTML()}
        </div>
      </div>
    </section>
  `;
}

/* Genera la pantalla para recuperar contraseña */

function forgotHTML() {
  const sent = state.forgotSent;
  return `
    <section class="screen active auth-screen" data-screen-label="ForgotPassword">
      <button class="auth-close" data-nav="login" aria-label="Volver">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="auth-grid">
        ${authBrandHTML()}
        <div class="auth-panel">
          <div class="auth-form">
            ${sent ? `
              <div class="reg-success">
                <div class="reg-success-icon">
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z" opacity="0"/><polyline points="22 6 12 13 2 6"/><path d="M2 6h20v12H2z"/></svg>
                </div>
                <h3 class="auth-form-h" style="text-align:center; margin-top:18px;">Revisá tu correo</h3>
                <p class="auth-form-s" style="text-align:center;">Si <strong>${state.forgotEmail || 'ese email'}</strong> está registrado, te enviamos un enlace para restablecer tu contraseña. Puede tardar unos minutos en llegar.</p>
                <button class="btn btn-primary auth-submit" data-nav="login" style="margin-top:24px;">${icon('arrowL', 14)} Volver a iniciar sesión</button>
                <button class="btn btn-ghost auth-submit" data-action="forgot-resend" style="margin-top:8px;">Reenviar enlace</button>
              </div>
            ` : `
              <div class="auth-form-head">
                <h3 class="auth-form-h">¿Olvidaste tu contraseña?</h3>
                <p class="auth-form-s">Ingresá tu email y te enviaremos un enlace para crear una nueva.</p>
              </div>
              <div class="auth-field">
                <label>Email</label>
                <input type="email" id="forgot-email" placeholder="tu@email.com" value="${state.forgotEmail || ''}">
              </div>
              <button class="btn btn-primary auth-submit" data-action="forgot-send">${icon('arrowR', 14)} Enviar enlace</button>
              <div class="auth-foot">
                ¿Te acordaste? <a class="auth-link" data-nav="login">Volver a iniciar sesión</a>
              </div>
            `}
          </div>
        </div>
      </div>
    </section>
  `;
}

