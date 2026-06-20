// ============================================================
// PERSONA 3 — Acerca de
// Archivo suelto asignado a P3 junto al inicio institucional.
// ============================================================

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
