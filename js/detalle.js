// ============================================================
// PERSONA 3 — Detalle de escenario
// ============================================================

function detailHTML() {
  const sc = getScenario(state.detailScenario);
  const d = SCENARIO_DETAILS[state.detailScenario];
  const arrow = (dir) => dir === 'up' ? '↑' : dir === 'down' ? '↓' : '↕';
  return `
    <section class="screen active" data-screen-label="ScenarioDetail">
      <div class="detail-crumbs">
        <button data-nav="scenarios">Escenarios</button>
        <span class="slash">›</span>
        <strong>${sc.name}</strong>
      </div>
      <div class="detail-grid">
        <div>
          <div class="detail-hero">
            <div class="detail-hero-glyph">${sc.glyph}</div>
            <div>
              <h2 class="detail-title">${sc.name}</h2>
              <div style="display:flex; gap:6px; margin-top:8px;">
                <span class="pill pill-brand">${sc.tag}</span>
                <span class="pill">Global</span>
                <div class="impact-bar lvl-${sc.impact}" style="margin-left:6px; align-self:center;"><span></span><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>
          <p class="detail-long">${d.long}</p>

          <h4 class="detail-h">Variables afectadas</h4>
          <div class="detail-vars">
            ${d.vars.map(v => `
              <div class="detail-var">
                <div class="detail-var-glyph">${v.glyph}</div>
                <div class="detail-var-info">
                  <div class="detail-var-name">${v.name}</div>
                  <div class="detail-var-sub">${v.sub}</div>
                </div>
                <div class="detail-var-dir dir-${v.dir}">${arrow(v.dir)} ${v.label}</div>
              </div>
            `).join('')}
          </div>

          <div class="detail-cta-row">
            <button class="btn btn-primary" data-action="sim-from-detail">${icon('play', 14)} Simular este escenario</button>
            <button class="btn btn-ghost" data-nav="scenarios">${icon('grid', 14)} Ver otros escenarios</button>
          </div>
        </div>

        <aside class="detail-side">
          <h4 class="detail-h">Ejemplos históricos</h4>
          <div class="detail-cases">
            ${d.cases.map(c => `
              <div class="detail-case">
                <div class="detail-case-title">${c.title}</div>
                <p>${c.body}</p>
                <div class="detail-case-meta">${c.meta}</div>
              </div>
            `).join('')}
          </div>
          <div class="detail-trivia">
            <div class="detail-trivia-eyebrow">¿Sabías que...?</div>
            <p>${d.trivia}</p>
          </div>
        </aside>
      </div>
    </section>
  `;
}
