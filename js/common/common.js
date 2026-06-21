window.SUPABASE_CONFIG = {
  url: 'https://goyslzvikweskyifxatt.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveXNsenZpa3dlc2t5aWZ4YXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjg3MTIsImV4cCI6MjA5Njk0NDcxMn0.dgFTGgHYTeSfCUc4Vk6ykSyqLXOJAD07K1ynzcDMYmU',
};

window.supabaseClient = null;
window.SUPABASE_ENABLED = false;

(function initSupabase() {
  var cfg = window.SUPABASE_CONFIG || {};
  var hasCreds = !!(cfg.url && cfg.anonKey);
  var hasLib = !!(window.supabase && window.supabase.createClient);

  if (hasCreds && hasLib) {
    try {
      window.supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
      window.SUPABASE_ENABLED = true;
      console.info('[Geolytics] Supabase conectado →', cfg.url);
    } catch (e) {
      console.warn('[Geolytics] No se pudo inicializar Supabase. Uso localStorage.', e);
    }
  } else if (hasCreds && !hasLib) {
    console.warn('[Geolytics] Hay credenciales pero la librería de Supabase no cargó. Uso localStorage.');
  } else {
    console.info('[Geolytics] Supabase sin configurar → modo localStorage. Completá supabase-config.js para activarlo.');
  }
})();

window.geoClientId = (function () {
  try {
    var id = localStorage.getItem('geolytics-client-id');
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'c-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      localStorage.setItem('geolytics-client-id', id);
    }
    return id;
  } catch (e) {
    return 'anon';
  }
})();

(function () {
  var TABLE_SIMS = 'simulations';
  var TABLE_SCEN = 'scenarios';

  var sb = function () { return window.supabaseClient; };
  var enabled = function () { return !!(window.SUPABASE_ENABLED && sb()); };
  var cid = function () {
    return (window.geoUser && window.geoUser.id) || window.geoClientId || 'anon';
  };

  async function scenariosList() {
    if (!enabled()) return null;
    try {
      var res = await sb().from(TABLE_SCEN).select('*').order('sort', { ascending: true });
      if (res.error) throw res.error;
      var data = res.data || [];
      if (!data.length) return null;
      return data.map(function (r) {
        return {
          id: r.id,
          glyph: r.glyph,
          name: r.name,
          desc: r.descr,
          impact: r.impact,
          tag: r.tag,
          summary: r.summary,
          effects: r.effects, // jsonb → objeto
        };
      });
    } catch (e) {
      console.warn('[Geolytics] No se pudo leer escenarios de Supabase:', e.message || e);
      return null;
    }
  }

  async function simsList() {
    if (!enabled()) return null;
    try {
      var res = await sb()
        .from(TABLE_SIMS)
        .select('*')
        .eq('client_id', cid())
        .order('created_at', { ascending: false });
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) {
        return {
          id: Number(r.sim_id),
          scenario: r.scenario,
          country: r.country,
          intensityPct: r.intensity_pct,
          durIdx: r.dur_idx,
          date: r.date,
          saved: !!r.saved,
          name: r.name,
        };
      });
    } catch (e) {
      console.warn('[Geolytics] No se pudo leer historial de Supabase:', e.message || e);
      return null;
    }
  }

  async function simsAdd(rec) {
    if (!enabled()) return false;
    try {
      var res = await sb().from(TABLE_SIMS).insert({
        client_id: cid(),
        sim_id: rec.id,
        scenario: rec.scenario,
        country: rec.country || null,
        intensity_pct: rec.intensityPct,
        dur_idx: rec.durIdx,
        date: rec.date,
        saved: !!rec.saved,
        name: rec.name,
      });
      if (res.error) throw res.error;
      return true;
    } catch (e) {
      console.warn('[Geolytics] No se pudo guardar la simulación en Supabase:', e.message || e);
      return false;
    }
  }

  async function simsSetSaved(id, saved) {
    if (!enabled()) return false;
    try {
      var res = await sb()
        .from(TABLE_SIMS)
        .update({ saved: saved })
        .eq('client_id', cid())
        .eq('sim_id', id);
      if (res.error) throw res.error;
      return true;
    } catch (e) {
      console.warn('[Geolytics] No se pudo actualizar el favorito en Supabase:', e.message || e);
      return false;
    }
  }

  async function simsRemove(id) {
    if (!enabled()) return false;
    try {
      var res = await sb()
        .from(TABLE_SIMS)
        .delete()
        .eq('client_id', cid())
        .eq('sim_id', id);
      if (res.error) throw res.error;
      return true;
    } catch (e) {
      console.warn('[Geolytics] No se pudo borrar la simulación en Supabase:', e.message || e);
      return false;
    }
  }

  async function authSignInGoogle(redirectTo) {
    if (!enabled()) return { ok: false, reason: 'supabase-off' };
    try {
      var res = await sb().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || window.location.href,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (res.error) throw res.error;
      return { ok: true };
    } catch (e) {
      console.warn('[Geolytics] No se pudo iniciar Google OAuth:', e.message || e);
      return { ok: false, reason: e.message || 'error' };
    }
  }

  async function authSignUp(email, password, meta) {
    if (!enabled()) return { ok: false, reason: 'supabase-off' };
    try {
      var res = await sb().auth.signUp({
        email: email,
        password: password,
        options: { data: meta || {} },
      });
      if (res.error) throw res.error;
      return { ok: true, user: res.data.user, session: res.data.session };
    } catch (e) {
      return { ok: false, reason: e.message || 'error' };
    }
  }

  async function authSignInPassword(email, password) {
    if (!enabled()) return { ok: false, reason: 'supabase-off' };
    try {
      var res = await sb().auth.signInWithPassword({ email: email, password: password });
      if (res.error) throw res.error;
      return { ok: true, user: res.data.user, session: res.data.session };
    } catch (e) {
      return { ok: false, reason: e.message || 'error' };
    }
  }

  async function authResetPassword(email, redirectTo) {
    if (!enabled()) return { ok: false, reason: 'supabase-off' };
    try {
      var res = await sb().auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
      if (res.error) throw res.error;
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e.message || 'error' };
    }
  }

  async function authSignOut() {
    if (!enabled()) return false;
    try {
      var res = await sb().auth.signOut();
      if (res.error) throw res.error;
      window.geoUser = null;
      return true;
    } catch (e) {
      console.warn('[Geolytics] No se pudo cerrar sesión:', e.message || e);
      return false;
    }
  }

  async function authGetUser() {
    if (!enabled()) return null;
    try {
      var res = await sb().auth.getUser();
      return (res.data && res.data.user) || null;
    } catch (e) {
      return null;
    }
  }

  async function authMarkOnboarded() {
    if (!enabled()) return false;
    try {
      var res = await sb().auth.updateUser({ data: { onboarded: true } });
      if (res.error) throw res.error;
      if (res.data && res.data.user) window.geoUser = res.data.user;
      return true;
    } catch (e) {
      console.warn('[Geolytics] No se pudo marcar onboarding:', e.message || e);
      return false;
    }
  }

  function authOnChange(cb) {
    if (!enabled()) return function () {};
    try {
      var sub = sb().auth.onAuthStateChange(function (_evt, session) {
        cb((session && session.user) || null);
      });
      return function () { try { sub.data.subscription.unsubscribe(); } catch (e) {} };
    } catch (e) {
      return function () {};
    }
  }

  async function profileGet(userId) {
    if (!enabled() || !userId) return null;
    try {
      var res = await sb().from('profiles').select('*').eq('id', userId).maybeSingle();
      if (res.error) throw res.error;
      return res.data || null;
    } catch (e) {
      console.warn('[Geolytics] No se pudo leer el perfil de Supabase:', e.message || e);
      return null;
    }
  }

  async function profileUpsert(userId, p) {
    if (!enabled() || !userId) return false;
    try {
      var res = await sb().from('profiles').upsert({
        id: userId,
        first: p.first || null,
        last: p.last || null,
        email: p.email || null,
        occupation: p.occupation || null,
        interests: p.interests || [],
        avatar: p.avatar || null,
        updated_at: new Date().toISOString(),
      });
      if (res.error) throw res.error;
      return true;
    } catch (e) {
      console.warn('[Geolytics] No se pudo guardar el perfil en Supabase:', e.message || e);
      return false;
    }
  }

  window.DB = {
    enabled: enabled,
    auth: {
      signInGoogle: authSignInGoogle,
      signUp: authSignUp,
      signInPassword: authSignInPassword,
      resetPassword: authResetPassword,
      signOut: authSignOut,
      getUser: authGetUser,
      markOnboarded: authMarkOnboarded,
      onChange: authOnChange,
    },
    profiles: {
      get: profileGet,
      upsert: profileUpsert,
    },
    scenarios: { list: scenariosList },
    simulations: {
      list: simsList,
      add: simsAdd,
      setSaved: simsSetSaved,
      remove: simsRemove,
    },
  };
})();

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

