// ============================================================
// GEOLYTICS — js/common/data.js  ·  núcleo compartido (datos + simulación + API Banco Mundial)
// ------------------------------------------------------------
// Escenarios, países, indicadores, simulate(), helpers de formato y
// fetch a la API del Banco Mundial. Lo usan TODAS las pantallas.
// ⚠️ Núcleo compartido: lo usan todas las pantallas.
// ============================================================

// Extra scenario detail data
const SCENARIO_DETAILS = {
  crisis: {
    long: 'Una crisis económica global se caracteriza por una recesión profunda, caída generalizada de los mercados bursátiles, aumento del desempleo y pérdida de confianza de los inversores. Estos eventos impactan directamente en el tipo de cambio, los commodities y los índices bursátiles.',
    vars: [
      { glyph: '📊', name: 'Índices bursátiles', sub: 'S&P 500, Merval, Nasdaq', dir: 'down', label: 'Baja' },
      { glyph: '💵', name: 'Tipo de cambio',    sub: 'USD/ARS, EUR/USD',     dir: 'up',   label: 'Sube' },
      { glyph: '🛢️', name: 'Commodities',        sub: 'Petróleo, Oro, Soja',  dir: 'mix',  label: 'Mixto' },
    ],
    cases: [
      { title: 'Crisis financiera 2008', body: 'Colapso del mercado inmobiliario en EE.UU. con efectos globales. S&P 500 cayó un 57%.', meta: 'Duración ~18 meses · Intensidad extrema' },
      { title: 'COVID-19 (2020)',         body: 'Pandemia global que generó una recesión abrupta. Mercados cayeron 34% en semanas.',     meta: 'Duración ~6 meses · Intensidad alta' },
      { title: 'Deuda europea (2010)',    body: 'Deuda soberana en Grecia, Portugal y España afectó a toda la eurozona.',                meta: 'Duración ~24 meses · Intensidad moderada' },
    ],
    trivia: 'En una crisis, el oro suele subir como activo refugio, mientras que el petróleo tiende a bajar por la menor demanda industrial.'
  },
  conflict: {
    long: 'Un conflicto geopolítico altera rutas comerciales, eleva primas de riesgo y desplaza capitales hacia activos refugio. Los commodities energéticos y el oro tienden a subir.',
    vars: [
      { glyph: '🛢️', name: 'Petróleo',     sub: 'WTI, Brent',          dir: 'up',   label: 'Sube' },
      { glyph: '🥇', name: 'Oro',          sub: 'Activo refugio',      dir: 'up',   label: 'Sube' },
      { glyph: '📊', name: 'Acciones',     sub: 'Índices globales',    dir: 'down', label: 'Baja' },
    ],
    cases: [
      { title: 'Invasión de Ucrania (2022)', body: 'Escalada del petróleo por encima de USD 120. Gas europeo multiplicado por 5.', meta: 'Duración en curso · Intensidad alta' },
      { title: 'Guerra del Golfo (1990)',    body: 'Shock petrolero por corte de suministro iraquí y kuwaití.',                     meta: 'Duración ~7 meses · Intensidad alta' },
    ],
    trivia: 'Los mercados suelen descontar el conflicto antes del estallido: el oro se mueve semanas antes que el petróleo.'
  },
  rates: {
    long: 'Un ciclo de suba de tasas por parte de bancos centrales encarece el financiamiento, fortalece al dólar y presiona a los mercados emergentes.',
    vars: [
      { glyph: '📊', name: 'Acciones',     sub: 'Tecnología más sensible', dir: 'down', label: 'Baja' },
      { glyph: '💵', name: 'Dólar',        sub: 'DXY, pares G10',          dir: 'up',   label: 'Sube' },
      { glyph: '🥇', name: 'Oro',          sub: 'Sensible a tasas reales', dir: 'down', label: 'Baja' },
    ],
    cases: [
      { title: 'Volcker shock (1980)',    body: 'Fed llevó la tasa al 20%. Recesión y control de la inflación.',  meta: 'Duración ~14 meses · Intensidad extrema' },
      { title: 'Ciclo Fed 2022-23',       body: 'De 0.25% a 5.5% en 18 meses. Valuaciones tech comprimidas.',     meta: 'Duración ~18 meses · Intensidad alta' },
    ],
    trivia: 'Un aumento de 1% en la tasa real suele restar entre 8% y 12% a las valuaciones de empresas de alto crecimiento.'
  },
  oil: {
    long: 'Un shock de oferta o demanda en el mercado del crudo se propaga a costos industriales, transporte y presiones inflacionarias.',
    vars: [
      { glyph: '🛢️', name: 'Petróleo',     sub: 'WTI, Brent',          dir: 'up',   label: 'Variable' },
      { glyph: '🏭', name: 'Inflación',    sub: 'IPC energía y transporte', dir: 'up', label: 'Sube' },
      { glyph: '📊', name: 'Aerolíneas',   sub: 'Sector transporte',    dir: 'down', label: 'Baja' },
    ],
    cases: [
      { title: 'Embargo de 1973',         body: 'OPEP cortó suministro. Precio del crudo se cuadruplicó.',       meta: 'Duración ~6 meses · Intensidad extrema' },
      { title: 'Colapso 2014-16',         body: 'Sobreoferta de shale. WTI de USD 100 a USD 26.',                meta: 'Duración ~20 meses · Intensidad alta' },
    ],
    trivia: 'Un alza del 10% en el petróleo agrega aproximadamente 0.4% a la inflación interanual de economías avanzadas.'
  },
  pandemic: {
    long: 'Una crisis sanitaria paraliza cadenas de suministro y demanda agregada, provoca respuestas fiscales masivas y genera volatilidad extrema.',
    vars: [
      { glyph: '📊', name: 'Acciones',     sub: 'Caída abrupta inicial', dir: 'down', label: 'Baja' },
      { glyph: '🏭', name: 'Desempleo',    sub: 'Pico de corto plazo',   dir: 'up',   label: 'Sube' },
      { glyph: '🛢️', name: 'Petróleo',     sub: 'Demanda industrial',    dir: 'down', label: 'Baja' },
    ],
    cases: [
      { title: 'COVID-19 (2020)',         body: 'Shock simultáneo de oferta y demanda. Estímulo fiscal récord.', meta: 'Duración ~18 meses · Intensidad extrema' },
      { title: 'Gripe H1N1 (2009)',       body: 'Impacto económico acotado, principalmente sector turismo.',     meta: 'Duración ~6 meses · Intensidad media' },
    ],
    trivia: 'En 2020, los índices bursátiles recuperaron el nivel pre-crisis en menos de 5 meses — la recuperación más rápida de la historia.'
  },
  trade: {
    long: 'Una escalada de aranceles y represalias entre grandes bloques redistribuye flujos comerciales y eleva costos al consumidor.',
    vars: [
      { glyph: '🏭', name: 'Manufacturas', sub: 'Cadenas globales',      dir: 'down', label: 'Baja' },
      { glyph: '💵', name: 'Monedas EM',   sub: 'Yuan, peso, real',      dir: 'mix',  label: 'Mixto' },
      { glyph: '📊', name: 'Consumo',      sub: 'Bienes importados',     dir: 'down', label: 'Caro' },
    ],
    cases: [
      { title: 'Guerra EE.UU.-China (2018-19)', body: 'Aranceles recíprocos sobre USD 360B en bienes.',          meta: 'Duración ~24 meses · Intensidad alta' },
      { title: 'Smoot-Hawley (1930)',           body: 'Ley arancelaria profundizó la Gran Depresión.',           meta: 'Duración ~5 años · Intensidad extrema' },
    ],
    trivia: 'Históricamente, una guerra comercial reduce el comercio mundial entre 1% y 3% por año mientras está activa.'
  }
};


