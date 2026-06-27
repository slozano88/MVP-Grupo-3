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
          <div class="chart-toggle">
            <button class="${state.chartMode === 'line' ? 'on' : ''}" data-chart-mode="line">Línea</button>
            <button class="${state.chartMode === 'area' ? 'on' : ''}" data-chart-mode="area">Área</button>
            <button class="${state.chartMode === 'bars' ? 'on' : ''}" data-chart-mode="bars">Barras</button>
          </div>
        </div>
        ${renderBigChart(sim.sp500, 760, 250, state.chartMode, '--chart-1')}
        <div class="legend">
          <div class="legend-item"><span class="legend-swatch" style="background:var(--chart-1)"></span>S&P 500</div>
          <div class="legend-item" style="color:var(--muted-2)"><span class="legend-swatch" style="background:var(--line-strong)"></span>Baseline</div>
        </div>
      </div>`);
  }
  if (state.vars.usdars) {
    chartCards.push(`
      <div class="card chart-card">
        <div class="chart-header"><div><div class="chart-title">Tipo de cambio</div><div class="chart-sub">${exInfo.label} · ${months} meses</div></div></div>
        ${renderMultiChart([{ key: 'usdars', label: exInfo.cur, color: 'var(--chart-1)', s: sim.usdars }], 760, 250)}
        <div class="legend"><div class="legend-item"><span class="legend-swatch" style="background:var(--chart-1)"></span>${exInfo.label}</div></div>
      </div>`);
  }
  if (state.vars.commodities) {
    chartCards.push(`
      <div class="card chart-card">
        <div class="chart-header"><div><div class="chart-title">Commodities</div><div class="chart-sub">Petróleo, oro — normalizados</div></div></div>
        ${renderMultiChart([
          { key: 'wti', label: 'Petróleo', color: 'var(--chart-2)', s: sim.wti },
          { key: 'gold', label: 'Oro', color: 'var(--chart-3)', s: sim.gold }
        ], 760, 250)}
        <div class="legend">
          <div class="legend-item"><span class="legend-swatch" style="background:var(--chart-2)"></span>Petróleo WTI</div>
          <div class="legend-item"><span class="legend-swatch" style="background:var(--chart-3)"></span>Oro</div>
        </div>
      </div>`);
  }
  if (state.vars.inflation) {
    chartCards.push(`
      <div class="card chart-card">
        <div class="chart-header"><div><div class="chart-title">Inflación</div><div class="chart-sub">IPC proyectado · ${months} meses</div></div></div>
        ${renderMultiChart([{ key: 'inflation', label: 'Inflación', color: 'var(--chart-2)', s: sim.inflation }], 760, 250)}
        <div class="legend"><div class="legend-item"><span class="legend-swatch" style="background:var(--chart-2)"></span>Tasa de inflación</div></div>
      </div>`);
  }
  if (state.vars.unemployment) {
    chartCards.push(`
      <div class="card chart-card">
        <div class="chart-header"><div><div class="chart-title">Desempleo</div><div class="chart-sub">Tasa proyectada · ${months} meses</div></div></div>
        ${renderMultiChart([{ key: 'unemployment', label: 'Desempleo', color: 'var(--chart-3)', s: sim.unemployment }], 760, 250)}
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

function geoChartFiniteValues(arr) {
  return (arr || []).filter(v => Number.isFinite(v));
}

function geoChartBounds(values, options = {}) {
  const flat = values.flat().filter(v => Number.isFinite(v));
  if (options.includeZero) flat.push(0);
  if (Number.isFinite(options.baseline)) flat.push(options.baseline);
  let min = flat.length ? Math.min(...flat) : 0;
  let max = flat.length ? Math.max(...flat) : 1;
  if (min === max) {
    const margin = Math.abs(min || 1) * 0.08;
    min -= margin;
    max += margin;
  }
  const pad = (max - min) * 0.12;
  return { min: min - pad, max: max + pad };
}

function geoChartY(value, min, max, top, height) {
  return top + (1 - (value - min) / (max - min || 1)) * height;
}

function geoChartX(index, count, left, width) {
  return left + (count <= 1 ? 0 : (index / (count - 1)) * width);
}

