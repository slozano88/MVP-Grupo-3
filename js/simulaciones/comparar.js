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
          </div>
          ${renderCompareChart(simA.sp500, simB.sp500, 760, 250)}
          <div class="legend">
            <div class="legend-item"><span class="legend-swatch" style="background:var(--brand)"></span>A · ${a.name}</div>
            <div class="legend-item"><span class="legend-swatch" style="background:var(--accent)"></span>B · ${b.name}</div>
          </div>
        </div>
        <div class="card chart-card">
          <div class="chart-header">
            <div><div class="chart-title">Tipo de cambio — A vs B</div><div class="chart-sub">${exInfoC.label} normalizado</div></div>
          </div>
          ${renderCompareChart(simA.usdars, simB.usdars, 760, 250)}
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


function renderCompareChart(sA, sB, w, h) {
  h = Math.max(h, 250);

  const rawA = geoChartFiniteValues(sA && sA.arr);
  const rawB = geoChartFiniteValues(sB && sB.arr);

  if (rawA.length < 2 || rawB.length < 2) {
    return `<div class="chart-empty">No hay datos suficientes para comparar.</div>`;
  }

  const normA = rawA.map(v => (v - rawA[0]) / (rawA[0] || 1));
  const normB = rawB.map(v => (v - rawB[0]) / (rawB[0] || 1));

  const box = { left: 56, right: 24, top: 20, bottom: 36 };
  box.width = w - box.left - box.right;
  box.height = h - box.top - box.bottom;

  const { min, max } = geoChartBounds([normA, normB], { includeZero: true });
  const count = Math.max(normA.length, normB.length);
  const grid = geoChartGrid(w, h, box, min, max, { count, percent: true });

  const zeroY = geoChartY(0, min, max, box.top, box.height);

  const zeroLine = `
    <line x1="${box.left}" y1="${zeroY.toFixed(1)}" x2="${w - box.right}" y2="${zeroY.toFixed(1)}" stroke="var(--line-strong)" stroke-width="1.2" stroke-dasharray="5 5"/>
    <text x="${w - box.right - 4}" y="${Math.max(box.top + 12, zeroY - 6).toFixed(1)}" font-size="10" fill="var(--muted)" font-family="IBM Plex Mono" text-anchor="end">Inicio 0%</text>
  `;

  const pathA = geoChartPath(normA, min, max, box);
  const pathB = geoChartPath(normB, min, max, box);

  const end = (arr) => ({
    x: geoChartX(arr.length - 1, arr.length, box.left, box.width),
    y: geoChartY(arr[arr.length - 1], min, max, box.top, box.height),
    value: arr[arr.length - 1]
  });

  const aEnd = end(normA);
  const bEnd = end(normB);

  return `<svg class="chart-svg" style="width:100%; height:${h}px; display:block;" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Comparación de escenarios normalizada">
    ${grid}${zeroLine}
    <path d="${pathA}" fill="none" stroke="var(--brand)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${pathB}" fill="none" stroke="var(--accent)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${aEnd.x.toFixed(1)}" cy="${aEnd.y.toFixed(1)}" r="4" fill="var(--brand)"/>
    <circle cx="${bEnd.x.toFixed(1)}" cy="${bEnd.y.toFixed(1)}" r="4" fill="var(--accent)"/>
    <text x="${Math.max(box.left + 35, aEnd.x - 7).toFixed(1)}" y="${Math.max(box.top + 12, aEnd.y - 10).toFixed(1)}" font-size="10" fill="var(--brand)" font-family="IBM Plex Mono" text-anchor="end">A ${geoChartFormatPct(aEnd.value)}</text>
    <text x="${Math.max(box.left + 35, bEnd.x - 7).toFixed(1)}" y="${Math.min(box.top + box.height - 4, bEnd.y + 16).toFixed(1)}" font-size="10" fill="var(--accent)" font-family="IBM Plex Mono" text-anchor="end">B ${geoChartFormatPct(bEnd.value)}</text>
  </svg>`;
}
