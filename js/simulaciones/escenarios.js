function scenariosHTML() {
  const selected = getScenario(state.selectedScenario);
  return `
    <section class="screen active" id="screen-scenarios" data-screen-label="Scenarios">
      <div class="page-head">
        <div>
          <div class="eyebrow">Paso 1 de 3</div>
          <h2 class="page-title" style="margin-top:6px;">Elegí un escenario</h2>
          <p class="page-sub">Seleccioná el tipo de evento global que querés simular. Luego podrás ajustar su intensidad y duración.</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-ghost btn-sm">Filtros</button>
          <button class="btn btn-ghost btn-sm">Ordenar</button>
        </div>
      </div>
      <div class="scenario-grid">
        ${SCENARIOS.map(sc => `
          <article class="scenario-card ${sc.id === state.selectedScenario ? 'selected' : ''}" data-pick-scenario="${sc.id}">
            <div class="scenario-check">${icon('check', 12)}</div>
            <button class="scenario-info" data-detail-scenario="${sc.id}" aria-label="Ver detalle">${icon('info', 14)}</button>
            <div class="scenario-glyph">${sc.glyph}</div>
            <h3>${sc.name}</h3>
            <p>${sc.desc}</p>
            <div class="scenario-foot">
              <span class="pill ${sc.impact >= 4 ? 'pill-accent' : ''}">${sc.tag}</span>
              <div class="impact-bar lvl-${sc.impact}"><span></span><span></span><span></span><span></span></div>
            </div>
          </article>
        `).join('')}
      </div>
      <div class="continue-bar">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="scenario-glyph" style="margin-bottom:0; width:40px; height:40px; font-size:20px;">${selected.glyph}</div>
          <div>
            <div style="font-size:13px; color:var(--muted); font-family:var(--font-mono); letter-spacing:0.04em;">SELECCIONADO</div>
            <div style="font-size:15px; font-weight:700;">${selected.name}</div>
          </div>
        </div>
        <button class="btn btn-primary" data-nav="config">
          Continuar a configuración ${icon('arrowR', 14)}
        </button>
      </div>
    </section>
  `;
}