function geoChartPath(values, min, max, box) {
  const n = values.length;
  return values.map((v, i) => {
    const x = geoChartX(i, n, box.left, box.width);
    const y = geoChartY(v, min, max, box.top, box.height);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function geoChartFormatNumber(value, key) {
  if (!Number.isFinite(value)) return '';
  if (key === 'inflation' || key === 'unemployment') return (value * 100).toFixed(1) + '%';
  const abs = Math.abs(value);
  if (abs >= 1000) return Math.round(value).toLocaleString('es-AR');
  if (abs >= 100) return value.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  if (abs >= 10) return value.toLocaleString('es-AR', { maximumFractionDigits: 1 });
  return value.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function geoChartFormatPct(value) {
  if (!Number.isFinite(value)) return '';
  return (value >= 0 ? '+' : '') + (value * 100).toFixed(1) + '%';
}

function geoChartGrid(w, h, box, min, max, options = {}) {
  const ticks = 5;
  let out = '';
  for (let i = 0; i < ticks; i++) {
    const ratio = i / (ticks - 1);
    const value = max - ratio * (max - min);
    const y = box.top + ratio * box.height;
    const label = options.percent ? geoChartFormatPct(value) : geoChartFormatNumber(value, options.key);
    out += `<line x1="${box.left}" y1="${y.toFixed(1)}" x2="${w - box.right}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 6"/>`;
    out += `<text x="${box.left - 10}" y="${(y + 3).toFixed(1)}" font-size="10" fill="var(--muted)" font-family="IBM Plex Mono" text-anchor="end">${label}</text>`;
  }
  const xTicks = [0, 0.5, 1];
  xTicks.forEach((ratio) => {
    const x = box.left + ratio * box.width;
    const month = Math.round(1 + ratio * (options.count - 1));
    out += `<line x1="${x.toFixed(1)}" y1="${box.top + box.height}" x2="${x.toFixed(1)}" y2="${box.top + box.height + 5}" stroke="var(--line-strong)" stroke-width="1"/>`;
    out += `<text x="${x.toFixed(1)}" y="${h - 8}" font-size="10" fill="var(--muted)" font-family="IBM Plex Mono" text-anchor="middle">M${month}</text>`;
  });
  out += `<line x1="${box.left}" y1="${box.top + box.height}" x2="${w - box.right}" y2="${box.top + box.height}" stroke="var(--line-strong)" stroke-width="1"/>`;
  out += `<line x1="${box.left}" y1="${box.top}" x2="${box.left}" y2="${box.top + box.height}" stroke="var(--line-strong)" stroke-width="1" opacity="0.55"/>`;
  return out;
}

function renderBigChart(s, w, h, mode, colorVar) {
  h = Math.max(h, 250);
  const baseline = s.base;
  const arr = geoChartFiniteValues(s.arr);
  const n = arr.length;
  const box = { left: 56, right: 22, top: 20, bottom: 36 };
  box.width = w - box.left - box.right;
  box.height = h - box.top - box.bottom;

  const { min, max } = geoChartBounds([arr], { baseline });
  const by = geoChartY(baseline, min, max, box.top, box.height);
  const grid = geoChartGrid(w, h, box, min, max, { count: n, key: 'sp500' });
  const baselineLabel = `Base ${geoChartFormatNumber(baseline, 'sp500')}`;
  const baselineLine = `
    <line x1="${box.left}" y1="${by.toFixed(1)}" x2="${w - box.right}" y2="${by.toFixed(1)}" stroke="var(--line-strong)" stroke-width="1.2" stroke-dasharray="5 5"/>
    <text x="${w - box.right - 4}" y="${Math.max(box.top + 12, by - 6).toFixed(1)}" font-size="10" fill="var(--muted)" font-family="IBM Plex Mono" text-anchor="end">${baselineLabel}</text>`;

  let body = '';
  if (mode === 'bars') {
    const barW = Math.max(4, (box.width / n) * 0.54);
    body = arr.map((v, i) => {
      const x = geoChartX(i, n, box.left, box.width) - barW / 2;
      const y = geoChartY(v, min, max, box.top, box.height);
      const height = Math.max(2, Math.abs(by - y));
      const isUp = v >= baseline;
      const fill = isUp ? `var(${colorVar})` : 'var(--neg)';
      return `<rect x="${x.toFixed(1)}" y="${(isUp ? y : by).toFixed(1)}" width="${barW.toFixed(1)}" height="${height.toFixed(1)}" rx="3" fill="${fill}" opacity="0.82"/>`;
    }).join('');
  } else {
    const linePath = geoChartPath(arr, min, max, box);
    if (mode === 'area') {
      const gradId = `areaGrad_${String(colorVar).replace(/[^a-z0-9]/gi, '')}_${w}_${h}`;
      const lastX = geoChartX(n - 1, n, box.left, box.width);
      const firstX = geoChartX(0, n, box.left, box.width);
      const areaPath = `${linePath} L${lastX.toFixed(1)},${box.top + box.height} L${firstX.toFixed(1)},${box.top + box.height} Z`;
      body = `<defs><linearGradient id="${gradId}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="var(${colorVar})" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="var(${colorVar})" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${areaPath}" fill="url(#${gradId})"/>
      <path d="${linePath}" fill="none" stroke="var(${colorVar})" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else {
      body = `<path d="${linePath}" fill="none" stroke="var(${colorVar})" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const lx = geoChartX(n - 1, n, box.left, box.width);
    const ly = geoChartY(arr[n - 1], min, max, box.top, box.height);
    body += `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4" fill="var(${colorVar})"/>
      <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="8" fill="var(${colorVar})" opacity="0.18"/>
      <text x="${Math.max(box.left + 28, lx - 6).toFixed(1)}" y="${Math.max(box.top + 12, ly - 9).toFixed(1)}" font-size="10" fill="var(${colorVar})" font-family="IBM Plex Mono" text-anchor="end">${geoChartFormatNumber(arr[n - 1], 'sp500')}</text>`;
  }

  return `<svg class="chart-svg" style="width:100%; height:${h}px; display:block;" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gráfico de evolución de índices bursátiles">    ${grid}${baselineLine}${body}
  </svg>`;
}

function renderMultiChart(series, w, h) {
  h = Math.max(h, 250);
  const isNormalized = series.length > 1;
  const prepared = series.map((ss) => {
    const arr = geoChartFiniteValues(ss.s && ss.s.arr);
    const values = isNormalized ? arr.map(v => (v - arr[0]) / (arr[0] || 1)) : arr;
    return { ...ss, arr, values };
  }).filter(ss => ss.values.length > 1);

  if (!prepared.length) {
    return `<div class="chart-empty">No hay datos suficientes para mostrar el gráfico.</div>`;
  }

  const box = { left: 56, right: 22, top: 20, bottom: 36 };
  box.width = w - box.left - box.right;
  box.height = h - box.top - box.bottom;
  const { min, max } = geoChartBounds(prepared.map(ss => ss.values), { includeZero: isNormalized });
  const key = prepared.length === 1 ? prepared[0].key : null;
  const grid = geoChartGrid(w, h, box, min, max, { count: prepared[0].values.length, percent: isNormalized, key });

  let zeroLine = '';
  if (isNormalized && min < 0 && max > 0) {
    const zy = geoChartY(0, min, max, box.top, box.height);
    zeroLine = `<line x1="${box.left}" y1="${zy.toFixed(1)}" x2="${w - box.right}" y2="${zy.toFixed(1)}" stroke="var(--line-strong)" stroke-width="1.2" stroke-dasharray="5 5"/>
      <text x="${w - box.right - 4}" y="${Math.max(box.top + 12, zy - 6).toFixed(1)}" font-size="10" fill="var(--muted)" font-family="IBM Plex Mono" text-anchor="end">Inicio 0%</text>`;
  }

  let body = '';
  prepared.forEach((ss) => {
    const path = geoChartPath(ss.values, min, max, box);
    body += `<path d="${path}" fill="none" stroke="${ss.color}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>`;
    const lastValue = ss.values[ss.values.length - 1];
    const lx = geoChartX(ss.values.length - 1, ss.values.length, box.left, box.width);
    const ly = geoChartY(lastValue, min, max, box.top, box.height);
    body += `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4" fill="${ss.color}"/>
      <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="8" fill="${ss.color}" opacity="0.16"/>`;
    if (prepared.length === 1) {
      const label = isNormalized ? geoChartFormatPct(lastValue) : geoChartFormatNumber(lastValue, ss.key);
      body += `<text x="${Math.max(box.left + 30, lx - 7).toFixed(1)}" y="${Math.max(box.top + 12, ly - 9).toFixed(1)}" font-size="10" fill="${ss.color}" font-family="IBM Plex Mono" text-anchor="end">${label}</text>`;
    }
  });

  const title = isNormalized ? 'normalizado por variación porcentual desde el inicio' : 'evolución de la serie seleccionada';
  return `<svg class="chart-svg" style="width:100%; height:${h}px; display:block;" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gráfico de ${title}">    ${grid}${zeroLine}${body}
  </svg>`;
}