const NOTIFICATIONS = [
  { icon: 'check', color: 'var(--pos)',   title: 'Tu simulación está lista',              body: 'Crisis económica · Argentina terminó de procesarse.',                          time: 'hace 2 min',  unread: true },
  { icon: 'bars',  color: 'var(--brand)', title: 'Datos actualizados del Banco Mundial',  body: 'La inflación de Argentina se actualizó al último dato disponible. Volvé a correr tus simulaciones.', time: 'hace 1 h', unread: true },
  { icon: 'grid',  color: 'var(--brand)', title: 'Nuevo escenario disponible',            body: "Ya podés simular 'Crisis crediticia' desde la biblioteca.",                     time: 'ayer',        unread: false },
  { icon: 'save',  color: 'var(--muted)', title: 'Material educativo nuevo',              body: 'Guía: cómo leer una curva de inflación proyectada.',                            time: 'hace 3 días', unread: false },
];
const getCountry = (code) => COUNTRIES.find(c => c.code === code) || COUNTRIES[0];

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
function wbCachedLatest(country, indicator) {
  const rows = wbCachedRows(country, indicator);
  return rows.length ? rows[rows.length - 1].value : null;
}
function wbValueAtYear(country, indicator, year) {
  const row = wbCachedRows(country, indicator).find(r => r.year === year);
  return row ? row.value : null;
}
const realInflationFraction = (country) => {
  const v = wbCachedLatest(country, WB_INDICATORS.inflation);
  return v == null ? null : v / 100;
};
const realUnemploymentFraction = (country) => {
  const v = wbCachedLatest(country, WB_INDICATORS.unemployment);
  return v == null ? null : v / 100;
};
const realExchangeRate = (country) => {
  if (country === 'US') return wbCachedLatest('DE', WB_INDICATORS.fx);
  return wbCachedLatest(country, WB_INDICATORS.fx);
};
function exchangeInfo(country) {
  if (country === 'US') return { label: 'USD / EUR', cur: 'EUR', rate: realExchangeRate('US') };
  const c = getCountry(country);
  return { label: 'USD / ' + (c.cur || 'LCU'), cur: c.cur || 'LCU', rate: realExchangeRate(country) };
}

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

function fmtGdp(v) {
  if (v == null) return 's/d';
  if (v >= 1e12) return 'US$ ' + (v / 1e12).toLocaleString('es-AR', { maximumFractionDigits: 2 }) + ' bill.';
  return 'US$ ' + (v / 1e9).toLocaleString('es-AR', { maximumFractionDigits: 0 }) + ' mil M';
}

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

const DURATIONS = [3, 6, 12, 24];
const INTENSITY_LABELS = ['Leve', 'Moderada', 'Alta', 'Extrema'];
const durIdx = (d) => Math.min(3, Math.floor(d / 25));
const intensityLabel = (i) => INTENSITY_LABELS[Math.min(3, Math.floor(i / 25))];
const intensityFactor = (i) => 0.3 + (i / 100) * 1.4; // scales effect
const getScenario = (id) => SCENARIOS.find(s => s.id === id);
const fmtPct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
const fmtNum = (v, d=0) => v.toLocaleString('es-AR', { maximumFractionDigits: d, minimumFractionDigits: d });

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
      const tt = p.lag >= 1 ? 0 : Math.max(0, (t - p.lag) / (1 - p.lag));
      const ramp = 1 - Math.exp(-p.speed * tt);
      const reb = 1 - p.rebound * Math.max(0, tt - p.reboundAt) / (1 - p.reboundAt + 1e-6);
      const shock = delta * ramp * reb;
      const noise = (Math.sin(i * 1.3 + k.length) * 0.01 + (Math.random() - 0.5) * 0.004) * Math.abs(delta || 0.05);
      const val = base * (1 + shock + noise);
      arr.push(val);
    }
    series[k] = { base, final: arr[arr.length - 1], delta, arr };
  }
  return series;
}

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

function initExtraState() {
  Object.assign(state, {
    onboardingStep: state.onboardingStep || 1,
    detailScenario: state.detailScenario || 'crisis',
    profileTab: state.profileTab || 'account',
    authMode: state.authMode || 'login',
    registerStep: state.registerStep || 1,
    register: state.register || {
      first: '', last: '', email: '', password: '', confirm: '',
      role: '', institution: '', level: '',
      interests: [], terms: false, newsletter: true
    },
    profile: state.profile || {
      first: 'Tomás',
      last: 'Fernández',
      email: 'tomas@geolytics.io',
      occupation: 'Estudiante',
      interests: ['Crisis económica', 'Commodities']
    },
    prefs: state.prefs || { autosave: true, language: 'Español (AR)', timezone: 'America/Buenos_Aires (GMT-3)', numfmt: '1.234,56' },
    notifs: state.notifs || { newScenarios: true, weekly: true, product: false, edu: false },
    compareCount: state.compareCount || 0,
    loginError: '',
    registerError: ''
  });
}
window.initExtraState = initExtraState;

