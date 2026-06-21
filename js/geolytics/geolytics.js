function homeHTML() {
  const last = state.history[0];
  const last_sc = last ? getScenario(last.scenario) : null;
  const sim = last ? simulate(last.scenario, last.intensityPct, DURATIONS[last.durIdx]) : null;
  const spark = sim ? buildLinePath(sim.sp500.arr, 260, 80) : '';
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
        <div class="hero-viz">${sim ? `
          <div class="hero-viz-header">
            <div>
              <div class="hero-viz-title">Última simulación</div>
              <div style="color:#fff; font-weight:600; font-size:13.5px; margin-top:2px;">${last_sc ? last_sc.glyph : ''} ${last.name}</div>
            </div>
            <span class="hero-viz-badge">${last.date}</span>
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
        ` : `
          <div class="hero-viz-header">
            <div>
              <div class="hero-viz-title">Tu primera simulación</div>
              <div style="color:#fff; font-weight:600; font-size:13.5px; margin-top:2px;">Todavía no corriste ninguna</div>
            </div>
          </div>
          <p style="color:rgba(255,255,255,0.72); font-size:13.5px; line-height:1.6; margin:18px 0 22px;">Elegí un escenario y ajustá su intensidad para ver acá el impacto sobre el S&amp;P 500, el dólar y el oro.</p>
          <button class="btn btn-primary" data-nav="scenarios">${icon('play', 14)} Crear mi primera simulación</button>
        `}</div>
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
