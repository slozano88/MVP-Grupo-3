// ============================================================
// GEOLYTICS — js/simulaciones/screens-simulacion.js  ·  módulo simulación
// ------------------------------------------------------------
// Selección de escenarios, resultados (+ gráficos) y comparación A/B.
// ============================================================

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

function resultsHTML() {
  const sc = getScenario(state.selectedScenario);
  const months = DURATIONS[durIdx(state.duration)];
  const sim = simulate(state.selectedScenario, state.intensity, months);

  const ctry = getCountry(state.country);
  const exInfo = exchangeInfo(state.country);
  const realInflPct = wbCachedLatest(state.country, WB_INDICATORS.inflation);
  const realGdpVal = wbCachedLatest(state.country, WB_INDICATORS.gdp);
  const realUnemplPct = wbCachedLatest(state.country, WB_INDICATORS.unemployment);
  const projInflPct = sim.inflation ? sim.inflation.final * 100 : null;
  const realStrip = [
    ['PIB real', realGdpVal != null ? fmtGdp(realGdpVal) : '…', 'inherit'],
    ['Tipo de cambio real · ' + exInfo.cur, exInfo.rate != null ? fmtNum(exInfo.rate, exInfo.rate < 100 ? 2 : 0) : '…', 'inherit'],
    ['Desempleo real de partida', realUnemplPct != null ? realUnemplPct.toFixed(1) + '%' : '…', 'inherit'],
    ['Inflación real de partida', realInflPct != null ? realInflPct.toFixed(1) + '%' : '…', 'inherit'],
    ['Inflación proyectada · ' + months + ' m', (realInflPct != null && projInflPct != null) ? projInflPct.toFixed(1) + '%' : '…',
      (projInflPct != null && realInflPct != null && projInflPct >= realInflPct) ? 'var(--neg)' : 'var(--pos)'],
  ];

  // ---- Respaldo histórico: qué ocurrió de verdad el año del evento de referencia ----
  const ref = sc.reference;
  let histBackHTML = '';
  if (ref) {
    const gAt = wbValueAtYear(state.country, WB_INDICATORS.gdpGrowth, ref.year);
    const uAt = wbValueAtYear(state.country, WB_INDICATORS.unemployment, ref.year);
    const uPrev = wbValueAtYear(state.country, WB_INDICATORS.unemployment, ref.year - 1);
    const iAt = wbValueAtYear(state.country, WB_INDICATORS.inflation, ref.year);
    const hb = (label, valHtml, sub) => `
      <div>
        <div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted);">${label}</div>
        <div style="font-family:var(--font-mono); font-size:16px; font-weight:600; margin-top:3px;">${valHtml}</div>
        ${sub ? `<div style="font-size:10px; color:var(--muted); margin-top:3px;">${sub}</div>` : ''}
      </div>`;
    const metrics = [];
    if (gAt != null) metrics.push(hb('Crec. PIB ' + ref.year, `<span style="color:${gAt < 0 ? 'var(--neg)' : 'var(--pos)'}">${gAt >= 0 ? '+' : ''}${gAt.toFixed(1)}%</span>`, 'real, Banco Mundial'));
    if (uAt != null) {
      let sub = 'real, Banco Mundial';
      if (uPrev != null) { const d = uAt - uPrev; sub = `${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)} pp vs ${ref.year - 1}`; }
      metrics.push(hb('Desempleo ' + ref.year, uAt.toFixed(1) + '%', sub));
    }
    if (iAt != null) metrics.push(hb('Inflación ' + ref.year, `<span style="color:${iAt > 10 ? 'var(--neg)' : 'inherit'}">${iAt.toFixed(1)}%</span>`, 'real, Banco Mundial'));

    const metricsHTML = metrics.length
      ? `<div style="display:flex; gap:28px; flex-wrap:wrap;">${metrics.join('')}</div>`
      : `<div style="font-size:11.5px; color:var(--muted);">${ctry.name} no reporta indicadores para ${ref.year}; el escenario se calibra sobre el patrón global del evento.</div>`;

    histBackHTML = `
      <div class="card card-pad" style="margin-bottom:18px; border-left:3px solid var(--brand);">
        <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;">
          <span style="font-family:var(--font-mono); font-size:9.5px; letter-spacing:0.06em; color:var(--muted); text-transform:uppercase;">Respaldo histórico</span>
          <span style="font-weight:700; font-size:15px;">${ref.name}</span>
          <span style="font-family:var(--font-mono); font-size:12px; color:var(--brand); font-weight:600;">${ref.year}</span>
        </div>
        <p style="font-size:12.5px; color:var(--muted); line-height:1.5; margin:8px 0 14px; max-width:62ch;">${ref.note}</p>
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted); margin-bottom:8px;">Lo que ocurrió en ${ctry.name}</div>
        ${metricsHTML}
      </div>`;
  }

  const fxDigits = (exInfo.rate != null && exInfo.rate < 100) ? 2 : 0;
  // KPIs y gráficos según las variables seleccionadas en Configuración (state.vars)
  const KPI_BY_VAR = {
    sp500:        [{ key: 'sp500', label: 'S&P 500', unit: '', digits: 0 }],
    usdars:       [{ key: 'usdars', label: exInfo.label, unit: '', digits: fxDigits }],
    commodities:  [{ key: 'wti', label: 'Petróleo WTI', unit: '$', digits: 0 }, { key: 'gold', label: 'Oro (oz)', unit: '$', digits: 0 }],
    inflation:    [{ key: 'inflation', label: 'Inflación', unit: '', digits: 1, pct: true }],
    unemployment: [{ key: 'unemployment', label: 'Desempleo', unit: '', digits: 1, pct: true }]
  };
  const kpis = VARIABLES.filter(v => state.vars[v.id]).flatMap(v => KPI_BY_VAR[v.id] || []);

  const chartCards = [];
  if (state.vars.sp500) {
    chartCards.push(`
      <div class="card chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Índices bursátiles</div>
            <div class="chart-sub">S&P 500 · ${months} meses proyectados</div>
          </div>
          ${chartToggle('sp500')}
        </div>
        ${renderBigChart(sim.sp500, 560, 240, chartModeFor('sp500'), '--chart-1')}
        <div class="legend">
          <div class="legend-item"><span class="legend-swatch" style="background:var(--chart-1)"></span>S&P 500</div>
          <div class="legend-item" style="color:var(--muted-2)"><span class="legend-swatch" style="background:var(--line-strong)"></span>Baseline</div>
        </div>
      </div>`);
  }
  if (state.vars.usdars) {
    chartCards.push(`
      <div class="card chart-card">
        <div class="chart-header"><div><div class="chart-title">Tipo de cambio</div><div class="chart-sub">${exInfo.label} · ${months} meses</div></div>${chartToggle('usdars')}</div>
        ${renderMultiChart([{ key: 'usdars', label: exInfo.cur, color: 'var(--chart-1)', s: sim.usdars }], 560, 240, chartModeFor('usdars'))}
        <div class="legend"><div class="legend-item"><span class="legend-swatch" style="background:var(--chart-1)"></span>${exInfo.label}</div></div>
      </div>`);
  }
  if (state.vars.commodities) {
    chartCards.push(`
      <div class="card chart-card">
        <div class="chart-header"><div><div class="chart-title">Commodities</div><div class="chart-sub">Petróleo, oro — normalizados</div></div>${chartToggle('commodities')}</div>
        ${renderMultiChart([
          { key: 'wti', label: 'Petróleo', color: 'var(--chart-2)', s: sim.wti },
          { key: 'gold', label: 'Oro', color: 'var(--chart-3)', s: sim.gold }
        ], 560, 240, chartModeFor('commodities'))}
        <div class="legend">
          <div class="legend-item"><span class="legend-swatch" style="background:var(--chart-2)"></span>Petróleo WTI</div>
          <div class="legend-item"><span class="legend-swatch" style="background:var(--chart-3)"></span>Oro</div>
        </div>
      </div>`);
  }
  if (state.vars.inflation) {
    chartCards.push(`
      <div class="card chart-card">
        <div class="chart-header"><div><div class="chart-title">Inflación</div><div class="chart-sub">IPC proyectado · ${months} meses</div></div>${chartToggle('inflation')}</div>
        ${renderMultiChart([{ key: 'inflation', label: 'Inflación', color: 'var(--chart-2)', s: sim.inflation }], 560, 240, chartModeFor('inflation'))}
        <div class="legend"><div class="legend-item"><span class="legend-swatch" style="background:var(--chart-2)"></span>Tasa de inflación</div></div>
      </div>`);
  }
  if (state.vars.unemployment) {
    chartCards.push(`
      <div class="card chart-card">
        <div class="chart-header"><div><div class="chart-title">Desempleo</div><div class="chart-sub">Tasa proyectada · ${months} meses</div></div>${chartToggle('unemployment')}</div>
        ${renderMultiChart([{ key: 'unemployment', label: 'Desempleo', color: 'var(--chart-3)', s: sim.unemployment }], 560, 240, chartModeFor('unemployment'))}
        <div class="legend"><div class="legend-item"><span class="legend-swatch" style="background:var(--chart-3)"></span>Tasa de desempleo</div></div>
      </div>`);
  }

  return `
    <section class="screen active" id="screen-results" data-screen-label="Results">
      <div class="result-head">
        <div>
          <div class="eyebrow">Paso 3 · Resultados de simulación</div>
          <h1 class="result-title" style="margin-top:8px;">${sc.glyph} ${sc.name}<br><em>${intensityLabel(state.intensity).toLowerCase()}</em>, ${months} meses</h1>
          <div class="result-meta">
            <span class="pill pill-brand">${sc.tag}</span>
            <span class="pill">Intensidad: ${intensityLabel(state.intensity)}</span>
            <span class="pill">Duración: ${months} meses</span>
            <span class="pill">${Object.values(state.vars).filter(Boolean).length} variables</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn btn-ghost btn-sm" data-nav="compare">${icon('compare', 14)} Comparar</button>
          <div class="export-wrap">
            <button class="btn btn-ghost btn-sm" data-action="toggle-export" aria-haspopup="true">${icon('download', 14)} Exportar</button>
            <div id="export-menu" class="export-menu" role="menu">
              <button class="export-opt" data-action="export-pdf" role="menuitem">${icon('book', 14)} <span><strong>PDF completo</strong><em>Documento con gráficos</em></span></button>
              <button class="export-opt" data-action="export-jpg" role="menuitem">${icon('grid', 14)} <span><strong>Imagen JPG</strong><em>Resumen compacto</em></span></button>
              <button class="export-opt" data-action="export-png" role="menuitem">${icon('copy', 14)} <span><strong>Imagen PNG</strong><em>Resumen sin pérdida</em></span></button>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" data-action="save-result">${icon('save', 14)} Guardar</button>
        </div>
      </div>

      <div class="card card-pad" id="results-real" style="margin-bottom:18px; display:flex; flex-wrap:wrap; align-items:center; gap:24px;">
        <div style="display:flex; align-items:center; gap:10px; min-width:170px;">
          <span style="font-size:24px;">${ctry.flag}</span>
          <div>
            <div style="font-family:var(--font-mono); font-size:9.5px; letter-spacing:0.06em; color:var(--muted); text-transform:uppercase;">Punto de partida · Banco Mundial</div>
            <div style="font-weight:600; font-size:14px; margin-top:1px;">${ctry.name}</div>
          </div>
        </div>
        <div style="display:flex; gap:28px; flex-wrap:wrap; flex:1;">
          ${realStrip.map(([l, v, col]) => `
            <div>
              <div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted);">${l}</div>
              <div style="font-family:var(--font-mono); font-size:16px; font-weight:600; margin-top:3px; color:${col};">${v}</div>
            </div>`).join('')}
        </div>
      </div>

      ${histBackHTML}

      ${kpis.length === 0 ? `<div class="card card-pad" style="text-align:center; color:var(--muted); margin-bottom:20px;">No hay variables seleccionadas. Volvé a <a data-nav="config" style="color:var(--brand); cursor:pointer;">Configuración</a> para elegir qué observar.</div>` : ''}
      <div class="kpi-grid">
        ${kpis.map(k => {
          const s = sim[k.key];
          const pos = s.delta >= 0;
          const valStr = k.pct ? fmtNum(s.final * 100, 1) + '%' : fmtNum(s.final, k.digits);
          return `
            <div class="kpi">
              <div class="kpi-label">${k.label}</div>
              <div class="kpi-value"><span class="cur">${k.unit}</span>${valStr}</div>
              <div class="kpi-change ${pos ? 'pos' : 'neg'}">
                ${pos ? '▲' : '▼'} ${fmtPct(s.delta)}
              </div>
              <svg class="kpi-spark" viewBox="0 0 90 36" preserveAspectRatio="none">
                <path d="${buildLinePath(s.arr, 90, 36, 2)}" fill="none" stroke="${pos ? 'var(--pos)' : 'var(--neg)'}" stroke-width="1.5"/>
              </svg>
            </div>
          `;
        }).join('')}
      </div>

      <div class="charts-grid" style="grid-template-columns:${chartCards.length <= 1 ? '1fr' : 'repeat(2, 1fr)'};">
        ${chartCards.join('')}
      </div>

      <div class="explain">
        <div class="explain-head">
          <div>
            <div class="eyebrow" style="color:var(--brand);">${icon('info', 14)} ¿Qué está pasando?</div>
            <h3 class="explain-title" style="margin-top:6px;">Interpretación del escenario <em>en contexto</em></h3>
          </div>
          <button class="btn btn-ghost btn-sm" data-nav="about">Ver metodología ${icon('arrowR', 14)}</button>
        </div>
        <p>${buildExplanation(sc, sim, state.intensity, months)}</p>
        <div class="causal-chain">
          ${buildCausalChain(sc, sim)}
        </div>
      </div>
    </section>
  `;
}