function wireExtraEvents() {
  document.querySelectorAll('[data-auth-mode]').forEach(el => el.addEventListener('click', () => {
    state.authMode = el.getAttribute('data-auth-mode');
    if (state.authMode === 'register') state.registerStep = 1;
    state.loginError = ''; state.registerError = '';
    render();
  }));

  document.querySelectorAll('[data-action="login-submit"]').forEach(el => el.addEventListener('click', async () => {
    if (!window.DB || !DB.enabled()) { navigate('home'); return; }
    const email = (document.getElementById('login-email')?.value || '').trim();
    const pass = document.getElementById('login-password')?.value || '';
    if (!email || !pass) { state.loginError = 'Completá email y contraseña.'; render(); return; }
    const orig = el.innerHTML;
    el.disabled = true; el.style.opacity = '0.6'; el.style.cursor = 'wait';
    el.innerHTML = 'Ingresando…';
    const res = await DB.auth.signInPassword(email, pass);
    if (!res.ok) {
      el.disabled = false; el.style.opacity = ''; el.style.cursor = '';
      el.innerHTML = orig;
      state.loginError = /invalid login/i.test(res.reason) ? 'Email o contraseña incorrectos.'
        : /not confirmed/i.test(res.reason) ? 'Tenés que confirmar tu email antes de entrar.'
        : ('No se pudo iniciar sesión: ' + res.reason);
      render(); return;
    }
    state.loginError = '';
    if (res.user) { applyAuthUser(res.user); }
    state.onboardingStep = 1;
    navigate(res.user && isOnboarded(res.user) ? 'home' : 'onboarding');
  }));
  document.querySelectorAll('[data-reg-key]').forEach(el => {
    const key = el.getAttribute('data-reg-key');
    el.addEventListener('input', () => { state.register[key] = el.value; if (['password','confirm'].includes(key)) render(); });
    el.addEventListener('change', () => { state.register[key] = el.value; });
    if (key === 'email') el.addEventListener('blur', () => { state.register[key] = el.value; render(); });
  });
  document.querySelectorAll('[data-reg-toggle]').forEach(el => el.addEventListener('click', (e) => {
    e.preventDefault();
    const k = el.getAttribute('data-reg-toggle');
    state.register[k] = !state.register[k];
    render();
  }));
  document.querySelectorAll('[data-reg-role]').forEach(el => el.addEventListener('click', () => {
    state.register.role = el.getAttribute('data-reg-role');
    render();
  }));
  document.querySelectorAll('[data-reg-interest]').forEach(el => el.addEventListener('click', () => {
    const name = el.getAttribute('data-reg-interest');
    const arr = state.register.interests;
    const i = arr.indexOf(name);
    if (i >= 0) arr.splice(i, 1); else arr.push(name);
    render();
  }));
  document.querySelectorAll('[data-reg-next]').forEach(el => el.addEventListener('click', () => {
    if (el.hasAttribute('disabled')) return;
    state.registerStep = Math.min(2, state.registerStep + 1);
    render();
  }));
  document.querySelectorAll('[data-reg-prev]').forEach(el => el.addEventListener('click', () => {
    state.registerStep = Math.max(1, state.registerStep - 1);
    render();
  }));
  document.querySelectorAll('[data-reg-finish]').forEach(el => el.addEventListener('click', async () => {
    if (el.hasAttribute('disabled')) return;
    const r = state.register;
    const occupation = ({student:'Estudiante',teacher:'Docente',pro:'Profesional',curious:'Curioso'})[r.role] || 'Estudiante';
    if (!window.DB || !DB.enabled()) {
      state.profile = {
        first: r.first || state.profile.first, last: r.last || state.profile.last,
        email: r.email || state.profile.email, occupation, interests: state.profile.interests
      };
      state.registerStep = 3; render(); return;
    }
    const orig = el.innerHTML;
    el.disabled = true; el.style.opacity = '0.6'; el.style.cursor = 'wait';
    el.innerHTML = 'Creando cuenta…';
    const fullName = (r.first + ' ' + r.last).trim();
    const res = await DB.auth.signUp(r.email, r.password, { first: r.first, last: r.last, full_name: fullName, occupation });
    if (!res.ok) {
      el.disabled = false; el.style.opacity = ''; el.style.cursor = ''; el.innerHTML = orig;
      state.registerError = /already registered|already exists/i.test(res.reason)
        ? 'Ese email ya está registrado. Probá iniciar sesión.'
        : ('No se pudo crear la cuenta: ' + res.reason);
      render(); return;
    }
    state.profile = { first: r.first, last: r.last, email: r.email, occupation, interests: state.profile.interests, avatar: '' };
    if (!res.session) {
      el.disabled = false; el.style.opacity = ''; el.style.cursor = ''; el.innerHTML = orig;
      state.registerError = 'Cuenta creada. Confirmá tu email para poder iniciar sesión.';
      render(); return;
    }
    if (res.user) { applyAuthUser(res.user); DB.profiles.upsert(res.user.id, state.profile); }
    state.registerError = '';
    state.registerStep = 3;
    render();
  }));

  document.querySelectorAll('[data-onb-next]').forEach(el => el.addEventListener('click', () => { state.onboardingStep = Math.min(4, state.onboardingStep + 1); render(); }));
  document.querySelectorAll('[data-onb-prev]').forEach(el => el.addEventListener('click', () => { state.onboardingStep = Math.max(1, state.onboardingStep - 1); render(); }));
  document.querySelectorAll('[data-action="onb-done"]').forEach(el => el.addEventListener('click', () => { markOnboarded(); navigate('home'); }));

  document.querySelectorAll('[data-profile-tab]').forEach(el => el.addEventListener('click', () => { state.profileTab = el.getAttribute('data-profile-tab'); render(); }));
  document.querySelectorAll('[data-profile-key]').forEach(el => {
    el.addEventListener('input', () => { state.profile[el.getAttribute('data-profile-key')] = el.value; });
    el.addEventListener('change', () => { state.profile[el.getAttribute('data-profile-key')] = el.value; });
  });
  document.querySelectorAll('[data-profile-interest]').forEach(el => el.addEventListener('click', () => {
    const name = el.getAttribute('data-profile-interest');
    const arr = state.profile.interests;
    const i = arr.indexOf(name);
    if (i >= 0) arr.splice(i, 1); else arr.push(name);
    render();
  }));

  document.querySelectorAll('[data-detail-scenario]').forEach(el => el.addEventListener('click', (e) => {
    e.stopPropagation();
    state.detailScenario = el.getAttribute('data-detail-scenario');
    navigate('detail');
  }));

  document.querySelectorAll('[data-action="sim-from-detail"]').forEach(el => el.addEventListener('click', () => {
    state.selectedScenario = state.detailScenario;
    navigate('config');
  }));

  document.querySelectorAll('[data-user-action]').forEach(el => el.addEventListener('click', async () => {
    const action = el.getAttribute('data-user-action');
    if (action === 'profile') navigate('profile');
    if (action === 'logout') {
      if (window.DB && DB.enabled()) { await DB.auth.signOut(); }
      navigate('login');
    }
  }));

  document.querySelectorAll('[data-pref-select]').forEach(el => el.addEventListener('change', () => {
    state.prefs[el.getAttribute('data-pref-select')] = el.value;
    saveState();
  }));
  document.querySelectorAll('[data-pref-toggle]').forEach(el => el.addEventListener('click', () => {
    const k = el.getAttribute('data-pref-toggle');
    state.prefs[k] = !state.prefs[k];
    el.classList.toggle('on', state.prefs[k]);
    saveState();
  }));
  document.querySelectorAll('[data-notif-toggle]').forEach(el => el.addEventListener('click', () => {
    const k = el.getAttribute('data-notif-toggle');
    state.notifs[k] = !state.notifs[k];
    el.classList.toggle('on', state.notifs[k]);
    saveState();
  }));

  document.querySelectorAll('.auth-oauth-btn').forEach(el => el.addEventListener('click', async () => {
    if (!window.DB || !DB.enabled()) { navigate('home'); return; }
    const original = el.innerHTML;
    el.disabled = true;
    el.style.opacity = '0.6';
    el.style.cursor = 'wait';
    el.innerHTML = `${GOOGLE_SVG} Conectando con Google…`;
    const res = await DB.auth.signInGoogle(homeUrl());
    if (!res || !res.ok) {
      el.disabled = false;
      el.style.opacity = '';
      el.style.cursor = '';
      el.innerHTML = original;
      alert('No se pudo conectar con Google.\n\nVerificá que el proveedor Google esté habilitado en Supabase (Authentication → Providers) y que esta URL esté en la lista de Redirect URLs.');
    }
  }));
}

window.EXTRA_SCREENS = {
  login: loginHTML,
  onboarding: onboardingHTML,
  profile: profileHTML,
  detail: detailHTML,
  about: aboutHTML,
  loading: loadingHTML,
  teachers: teachersHTML,
  glossary: glossaryHTML,
  forgot: forgotHTML,
  aula: aulaHTML,
  institucion: institucionHTML
};
window.STANDALONE_SCREENS = new Set(['login', 'onboarding', 'loading', 'forgot']);
window.EXTRA_TITLES = {
  login: 'Iniciar sesión',
  onboarding: 'Bienvenida',
  profile: 'Perfil',
  detail: 'Detalle de escenario',
  about: 'Acerca de',
  loading: 'Simulando',
  teachers: 'Para docentes',
  glossary: 'Glosario',
  forgot: 'Recuperar contraseña',
  aula: 'Mi aula',
  institucion: 'Institución'
};
window.wireExtraEvents = wireExtraEvents;

const icon = (name, size=16) => {
  const paths = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    bars: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    compare: '<line x1="12" y1="2" x2="12" y2="22"/><polyline points="17 7 12 2 7 7"/><polyline points="7 17 12 22 17 17"/>',
    logo: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    arrowR: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    arrowL: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    wand: '<path d="M15 4V2m0 14v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9h0M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/>',
    sparkle: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>'
  };
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
};

const brandLogo = (size = 20) => `<svg viewBox="18 22 66 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="24" y="54" width="14" height="28" rx="2.5" fill="currentColor" opacity="0.5"/>
  <rect x="43" y="42" width="14" height="40" rx="2.5" fill="currentColor" opacity="0.75"/>
  <rect x="62" y="26" width="14" height="56" rx="2.5" fill="currentColor"/>
  <path d="M22 80 L74 42" stroke="var(--accent)" stroke-width="7" stroke-linecap="round"/>
  <path d="M64 36 L80 34 L74 49 Z" fill="var(--accent)"/>
</svg>`;

