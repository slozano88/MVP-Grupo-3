// ============================================================
// GEOLYTICS — js/geolytics/screens-inicio.js  ·  módulo inicio + historial
// ------------------------------------------------------------
// Pantalla de inicio, detalle de escenario, historial y glosario.
// P3 también es dueño de la capa de datos Supabase (supabase-*.js).
// ============================================================

function homeHTML() {
  // Gráfico del hero: SIEMPRE un ejemplo visual fijo. No depende de si el
  // usuario corrió simulaciones o no — es ilustrativo.
  const demo_sc = getScenario('crisis') || SCENARIOS[0];
  const sim = simulate(demo_sc.id, 72, 12);
  const spark = buildLinePath(sim.sp500.arr, 260, 80);
  return `
    <section class="screen active" id="screen-home" data-screen-label="Home">
      <section class="hero">
        <div>
          <div class="hero-eyebrow"><span class="live-dot"></span>Geolytics</div>
          <h1>Explorá cómo los<br>eventos globales<br><em>remodelan</em> la economía.</h1>
          <p>Elegí un escenario, ajustá su intensidad y duración, y visualizá el impacto en variables clave —sin tecnicismos, con explicaciones claras.</p>
          <div class="hero-cta">
            <button class="btn btn-primary" data-nav="scenarios">
              ${icon('play', 14)} Explorar escenarios
            </button>
            <button class="btn btn-ghost" data-nav="results">
              ${icon('info', 14)} Ver ejemplo
            </button>
          </div>
        </div>
        <div class="hero-viz">
          <div class="hero-viz-header">
            <div>
              <div class="hero-viz-title">Ejemplo de simulación</div>
              <div style="color:#fff; font-weight:600; font-size:13.5px; margin-top:2px;">${demo_sc.glyph} ${demo_sc.name}</div>
            </div>
            <span class="hero-viz-badge">Ejemplo</span>
          </div>
          <svg class="hero-sparkline" viewBox="0 0 260 80" preserveAspectRatio="none" style="width:100%; height:80px;">
            <defs>
              <linearGradient id="heroGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#C4703B" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#C4703B" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="${buildAreaPath(sim.sp500.arr, 260, 80)}" fill="url(#heroGrad)"/>
            <path d="${spark}" fill="none" stroke="#C4703B" stroke-width="2"/>
          </svg>
          <div class="hero-tickers">
            <div class="hero-ticker">
              <div class="hero-ticker-label">S&P 500</div>
              <div class="hero-ticker-value">${fmtNum(sim.sp500.final)}</div>
              <div class="hero-ticker-change ${sim.sp500.delta < 0 ? 'chg-neg' : 'chg-pos'}">${fmtPct(sim.sp500.delta)}</div>
            </div>
            <div class="hero-ticker">
              <div class="hero-ticker-label">${exchangeInfo(state.country).cur === 'EUR' ? 'USD/EUR' : 'USD/' + exchangeInfo(state.country).cur}</div>
              <div class="hero-ticker-value">${fmtNum(sim.usdars.final, sim.usdars.final < 100 ? 2 : 0)}</div>
              <div class="hero-ticker-change ${sim.usdars.delta < 0 ? 'chg-neg' : 'chg-pos'}">${fmtPct(sim.usdars.delta)}</div>
            </div>
            <div class="hero-ticker">
              <div class="hero-ticker-label">Oro</div>
              <div class="hero-ticker-value">$${fmtNum(sim.gold.final)}</div>
              <div class="hero-ticker-change ${sim.gold.delta < 0 ? 'chg-neg' : 'chg-pos'}">${fmtPct(sim.gold.delta)}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="feature">
          <div class="feature-icon">${icon('sliders', 20)}</div>
          <h3>Simulación interactiva</h3>
          <p>Elegí un evento, ajustá intensidad y duración, y observá el impacto en tiempo real en las variables clave.</p>
        </div>
        <div class="feature">
          <div class="feature-icon">${icon('grid', 20)}</div>
          <h3>Escenarios globales</h3>
          <p>Seis escenarios validados: crisis económica, pandemia, conflicto, guerra comercial, shocks petroleros y más.</p>
        </div>
        <div class="feature">
          <div class="feature-icon">${icon('info', 20)}</div>
          <h3>Aprendé haciendo</h3>
          <p>Cada resultado incluye una explicación causal clara. Para entender —no solo para mirar gráficos.</p>
        </div>
      </section>

      <section class="strip">
        <div class="strip-head">
          <h3>Explorá los escenarios</h3>
          <button class="btn btn-ghost btn-sm" data-nav="scenarios">Ver todos ${icon('arrowR', 14)}</button>
        </div>
        <div class="strip-list">
          ${SCENARIOS.slice(0, 3).map(sc => `
            <div class="strip-card" data-pick-scenario="${sc.id}">
              <div class="strip-glyph">${sc.glyph}</div>
              <div style="flex:1">
                <div class="strip-title">${sc.name}</div>
                <div class="strip-meta">${sc.tag.toUpperCase()}</div>
              </div>
              ${icon('arrowR', 16)}
            </div>
          `).join('')}
        </div>
      </section>
    </section>
  `;
}

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