function buildExplanation(sc, sim, intensity, months) {
  const impact = intensityLabel(intensity).toLowerCase();
  const sp = fmtPct(sim.sp500.delta);
  const usd = fmtPct(sim.usdars.delta);
  const oil = fmtPct(sim.wti.delta);
  const gold = fmtPct(sim.gold.delta);
  return `Una <strong>${sc.name.toLowerCase()}</strong> de intensidad <strong>${impact}</strong> sostenida durante <strong>${months} meses</strong> genera un reacomodamiento sistémico: ${sc.summary} Los índices bursátiles reaccionan con ${sp}, el tipo de cambio se ajusta ${usd}, el petróleo refleja ${oil} y el oro —como activo refugio— ${gold}.`;
}

function buildCausalChain(sc, sim) {
  const nodes = [];
  nodes.push(`<div class="cause-node primary">${sc.glyph} ${sc.name}</div>`);
  const arrow = `<div class="cause-arrow">${icon('arrowR', 16)}</div>`;
  const chain = [
    { label: `Bolsa ${fmtPct(sim.sp500.delta)}` },
    { label: `Dólar ${fmtPct(sim.usdars.delta)}` },
    { label: `Oro ${fmtPct(sim.gold.delta)}` }
  ];
  chain.forEach(c => {
    nodes.push(arrow);
    nodes.push(`<div class="cause-node">${c.label}</div>`);
  });
  return nodes.join('');
}

