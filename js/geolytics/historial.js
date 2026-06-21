function historyHTML() {
  const q = (state.histSearch || '').trim().toLowerCase();
  const list = state.history.filter(h =>
    (state.histFilter === 'all' || (state.histFilter === 'saved' && h.saved)) &&
    (!q || (h.name || '').toLowerCase().includes(q) || (getScenario(h.scenario)?.name || '').toLowerCase().includes(q))
  );
  return `
    <section class="screen active" id="screen-history" data-screen-label="History">
      <div class="page-head">
        <div>
          <div class="eyebrow">Biblioteca</div>
          <h2 class="page-title" style="margin-top:6px;">Mis simulaciones</h2>
          <p class="page-sub">Historial completo de escenarios simulados. Marcá favoritos, compará entre sí y volvé a abrir cualquiera.</p>
        </div>
      </div>

      <div class="history-controls">
        <div class="search" style="background: var(--surface); min-width: 320px;">
          ${icon('search', 14)}
          <input id="hist-search" type="text" placeholder="Buscar simulación…" value="${(state.histSearch || '').replace(/"/g, '&quot;')}" autocomplete="off" spellcheck="false" style="flex:1; min-width:0; border:none; background:transparent; outline:none; font:inherit; color:inherit;">
        </div>
        <div class="seg">
          <button class="${state.histFilter === 'all' ? 'on' : ''}" data-hist-filter="all">Todas · ${state.history.length}</button>
          <button class="${state.histFilter === 'saved' ? 'on' : ''}" data-hist-filter="saved">Favoritas · ${state.history.filter(h => h.saved).length}</button>
        </div>
        <div style="margin-left:auto; display:flex; gap:8px;">
          <button class="btn btn-ghost btn-sm">Ordenar: más recientes ${icon('arrowR', 14)}</button>
        </div>
      </div>

      ${list.length === 0 ? emptyState({
        icon: 'clock',
        title: q ? 'Sin resultados'
          : (state.history.length === 0 ? 'Todavía no corriste simulaciones' : 'No tenés favoritas'),
        text: q ? `No encontramos simulaciones que coincidan con “${state.histSearch.trim()}”.`
          : (state.history.length === 0
            ? 'Acá van a aparecer todas las simulaciones que ejecutes. Empezá creando la primera.'
            : 'Marcá una simulación con la estrella para guardarla como favorita y encontrarla rápido acá.'),
        actions: q ? ''
          : (state.history.length === 0
            ? `<button class="btn btn-primary" data-nav="scenarios">${icon('sparkle', 14)} Crear una simulación</button>`
            : `<button class="btn btn-ghost" data-hist-filter="all">Ver todas</button>`)
      }) : ''}
      <div class="history-list">
        ${list.map(h => {
          const sc = getScenario(h.scenario);
          const sim = simulate(h.scenario, h.intensityPct, DURATIONS[h.durIdx], h.country);
          const sp = sim.sp500.arr;
          const pos = sim.sp500.delta >= 0;
          return `
            <div class="history-row" data-hist-open="${h.id}">
              <div class="h-glyph">${sc.glyph}</div>
              <div class="h-main">
                <div class="h-name">${h.name}</div>
                <div class="h-tags">
                  <span class="pill">${intensityLabel(h.intensityPct)}</span>
                  <span class="pill">${DURATIONS[h.durIdx]} meses</span>
                  <span class="pill ${pos ? 'pill-pos' : 'pill-neg'}">S&P ${fmtPct(sim.sp500.delta)}</span>
                </div>
              </div>
              <svg class="h-spark" viewBox="0 0 120 32" preserveAspectRatio="none">
                <path d="${buildLinePath(sp, 120, 32, 2)}" fill="none" stroke="${pos ? 'var(--pos)' : 'var(--neg)'}" stroke-width="1.5"/>
              </svg>
              <div class="h-meta">
                <div class="lab">Fecha</div>
                <div class="val">${h.date}</div>
              </div>
              <div class="h-actions">
                <button class="btn btn-ghost btn-sm">Ver</button>
                <button class="btn btn-ghost btn-sm" data-hist-compare="${h.id}">Comparar</button>
                <button class="h-bookmark ${h.saved ? 'on' : ''}" data-hist-save="${h.id}" title="Favorita">
                  ${icon('bookmark', 15)}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${list.length ? `<div style="display:flex; justify-content:center; gap:4px; margin-top:24px;">
        <button class="btn btn-ghost btn-sm">${icon('arrowL', 12)}</button>
        <button class="btn btn-primary btn-sm" style="min-width:34px">1</button>
        <button class="btn btn-ghost btn-sm" style="min-width:34px">2</button>
        <button class="btn btn-ghost btn-sm" style="min-width:34px">3</button>
        <button class="btn btn-ghost btn-sm">${icon('arrowR', 12)}</button>
      </div>` : ''}
    </section>
  `;
}