function glossaryHTML() {
  const terms = [
    { t: 'PIB (Producto Interno Bruto)', cat: 'Indicador', d: 'El valor total de los bienes y servicios que produce un país en un período. Es la medida más usada del tamaño de una economía.' },
    { t: 'Inflación', cat: 'Indicador', d: 'El aumento generalizado y sostenido de los precios. Con 100% de inflación, lo que costaba $100 pasa a costar $200 en un año.' },
    { t: 'Recesión', cat: 'Ciclo', d: 'Una caída de la actividad económica durante varios meses seguidos: baja la producción, el consumo y el empleo.' },
    { t: 'Tipo de cambio', cat: 'Mercado', d: 'El precio de una moneda en términos de otra; por ejemplo, cuántos pesos hacen falta para comprar un dólar.' },
    { t: 'Commodities', cat: 'Mercado', d: 'Materias primas que se comercian a escala global con un precio de referencia: petróleo, oro, soja, cobre.' },
    { t: 'Índice bursátil', cat: 'Mercado', d: 'Un promedio que resume cómo se mueve un conjunto de acciones. El S&P 500 (EE.UU.) y el Merval (Argentina) son ejemplos.' },
    { t: 'Prima de riesgo', cat: 'Finanzas', d: 'El rendimiento extra que exigen los inversores para prestarle a un país o empresa que consideran más riesgoso.' },
    { t: 'Fuga de capitales', cat: 'Finanzas', d: 'La salida masiva de dinero de un país hacia el exterior, en busca de activos más seguros.' },
    { t: 'Política monetaria', cat: 'Política', d: 'Las decisiones de un banco central sobre la cantidad de dinero y las tasas de interés para controlar la inflación y la actividad.' },
    { t: 'Tasa de interés', cat: 'Política', d: 'El costo del dinero. Subirla enfría la economía (frena el crédito); bajarla la estimula.' },
    { t: 'Desempleo', cat: 'Indicador', d: 'La proporción de personas que buscan trabajo y no lo consiguen, dentro de la población económicamente activa.' },
    { t: 'Activo refugio', cat: 'Finanzas', d: 'Un activo que conserva su valor en tiempos de crisis. El oro es el ejemplo clásico: cuando hay miedo, su precio suele subir.' },
    { t: 'Aranceles', cat: 'Comercio', d: 'Impuestos que un país cobra a los productos importados. Encarecen lo importado y son típicos de las guerras comerciales.' },
    { t: 'Volatilidad', cat: 'Mercado', d: 'Qué tan bruscos son los movimientos de un precio. A mayor volatilidad, más incertidumbre y más riesgo.' }
  ];
  return `
    <section class="screen active" data-screen-label="Glossary">
      <div class="page-head">
        <div>
          <div class="eyebrow">Ayuda</div>
          <h2 class="page-title" style="margin-top:6px;">Glosario</h2>
          <p class="page-sub">Los términos económicos que aparecen en los escenarios, explicados en lenguaje simple.</p>
        </div>
        <span class="pill" style="flex-shrink:0;">${terms.length} términos</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">
        ${terms.map(x => `
          <div class="card card-pad">
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:9px;">
              <h3 style="font-family:var(--font-display); font-size:17px; font-weight:700; letter-spacing:-0.01em;">${x.t}</h3>
              <span class="pill pill-accent" style="flex-shrink:0; font-size:10.5px;">${x.cat}</span>
            </div>
            <p style="font-size:13.5px; line-height:1.6; color:var(--ink-2, var(--muted));">${x.d}</p>
          </div>`).join('')}
      </div>
    </section>
  `;
}