function emptyState(opts) {
  opts = opts || {};
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon(opts.icon || 'info', 26)}</div>
      <h3 class="empty-state-title">${opts.title || ''}</h3>
      <p class="empty-state-text">${opts.text || ''}</p>
      ${opts.actions ? `<div class="empty-state-actions">${opts.actions}</div>` : ''}
    </div>`;
}

const PAGE_MAP = {
  home:        'Geolytics.html',
  scenarios:   'escenarios.html',
  config:      'configuracion.html',
  loading:     'loading.html',
  results:     'resultados.html',
  history:     'historial.html',
  compare:     'comparar.html',
  profile:     'perfil.html',
  about:       'acerca.html',
  teachers:    'docentes.html',
  login:       'login.html',
  detail:      'detalle.html',
  onboarding:  'onboarding.html',
  glossary:    'glosario.html',
  forgot:      'recuperar.html',
  aula:        'aula.html',
  institucion: 'institucion.html',
};

const SAVED = (() => {
  try { return JSON.parse(localStorage.getItem('geolytics-state') || '{}'); }
  catch { return {}; }
})();

const state = {
  screen: window.__INITIAL_SCREEN || 'home',
  selectedScenario: 'crisis',
  country: 'AR',
  intensity: 75, // 0-100
  duration: 50,  // 0-100 (3mo, 6mo, 12mo, 24mo)
  vars: { sp500: true, usdars: true, commodities: true, inflation: false, unemployment: false },
  history: [
    { id: 1, scenario: 'crisis', intensityPct: 85, durIdx: 2, date: '05/04/2026', saved: true, name: 'Crisis económica' },
    { id: 2, scenario: 'conflict', intensityPct: 55, durIdx: 1, date: '03/04/2026', saved: false, name: 'Conflicto internacional' },
    { id: 3, scenario: 'pandemic', intensityPct: 80, durIdx: 3, date: '01/04/2026', saved: true, name: 'Pandemia' },
    { id: 4, scenario: 'oil', intensityPct: 95, durIdx: 0, date: '28/03/2026', saved: false, name: 'Shock petrolero' },
    { id: 5, scenario: 'rates', intensityPct: 60, durIdx: 2, date: '22/03/2026', saved: false, name: 'Suba de tasas' }
  ],
  compareA: 1,
  compareB: 2,
  chartMode: 'line',
  histFilter: 'all',
  histSearch: ''
};

Object.assign(state, SAVED);
if (window.__INITIAL_SCREEN) state.screen = window.__INITIAL_SCREEN;

function sidebarHTML() {
  const items = [
    { id: 'home', label: 'Inicio', icon: 'home' },
    { id: 'scenarios', label: 'Escenarios', icon: 'grid', count: SCENARIOS.length },
    { id: 'config', label: 'Configuración', icon: 'sliders' },
    { id: 'results', label: 'Resultados', icon: 'bars' },
    { id: 'history', label: 'Mis simulaciones', icon: 'clock', count: state.history.length },
    { id: 'compare', label: 'Comparación', icon: 'compare' }
  ];
  const helpItems = [
    { id: 'glossary', label: 'Glosario', icon: 'book' },
    { id: 'about', label: 'Acerca de', icon: 'info' },
    { id: 'teachers', label: 'Para docentes', icon: 'sparkle' }
  ];
  const __av = state.profile && state.profile.avatar;
  const __avStyle = __av
    ? `cursor:pointer; background-image:url('${__av}'); background-size:cover; background-position:center; color:transparent; text-indent:-9999px;`
    : 'cursor:pointer;';
  return `
    <aside class="side" data-screen-label="Sidebar">
      <div class="brand">
        <div class="brand-mark">${brandLogo(20)}</div>
        <div>
          <div class="brand-name" style="font-size:22px; letter-spacing:-0.02em; line-height:1;">Geolytics</div>
        </div>
      </div>
      <nav class="nav">
        <div class="nav-heading">Navegación</div>
        ${items.map(it => `
          <button class="nav-item ${state.screen === it.id ? 'active' : ''}" data-nav="${it.id}">
            ${icon(it.icon, 16)}
            <span>${it.label}</span>
            ${it.count ? `<span class="nav-count">${it.count}</span>` : ''}
          </button>
        `).join('')}
        <div class="nav-heading" style="margin-top:18px;">Ayuda</div>
        ${helpItems.map(it => `
          <button class="nav-item ${state.screen === it.id ? 'active' : ''}" data-nav="${it.id}">
            ${icon(it.icon, 16)}
            <span>${it.label}</span>
          </button>
        `).join('')}
        <div class="nav-heading" style="margin-top:18px;">Recientes</div>
        ${state.history.slice(0, 3).map(h => {
          const sc = getScenario(h.scenario);
          return `<button class="nav-item" data-nav-history="${h.id}" style="font-size:12.5px;">
            <span style="font-size:14px;">${sc.glyph}</span>
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${h.name}</span>
          </button>`;
        }).join('')}
      </nav>
      <div class="side-footer">
        <div class="user-row">
          <div class="avatar" data-user-action="profile" style="${__avStyle}">${(state.profile?.first?.[0] || 'T') + (state.profile?.last?.[0] || 'F')}</div>
          <div data-user-action="profile" style="cursor:pointer; flex:1; min-width:0;">
            <div class="user-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${state.profile?.first || 'Tomás'} ${(state.profile?.last || 'Fernández')[0]}.</div>
            <div class="user-role">${state.profile?.occupation || 'Estudiante'}</div>
          </div>
          <button class="icon-btn" data-user-action="logout" title="Cerrar sesión" style="width:28px; height:28px; margin-left:auto; background:transparent; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>
  `;
}

const TITLES = {
  home: 'Inicio',
  scenarios: 'Escenarios',
  config: 'Configuración',
  results: 'Resultados',
  history: 'Mis simulaciones',
  compare: 'Comparación',
  profile: 'Perfil',
  detail: 'Detalle de escenario',
  about: 'Acerca de',
  teachers: 'Para docentes'
};

function topbarHTML() {
  const crumbs = {
    home: ['Panel'],
    scenarios: ['Simulación', 'Escenarios'],
    config: ['Simulación', 'Escenarios', 'Configuración'],
    results: ['Simulación', 'Resultados'],
    history: ['Biblioteca', 'Mis simulaciones'],
    compare: ['Biblioteca', 'Comparación'],
    profile: ['Cuenta', 'Perfil'],
    detail: ['Simulación', 'Escenarios', 'Detalle'],
    about: ['Ayuda', 'Acerca de'],
    glossary: ['Ayuda', 'Glosario'],
    teachers: ['Ayuda', 'Para docentes'],
    aula: ['Para docentes', 'Mi aula'],
    institucion: ['Para docentes', 'Institución']
  }[state.screen] || ['Panel'];
  return `
    <div class="topbar">
      <button class="mobile-menu-btn" data-action="toggle-sidebar" aria-label="Abrir menú">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div class="crumbs">
        ${crumbs.map((c, i) => i === crumbs.length - 1
          ? `<strong>${c}</strong>`
          : `<span>${c}</span><span class="slash">/</span>`).join('')}
      </div>
      <div class="top-actions">
        <button class="icon-btn" data-action="toggle-dark" aria-label="Cambiar modo claro/oscuro" title="Modo claro / oscuro">${icon(isDark() ? 'sun' : 'moon', 15)}</button>
        <div class="search" data-action="open-search">
          ${icon('search', 14)}
          <span>Buscar escenario, variable…</span>
        </div>
        <div class="notif-wrap" style="position:relative;">
          <button class="icon-btn" aria-label="Notificaciones" data-action="toggle-notif">
            ${icon('bell', 15)}
            <span class="pip"></span>
          </button>
          <div id="notif-panel" style="display:none; position:absolute; top:calc(100% + 10px); right:0; width:344px; background:var(--surface,#fff); border:1px solid var(--line); border-radius:14px; box-shadow:0 14px 44px rgba(0,0,0,0.16); z-index:300; overflow:hidden;">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:13px 15px; border-bottom:1px solid var(--line);">
              <strong style="font-size:14px;">Notificaciones</strong>
              <button data-action="mark-read-notif" style="font:inherit; font-size:12px; color:var(--brand); background:none; border:none; cursor:pointer; padding:0;">Marcar como leídas</button>
            </div>
            <div style="max-height:380px; overflow-y:auto;">
              ${NOTIFICATIONS.map(n => `
                <div ${n.unread ? 'data-unread-row="1"' : ''} style="display:flex; gap:11px; padding:12px 15px; border-bottom:1px solid var(--line); ${n.unread ? 'background:rgba(0,0,0,0.025);' : ''}">
                  <div style="flex-shrink:0; width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.05); color:${n.color};">${icon(n.icon, 15)}</div>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:13px; font-weight:600;">${n.title}</div>
                    <div style="font-size:12px; color:var(--muted); margin-top:2px; line-height:1.4;">${n.body}</div>
                    <div style="font-size:10.5px; color:var(--muted); margin-top:4px; font-family:var(--font-mono);">${n.time}</div>
                  </div>
                  ${n.unread ? '<span data-unread-dot="1" style="flex-shrink:0; width:7px; height:7px; border-radius:50%; background:var(--brand); margin-top:5px;"></span>' : ''}
                </div>`).join('')}
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" data-action="new-sim">
          ${icon('sparkle', 14)}
          Nueva simulación
        </button>
      </div>
    </div>
  `;
}

function render() {
  const builtins = {
    home: homeHTML,
    scenarios: scenariosHTML,
    config: configHTML,
    results: resultsHTML,
    history: historyHTML,
    compare: compareHTML
  };
  const extra = window.EXTRA_SCREENS || {};
  const builder = builtins[state.screen] || extra[state.screen] || homeHTML;
  const screenHTML = builder();

  const standalone = window.STANDALONE_SCREENS || new Set();
  if (standalone.has(state.screen)) {
    document.getElementById('app').innerHTML = `<main class="main main-standalone"><div class="canvas standalone-canvas">${screenHTML}</div></main>`;
    document.getElementById('app').classList.add('app-standalone');
  } else {
    document.getElementById('app').classList.remove('app-standalone');
    document.getElementById('app').innerHTML = sidebarHTML() + `
      <main class="main">
        ${topbarHTML()}
        <div class="canvas">${screenHTML}</div>
      </main>
      <div class="side-backdrop" data-action="close-sidebar"></div>
    `;
  }
  wireEvents();
  if (window.wireExtraEvents) window.wireExtraEvents();
  try {
    var __noSuffix = ['login', 'forgot', 'onboarding', 'loading'];
    var __pretty = (window.EXTRA_TITLES && window.EXTRA_TITLES[state.screen]) || TITLES[state.screen];
    document.title = (__noSuffix.indexOf(state.screen) !== -1 || !__pretty) ? 'Geolytics' : ('Geolytics — ' + __pretty);
  } catch (e) {}
  if (!window.__INITIAL_SCREEN) {
    try { localStorage.setItem('geolytics.screen', state.screen); } catch(e) {}
  }
}

let __pendingAsyncRender = false;
window.__pointerHeld = false;
document.addEventListener('pointerdown', () => { window.__pointerHeld = true; }, true);
function __flushAsyncRender() {
  window.__pointerHeld = false;
  if (__pendingAsyncRender) { __pendingAsyncRender = false; render(); }
}
document.addEventListener('pointerup', __flushAsyncRender, true);
document.addEventListener('pointercancel', __flushAsyncRender, true);
function renderAsync() {
  if (window.__pointerHeld) { __pendingAsyncRender = true; return; }
  render();
}

function navigate(screen) {
  saveState();
  if (screen === 'forgot') { state.forgotSent = false; }
  if (screen === 'compare' && state.screen !== 'compare') { state.compareCount = (state.compareCount || 0) + 1; }
  state.screen = screen;
  render();
  document.querySelector('.canvas')?.scrollTo({ top: 0 });
  const url = PAGE_MAP[screen];
  if (url && url !== location.pathname.split('/').pop()) {
    try { history.pushState({ screen: screen }, '', url); } catch (e) {}
  }
  if (screen === 'loading') {
    setTimeout(() => { if (state.screen === 'loading') navigate('results'); }, 1500);
  }
}

const FILE_TO_SCREEN = Object.fromEntries(
  Object.entries(PAGE_MAP).map(([s, f]) => [f, s])
);
window.addEventListener('popstate', (e) => {
  const file = location.pathname.split('/').pop();
  const screen = (e.state && e.state.screen) || FILE_TO_SCREEN[file] || state.screen;
  state.screen = screen;
  render();
  document.querySelector('.canvas')?.scrollTo({ top: 0 });
});

function saveState() {
  try {
    const persist = {
      selectedScenario: state.selectedScenario,
      country: state.country,
      intensity: state.intensity,
      duration: state.duration,
      variables: state.variables,
      history: state.history,
      profile: state.profile,
      profileTab: state.profileTab,
      authMode: state.authMode,
      detailScenario: state.detailScenario,
      compareA: state.compareA,
      compareB: state.compareB,
      histFilter: state.histFilter,
      prefs: state.prefs,
      notifs: state.notifs,
      compareCount: state.compareCount,
    };
    localStorage.setItem('geolytics-state', JSON.stringify(persist));
  } catch {}
}
window.addEventListener('beforeunload', saveState);

function wireEvents() {
  if (!window.__navDelegated) {
    window.__navDelegated = true;
    document.addEventListener('click', (e) => {
      const navEl = e.target.closest('[data-nav]');
      if (navEl) {
        e.preventDefault();
        navigate(navEl.getAttribute('data-nav'));
        return;
      }
      const histEl = e.target.closest('[data-nav-history]');
      if (histEl) {
        const id = parseInt(histEl.getAttribute('data-nav-history'));
        const h = state.history.find(x => x.id === id);
        if (h) {
          state.selectedScenario = h.scenario;
          state.intensity = h.intensityPct;
          state.duration = h.durIdx * 25;
          navigate('results');
        }
      }
    });
  }

  document.querySelectorAll('[data-pick-scenario]').forEach(el => {
    el.addEventListener('click', () => {
      state.selectedScenario = el.getAttribute('data-pick-scenario');
      if (state.screen === 'scenarios') {
        render();
      } else {
        navigate('config');
      }
    });
  });

  document.querySelectorAll('[data-action="run-sim"]').forEach(el => {
    el.addEventListener('click', () => {
      const sc = getScenario(state.selectedScenario);
      const rec = {
        id: Date.now(),
        scenario: state.selectedScenario,
        country: state.country,
        intensityPct: state.intensity,
        durIdx: durIdx(state.duration),
        date: new Date().toLocaleDateString('es-AR'),
        saved: false,
        name: sc.name
      };
      state.history.unshift(rec);
      if (window.DB) DB.simulations.add(rec);
      navigate('loading');
    });
  });

  document.querySelectorAll('[data-action="new-sim"]').forEach(el => {
    el.addEventListener('click', () => navigate('scenarios'));
  });

  document.querySelectorAll('[data-action="toggle-sidebar"]').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelector('.side')?.classList.add('open');
      document.querySelector('.side-backdrop')?.classList.add('show');
    });
  });
  document.querySelectorAll('[data-action="close-sidebar"]').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelector('.side')?.classList.remove('open');
      document.querySelector('.side-backdrop')?.classList.remove('show');
    });
  });

  document.querySelectorAll('[data-action="toggle-dark"]').forEach(el => el.addEventListener('click', toggleDark));

  const intSlider = document.getElementById('intensity-slider');
  if (intSlider) {
    intSlider.addEventListener('input', (e) => {
      state.intensity = parseInt(e.target.value);
      e.target.style.setProperty('--val', state.intensity + '%');
      document.getElementById('intensity-chip').textContent = intensityLabel(state.intensity);
      updatePreview();
    });
  }
  const durSlider = document.getElementById('duration-slider');
  if (durSlider) {
    durSlider.addEventListener('input', (e) => {
      state.duration = parseInt(e.target.value);
      const idx = durIdx(state.duration);
      e.target.style.setProperty('--val', ((idx / 3) * 100) + '%');
      document.getElementById('duration-chip').textContent = DURATIONS[idx] + ' meses';
      updatePreview();
    });
  }

  const countrySel = document.getElementById('country-select');
  if (countrySel) {
    countrySel.addEventListener('change', (e) => {
      state.country = e.target.value;
      updateWBPanel();
    });
    updateWBPanel(); // carga inicial
  }

  updateResultsRealData();

  document.querySelectorAll('[data-action="forgot-send"]').forEach(el => {
    el.addEventListener('click', () => {
      const input = document.getElementById('forgot-email');
      state.forgotEmail = (input && input.value.trim()) || '';
      state.forgotSent = true;
      render();
    });
  });
  document.querySelectorAll('[data-action="forgot-resend"]').forEach(el => {
    el.addEventListener('click', () => { state.forgotSent = true; render(); });
  });

  const notifBtn = document.querySelector('[data-action="toggle-notif"]');
  const notifPanel = document.getElementById('notif-panel');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.style.display = notifPanel.style.display === 'block' ? 'none' : 'block';
    });
    const markRead = notifPanel.querySelector('[data-action="mark-read-notif"]');
    if (markRead) markRead.addEventListener('click', () => {
      notifPanel.querySelectorAll('[data-unread-dot]').forEach(d => d.remove());
      notifPanel.querySelectorAll('[data-unread-row]').forEach(r => { r.style.background = 'transparent'; });
      const pip = notifBtn.querySelector('.pip');
      if (pip) pip.style.display = 'none';
    });
  }
  if (!window.__notifOutsideWired) {
    window.__notifOutsideWired = true;
    document.addEventListener('click', (e) => {
      const p = document.getElementById('notif-panel');
      const b = document.querySelector('[data-action="toggle-notif"]');
      if (p && b && !p.contains(e.target) && !b.contains(e.target)) p.style.display = 'none';
    });
  }

  document.querySelectorAll('[data-toggle-var]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-toggle-var');
      state.vars[id] = !state.vars[id];
      el.classList.toggle('on', state.vars[id]);
      el.querySelector('.vtrend').textContent = state.vars[id] ? 'OBSERVANDO' : '—';
      const head = document.querySelector('.var-list');
      if (head) {
        const counter = head.closest('.config-section').querySelector('.config-section-head span');
        if (counter) counter.textContent = Object.values(state.vars).filter(Boolean).length + ' de ' + VARIABLES.length;
      }
    });
  });

  document.querySelectorAll('[data-chart-mode]').forEach(el => {
    el.addEventListener('click', () => {
      state.chartMode = el.getAttribute('data-chart-mode');
      render();
    });
  });

  document.querySelectorAll('[data-hist-save]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(el.getAttribute('data-hist-save'));
      const h = state.history.find(x => x.id === id);
      if (h) {
        h.saved = !h.saved;
        if (window.DB) DB.simulations.setSaved(h.id, h.saved);
        saveState();
        render();
      }
    });
  });
  document.querySelectorAll('[data-hist-filter]').forEach(el => {
    el.addEventListener('click', () => {
      state.histFilter = el.getAttribute('data-hist-filter');
      render();
    });
  });
  const histSearchEl = document.getElementById('hist-search');
  if (histSearchEl) {
    histSearchEl.addEventListener('input', () => {
      state.histSearch = histSearchEl.value;
      const caret = histSearchEl.selectionStart;
      render();
      const again = document.getElementById('hist-search');
      if (again) { again.focus(); try { again.setSelectionRange(caret, caret); } catch (e) {} }
    });
  }
  document.querySelectorAll('[data-hist-open]').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt(el.getAttribute('data-hist-open'));
      const h = state.history.find(x => x.id === id);
      if (h) {
        state.selectedScenario = h.scenario;
        state.intensity = h.intensityPct;
        state.duration = h.durIdx * 25;
        navigate('results');
      }
    });
  });
  document.querySelectorAll('[data-hist-compare]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(el.getAttribute('data-hist-compare'));
      state.compareA = id;
      state.compareB = state.history.find(h => h.id !== id)?.id || state.compareB;
      navigate('compare');
    });
  });

  const exportBtn = document.querySelector('[data-action="toggle-export"]');
  const exportMenu = document.getElementById('export-menu');
  if (exportBtn && exportMenu) {
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle('open');
    });
    if (!window.__exportOutsideWired) {
      window.__exportOutsideWired = true;
      document.addEventListener('click', (e) => {
        const m = document.getElementById('export-menu');
        const b = document.querySelector('[data-action="toggle-export"]');
        if (m && b && !m.contains(e.target) && !b.contains(e.target)) m.classList.remove('open');
      });
    }
  }
  document.querySelectorAll('[data-action="export-pdf"]').forEach(el => el.addEventListener('click', () => {
    exportMenu?.classList.remove('open');
    exportResultsPDF();
  }));
  document.querySelectorAll('[data-action="export-jpg"]').forEach(el => el.addEventListener('click', () => {
    exportMenu?.classList.remove('open');
    exportResultsImage('jpg');
  }));
  document.querySelectorAll('[data-action="export-png"]').forEach(el => el.addEventListener('click', () => {
    exportMenu?.classList.remove('open');
    exportResultsImage('png');
  }));

  document.querySelectorAll('[data-action="save-result"]').forEach(el => el.addEventListener('click', () => {
    const sc = getScenario(state.selectedScenario);
    const di = durIdx(state.duration);
    let rec = state.history.find(h => h.scenario === state.selectedScenario
      && h.intensityPct === state.intensity && h.durIdx === di && (h.country || 'AR') === state.country);
    if (rec) {
      rec.saved = true;
      if (window.DB) DB.simulations.setSaved(rec.id, true);
    } else {
      rec = {
        id: Date.now(), scenario: state.selectedScenario, country: state.country,
        intensityPct: state.intensity, durIdx: di,
        date: new Date().toLocaleDateString('es-AR'), saved: true, name: sc.name
      };
      state.history.unshift(rec);
      if (window.DB) DB.simulations.add(rec);
    }
    saveState();
    el.innerHTML = `${icon('check', 14)} Guardada`;
    el.disabled = true;
    el.style.opacity = '0.85';
    exportToast('Simulación guardada en “Mis simulaciones”');
  }));

  document.querySelectorAll('[data-action="profile-save"]').forEach(el => el.addEventListener('click', async () => {
    saveState();
    if (window.DB && DB.enabled() && window.geoUser) {
      const ok = await DB.profiles.upsert(window.geoUser.id, state.profile);
      exportToast(ok ? 'Perfil guardado en tu cuenta' : 'Guardado en este dispositivo (no se pudo sincronizar)');
    } else {
      exportToast('Cambios de perfil guardados');
    }
  }));
  document.querySelectorAll('[data-action="profile-cancel"]').forEach(el => el.addEventListener('click', () => {
    try {
      const saved = JSON.parse(localStorage.getItem('geolytics-state') || '{}');
      if (saved.profile) state.profile = saved.profile;
    } catch (e) {}
    render();
  }));

  document.querySelectorAll('[data-action="open-search"]').forEach(el => el.addEventListener('click', openSearch));
  if (!window.__searchKeyWired) {
    window.__searchKeyWired = true;
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openSearch();
      }
    });
  }
}

function openSearch() {
  if (document.getElementById('cmd-overlay')) return;
  const PAGES = [
    { id: 'home', label: 'Inicio', icon: 'home' },
    { id: 'scenarios', label: 'Escenarios', icon: 'grid' },
    { id: 'config', label: 'Configuración', icon: 'sliders' },
    { id: 'results', label: 'Resultados', icon: 'bars' },
    { id: 'history', label: 'Mis simulaciones', icon: 'clock' },
    { id: 'compare', label: 'Comparación', icon: 'compare' },
    { id: 'glossary', label: 'Glosario', icon: 'book' },
    { id: 'about', label: 'Acerca de', icon: 'info' },
    { id: 'teachers', label: 'Para docentes', icon: 'sparkle' },
    { id: 'profile', label: 'Perfil', icon: 'home' }
  ];
  const overlay = document.createElement('div');
  overlay.id = 'cmd-overlay';
  overlay.className = 'cmd-overlay';
  overlay.innerHTML = `
    <div class="cmd-box" role="dialog" aria-label="Buscar">
      <div class="cmd-input-row">
        ${icon('search', 16)}
        <input id="cmd-input" class="cmd-input" placeholder="Buscar escenario o sección…" autocomplete="off" spellcheck="false">
        <kbd class="cmd-esc">esc</kbd>
      </div>
      <div class="cmd-results" id="cmd-results"></div>
    </div>`;
  document.body.appendChild(overlay);
  const input = overlay.querySelector('#cmd-input');
  const resultsEl = overlay.querySelector('#cmd-results');
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') { const first = resultsEl.querySelector('.cmd-item'); if (first) first.click(); }
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);

  function renderResults(q) {
    q = (q || '').trim().toLowerCase();
    const match = (s) => !q || (s || '').toLowerCase().includes(q);
    const scen = SCENARIOS.filter(s => match(s.name) || match(s.desc) || match(s.tag));
    const pages = PAGES.filter(p => match(p.label));
    let html = '';
    if (scen.length) {
      html += `<div class="cmd-group">Escenarios</div>` + scen.map(s => `
        <button class="cmd-item" data-cmd-scenario="${s.id}">
          <span class="cmd-glyph">${s.glyph}</span>
          <span class="cmd-item-main"><strong>${s.name}</strong><em>${s.desc || ''}</em></span>
          <span class="cmd-tag">${s.tag || ''}</span>
        </button>`).join('');
    }
    if (pages.length) {
      html += `<div class="cmd-group">Ir a</div>` + pages.map(p => `
        <button class="cmd-item" data-cmd-nav="${p.id}">
          <span class="cmd-glyph cmd-glyph-icon">${icon(p.icon, 15)}</span>
          <span class="cmd-item-main"><strong>${p.label}</strong></span>
        </button>`).join('');
    }
    if (!html) html = `<div class="cmd-empty">Sin resultados para “${q}”</div>`;
    resultsEl.innerHTML = html;
    resultsEl.querySelectorAll('[data-cmd-scenario]').forEach(b => b.addEventListener('click', () => {
      state.selectedScenario = b.getAttribute('data-cmd-scenario');
      state.detailScenario = state.selectedScenario;
      close();
      navigate('detail');
    }));
    resultsEl.querySelectorAll('[data-cmd-nav]').forEach(b => b.addEventListener('click', () => {
      close();
      navigate(b.getAttribute('data-cmd-nav'));
    }));
  }
  input.addEventListener('input', () => renderResults(input.value));
  renderResults('');
  setTimeout(() => input.focus(), 30);
}

function exportFilename(ext) {
  const sc = getScenario(state.selectedScenario);
  const slug = (sc?.name || 'simulacion').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return `geolytics-${slug}-${stamp}.${ext}`;
}

function exportToast(msg) {
  let t = document.getElementById('export-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'export-toast';
    t.className = 'export-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__exportToastTimer);
  window.__exportToastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function ensureHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (window.__h2cPromise) return window.__h2cPromise;
  window.__h2cPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.8/dist/html2canvas-pro.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => reject(new Error('No se pudo cargar html2canvas-pro'));
    document.head.appendChild(s);
  });
  return window.__h2cPromise;
}

function buildExportCard() {
  const sc = getScenario(state.selectedScenario);
  const months = DURATIONS[durIdx(state.duration)];
  const sim = simulate(state.selectedScenario, state.intensity, months);
  const ctry = getCountry(state.country);
  const exInfo = exchangeInfo(state.country);
  const fxDigits = (exInfo.rate != null && exInfo.rate < 100) ? 2 : 0;
  const KPI_BY_VAR = {
    sp500:        [{ key: 'sp500', label: 'S&P 500', unit: '', digits: 0 }],
    usdars:       [{ key: 'usdars', label: exInfo.label, unit: '', digits: fxDigits }],
    commodities:  [{ key: 'wti', label: 'Petróleo WTI', unit: '$', digits: 0 }, { key: 'gold', label: 'Oro (oz)', unit: '$', digits: 0 }],
    inflation:    [{ key: 'inflation', label: 'Inflación', unit: '', digits: 1, pct: true }],
    unemployment: [{ key: 'unemployment', label: 'Desempleo', unit: '', digits: 1, pct: true }]
  };
  const kpis = VARIABLES.filter(v => state.vars[v.id]).flatMap(v => KPI_BY_VAR[v.id] || []);
  const dateStr = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

  const realInflPct = (typeof wbCachedLatest === 'function') ? wbCachedLatest(state.country, WB_INDICATORS.inflation) : null;
  const realGdpVal = (typeof wbCachedLatest === 'function') ? wbCachedLatest(state.country, WB_INDICATORS.gdp) : null;
  const realUnemplPct = (typeof wbCachedLatest === 'function') ? wbCachedLatest(state.country, WB_INDICATORS.unemployment) : null;
  const realMetrics = [];
  if (realGdpVal != null) realMetrics.push(['PIB', fmtGdp(realGdpVal)]);
  if (realInflPct != null) realMetrics.push(['Inflación', realInflPct.toFixed(1) + '%']);
  if (realUnemplPct != null) realMetrics.push(['Desempleo', realUnemplPct.toFixed(1) + '%']);
  const realHTML = realMetrics.length ? `
    <div class="exp-real">
      <div class="exp-real-head">${ctry.flag} Punto de partida · ${ctry.name} <span>Banco Mundial</span></div>
      <div class="exp-real-row">
        ${realMetrics.map(([l, v]) => `<div><span class="exp-real-l">${l}</span><span class="exp-real-v">${v}</span></div>`).join('')}
      </div>
    </div>` : '';

  const ref = sc.reference;
  let histHTML = '';
  if (ref && typeof wbValueAtYear === 'function') {
    const gAt = wbValueAtYear(state.country, WB_INDICATORS.gdpGrowth, ref.year);
    const uAt = wbValueAtYear(state.country, WB_INDICATORS.unemployment, ref.year);
    const iAt = wbValueAtYear(state.country, WB_INDICATORS.inflation, ref.year);
    const hm = [];
    if (gAt != null) hm.push(['Crec. PIB', (gAt >= 0 ? '+' : '') + gAt.toFixed(1) + '%', gAt < 0 ? 'neg' : 'pos']);
    if (uAt != null) hm.push(['Desempleo', uAt.toFixed(1) + '%', '']);
    if (iAt != null) hm.push(['Inflación', iAt.toFixed(1) + '%', iAt > 10 ? 'neg' : '']);
    if (hm.length) {
      histHTML = `
        <div class="exp-hist">
          <div class="exp-real-head">Respaldo histórico · ${ref.name} <span>${ref.year}</span></div>
          <div class="exp-real-row">
            ${hm.map(([l, v, c]) => `<div><span class="exp-real-l">${l} ${ref.year}</span><span class="exp-real-v ${c}">${v}</span></div>`).join('')}
          </div>
        </div>`;
    }
  }

  const kpiHTML = kpis.length ? kpis.map(k => {
    const s = sim[k.key];
    const pos = s.delta >= 0;
    const valStr = k.pct ? fmtNum(s.final * 100, 1) + '%' : (k.unit || '') + fmtNum(s.final, k.digits);
    return `<div class="exp-kpi">
      <div class="exp-kpi-l">${k.label}</div>
      <div class="exp-kpi-v">${valStr}</div>
      <div class="exp-kpi-d ${pos ? 'pos' : 'neg'}">${pos ? '▲' : '▼'} ${fmtPct(s.delta)}</div>
    </div>`;
  }).join('') : `<div class="exp-kpi" style="grid-column:1/-1;"><div class="exp-kpi-l">Sin variables seleccionadas</div></div>`;

  const node = document.createElement('div');
  node.className = 'export-card';
  node.innerHTML = `
    <div class="exp-top">
      <div class="exp-brand"><div class="brand-mark" style="width:30px;height:30px;">${brandLogo(18)}</div><span>Geolytics</span></div>
      <div class="exp-date">${dateStr}</div>
    </div>
    <div class="exp-eyebrow">Resumen de simulación</div>
    <div class="exp-title">${sc.glyph} ${sc.name}</div>
    <div class="exp-pills">
      <span class="exp-pill exp-pill-brand">${sc.tag}</span>
      <span class="exp-pill">Intensidad: ${intensityLabel(state.intensity)}</span>
      <span class="exp-pill">Duración: ${months} meses</span>
      <span class="exp-pill">${ctry.flag} ${ctry.name}</span>
    </div>
    <div class="exp-kpis" style="grid-template-columns:repeat(${Math.min(3, Math.max(1, kpis.length || 1))}, 1fr);">
      ${kpiHTML}
    </div>
    ${realHTML}
    ${histHTML}
    <div class="exp-foot">Generado con Geolytics · Proyección educativa, no constituye asesoramiento financiero.</div>
  `;
  return node;
}

async function exportResultsImage(format) {
  exportToast('Generando imagen…');
  let h2c;
  try { h2c = await ensureHtml2Canvas(); }
  catch (e) { exportToast('No se pudo cargar el exportador (¿sin conexión?)'); return; }

  const card = buildExportCard();
  card.style.position = 'fixed';
  card.style.left = '-10000px';
  card.style.top = '0';
  card.style.pointerEvents = 'none';
  document.body.appendChild(card);
  const bg = (getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#ffffff').trim();

  try {
    const canvas = await h2c(card, {
      backgroundColor: bg,
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'png' ? undefined : 0.95;
    const url = canvas.toDataURL(mime, quality);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename(format);
    document.body.appendChild(a);
    a.click();
    a.remove();
    exportToast(`Imagen ${format.toUpperCase()} descargada`);
  } catch (e) {
    console.warn('[Geolytics] Falló la exportación de imagen:', e);
    exportToast('No se pudo generar la imagen');
  } finally {
    card.remove();
  }
}

function exportResultsPDF() {
  document.body.classList.add('printing-results');
  exportToast('Abriendo diálogo de impresión → elegí “Guardar como PDF”');
  const cleanup = () => {
    document.body.classList.remove('printing-results');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => { window.print(); }, 60);
  setTimeout(cleanup, 1500);
}

const THEMES = [
  { id: 'forest',  label: 'FRST', color: '#0F3D2E', accent: '#C4703B' },
  { id: 'midnight',label: 'NIGT', color: '#151A21', accent: '#347C58' }
];

function renderTweaks() {
  const cont = document.getElementById('tw-themes');
  if (!cont) return;
  cont.innerHTML = THEMES.map(t => `
    <div class="tw-swatch ${TWEAKS.theme === t.id ? 'on' : ''}" data-theme-pick="${t.id}"
      style="background:linear-gradient(135deg, ${t.color} 0%, ${t.color} 55%, ${t.accent} 55%, ${t.accent} 100%); color:#fff;">
      <span>${t.label}</span>
    </div>
  `).join('');
  cont.querySelectorAll('[data-theme-pick]').forEach(el => {
    el.addEventListener('click', () => {
      TWEAKS.theme = el.getAttribute('data-theme-pick');
      try {
        localStorage.setItem('geolytics-theme', TWEAKS.theme);
        if (TWEAKS.theme !== 'midnight') localStorage.setItem('geolytics-theme-light', TWEAKS.theme);
      } catch (e) {}
      applyTheme();
      renderTweaks();
      persistTweaks({ theme: TWEAKS.theme });
      document.querySelectorAll('[data-action="toggle-dark"]').forEach(b => { b.innerHTML = icon(TWEAKS.theme === 'midnight' ? 'sun' : 'moon', 15); });
    });
  });
  document.getElementById('tw-grid').classList.toggle('on', TWEAKS.showGrid);
  document.getElementById('tw-density').classList.toggle('on', TWEAKS.density === 'compact');
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', TWEAKS.theme);
  document.body.setAttribute('data-grid', TWEAKS.showGrid ? 'on' : 'off');
  document.body.setAttribute('data-density', TWEAKS.density);
}

function activeTheme() {
  try { return localStorage.getItem('geolytics-theme') || TWEAKS.theme; }
  catch (e) { return TWEAKS.theme; }
}
function isDark() { return activeTheme() === 'midnight'; }
function setTheme(t) {
  TWEAKS.theme = t;
  try {
    localStorage.setItem('geolytics-theme', t);
    if (t !== 'midnight') localStorage.setItem('geolytics-theme-light', t);
  } catch (e) {}
  applyTheme();
  document.querySelectorAll('[data-action="toggle-dark"]').forEach(b => { b.innerHTML = icon(t === 'midnight' ? 'sun' : 'moon', 15); });
  if (document.getElementById('tw-themes')) renderTweaks();
}
function toggleDark() {
  if (isDark()) {
    var light = 'forest';
    try { light = localStorage.getItem('geolytics-theme-light') || 'forest'; } catch (e) {}
    setTheme(light);
  } else {
    setTheme('midnight');
  }
}

function toggleGrid() {
  TWEAKS.showGrid = !TWEAKS.showGrid;
  applyTheme();
  renderTweaks();
  persistTweaks({ showGrid: TWEAKS.showGrid });
}
function toggleDensity() {
  TWEAKS.density = TWEAKS.density === 'compact' ? 'comfortable' : 'compact';
  applyTheme();
  renderTweaks();
  persistTweaks({ density: TWEAKS.density });
}
function closeTweaks() {
  document.getElementById('tweaks').classList.remove('on');
  window.parent.postMessage({ type: '__deactivate_edit_mode' }, '*');
}
function persistTweaks(partial) {
  window.parent.postMessage({ type: '__edit_mode_set_keys', edits: partial }, '*');
}

window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === '__activate_edit_mode') {
    document.getElementById('tweaks').classList.add('on');
    renderTweaks();
  }
  if (e.data.type === '__deactivate_edit_mode') {
    document.getElementById('tweaks').classList.remove('on');
  }
});

function boot() {
  if (!window.__INITIAL_SCREEN) {
    try {
      const saved = localStorage.getItem('geolytics.screen');
      if (saved && TITLES[saved]) state.screen = saved;
    } catch(e) {}
  } else {
    try { localStorage.removeItem('geolytics.screen'); } catch(e) {}
  }
  if (window.initExtraState) window.initExtraState();
  try { var __st = localStorage.getItem('geolytics-theme'); if (__st) TWEAKS.theme = __st; } catch (e) {}
  applyTheme();
  window.__gateBounced = false;
  if (window.SUPABASE_ENABLED && !hasSupabaseSession()
      && !new Set(['login', 'forgot']).has(state.screen)) {
    window.__intendedScreen = state.screen;
    state.screen = 'login';
    window.__gateBounced = true;
  }
  render();
  bootstrapSession();
  try { history.replaceState({ screen: state.screen }, '', location.pathname.split('/').pop() || undefined); } catch (e) {}
  if (state.screen === 'loading') {
    setTimeout(() => { if (state.screen === 'loading') navigate('results'); }, 1500);
  }
  setTimeout(() => {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  }, 100);
}

function isOnboarded(u) {
  if (u && u.user_metadata && u.user_metadata.onboarded) return true;
  try { return !!(u && localStorage.getItem('geolytics-onb-' + u.id) === '1'); } catch (e) { return false; }
}
function markOnboarded() {
  try { if (window.geoUser) localStorage.setItem('geolytics-onb-' + window.geoUser.id, '1'); } catch (e) {}
  if (window.geoUser && window.geoUser.user_metadata) window.geoUser.user_metadata.onboarded = true;
  if (window.DB && DB.auth && DB.auth.markOnboarded) DB.auth.markOnboarded();
}

function hasSupabaseSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('-auth-token') !== -1) {
        const v = localStorage.getItem(k);
        if (v && v.length > 20) return true;
      }
    }
  } catch (e) {}
  return false;
}

function homeUrl() {
  const parts = location.pathname.split('/');
  parts[parts.length - 1] = '';
  return location.origin + parts.join('/');
}

function applyAuthUser(user) {
  window.geoUser = user || null;
  if (!user) return;
  const m = user.user_metadata || {};
  const full = (m.full_name || m.name || '').trim();
  const parts = full ? full.split(/\s+/) : [];
  const emailName = (user.email || '').split('@')[0];
  state.profile = Object.assign({}, state.profile, {
    first: m.first || parts[0] || emailName || state.profile.first,
    last: m.last || parts.slice(1).join(' ') || state.profile.last,
    email: user.email || m.email || state.profile.email,
    occupation: m.occupation || state.profile.occupation,
    avatar: m.avatar_url || m.picture || state.profile.avatar || ''
  });
}

async function loadProfile(uid) {
  if (!uid || !window.DB) return;
  try {
    const row = await DB.profiles.get(uid);
    if (row) {
      state.profile = Object.assign({}, state.profile, {
        first: row.first || state.profile.first,
        last: row.last || state.profile.last,
        email: row.email || state.profile.email,
        occupation: row.occupation || state.profile.occupation,
        interests: Array.isArray(row.interests) ? row.interests : state.profile.interests,
        avatar: row.avatar || state.profile.avatar || ''
      });
    }
  } catch (e) {}
}

async function bootstrapSession() {
  if (!window.DB || !DB.enabled()) { bootstrapSupabase(); return; }
  const user = await DB.auth.getUser();
  if (user) {
    applyAuthUser(user);
    await loadProfile(user.id);
    if (!isOnboarded(user)) {
      state.onboardingStep = 1;
      navigate('onboarding');
    } else if (window.__gateBounced && new Set(['login', 'forgot']).has(state.screen)) {
      navigate(window.__intendedScreen || 'home');
    } else {
      renderAsync();
    }
  } else if (!new Set(['login', 'forgot']).has(state.screen)) {
    navigate('login');
  }
  DB.auth.onChange(async (u) => {
    const prevId = window.geoUser && window.geoUser.id;
    const newId = u && u.id;
    if (prevId === newId) { window.geoUser = u || null; return; }
    const wasLogged = !!prevId;
    applyAuthUser(u);
    if (u) await loadProfile(u.id);
    renderAsync();
    bootstrapSupabase();
    if (!wasLogged && u && state.screen === 'login') {
      state.onboardingStep = 1;
      navigate(isOnboarded(u) ? 'home' : 'onboarding');
    }
    if (wasLogged && !u) navigate('login');
  });
  await bootstrapSupabase();
}

async function bootstrapSupabase() {
  if (!window.DB || !DB.enabled()) return;
  let changed = false;
  try {
    const scen = await DB.scenarios.list();
    if (scen && scen.length) {
      scen.forEach(remote => {
        const local = SCENARIOS.find(s => s.id === remote.id);
        if (local) {
          Object.keys(remote).forEach(k => { if (remote[k] != null) local[k] = remote[k]; });
        } else {
          SCENARIOS.push(remote);
        }
      });
      changed = true;
    }
  } catch (e) {}
  try {
    const sims = await DB.simulations.list();
    if (sims) {  // [] cuando no hay filas; null solo si falló la consulta
      if (window.geoUser || sims.length) { state.history = sims; changed = true; }
    }
  } catch (e) {}
  if (changed) renderAsync();
}

boot();