// ============================================================
// GEOLYTICS — js/administracion/screens-cuenta.js  ·  módulo cuenta + institucional
// ------------------------------------------------------------
// Perfil, configuración de la simulación (+ vista previa), docentes y acerca.
// ============================================================

function profileHTML() {
  const p = state.profile;
  const initials = (p.first[0] + p.last[0]).toUpperCase();
  const OCCUPATIONS = ['Estudiante', 'Docente', 'Profesional', 'Investigador', 'Periodista', 'Curioso', 'Otro'];
  const occValid = OCCUPATIONS.includes(p.occupation);
  const occOptions = `<option value="" disabled ${occValid ? '' : 'selected'}>Seleccionar…</option>`
    + OCCUPATIONS.map(o => `<option ${p.occupation === o ? 'selected' : ''}>${o}</option>`).join('');
  const tabs = [
    { id: 'account',  label: 'Mi cuenta' },
    { id: 'prefs',    label: 'Preferencias' },
    { id: 'stats',    label: 'Estadísticas' },
    { id: 'notif',    label: 'Notificaciones' }
  ];
  const allInterests = ['Crisis económica', 'Commodities', 'Tasas de interés', 'Conflictos', 'Pandemias', 'Divisas', 'Guerra comercial'];
  return `
    <section class="screen active" data-screen-label="Profile">
      <div class="page-head">
        <div>
          <div class="eyebrow">Cuenta</div>
          <h2 class="page-title" style="margin-top:6px;">Perfil</h2>
          <p class="page-sub">Editá tu información personal, intereses y preferencias de notificaciones.</p>
        </div>
        <button class="btn btn-ghost btn-sm" data-nav="home">${icon('arrowL', 14)} Volver</button>
      </div>

      <div class="profile-layout">
        <aside class="profile-side">
          <div class="profile-user">
            <div class="profile-avatar">${initials}</div>
            <div class="profile-name">${p.first} ${p.last}</div>
            <div class="profile-email">${p.email}</div>
            <span class="pill pill-accent" style="margin-top:10px;">Cuenta activa</span>
          </div>
          <nav class="profile-nav">
            ${tabs.map(t => `<button class="profile-nav-item ${state.profileTab === t.id ? 'active' : ''}" data-profile-tab="${t.id}">${t.label}</button>`).join('')}
          </nav>
          <div class="profile-summary">
            <div class="profile-summary-h">Resumen</div>
            <div class="profile-summary-row"><span>Simulaciones</span><strong>${state.history.length}</strong></div>
            <div class="profile-summary-row"><span>Guardadas</span><strong>${state.history.filter(h=>h.saved).length}</strong></div>
            <div class="profile-summary-row"><span>Comparaciones</span><strong>${state.compareCount || 0}</strong></div>
          </div>
        </aside>

        <div class="card card-pad profile-main">
          ${state.profileTab === 'account' ? `
            <h3 class="profile-section-h">Mi cuenta</h3>
            <p class="profile-section-s">Editá tu información personal. Los cambios se guardan localmente.</p>
            <div class="profile-grid">
              <div class="profile-field"><label>Nombre</label><input value="${p.first}" data-profile-key="first"></div>
              <div class="profile-field"><label>Apellido</label><input value="${p.last}" data-profile-key="last"></div>
              <div class="profile-field"><label>Email</label><input value="${p.email}" data-profile-key="email"></div>
              <div class="profile-field"><label>Ocupación</label><select class="profile-select" style="max-width:none" data-profile-key="occupation">${occOptions}</select></div>
            </div>
            <hr class="profile-hr">
            <h4 class="profile-section-h" style="font-size:14px;">Intereses</h4>
            <p class="profile-section-s">Usamos esto para sugerirte escenarios relevantes.</p>
            <div class="profile-chips">
              ${allInterests.map(i => `
                <button class="profile-chip ${p.interests.includes(i) ? 'on' : ''}" data-profile-interest="${i}">
                  ${p.interests.includes(i) ? icon('check', 12) : ''} ${i}
                </button>
              `).join('')}
            </div>
            <div class="profile-actions">
              <button class="btn btn-primary" data-action="profile-save">${icon('save', 14)} Guardar cambios</button>
              <button class="btn btn-ghost" data-action="profile-cancel">Cancelar</button>
            </div>
          ` : state.profileTab === 'prefs' ? `
            <h3 class="profile-section-h">Preferencias</h3>
            <p class="profile-section-s">Cambiá entre modo claro y oscuro con el botón de sol/luna de la barra superior. Desde acá ajustás el resto.</p>
            <div class="pref-row"><div><strong>Idioma</strong><div class="profile-section-s">Idioma de la interfaz y textos explicativos.</div></div><select class="profile-select" data-pref-select="language">${['Español (AR)','English','Português'].map(o=>`<option ${state.prefs.language===o?'selected':''}>${o}</option>`).join('')}</select></div>
            <div class="pref-row"><div><strong>Zona horaria</strong><div class="profile-section-s">Usado para fechas de simulaciones.</div></div><select class="profile-select" data-pref-select="timezone">${['America/Buenos_Aires (GMT-3)','UTC'].map(o=>`<option ${state.prefs.timezone===o?'selected':''}>${o}</option>`).join('')}</select></div>
            <div class="pref-row"><div><strong>Formato numérico</strong><div class="profile-section-s">Separador decimal y de miles.</div></div><select class="profile-select" data-pref-select="numfmt">${['1.234,56','1,234.56'].map(o=>`<option ${state.prefs.numfmt===o?'selected':''}>${o}</option>`).join('')}</select></div>
            <div class="pref-row"><div><strong>Autoguardar simulaciones</strong><div class="profile-section-s">Guardar automáticamente cada resultado al historial.</div></div><div class="tw-toggle ${state.prefs.autosave?'on':''}" data-pref-toggle="autosave" style="cursor:pointer"></div></div>
          ` : state.profileTab === 'stats' ? `
            <h3 class="profile-section-h">Estadísticas</h3>
            <p class="profile-section-s">Tu actividad en los últimos 30 días.</p>
            <div class="stat-grid">
              <div class="stat-card"><div class="stat-n">${state.history.length}</div><div class="stat-l">Simulaciones totales</div></div>
              <div class="stat-card"><div class="stat-n">${state.history.filter(h=>h.saved).length}</div><div class="stat-l">Guardadas</div></div>
              <div class="stat-card"><div class="stat-n">${state.compareCount || 0}</div><div class="stat-l">Comparaciones</div></div>
              <div class="stat-card"><div class="stat-n">${p.interests.length}</div><div class="stat-l">Intereses</div></div>
            </div>
            <h4 class="profile-section-h" style="font-size:14px; margin-top:24px;">Escenarios más explorados</h4>
            ${(() => {
              const counts = SCENARIOS.map(sc => ({ sc, n: state.history.filter(h => h.scenario === sc.id).length }))
                .filter(x => x.n > 0).sort((a, b) => b.n - a.n);
              if (!counts.length) {
                return `<p class="profile-section-s" style="margin-top:6px;">Todavía no exploraste ningún escenario. Cuando corras tu primera simulación va a aparecer acá.</p>`;
              }
              const max = counts[0].n;
              return `<div class="stat-bars">${counts.map(({ sc, n }) => {
                const pct = Math.max(8, Math.round(n / max * 100));
                return `<div class="stat-bar-row"><span class="stat-bar-label">${sc.glyph} ${sc.name}</span><div class="stat-bar"><div class="stat-bar-fill" style="width:${pct}%"></div></div><span class="stat-bar-n">${n}</span></div>`;
              }).join('')}</div>`;
            })()}
          ` : `
            <h3 class="profile-section-h">Notificaciones</h3>
            <p class="profile-section-s">Elegí qué alertas querés recibir.</p>
            <div class="pref-row"><div><strong>Nuevos escenarios disponibles</strong><div class="profile-section-s">Cuando se publica un escenario en la biblioteca.</div></div><div class="tw-toggle ${state.notifs.newScenarios?'on':''}" data-notif-toggle="newScenarios" style="cursor:pointer"></div></div>
            <div class="pref-row"><div><strong>Resumen semanal</strong><div class="profile-section-s">Un email los lunes con tu actividad.</div></div><div class="tw-toggle ${state.notifs.weekly?'on':''}" data-notif-toggle="weekly" style="cursor:pointer"></div></div>
            <div class="pref-row"><div><strong>Actualizaciones del producto</strong><div class="profile-section-s">Nuevas funciones y mejoras.</div></div><div class="tw-toggle ${state.notifs.product?'on':''}" data-notif-toggle="product" style="cursor:pointer"></div></div>
            <div class="pref-row"><div><strong>Material educativo</strong><div class="profile-section-s">Guías, casos de estudio y análisis.</div></div><div class="tw-toggle ${state.notifs.edu?'on':''}" data-notif-toggle="edu" style="cursor:pointer"></div></div>
          `}
        </div>
      </div>
    </section>
  `;
}

