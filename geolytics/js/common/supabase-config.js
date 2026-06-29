// ============================================================
// GEOLYTICS — Configuración de Supabase
// ------------------------------------------------------------
// CÓMO CONECTAR (3 pasos):
//   1) Creá un proyecto gratis en https://supabase.com
//   2) Andá a  Project Settings → API  y copiá:
//        • Project URL   → pegala en `url`
//        • anon / public key → pegala en `anonKey`
//   3) En el editor SQL de Supabase, corré el archivo `supabase-schema.sql`
//      (crea las tablas `scenarios` y `simulations` + las políticas).
//
// Mientras `url` y `anonKey` estén en blanco, Geolytics funciona igual
// usando localStorage (modo offline). No se rompe nada.
// ============================================================

window.SUPABASE_CONFIG = {
  url: 'https://goyslzvikweskyifxatt.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveXNsenZpa3dlc2t5aWZ4YXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjg3MTIsImV4cCI6MjA5Njk0NDcxMn0.dgFTGgHYTeSfCUc4Vk6ykSyqLXOJAD07K1ynzcDMYmU',
};

// ---- Inicialización del cliente (solo si hay credenciales + librería) ----
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

// ---- Identidad anónima del dispositivo (sin login) ----
// Cada navegador recibe un client_id estable para asociar SUS simulaciones,
// sin necesitar autenticación. Se guarda en localStorage.
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
