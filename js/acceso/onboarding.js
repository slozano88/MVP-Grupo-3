// Genera la pantalla de onboarding inicial
function onboardingHTML() {
  // Pasos informativos
  const steps = [
    {
      t: 'Bienvenido a Geolytics',
      s: 'Una herramienta para explorar cómo eventos globales afectan a la economía. Simple, interactivo, explicable.',
      glyph: '👋'
    },
    {
      t: 'Elegí un escenario',
      s: 'Seleccioná entre crisis económicas, conflictos, pandemias y más. Cada uno simula un impacto diferente en la economía global.',
      glyph: '🌎'
    },
    {
      t: 'Ajustá los parámetros',
      s: 'Modificá la intensidad y la duración. Observá cómo cambia el impacto en tiempo real sobre cada variable.',
      glyph: '🎛'
    },
    {
      t: 'Leé los resultados',
      s: 'Gráficos, KPIs y explicaciones causales. Todo diseñado para entender - no solo para mirar números.',
      glyph: '📈'
    }
  ];

  // Obtiene el paso actual del onboarding
  const idx = state.onboardingStep - 1;
  const step = steps[idx];

  return `
    <section class="screen active onb-screen" data-screen-label="Onboarding">
      <button class="auth-close" data-action="onb-done" aria-label="Saltar">Saltar</button>

      <div class="onb-card">
        // Indicador de paso actual
        <div class="onb-eyebrow">Paso ${state.onboardingStep} de 4</div>

        // Barra de progreso
        <div class="onb-progress-track">
          <div class="onb-progress-fill" style="width:${(state.onboardingStep / 4) * 100}%"></div>
        </div>

        // Visual del paso
        <div class="onb-viz">
          <div class="onb-glyph">${step.glyph}</div>

          <svg class="onb-viz-svg" viewBox="0 0 360 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="onbGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.22"/>
                <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <path d="M0,140 C60,120 100,60 160,70 C220,80 260,30 320,50 L360,60 L360,180 L0,180 Z" fill="url(#onbGrad)"/>
            <path d="M0,140 C60,120 100,60 160,70 C220,80 260,30 320,50 L360,60" fill="none" stroke="var(--accent)" stroke-width="2"/>
          </svg>
        </div>

        // Texto explicativo del paso actual
        <h2 class="onb-title">${step.t}</h2>
        <p class="onb-sub">${step.s}</p>

        // Puntos de avance
        <div class="onb-dots">
          ${steps.map((_, i) => `<span class="onb-dot ${i === idx ? 'active' : i < idx ? 'done' : ''}"></span>`).join('')}
        </div>

        // Botones avanzar, retroceder o finalizar
        <div class="onb-actions">
          <button class="btn btn-ghost" ${state.onboardingStep === 1 ? 'disabled style="opacity:.4"' : ''} data-onb-prev>
            ${icon('arrowL', 14)} Anterior
          </button>

          ${state.onboardingStep < 4
            ? `<button class="btn btn-primary" data-onb-next>Siguiente ${icon('arrowR', 14)}</button>`
            : `<button class="btn btn-primary" data-action="onb-done">Empezar a explorar ${icon('arrowR', 14)}</button>`}
        </div>
      </div>
    </section>
  `;
}