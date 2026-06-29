// ============================================================
// PERSONA 4 — Perfil
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