const SCENARIOS = [
  { id: 'crisis', glyph: '📉', name: 'Crisis económica', desc: 'Recesión global, caída de mercados y contracción del crédito.', impact: 4, tag: 'Alto impacto',
    summary: 'Una caída abrupta de la actividad económica global que desencadena caídas bursátiles, fuga de capitales y presión cambiaria en economías emergentes.',
    reference: { year: 2009, name: 'Gran Recesión', note: 'El colapso financiero global de 2008 hundió la actividad en 2009: caída del PIB y salto del desempleo en casi todo el mundo.' },
    effects: { sp500: -0.185, usdars: 0.42, wti: -0.28, gold: 0.15, inflation: 0.06, unemployment: 0.08 } },
  { id: 'conflict', glyph: '⚔️', name: 'Conflicto internacional', desc: 'Tensiones geopolíticas, sanciones y disrupción comercial.', impact: 4, tag: 'Alto impacto',
    summary: 'Un conflicto armado o geopolítico que altera rutas comerciales, eleva primas de riesgo y desplaza capitales hacia activos refugio.',
    reference: { year: 2022, name: 'Invasión de Ucrania', note: 'La guerra disparó los precios de energía y alimentos, impulsó la inflación global y reordenó los flujos comerciales.' },
    effects: { sp500: -0.09, usdars: 0.18, wti: 0.34, gold: 0.22, inflation: 0.04, unemployment: 0.02 } },
  { id: 'rates', glyph: '📊', name: 'Suba de tasas de interés', desc: 'Política monetaria restrictiva, crédito más caro.', impact: 2, tag: 'Impacto medio',
    summary: 'Un ciclo de suba de tasas por parte de bancos centrales que encarece el financiamiento, fortalece al dólar y presiona a los mercados emergentes.',
    reference: { year: 2022, name: 'Ciclo de subas de la Fed', note: 'Para frenar la inflación post-pandemia, la Reserva Federal subió tasas al ritmo más agresivo en décadas, fortaleciendo el dólar.' },
    effects: { sp500: -0.08, usdars: 0.12, wti: -0.06, gold: -0.10, inflation: -0.03, unemployment: 0.015 } },
  { id: 'oil', glyph: '🛢️', name: 'Cambio en precios del petróleo', desc: 'Variación abrupta del crudo, efecto en costos y commodities.', impact: 2, tag: 'Impacto medio',
    summary: 'Un shock de oferta o demanda en el mercado del crudo que se propaga a costos industriales, transporte y presiones inflacionarias.',
    reference: { year: 2008, name: 'Shock petrolero de 2008', note: 'El crudo tocó un récord histórico (~US$147) antes de desplomarse, arrastrando costos e inflación a nivel global.' },
    effects: { sp500: -0.04, usdars: 0.05, wti: 0.48, gold: 0.04, inflation: 0.05, unemployment: 0.005 } },
  { id: 'pandemic', glyph: '🦠', name: 'Pandemia', desc: 'Crisis sanitaria global, shock simultáneo de oferta y demanda.', impact: 4, tag: 'Alto impacto',
    summary: 'Una crisis sanitaria que paraliza cadenas de suministro y demanda agregada, provoca respuestas fiscales masivas y genera volatilidad extrema.',
    reference: { year: 2020, name: 'Pandemia de COVID-19', note: 'Los confinamientos globales provocaron la mayor contracción del PIB desde la posguerra y un salto abrupto del desempleo.' },
    effects: { sp500: -0.22, usdars: 0.25, wti: -0.38, gold: 0.18, inflation: 0.08, unemployment: 0.12 } },
  { id: 'trade', glyph: '🌐', name: 'Guerra comercial', desc: 'Aranceles, represalias y reordenamiento de cadenas.', impact: 3, tag: 'Impacto variable',
    summary: 'Una escalada de aranceles y represalias entre grandes bloques que redistribuye flujos comerciales y eleva costos al consumidor.',
    reference: { year: 2019, name: 'Guerra comercial EE.UU.–China', note: 'La escalada de aranceles entre las dos mayores economías desaceleró el comercio global y reconfiguró cadenas de suministro.' },
    effects: { sp500: -0.07, usdars: 0.08, wti: -0.05, gold: 0.08, inflation: 0.035, unemployment: 0.02 } }
];

