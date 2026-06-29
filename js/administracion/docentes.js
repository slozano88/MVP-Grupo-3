// ============================================================
// PERSONA 4 — Docentes
// ============================================================

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

function openInvite()  { const m = document.getElementById('invite-modal'); if (m) m.style.display = 'flex'; }

function closeInvite() { const m = document.getElementById('invite-modal'); if (m) m.style.display = 'none'; }

function copyInvite(btn, text) {
  try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) {}
  const prev = btn.innerHTML;
  btn.innerHTML = '✓ Copiado';
  setTimeout(() => { btn.innerHTML = prev; }, 1400);
}