// Tipo de gráfico elegido por el usuario, por cada gráfico (clave). Default: línea.
function chartModeFor(key) {
  return (state.chartModes && state.chartModes[key]) || 'line';
}
// Selector de tipo de gráfico (línea / área / barras) para un gráfico dado.
function chartToggle(key) {
  const m = chartModeFor(key);
  return `<div class="chart-toggle">
    <button class="${m === 'line' ? 'on' : ''}" data-chart-mode="line" data-chart-key="${key}">Línea</button>
    <button class="${m === 'area' ? 'on' : ''}" data-chart-mode="area" data-chart-key="${key}">Área</button>
    <button class="${m === 'bars' ? 'on' : ''}" data-chart-mode="bars" data-chart-key="${key}">Barras</button>
  </div>`;
}

function renderBigChart(s, w, h, mode, colorVar) {
  const baseline = s.base;
  const min = Math.min(...s.arr, baseline * 0.95);
  const max = Math.max(...s.arr, baseline * 1.05);
  const range = (max - min) || 1;
  const baseY = (y) => 24 + (1 - (y - min) / range) * (h - 48);
  const pad = 20;
  const effW = w - pad * 2;
  const n = s.arr.length;
  // non-scaling-stroke: el grosor y las líneas punteadas NO se deforman al escalar.
  const ns = 'vector-effect="non-scaling-stroke"';

  // ticks del eje X
  const monthsL = ['E','F','M','A','M','J','J','A','S','O','N','D'];
  let ticks = '';
  for (let i = 0; i < 5; i++) {
    const x = pad + (i / 4) * effW;
    ticks += `<line x1="${x}" y1="${h - 20}" x2="${x}" y2="${h - 16}" stroke="var(--line-strong)" stroke-width="1" ${ns}/>`;
    ticks += `<text x="${x}" y="${h - 4}" font-size="10" fill="var(--muted)" font-family="IBM Plex Mono" text-anchor="middle">${monthsL[Math.floor(i * n / 4) % 12]}</text>`;
  }

  // gridlines horizontales
  let grid = '';
  for (let i = 0; i < 4; i++) {
    const y = 24 + (i / 3) * (h - 48);
    grid += `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 4" ${ns}/>`;
  }

  // baseline
  const by = baseY(baseline);
  const baselineLine = `<line x1="${pad}" y1="${by}" x2="${w - pad}" y2="${by}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="4 4" ${ns}/>
    <text x="${w - pad - 4}" y="${by - 4}" font-size="10" fill="var(--muted)" font-family="IBM Plex Mono" text-anchor="end">baseline ${fmtNum(baseline)}</text>`;

  // cuerpo según el tipo elegido
  let body = '';
  if (mode === 'bars') {
    const bw = (effW / n) * 0.7;
    body = s.arr.map((v, i) => {
      const x = pad + (i / (n - 1)) * effW - bw / 2;
      const y = baseY(v);
      const pos = v >= baseline;
      return `<rect x="${x}" y="${pos ? y : by}" width="${bw}" height="${Math.max(1, Math.abs(by - y))}" fill="var(${pos ? '--pos' : '--neg'})" opacity="0.75" rx="2"/>`;
    }).join('');
  } else {
    const pts = s.arr.map((v, i) => `${(pad + (i / (n - 1)) * effW).toFixed(1)},${baseY(v).toFixed(1)}`);
    const linePath = 'M' + pts.join(' L');
    if (mode === 'area') {
      body = `<defs><linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="var(${colorVar})" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="var(${colorVar})" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${linePath} L${w - pad},${h - 24} L${pad},${h - 24} Z" fill="url(#areaGrad)"/>
      <path d="${linePath}" fill="none" stroke="var(${colorVar})" stroke-width="2.5" ${ns}/>`;
    } else {
      body = `<path d="${linePath}" fill="none" stroke="var(${colorVar})" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${ns}/>`;
      const last = pts[pts.length - 1].split(',');
      body += `<circle cx="${last[0]}" cy="${last[1]}" r="4" fill="var(${colorVar})"/>
        <circle cx="${last[0]}" cy="${last[1]}" r="8" fill="var(${colorVar})" opacity="0.2"/>`;
    }
  }

  // SIN preserveAspectRatio="none": el SVG escala de forma uniforme (no se estira).
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block;">
    ${grid}${baselineLine}${body}${ticks}
  </svg>`;
}

function renderMultiChart(series, w, h, mode) {
  mode = mode || 'line';
  const pad = 20;
  const effW = w - pad * 2;
  const top = 24, bot = h - 24;
  const ns = 'vector-effect="non-scaling-stroke"';
  let defs = '', body = '';
  series.forEach((ss, si) => {
    const arr = ss.s.arr;
    const min = Math.min(...arr), max = Math.max(...arr);
    const range = (max - min) || 1;
    const n = arr.length;
    const X = (i) => pad + (i / (n - 1)) * effW;
    const Y = (v) => top + (1 - (v - min) / range) * (bot - top);
    const pts = arr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
    if (mode === 'bars') {
      const groupW = effW / n;
      const bw = Math.max(2, (groupW * 0.7) / series.length);
      body += arr.map((v, i) => {
        const x = X(i) - groupW * 0.35 + bw * si;
        const y = Y(v);
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, bot - y).toFixed(1)}" fill="${ss.color}" opacity="0.8" rx="1.5"/>`;
      }).join('');
    } else if (mode === 'area') {
      const gid = `mg${si}_${Math.random().toString(36).slice(2, 7)}`;
      defs += `<linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${ss.color}" stop-opacity="0.30"/><stop offset="100%" stop-color="${ss.color}" stop-opacity="0"/></linearGradient>`;
      const line = 'M' + pts.join(' L');
      body += `<path d="${line} L${X(n - 1).toFixed(1)},${bot} L${X(0).toFixed(1)},${bot} Z" fill="url(#${gid})"/>`;
      body += `<path d="${line}" fill="none" stroke="${ss.color}" stroke-width="2.2" ${ns}/>`;
    } else {
      body += `<path d="M${pts.join(' L')}" fill="none" stroke="${ss.color}" stroke-width="2.2" ${ns}/>`;
      const last = pts[pts.length - 1].split(',');
      body += `<circle cx="${last[0]}" cy="${last[1]}" r="3.2" fill="${ss.color}"/>`;
    }
  });
  let grid = '';
  for (let i = 0; i < 4; i++) {
    const y = top + (i / 3) * (bot - top);
    grid += `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 4" ${ns}/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block;">${defs ? `<defs>${defs}</defs>` : ''}${grid}${body}</svg>`;
}