const VARIABLES = [
  { id: 'sp500', name: 'Índices bursátiles', desc: 'S&P 500, Merval, índices globales', default: true },
  { id: 'usdars', name: 'Tipo de cambio USD', desc: 'Paridad USD / ARS y dólar index', default: true },
  { id: 'commodities', name: 'Commodities', desc: 'Petróleo, oro, soja, cobre', default: true },
  { id: 'inflation', name: 'Tasa de inflación', desc: 'IPC interanual global y local', default: false },
  { id: 'unemployment', name: 'Tasa de desempleo', desc: 'Desempleo agregado y sectorial', default: false }
];

// ---- Países (datos reales vía World Bank API) ----
const COUNTRIES = [
  { code: 'AR', name: 'Argentina',       flag: '🇦🇷', cur: 'ARS' },
  { code: 'BR', name: 'Brasil',          flag: '🇧🇷', cur: 'BRL' },
  { code: 'MX', name: 'México',          flag: '🇲🇽', cur: 'MXN' },
  { code: 'CL', name: 'Chile',           flag: '🇨🇱', cur: 'CLP' },
  { code: 'US', name: 'Estados Unidos',  flag: '🇺🇸', cur: 'USD' },
  { code: 'ES', name: 'España',          flag: '🇪🇸', cur: 'EUR' },
  { code: 'CN', name: 'China',           flag: '🇨🇳', cur: 'CNY' },
  { code: 'DE', name: 'Alemania',        flag: '🇩🇪', cur: 'EUR' },
];
const WB_INDICATORS = {
  gdp:         'NY.GDP.MKTP.CD',    // PIB (US$ corrientes)
  inflation:   'FP.CPI.TOTL.ZG',    // Inflación anual (% IPC)
  unemployment:'SL.UEM.TOTL.ZS',    // Desempleo (% fuerza laboral)
  gdpGrowth:   'NY.GDP.MKTP.KD.ZG',  // Crecimiento del PIB (% anual)
  debt:        'GC.DOD.TOTL.GD.ZS',  // Deuda del gobierno central (% del PIB)
  fx:          'PA.NUS.FCRF',        // Tipo de cambio oficial (moneda local por US$)
};