function configHTML() {
  const sc = getScenario(state.selectedScenario);
  const months = DURATIONS[durIdx(state.duration)];
  const sim = simulate(state.selectedScenario, state.intensity, months);
  const previewVars = ['sp500', 'usdars', 'wti', 'gold'].filter(k => sim[k]);

  return `
    <section class="screen active" id="screen-config" data-screen-label="Config">
      <div class="page-head">
        <div>
          <div class="eyebrow">Paso 2 de 3 · Configuración</div>
          <h2 class="page-title" style="margin-top:6px;">Ajustá los parámetros</h2>
          <p class="page-sub">Intensidad, duración y variables a observar. La vista previa se actualiza al instante.</p>
        </div>
        <button class="btn btn-ghost btn-sm" data-nav="scenarios">${icon('arrowL', 14)} Cambiar escenario</button>
      </div>

      <div class="config-layout">
        <div class="card config-card">
          <div class="config-selected">
            <div class="scenario-glyph" style="margin-bottom:0;">${sc.glyph}</div>
            <div>
              <div class="eyebrow">Escenario</div>
              <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700; letter-spacing:-0.02em; margin-top:2px;">${sc.name}</h3>
              <p style="font-size:13px; color:var(--muted); margin-top:4px; max-width:460px;">${sc.summary}</p>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-head">
              <h4>${icon('grid', 14)} País a analizar <span class="hint">Datos reales del Banco Mundial</span></h4>
            </div>
            <select id="country-select" style="width:100%; font:inherit; font-size:14px; padding:11px 13px; border:1px solid var(--line); border-radius:10px; background:var(--surface, #fff); color:inherit; cursor:pointer; appearance:none; background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>'); background-repeat:no-repeat; background-position:right 13px center;">
              ${COUNTRIES.map(c => `<option value="${c.code}" ${c.code === state.country ? 'selected' : ''}>${c.flag}  ${c.name}</option>`).join('')}
            </select>
            <div id="wb-card" style="margin-top:13px; padding:14px; border:1px solid var(--line); border-radius:12px; background:var(--bg-soft, rgba(0,0,0,0.015));"></div>
          </div>

          <div class="config-section">
            <div class="config-section-head">
              <h4>${icon('wand', 14)} Intensidad del evento <span class="hint">¿Qué tan grave es?</span></h4>
              <span class="value-chip" id="intensity-chip">${intensityLabel(state.intensity)}</span>
            </div>
            <div class="slider-wrap">
              <input type="range" class="slider" id="intensity-slider" min="0" max="100" value="${state.intensity}" style="--val: ${state.intensity}%;">
              <div class="slider-ticks">
                <span>Leve</span><span>Moderada</span><span>Alta</span><span>Extrema</span>
              </div>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-head">
              <h4>${icon('clock', 14)} Duración estimada <span class="hint">¿Cuánto dura el evento?</span></h4>
              <span class="value-chip" id="duration-chip">${months} meses</span>
            </div>
            <div class="slider-wrap">
              <input type="range" class="slider" id="duration-slider" min="0" max="75" step="25" value="${state.duration}" style="--val: ${state.duration + 25/3}%;">
              <div class="slider-ticks">
                <span>3 meses</span><span>6 meses</span><span>12 meses</span><span>24 meses</span>
              </div>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-head">
              <h4>${icon('bars', 14)} Variables a observar</h4>
              <span style="font-size:12px; color:var(--muted); font-family:var(--font-mono);">${Object.values(state.vars).filter(Boolean).length} de ${VARIABLES.length}</span>
            </div>
            <div class="var-list">
              ${VARIABLES.map(v => `
                <div class="var-row ${state.vars[v.id] ? 'on' : ''}" data-toggle-var="${v.id}">
                  <div class="checkbox">${icon('check', 10)}</div>
                  <div style="flex:1">
                    <div class="vname">${v.name}</div>
                    <div class="vdesc">${v.desc}</div>
                  </div>
                  <div class="vtrend">${state.vars[v.id] ? 'OBSERVANDO' : '—'}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="display:flex; gap:10px; padding-top:18px; border-top:1px dashed var(--line);">
            <button class="btn btn-ghost" data-nav="scenarios">${icon('arrowL', 14)} Cambiar escenario</button>
            <button class="btn btn-primary" data-action="run-sim" style="margin-left:auto;">
              ${icon('play', 14)} Simular ahora
            </button>
          </div>
        </div>

        <aside class="preview" id="preview-panel">
          <h4>Vista previa en vivo
            <span class="pill pill-accent" style="font-size:9.5px; padding:2px 8px;">AUTO</span>
          </h4>
          ${previewVars.map(k => {
            const s = sim[k];
            const w = 300, h = 40;
            const labels = { sp500: 'S&P 500', usdars: exchangeInfo(state.country).label, wti: 'Petróleo WTI', gold: 'Oro' };
            const units = { sp500: '', usdars: '', wti: '$', gold: '$' };
            const dig = (kk, val) => kk === 'inflation' || kk === 'unemployment' ? 3 : (kk === 'usdars' && val < 100 ? 2 : 0);
            return `
              <div class="preview-item">
                <div class="pi-head">
                  <span class="pi-label">${labels[k]}</span>
                  <span class="pi-delta ${s.delta < 0 ? '' : ''}" style="color:${s.delta < 0 ? 'var(--neg)' : 'var(--pos)'}">${fmtPct(s.delta)}</span>
                </div>
                <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%; height:40px;">
                  <path d="${buildAreaPath(s.arr, w, h, 2)}" fill="${s.delta < 0 ? 'rgba(168,56,56,0.12)' : 'rgba(47,107,74,0.12)'}"/>
                  <path d="${buildLinePath(s.arr, w, h, 2)}" fill="none" stroke="${s.delta < 0 ? 'var(--neg)' : 'var(--pos)'}" stroke-width="1.5"/>
                </svg>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:10.5px; color:var(--muted); margin-top:3px;">
                  <span>${units[k]}${fmtNum(s.base, dig(k, s.base))}</span>
                  <span>${units[k]}${fmtNum(s.final, dig(k, s.final))}</span>
                </div>
              </div>
            `;
          }).join('')}
        </aside>
      </div>
    </section>
  `;
}

function updatePreview() {
  // Just re-render the preview panel without touching slider focus
  const panel = document.getElementById('preview-panel');
  if (!panel) return;
  const sc = getScenario(state.selectedScenario);
  const months = DURATIONS[durIdx(state.duration)];
  const sim = simulate(state.selectedScenario, state.intensity, months);
  const previewVars = ['sp500', 'usdars', 'wti', 'gold'];
  const labels = { sp500: 'S&P 500', usdars: exchangeInfo(state.country).label, wti: 'Petróleo WTI', gold: 'Oro' };
  const units = { sp500: '', usdars: '', wti: '$', gold: '$' };
  const w = 300, h = 40;
  panel.innerHTML = `
    <h4>Vista previa en vivo
      <span class="pill pill-accent" style="font-size:9.5px; padding:2px 8px;">AUTO</span>
    </h4>
    ${previewVars.map(k => {
      const s = sim[k];
      return `
        <div class="preview-item">
          <div class="pi-head">
            <span class="pi-label">${labels[k]}</span>
            <span class="pi-delta" style="color:${s.delta < 0 ? 'var(--neg)' : 'var(--pos)'}">${fmtPct(s.delta)}</span>
          </div>
          <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%; height:40px;">
            <path d="${buildAreaPath(s.arr, w, h, 2)}" fill="${s.delta < 0 ? 'rgba(168,56,56,0.12)' : 'rgba(47,107,74,0.12)'}"/>
            <path d="${buildLinePath(s.arr, w, h, 2)}" fill="none" stroke="${s.delta < 0 ? 'var(--neg)' : 'var(--pos)'}" stroke-width="1.5"/>
          </svg>
          <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:10.5px; color:var(--muted); margin-top:3px;">
            <span>${units[k]}${fmtNum(s.base, 0)}</span>
            <span>${units[k]}${fmtNum(s.final, 0)}</span>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function teachersHTML() {
  const feats = [
    { icon: 'sparkle',  t: 'Grupos de clase',       s: 'Creá grupos para que tus alumnos simulen y comparen resultados entre sí. Un panel central muestra las simulaciones de todos.' },
    { icon: 'bars',     t: 'Modo presentación',      s: 'Proyectá simulaciones en clase con gráficos amplificados y explicaciones en vivo. Optimizado para HD y 4K.' },
    { icon: 'save',     t: 'Guías didácticas',       s: 'Material descargable con actividades sugeridas para usar en clase, adaptadas a nivel secundario y universitario.' },
    { icon: 'info',     t: 'Seguimiento de alumnos', s: 'Seguí el progreso individual y grupal: qué escenarios exploraron, qué preguntas respondieron, qué conceptos dominan.' }
  ];
  const teachSteps = [
    { t: 'Creá tu aula',        s: 'Generá un grupo en segundos y compartí el código de acceso con tus alumnos.' },
    { t: 'Elegí un escenario',  s: 'Pandemia, crisis, conflicto o shock petrolero — cada uno con su respaldo histórico real.' },
    { t: 'Simulen en vivo',     s: 'Cada alumno ajusta intensidad y duración, y observa el impacto sobre la economía al instante.' },
    { t: 'Comparen y debatan',  s: 'Pongan dos simulaciones lado a lado y discutan por qué cambian los resultados.' }
  ];
  return `
    <section class="screen active" data-screen-label="Teachers">
      <div class="teach-hero">
        <div class="eyebrow">Para docentes y educadores</div>
        <h2 class="page-title teach-h" style="margin-top:10px;">Llevá la economía al <em>aula</em>.</h2>
        <p class="teach-lede">Geolytics permite a tus alumnos experimentar con escenarios reales y entender relaciones causa-efecto sin tecnicismos. Diseñado en colaboración con docentes de secundario y universidad.</p>
        <div class="hero-cta" style="margin-top:22px;">
          <button class="btn btn-primary" style="background:var(--brand-ink); color:var(--brand);">${icon('sparkle', 14)} Solicitar acceso educativo</button>
          <button class="btn btn-ghost" data-nav="about" style="color:var(--brand-ink); border-color:rgba(255,255,255,0.25);">Ver demo</button>
        </div>
      </div>

      <div class="teach-feats">
        ${feats.map(f => `
          <div class="teach-feat">
            <div class="feature-icon">${icon(f.icon, 20)}</div>
            <h3>${f.t}</h3>
            <p>${f.s}</p>
          </div>
        `).join('')}
      </div>

      <div class="teach-steps">
        <div class="eyebrow" style="color:var(--accent-2);">Cómo usarlo en clase</div>
        <h3 class="teach-section-h">De la teoría a la práctica en cuatro pasos</h3>
        <div class="teach-steps-grid">
          ${teachSteps.map((s, i) => `
            <div class="teach-step">
              <div class="teach-step-num">${i + 1}</div>
              <h4>${s.t}</h4>
              <p>${s.s}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="teach-quote">
        <div class="teach-quote-mark">“</div>
        <blockquote>Mis alumnos pudieron entender en una clase lo que antes les costaba un cuatrimestre. La simulación les permite experimentar sin miedo a equivocarse — y aprender de los errores en tiempo real.</blockquote>
        <div class="teach-quote-who">
          <div class="teach-quote-avatar">MT</div>
          <div>
            <div class="teach-quote-name">Prof. María Torres</div>
            <div class="teach-quote-role">Economía · UBA</div>
          </div>
        </div>
      </div>

      <div class="teach-plans-intro">
        <div class="eyebrow" style="color:var(--accent-2);">Acceso</div>
        <h3 class="teach-section-h" style="margin-bottom:8px;">Gratis para educar</h3>
        <p class="teach-plans-note">Todas las funciones de Geolytics son gratuitas para docentes e instituciones educativas. Elegí cómo lo vas a usar.</p>
      </div>
      <div class="teach-plans">
        <div class="teach-plan">
          <div class="teach-plan-name">Docente individual</div>
          <div class="teach-plan-price">Aula</div>
          <div class="teach-plan-sub">Para vos y tus cursos</div>
          <ul class="teach-plan-list">
            <li>Grupos de clase ilimitados</li>
            <li>Los 6 escenarios completos</li>
            <li>Respaldo histórico con datos reales</li>
            <li>Guías de actividades descargables</li>
          </ul>
          <button class="btn btn-ghost" data-nav="aula" style="width:100%; justify-content:center;">Crear mi aula</button>
        </div>
        <div class="teach-plan featured">
          <span class="teach-plan-tag">Para instituciones</span>
          <div class="teach-plan-name">Escuela o universidad</div>
          <div class="teach-plan-price">Institución</div>
          <div class="teach-plan-sub">Para varios docentes a la vez</div>
          <ul class="teach-plan-list">
            <li>Todo lo del plan Aula</li>
            <li>Varios docentes en un mismo panel</li>
            <li>Modo presentación para proyectar en clase</li>
            <li>Acompañamiento para implementarlo</li>
          </ul>
          <button class="btn btn-primary" data-nav="institucion" style="width:100%; justify-content:center;">Sumar mi institución</button>
        </div>
      </div>
    </section>
  `;
}

// Modal de invitación de la pantalla Aula (mockup)
function openInvite()  { const m = document.getElementById('invite-modal'); if (m) m.style.display = 'flex'; }
function closeInvite() { const m = document.getElementById('invite-modal'); if (m) m.style.display = 'none'; }
function copyInvite(btn, text) {
  try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) {}
  const prev = btn.innerHTML;
  btn.innerHTML = '✓ Copiado';
  setTimeout(() => { btn.innerHTML = prev; }, 1400);
}

function aulaHTML() {
  const alumnos = [
    { n: 'Sofía Giménez',   ini: 'SG', sims: 6, last: 'Pandemia',          when: 'hace 2 h', on: true },
    { n: 'Mateo Ruiz',      ini: 'MR', sims: 4, last: 'Crisis económica',  when: 'hace 5 h', on: true },
    { n: 'Valentina López', ini: 'VL', sims: 8, last: 'Conflicto intern.', when: 'ayer',     on: true },
    { n: 'Tomás Herrera',   ini: 'TH', sims: 3, last: 'Suba de tasas',     when: 'ayer',     on: false },
    { n: 'Camila Sosa',     ini: 'CS', sims: 5, last: 'Guerra comercial',  when: 'hace 2 d', on: false },
    { n: 'Benjamín Díaz',   ini: 'BD', sims: 2, last: 'Petróleo',          when: 'hace 3 d', on: false }
  ];
  const kpis = [['Alumnos', '28', ''], ['Simulaciones', '64', ''], ['Escenario top', 'Pandemia', 'font-size:22px;'], ['Prom. / alumno', '2,3', '']];
  const row = (a) => `
    <div style="display:flex; align-items:center; gap:14px; padding:13px 0; border-top:1px solid var(--line);">
      <div style="flex-shrink:0; width:36px; height:36px; border-radius:50%; background:var(--brand); color:var(--brand-ink); display:grid; place-items:center; font-family:var(--font-mono); font-size:12px; font-weight:600;">${a.ini}</div>
      <div style="flex:1; min-width:0;">
        <div style="font-size:14px; font-weight:600;">${a.n}</div>
        <div style="font-size:12px; color:var(--muted);">Última: ${a.last} · ${a.when}</div>
      </div>
      <div style="font-family:var(--font-mono); font-size:13px; color:var(--ink-2); flex-shrink:0;">${a.sims} sim.</div>
      <span title="${a.on ? 'Activo' : 'Inactivo'}" style="flex-shrink:0; width:8px; height:8px; border-radius:50%; background:${a.on ? 'var(--pos)' : 'var(--line)'};"></span>
    </div>`;
  return `
    <section class="screen active" data-screen-label="Aula">
      <div class="page-head">
        <div>
          <div class="eyebrow">Aula</div>
          <h2 class="page-title" style="margin-top:6px;">Economía · 5.º B</h2>
          <p class="page-sub">Panel del aula: seguí la actividad de tus alumnos y sus simulaciones.</p>
        </div>
        <button class="btn btn-ghost btn-sm" data-nav="teachers">${icon('arrowL', 14)} Volver</button>
      </div>

      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:22px;">
        <div style="display:flex; align-items:center; gap:10px; background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:10px 14px;">
          <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted);">Código de acceso</span>
          <strong style="font-family:var(--font-mono); font-size:16px; letter-spacing:0.08em;">GEO-5B</strong>
        </div>
        <button class="btn btn-ghost btn-sm">${icon('copy', 14)} Copiar código</button>
        <button class="btn btn-primary btn-sm" onclick="openInvite()">${icon('userPlus', 14)} Invitar alumnos</button>
      </div>

      <div class="kpi-grid">
        ${kpis.map(([l, v, st]) => `
          <div class="kpi">
            <div class="kpi-label">${l}</div>
            <div class="kpi-value" style="${st}">${v}</div>
          </div>`).join('')}
      </div>

      <div class="card card-pad">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2px;">
          <h3 style="font-family:var(--font-display); font-size:17px; font-weight:700;">Alumnos</h3>
          <span style="font-size:12px; color:var(--muted);">28 en total · mostrando 6</span>
        </div>
        ${alumnos.map(row).join('')}
      </div>

      <div id="invite-modal" onclick="if(event.target===this)closeInvite()" style="display:none; position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.45); align-items:center; justify-content:center; padding:20px;">
        <div style="background:var(--surface); border:1px solid var(--line); border-radius:18px; box-shadow:0 24px 70px rgba(0,0,0,0.3); width:100%; max-width:440px; padding:28px;">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
            <div>
              <h3 style="font-family:var(--font-display); font-size:20px; font-weight:800;">Invitar alumnos</h3>
              <p style="font-size:13px; color:var(--muted); margin-top:4px; line-height:1.5;">Compartí el código o el enlace para que se sumen a <strong>Economía · 5.º B</strong>.</p>
            </div>
            <button onclick="closeInvite()" class="icon-btn" style="flex-shrink:0;" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style="margin-top:20px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Código del aula</div>
            <div style="display:flex; gap:8px;">
              <div style="flex:1; display:flex; align-items:center; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font-family:var(--font-mono); font-size:17px; letter-spacing:0.1em; font-weight:600;">GEO-5B</div>
              <button class="btn btn-ghost" onclick="copyInvite(this,'GEO-5B')">${icon('copy', 14)} Copiar</button>
            </div>
          </div>
          <div style="margin-top:16px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Enlace de invitación</div>
            <div style="display:flex; gap:8px;">
              <div style="flex:1; min-width:0; display:flex; align-items:center; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font-size:13px; color:var(--ink-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">geolytics.app/aula/GEO-5B</div>
              <button class="btn btn-ghost" onclick="copyInvite(this,'geolytics.app/aula/GEO-5B')">${icon('copy', 14)} Copiar</button>
            </div>
          </div>
          <div style="margin-top:16px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Invitar por email</div>
            <div style="display:flex; gap:8px;">
              <input type="email" placeholder="alumno@email.com" style="flex:1; min-width:0; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font:inherit; font-size:13px; color:var(--ink);">
              <button class="btn btn-primary" onclick="closeInvite()">Enviar</button>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

// Modal de invitación de docente de la pantalla Institución (mockup)
function openInviteDocente()  { const m = document.getElementById('invite-teacher-modal'); if (m) m.style.display = 'flex'; }
function closeInviteDocente() { const m = document.getElementById('invite-teacher-modal'); if (m) m.style.display = 'none'; }

function institucionHTML() {
  const aulas = [
    { name: 'Economía · 5.º B',    teacher: 'M. Torres',    al: 28, sims: 64, act: 0.92 },
    { name: 'Economía · 5.º A',    teacher: 'J. Pereyra',   al: 26, sims: 41, act: 0.60 },
    { name: 'Cs. Sociales · 4.º',  teacher: 'L. Fernández', al: 31, sims: 38, act: 0.54 },
    { name: 'Geografía · 6.º',     teacher: 'R. Acosta',    al: 24, sims: 52, act: 0.78 },
    { name: 'Economía · 6.º C',    teacher: 'P. Molina',    al: 22, sims: 19, act: 0.28 }
  ];
  const kpis = [['Docentes', '12'], ['Aulas', '18'], ['Alumnos', '430'], ['Simulaciones', '1.240']];
  const row = (a) => `
    <div style="display:flex; align-items:center; gap:16px; padding:14px 0; border-top:1px solid var(--line);">
      <div style="flex:1; min-width:0;">
        <div style="font-size:14px; font-weight:600;">${a.name}</div>
        <div style="font-size:12px; color:var(--muted);">${a.teacher} · ${a.al} alumnos</div>
      </div>
      <div style="width:110px; flex-shrink:0;" title="Actividad ${Math.round(a.act * 100)}%">
        <div style="height:6px; background:var(--line); border-radius:3px; overflow:hidden;">
          <div style="height:100%; width:${Math.round(a.act * 100)}%; background:var(--brand);"></div>
        </div>
      </div>
      <div style="font-family:var(--font-mono); font-size:13px; color:var(--ink-2); flex-shrink:0; width:62px; text-align:right;">${a.sims} sim.</div>
    </div>`;
  return `
    <section class="screen active" data-screen-label="Institucion">
      <div class="page-head">
        <div>
          <div class="eyebrow">Institución</div>
          <h2 class="page-title" style="margin-top:6px;">Colegio San Martín</h2>
          <p class="page-sub">Panel institucional: todas las aulas y docentes en un mismo lugar.</p>
        </div>
        <button class="btn btn-ghost btn-sm" data-nav="teachers">${icon('arrowL', 14)} Volver</button>
      </div>

      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:22px;">
        <span class="pill pill-accent">Plan Institución · activo</span>
        <button class="btn btn-primary btn-sm" onclick="openInviteDocente()">${icon('userPlus', 14)} Invitar docente</button>
      </div>

      <div class="kpi-grid">
        ${kpis.map(([l, v]) => `
          <div class="kpi">
            <div class="kpi-label">${l}</div>
            <div class="kpi-value">${v}</div>
          </div>`).join('')}
      </div>

      <div class="card card-pad">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2px;">
          <h3 style="font-family:var(--font-display); font-size:17px; font-weight:700;">Aulas</h3>
          <span style="font-size:12px; color:var(--muted);">18 aulas · mostrando 5</span>
        </div>
        ${aulas.map(row).join('')}
      </div>

      <div id="invite-teacher-modal" onclick="if(event.target===this)closeInviteDocente()" style="display:none; position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.45); align-items:center; justify-content:center; padding:20px;">
        <div style="background:var(--surface); border:1px solid var(--line); border-radius:18px; box-shadow:0 24px 70px rgba(0,0,0,0.3); width:100%; max-width:440px; padding:28px;">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
            <div>
              <h3 style="font-family:var(--font-display); font-size:20px; font-weight:800;">Invitar docente</h3>
              <p style="font-size:13px; color:var(--muted); margin-top:4px; line-height:1.5;">Sumá a un docente a <strong>Colegio San Martín</strong> para que cree sus propias aulas.</p>
            </div>
            <button onclick="closeInviteDocente()" class="icon-btn" style="flex-shrink:0;" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style="margin-top:20px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Email del docente</div>
            <input type="email" placeholder="docente@colegio.edu" style="width:100%; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font:inherit; font-size:13px; color:var(--ink);">
          </div>
          <div style="margin-top:16px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Rol</div>
            <select style="width:100%; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font:inherit; font-size:13px; color:var(--ink); cursor:pointer;">
              <option>Docente</option>
              <option>Coordinador/a</option>
            </select>
          </div>
          <div style="margin-top:16px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Enlace de invitación</div>
            <div style="display:flex; gap:8px;">
              <div style="flex:1; min-width:0; display:flex; align-items:center; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font-size:13px; color:var(--ink-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">geolytics.app/inst/SANMARTIN</div>
              <button class="btn btn-ghost" onclick="copyInvite(this,'geolytics.app/inst/SANMARTIN')">${icon('copy', 14)} Copiar</button>
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%; justify-content:center; margin-top:22px;" onclick="closeInviteDocente()">Enviar invitación</button>
        </div>
      </div>
    </section>`;
}

function aboutHTML() {
  const steps = [
    { n: '1', t: 'Elegí un escenario',    s: 'Crisis, conflictos, pandemias y más.' },
    { n: '2', t: 'Ajustá parámetros',      s: 'Intensidad, duración y variables observadas.' },
    { n: '3', t: 'Visualizá resultados',   s: 'Gráficos y KPIs en tiempo real.' },
    { n: '4', t: 'Compará y aprendé',      s: 'Entendé causa-efecto en economía.' }
  ];
  return `
    <section class="screen active" data-screen-label="About">
      <div class="about-hero">
        <div class="eyebrow">Acerca de Geolytics</div>
        <h2 class="page-title about-h" style="margin-top:10px;">¿Cómo <em>funciona</em> Geolytics?</h2>
        <p class="about-lede">Una herramienta educativa que simula el impacto de eventos globales en la economía, de forma simple e interactiva. Pensada para estudiantes, docentes y curiosos.</p>
        <div class="hero-cta" style="margin-top:22px; position:relative; z-index:1;">
          <button class="btn btn-primary" data-nav="scenarios" style="background:var(--brand-ink); color:var(--brand);">${icon('play', 14)} Empezar a simular</button>
          <button class="btn btn-ghost" data-nav="teachers" style="color:var(--brand-ink); border-color:rgba(255,255,255,0.25);">Para docentes</button>
        </div>
      </div>

      <h3 class="about-section-h">Cómo usarlo</h3>
      <div class="about-steps">
        ${steps.map(s => `
          <div class="about-step">
            <div class="about-step-n">${s.n}</div>
            <div class="about-step-t">${s.t}</div>
            <div class="about-step-s">${s.s}</div>
          </div>
        `).join('')}
      </div>

      <h3 class="about-section-h">Metodología</h3>
      <div class="card card-pad about-methodology">
        <p>Los resultados combinan <em>datos reales</em> con <em>reglas de modelado</em>. El punto de partida de cada simulación —el PIB y la inflación del país elegido— proviene de la <strong>API del Banco Mundial</strong> (indicadores oficiales por país). Sobre esa base real, Geolytics aplica el shock del escenario usando relaciones económicas conocidas, priorizando la <em>coherencia</em> antes que la precisión. El objetivo no es predecir el mercado sino ofrecer una herramienta para explorar escenarios y entender de forma intuitiva cómo distintos eventos pueden influir en la economía.</p>
        <div class="about-meth-grid">
          <div><div class="about-meth-n">~60</div><div class="about-meth-l">Relaciones económicas modeladas</div></div>
          <div><div class="about-meth-n">12</div><div class="about-meth-l">Variables observables</div></div>
          <div><div class="about-meth-n">6</div><div class="about-meth-l">Escenarios base</div></div>
          <div><div class="about-meth-n">∞</div><div class="about-meth-l">Combinaciones posibles</div></div>
        </div>
      </div>

      <div class="about-footer">
        Geolytics · Proyecto educativo · 2026 · <a data-nav="teachers">Para docentes →</a>
      </div>
    </section>
  `;
}
