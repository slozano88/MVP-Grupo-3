// ============================================================
// GEOLYTICS — Capa de datos (Supabase + fallback localStorage)
// ------------------------------------------------------------
// Expone window.DB con dos dominios:
//   DB.scenarios.list()            → catálogo de escenarios (o null si falla)
//   DB.simulations.list()          → historial del dispositivo (o null si falla)
//   DB.simulations.add(rec)        → inserta una simulación
//   DB.simulations.setSaved(id,b)  → marca/desmarca favorito
//   DB.simulations.remove(id)      → borra una simulación
//
// Todas devuelven false/null cuando Supabase no está activo o falla, para que
// app.js pueda caer a localStorage sin romperse. NUNCA tiran excepción.
// ============================================================

(function () {
  var TABLE_SIMS = 'simulations';
  var TABLE_SCEN = 'scenarios';

  var sb = function () { return window.supabaseClient; };
  var enabled = function () { return !!(window.SUPABASE_ENABLED && sb()); };
  // Identidad de las filas: el login es OBLIGATORIO (Google), así que siempre
  // usamos el id estable del usuario de Supabase. Sin sesión no se toca la DB.
  var uid = function () {
    return (window.geoUser && window.geoUser.id) || null;
  };

  // ---- Escenarios (catálogo) ----
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

  // ---- Simulaciones (historial del dispositivo) ----
  async function simsList() {
    if (!enabled() || !uid()) return null;
    try {
      var res = await sb()
        .from(TABLE_SIMS)
        .select('*')
        .eq('user_id', uid())
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
    if (!enabled() || !uid()) return false;
    try {
      var res = await sb().from(TABLE_SIMS).insert({
        user_id: uid(),
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
    if (!enabled() || !uid()) return false;
    try {
      var res = await sb()
        .from(TABLE_SIMS)
        .update({ saved: saved })
        .eq('user_id', uid())
        .eq('sim_id', id);
      if (res.error) throw res.error;
      return true;
    } catch (e) {
      console.warn('[Geolytics] No se pudo actualizar el favorito en Supabase:', e.message || e);
      return false;
    }
  }

  async function simsRemove(id) {
    if (!enabled() || !uid()) return false;
    try {
      var res = await sb()
        .from(TABLE_SIMS)
        .delete()
        .eq('user_id', uid())
        .eq('sim_id', id);
      if (res.error) throw res.error;
      return true;
    } catch (e) {
      console.warn('[Geolytics] No se pudo borrar la simulación en Supabase:', e.message || e);
      return false;
    }
  }

  // ---- Auth (Google OAuth vía Supabase) ----
  // Redirige TODA la pestaña a Google y vuelve a `redirectTo`. El cliente de
  // Supabase detecta el token en la URL al volver (detectSessionInUrl) y deja
  // la sesión persistida en localStorage. No tira excepción nunca.
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

  // Registro con email + contraseña. `meta` va a user_metadata (nombre, rol…).
  // Si en Supabase está desactivado "Confirm email", devuelve sesión al toque.
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

  // Marca al usuario como "ya vio el onboarding" en sus metadatos. Como vive en
  // la cuenta (no en el dispositivo), el onboarding NO se repite al entrar desde
  // otra computadora con la misma cuenta.
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

  // Notifica cambios de sesión (login/logout/refresh de token).
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

  // ---- Perfil del usuario (tabla `profiles`, atada a auth.uid()) ----
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