// ---- Notificaciones (ejemplos fijos para la campanita) ----
const NOTIFICATIONS = [
  { icon: 'check', color: 'var(--pos)',   title: 'Tu simulación está lista',              body: 'Crisis económica · Argentina terminó de procesarse.',                          time: 'hace 2 min',  unread: true },
  { icon: 'bars',  color: 'var(--brand)', title: 'Datos actualizados del Banco Mundial',  body: 'La inflación de Argentina se actualizó al último dato disponible. Volvé a correr tus simulaciones.', time: 'hace 1 h', unread: true },
  { icon: 'grid',  color: 'var(--brand)', title: 'Nuevo escenario disponible',            body: "Ya podés simular 'Crisis crediticia' desde la biblioteca.",                     time: 'ayer',        unread: false },
  { icon: 'save',  color: 'var(--muted)', title: 'Material educativo nuevo',              body: 'Guía: cómo leer una curva de inflación proyectada.',                            time: 'hace 3 días', unread: false },
];
const getCountry = (code) => COUNTRIES.find(c => c.code === code) || COUNTRIES[0];

// Lee las filas reales cacheadas de forma SINCRÓNICA (las escribió fetchWorldBank,
// persisten en localStorage entre páginas). Devuelve [] si todavía no se descargó.
function wbCachedRows(country, indicator) {
  const key = country + ':' + indicator;
  let rows = _wbCache[key];
  if (!rows) {
    try {
      const c = JSON.parse(localStorage.getItem('wb2:' + key) || 'null');
      if (c && c.d) { rows = c.d; _wbCache[key] = rows; }
    } catch {}
  }
  return rows || [];
}
// Último valor real cacheado (o null).
function wbCachedLatest(country, indicator) {
  const rows = wbCachedRows(country, indicator);
  return rows.length ? rows[rows.length - 1].value : null;
}
// Valor real de un indicador en un AÑO específico (o null si no hay dato ese año).
function wbValueAtYear(country, indicator, year) {
  const row = wbCachedRows(country, indicator).find(r => r.year === year);
  return row ? row.value : null;
}
// Inflación real del país como fracción (World Bank la da en %)
const realInflationFraction = (country) => {
  const v = wbCachedLatest(country, WB_INDICATORS.inflation);
  return v == null ? null : v / 100;
};
// Desempleo real del país como fracción (World Bank lo da en %)
const realUnemploymentFraction = (country) => {
  const v = wbCachedLatest(country, WB_INDICATORS.unemployment);
  return v == null ? null : v / 100;
};
// Tipo de cambio real (moneda local por US$). EE.UU. usa el euro (Alemania) como referencia.
const realExchangeRate = (country) => {
  if (country === 'US') return wbCachedLatest('DE', WB_INDICATORS.fx);
  return wbCachedLatest(country, WB_INDICATORS.fx);
};
// Etiqueta + moneda a mostrar para el indicador cambiario según el país.
function exchangeInfo(country) {
  if (country === 'US') return { label: 'USD / EUR', cur: 'EUR', rate: realExchangeRate('US') };
  const c = getCountry(country);
  return { label: 'USD / ' + (c.cur || 'LCU'), cur: c.cur || 'LCU', rate: realExchangeRate(country) };
}