function compareHTML() {
  // Con menos de 2 simulaciones no hay nada que comparar → estado vacío
  // (antes crasheaba al intentar leer escenarios inexistentes).
  if (state.history.length < 2) {
    return `
      <section class="screen active" data-screen-label="Compare">
        <div class="page-head">
          <div>
            <div class="eyebrow">Análisis comparativo</div>
            <h2 class="page-title" style="margin-top:6px;">Comparación de escenarios</h2>
            <p class="page-sub">Poné dos simulaciones lado a lado para ver qué variables se comportan distinto.</p>
          </div>
        </div>
        ${emptyState({
          icon: 'compare',
          title: 'Todavía no hay nada que comparar',
          text: 'Las comparaciones aparecen cuando tenés al menos <strong>2 simulaciones</strong> en tu historial. Corré algunas y volvé acá para verlas enfrentadas.',
          actions: `<button class="btn btn-primary" data-nav="scenarios">${icon('sparkle', 14)} Crear una simulación</button><button class="btn btn-ghost" data-nav="history">Ver mi historial</button>`
        })}
      </section>
    `;
  }
  const a = state.history.find(h => h.id === state.compareA) || state.history[0];
  const b = state.history.find(h => h.id === state.compareB) || state.history[1];
  const sa = getScenario(a.scenario), sb = getScenario(b.scenario);
  const simA = simulate(a.scenario, a.intensityPct, DURATIONS[a.durIdx]);
  const simB = simulate(b.scenario, b.intensityPct, DURATIONS[b.durIdx]);

  const exInfoC = exchangeInfo(state.country);
  const vars = [
    { key: 'sp500', label: 'S&P 500', unit: '', digits: 0 },
    { key: 'usdars', label: exInfoC.label, unit: '', digits: (exInfoC.rate != null && exInfoC.rate < 100) ? 2 : 0 },
    { key: 'wti', label: 'Petróleo WTI', unit: '$', digits: 0 },
    { key: 'gold', label: 'Oro', unit: '$', digits: 0 },
    { key: 'inflation', label: 'Inflación', unit: '', digits: 3 },
    { key: 'unemployment', label: 'Desempleo', unit: '', digits: 3 }
  ];

  // Opciones para elegir libremente qué simulación va en A y cuál en B.
  const cmpOpts = (selId) => state.history.map(x => {
    const sx = getScenario(x.scenario);
    return `<option value="${x.id}"${x.id === selId ? ' selected' : ''}>${sx.glyph}  ${x.name} · ${intensityLabel(x.intensityPct)} · ${DURATIONS[x.durIdx]}m · ${x.date}</option>`;
  }).join('');

  return `
    <section class="screen active" id="screen-compare" data-screen-label="Compare">
      <div class="page-head">
        <div>
          <div class="eyebrow">Análisis comparativo</div>
          <h2 class="page-title" style="margin-top:6px;">Comparación de escenarios</h2>
          <p class="page-sub">Visualizá lado a lado las diferencias entre dos simulaciones y entendé qué variables se comportan distinto.</p>
        </div>
        <button class="btn btn-ghost btn-sm" data-nav="history">${icon('arrowL', 14)} Volver a historial</button>
      </div>

      <div class="compare-head">
        <div class="compare-card a">
          <span class="compare-label">Escenario A</span>
          <select class="compare-select" data-compare-pick="a" aria-label="Elegir simulación A">${cmpOpts(a.id)}</select>
          <div class="compare-card-head">
            <div class="scenario-glyph" style="margin-bottom:0;">${sa.glyph}</div>
            <div>
              <h3>${a.name}</h3>
              <div style="font-size:12px; color:var(--muted); font-family:var(--font-mono); margin-top:4px;">
                ${intensityLabel(a.intensityPct).toUpperCase()} · ${DURATIONS[a.durIdx]} MESES · ${a.date}
              </div>
            </div>
          </div>
        </div>
        <div class="compare-vs">vs</div>
        <div class="compare-card b">
          <span class="compare-label">Escenario B</span>
          <select class="compare-select" data-compare-pick="b" aria-label="Elegir simulación B">${cmpOpts(b.id)}</select>
          <div class="compare-card-head">
            <div class="scenario-glyph" style="margin-bottom:0;">${sb.glyph}</div>
            <div>
              <h3>${b.name}</h3>
              <div style="font-size:12px; color:var(--muted); font-family:var(--font-mono); margin-top:4px;">
                ${intensityLabel(b.intensityPct).toUpperCase()} · ${DURATIONS[b.durIdx]} MESES · ${b.date}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="charts-grid charts-grid-2col">
        <div class="card chart-card">
          <div class="chart-header">
            <div><div class="chart-title">Índices bursátiles — A vs B</div><div class="chart-sub">S&P 500 normalizado</div></div>
            ${chartToggle('cmp-sp500')}
          </div>
          ${renderCompareChart(simA.sp500, simB.sp500, 520, 240, chartModeFor('cmp-sp500'))}
          <div class="legend">
            <div class="legend-item"><span class="legend-swatch" style="background:var(--brand)"></span>A · ${a.name}</div>
            <div class="legend-item"><span class="legend-swatch" style="background:var(--accent)"></span>B · ${b.name}</div>
          </div>
        </div>
        <div class="card chart-card">
          <div class="chart-header">
            <div><div class="chart-title">Tipo de cambio — A vs B</div><div class="chart-sub">${exInfoC.label} normalizado</div></div>
            ${chartToggle('cmp-fx')}
          </div>
          ${renderCompareChart(simA.usdars, simB.usdars, 520, 240, chartModeFor('cmp-fx'))}
          <div class="legend">
            <div class="legend-item"><span class="legend-swatch" style="background:var(--brand)"></span>A</div>
            <div class="legend-item"><span class="legend-swatch" style="background:var(--accent)"></span>B</div>
          </div>
        </div>
      </div>

      <div style="margin-top:20px;"></div>

      <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr><th>Variable</th><th style="text-align:right;">Escenario A</th><th style="text-align:right;">Escenario B</th><th style="text-align:right;">Diferencia</th><th class="bar-col">Magnitud relativa</th></tr>
        </thead>
        <tbody>
          ${vars.map(v => {
            const va = simA[v.key], vb = simB[v.key];
            if (!va || !vb) return '';
            const diff = va.delta - vb.delta;
            const maxAbs = Math.max(Math.abs(va.delta), Math.abs(vb.delta), 0.01);
            const pctA = Math.abs(va.delta) / maxAbs * 100;
            const pctB = Math.abs(vb.delta) / maxAbs * 100;
            return `
              <tr>
                <td><strong>${v.label}</strong></td>
                <td class="val" style="color:${va.delta < 0 ? 'var(--neg)' : 'var(--pos)'}">${fmtPct(va.delta)}</td>
                <td class="val" style="color:${vb.delta < 0 ? 'var(--neg)' : 'var(--pos)'}">${fmtPct(vb.delta)}</td>
                <td class="diff" style="color:${diff >= 0 ? 'var(--pos)' : 'var(--neg)'}">${fmtPct(diff)}</td>
                <td class="bar-col">
                  <div class="bar">
                    <div class="bar-track">
                      <div class="bar-fill-a" style="width:${pctA}%"></div>
                      <div class="bar-fill-b" style="width:${pctB}%"></div>
                    </div>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      </div>
    </section>
  `;
}

function renderCompareChart(sA, sB, w, h, mode) {
  mode = mode || 'line';
  const pad = 20, top = 20, bot = h - 20;
  const effW = w - pad * 2;
  const ns = 'vector-effect="non-scaling-stroke"';
  // normalizar al % de cambio desde el primer punto
  const normA = sA.arr.map(v => (v - sA.arr[0]) / sA.arr[0]);
  const normB = sB.arr.map(v => (v - sB.arr[0]) / sB.arr[0]);
  const mn = Math.min(...normA, ...normB, -0.01);
  const mx = Math.max(...normA, ...normB, 0.01);
  const range = (mx - mn) || 1;
  const n = normA.length;
  const X = (i) => pad + (i / (n - 1)) * effW;
  const Y = (v) => top + (1 - (v - mn) / range) * (bot - top);
  const zeroY = Y(0);
  const grid = `<line x1="${pad}" y1="${zeroY.toFixed(1)}" x2="${w - pad}" y2="${zeroY.toFixed(1)}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="4 4" ${ns}/>`;
  const sets = [{ arr: normA, color: 'var(--brand)' }, { arr: normB, color: 'var(--accent)' }];
  let defs = '', body = '';
  sets.forEach((s, si) => {
    const pts = s.arr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
    if (mode === 'bars') {
      const groupW = effW / n;
      const bw = Math.max(2, (groupW * 0.66) / 2);
      body += s.arr.map((v, i) => {
        const x = X(i) - groupW * 0.33 + bw * si;
        const y = Y(v);
        const yTop = Math.min(y, zeroY);
        return `<rect x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, Math.abs(zeroY - y)).toFixed(1)}" fill="${s.color}" opacity="0.78" rx="1.5"/>`;
      }).join('');
    } else if (mode === 'area') {
      const gid = `cg${si}_${Math.random().toString(36).slice(2, 7)}`;
      defs += `<linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${s.color}" stop-opacity="0.26"/><stop offset="100%" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`;
      const line = 'M' + pts.join(' L');
      body += `<path d="${line} L${X(n - 1).toFixed(1)},${zeroY.toFixed(1)} L${X(0).toFixed(1)},${zeroY.toFixed(1)} Z" fill="url(#${gid})"/><path d="${line}" fill="none" stroke="${s.color}" stroke-width="2.4" ${ns}/>`;
    } else {
      body += `<path d="M${pts.join(' L')}" fill="none" stroke="${s.color}" stroke-width="2.5" ${ns}/>`;
    }
  });
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block;">${defs ? `<defs>${defs}</defs>` : ''}${grid}${body}</svg>`;
}
