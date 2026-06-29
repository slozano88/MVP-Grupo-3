// ============================================================
// PERSONA 4 — Configuración
// ============================================================

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