// En Resultados: descarga datos reales y, cuando llegan, re-renderiza para que
// simulate() y el respaldo histórico usen los valores reales del país. Robusto:
// un fetch que falle no bloquea a los demás (allSettled) y re-renderiza solo si
// aumentó la cantidad de indicadores disponibles (sin loops).
async function updateResultsRealData() {
  if (!document.getElementById('results-real')) return;
  const need = [
    WB_INDICATORS.gdp, WB_INDICATORS.inflation, WB_INDICATORS.unemployment,
    WB_INDICATORS.gdpGrowth, WB_INDICATORS.debt, WB_INDICATORS.fx,
  ];
  const countBefore = need.filter(i => wbCachedLatest(state.country, i) != null).length;
  const fetches = need.map(i => fetchWorldBank(state.country, i));
  if (state.country === 'US') fetches.push(fetchWorldBank('DE', WB_INDICATORS.fx)); // euro de referencia
  await Promise.allSettled(fetches);
  const countAfter = need.filter(i => wbCachedLatest(state.country, i) != null).length;
  if (countAfter > countBefore) render();
}

// Cache en memoria + localStorage (24h) para no re-pedir a la API
const _wbCache = {};
async function fetchWorldBank(country, indicator) {
  const key = country + ':' + indicator;
  if (_wbCache[key]) return _wbCache[key];
  try {
    const c = JSON.parse(localStorage.getItem('wb2:' + key) || 'null');
    if (c && Date.now() - c.t < 86400000) { _wbCache[key] = c.d; return c.d; }
  } catch {}
  const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&date=2005:2023&per_page=100`;
  const res = await fetch(url);
  const json = await res.json();
  const rows = (json[1] || [])
    .filter(r => r && r.value != null)
    .map(r => ({ year: +r.date, value: r.value }))
    .sort((a, b) => a.year - b.year);
  _wbCache[key] = rows;
  try { localStorage.setItem('wb2:' + key, JSON.stringify({ t: Date.now(), d: rows })); } catch {}
  return rows;
}

// Formato compacto de PIB en español (mil M = 10^9, bill. = 10^12)
function fmtGdp(v) {
  if (v == null) return 's/d';
  if (v >= 1e12) return 'US$ ' + (v / 1e12).toLocaleString('es-AR', { maximumFractionDigits: 2 }) + ' bill.';
  return 'US$ ' + (v / 1e9).toLocaleString('es-AR', { maximumFractionDigits: 0 }) + ' mil M';
}

// Rellena el panel #wb-card con datos reales del país seleccionado
async function updateWBPanel() {
  const card = document.getElementById('wb-card');
  if (!card) return;
  const c = getCountry(state.country);
  const head = `<div style="display:flex; align-items:center; gap:7px; font-weight:600; font-size:13px;">
      <span style="font-size:16px;">${c.flag}</span> ${c.name}
      <span style="margin-left:auto; font-family:var(--font-mono); font-size:9px; letter-spacing:0.06em; color:var(--muted); border:1px solid var(--line); border-radius:5px; padding:2px 6px;">BANCO MUNDIAL</span>
    </div>`;
  card.innerHTML = head + `<div style="font-size:12px; color:var(--muted); padding:14px 0;">Cargando datos reales…</div>`;
  try {
    const _safe = (i) => fetchWorldBank(state.country, i).catch(() => []);
    const [gdp, infl, unempl, growth, debt] = await Promise.all([
      _safe(WB_INDICATORS.gdp),
      _safe(WB_INDICATORS.inflation),
      _safe(WB_INDICATORS.unemployment),
      _safe(WB_INDICATORS.gdpGrowth),
      _safe(WB_INDICATORS.debt),
    ]);
    const lastGdp = gdp[gdp.length - 1];
    const lastInfl = infl[infl.length - 1];
    const last = (arr) => (arr && arr.length) ? arr[arr.length - 1] : null;
    const lUnempl = last(unempl), lGrowth = last(growth), lDebt = last(debt);
    const pct = (r, neg) => r ? `<span style="color:${neg && neg(r.value) ? 'var(--neg)' : 'inherit'}">${r.value.toFixed(1)}%</span>` : 's/d';
    const spark = gdp.length > 1 ? buildLinePath(gdp.map(r => r.value), 120, 30, 2) : '';
    const ctx = (label, valHtml, year) => `
        <div>
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted);">${label}${year ? ' · ' + year : ''}</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:600; margin-top:3px;">${valHtml}</div>
        </div>`;
    card.innerHTML = head + `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px;">
        <div>
          <div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted);">PIB${lastGdp ? ' · ' + lastGdp.year : ''}</div>
          <div style="font-family:var(--font-mono); font-size:15px; font-weight:600; margin-top:3px;">${fmtGdp(lastGdp && lastGdp.value)}</div>
          ${spark ? `<svg viewBox="0 0 120 30" preserveAspectRatio="none" style="width:100%; height:26px; margin-top:5px;"><path d="${spark}" fill="none" stroke="var(--pos)" stroke-width="1.5"/></svg>` : ''}
        </div>
        <div>
          <div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted);">Inflación${lastInfl ? ' · ' + lastInfl.year : ''}</div>
          <div style="font-family:var(--font-mono); font-size:15px; font-weight:600; margin-top:3px; color:${lastInfl && lastInfl.value > 10 ? 'var(--neg)' : 'inherit'};">${lastInfl ? lastInfl.value.toFixed(1) + '%' : 's/d'}</div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:12px; padding-top:12px; border-top:1px solid var(--line);">
        ${ctx('Desempleo', pct(lUnempl, v => v > 10), lUnempl && lUnempl.year)}
        ${ctx('Crec. PIB', lGrowth ? `<span style="color:${lGrowth.value < 0 ? 'var(--neg)' : 'var(--pos)'}">${lGrowth.value >= 0 ? '+' : ''}${lGrowth.value.toFixed(1)}%</span>` : 's/d', lGrowth && lGrowth.year)}
        ${ctx('Deuda/PIB', pct(lDebt, v => v > 80), lDebt && lDebt.year)}
      </div>
      <div style="font-size:10.5px; color:var(--muted); margin-top:11px; line-height:1.4;">El escenario se proyecta partiendo de la inflación y el desempleo reales del país.</div>`;
  } catch (e) {
    card.innerHTML = head + `<div style="font-size:12px; color:var(--neg); padding:12px 0;">No se pudieron cargar los datos del Banco Mundial. Revisá tu conexión.</div>`;
  }
}


// ---- Helpers ----
const DURATIONS = [3, 6, 12, 24];
const INTENSITY_LABELS = ['Leve', 'Moderada', 'Alta', 'Extrema'];
const durIdx = (d) => Math.min(3, Math.floor(d / 25));
const intensityLabel = (i) => INTENSITY_LABELS[Math.min(3, Math.floor(i / 25))];
const intensityFactor = (i) => 0.3 + (i / 100) * 1.4; // scales effect
const getScenario = (id) => SCENARIOS.find(s => s.id === id);
const fmtPct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
const fmtNum = (v, d=0) => v.toLocaleString('es-AR', { maximumFractionDigits: d, minimumFractionDigits: d });

// Generate time series based on scenario effects
// Perfil de curva propio por variable, para que cada serie tenga una FORMA
// distinta (no solo distinta magnitud): retardo de inicio (lag), velocidad de
// rampa (speed) y rebote al final (rebound desde reboundAt).
const CURVE_PROFILE = {
  sp500:        { speed: 4.6, reboundAt: 0.50, rebound: 0.48, lag: 0.00 }, // cae rápido y rebota fuerte
  usdars:       { speed: 2.2, reboundAt: 0.85, rebound: 0.10, lag: 0.05 }, // sube sostenido, leve meseta
  wti:          { speed: 5.2, reboundAt: 0.38, rebound: 0.58, lag: 0.00 }, // pico temprano y reversión
  gold:         { speed: 1.7, reboundAt: 0.92, rebound: 0.06, lag: 0.10 }, // refugio: lento y estable
  inflation:    { speed: 1.3, reboundAt: 0.97, rebound: 0.04, lag: 0.18 }, // se acelera tarde
  unemployment: { speed: 1.1, reboundAt: 1.00, rebound: 0.00, lag: 0.28 }  // rezagada, rampa sin rebote
};

function simulate(scenarioId, intensityPct, months, country) {
  const sc = getScenario(scenarioId);
  const factor = intensityFactor(intensityPct);
  const n = Math.max(8, Math.min(24, months));
  const series = {};
  // Inflación: punto de partida REAL del país (Banco Mundial). Si aún no se
  // descargó, cae al valor por defecto. El resto usa baselines de referencia.
  const realInfl = realInflationFraction(country || state.country);
  const realUnempl = realUnemploymentFraction(country || state.country);
  const realFx = realExchangeRate(country || state.country);
  const baselines = { sp500: 4500, usdars: realFx != null ? realFx : 1020, wti: 78, gold: 1900, inflation: realInfl != null ? realInfl : 0.04, unemployment: realUnempl != null ? realUnempl : 0.055 };
  for (const k of Object.keys(sc.effects)) {
    const delta = sc.effects[k] * factor;
    const base = baselines[k];
    const p = CURVE_PROFILE[k] || { speed: 3, reboundAt: 0.7, rebound: 0.25, lag: 0 };
    const arr = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      // onset retardado (lag) + rampa y rebote propios de la variable
      const tt = p.lag >= 1 ? 0 : Math.max(0, (t - p.lag) / (1 - p.lag));
      const ramp = 1 - Math.exp(-p.speed * tt);
      const reb = 1 - p.rebound * Math.max(0, tt - p.reboundAt) / (1 - p.reboundAt + 1e-6);
      const shock = delta * ramp * reb;
      // pequeño ruido
      const noise = (Math.sin(i * 1.3 + k.length) * 0.01 + (Math.random() - 0.5) * 0.004) * Math.abs(delta || 0.05);
      const val = base * (1 + shock + noise);
      arr.push(val);
    }
    series[k] = { base, final: arr[arr.length - 1], delta, arr };
  }
  return series;
}

// SVG path helpers
function buildLinePath(values, w, h, pad=6) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const n = values.length;
  return values.map((v, i) => {
    const x = pad + (i / (n - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
function buildAreaPath(values, w, h, pad=6) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const n = values.length;
  let d = '';
  values.forEach((v, i) => {
    const x = pad + (i / (n - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  });
  d += `L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  return d;
}
