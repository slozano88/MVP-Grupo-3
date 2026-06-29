// ============================================================
// PERSONA 4 — Aula e institución
// Archivos sueltos asignados a P4 por coherencia con docentes/configuración.
// ============================================================

function aulaHTML() {
  const alumnos = [
    { n: 'Sofía Giménez',   ini: 'SG', sims: 6, last: 'Pandemia',          when: 'hace 2 h', on: true },
    { n: 'Mateo Ruiz',      ini: 'MR', sims: 4, last: 'Crisis económica',  when: 'hace 5 h', on: true },
    { n: 'Valentina López', ini: 'VL', sims: 8, last: 'Conflicto intern.', when: 'ayer',     on: true },
    { n: 'Tomás Herrera',   ini: 'TH', sims: 3, last: 'Suba de tasas',     when: 'ayer',     on: false },
    { n: 'Camila Sosa',     ini: 'CS', sims: 5, last: 'Guerra comercial',  when: 'hace 2 d', on: false },
    { n: 'Benjamín Díaz',   ini: 'BD', sims: 2, last: 'Petróleo',          when: 'hace 3 d', on: false }
  ];
  const kpis = [['Alumnos', '28', ''], ['Simulaciones', '64', ''], ['Escenario top', 'Pandemia', 'font-size:22px;'], ['Prom. / alumno', '2,3', '']];
  const row = (a) => `
    <div style="display:flex; align-items:center; gap:14px; padding:13px 0; border-top:1px solid var(--line);">
      <div style="flex-shrink:0; width:36px; height:36px; border-radius:50%; background:var(--brand); color:var(--brand-ink); display:grid; place-items:center; font-family:var(--font-mono); font-size:12px; font-weight:600;">${a.ini}</div>
      <div style="flex:1; min-width:0;">
        <div style="font-size:14px; font-weight:600;">${a.n}</div>
        <div style="font-size:12px; color:var(--muted);">Última: ${a.last} · ${a.when}</div>
      </div>
      <div style="font-family:var(--font-mono); font-size:13px; color:var(--ink-2); flex-shrink:0;">${a.sims} sim.</div>
      <span title="${a.on ? 'Activo' : 'Inactivo'}" style="flex-shrink:0; width:8px; height:8px; border-radius:50%; background:${a.on ? 'var(--pos)' : 'var(--line)'};"></span>
    </div>`;
  return `
    <section class="screen active" data-screen-label="Aula">
      <div class="page-head">
        <div>
          <div class="eyebrow">Aula</div>
          <h2 class="page-title" style="margin-top:6px;">Economía · 5.º B</h2>
          <p class="page-sub">Panel del aula: seguí la actividad de tus alumnos y sus simulaciones.</p>
        </div>
        <button class="btn btn-ghost btn-sm" data-nav="teachers">${icon('arrowL', 14)} Volver</button>
      </div>

      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:22px;">
        <div style="display:flex; align-items:center; gap:10px; background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:10px 14px;">
          <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted);">Código de acceso</span>
          <strong style="font-family:var(--font-mono); font-size:16px; letter-spacing:0.08em;">GEO-5B</strong>
        </div>
        <button class="btn btn-ghost btn-sm">${icon('copy', 14)} Copiar código</button>
        <button class="btn btn-primary btn-sm" onclick="openInvite()">${icon('userPlus', 14)} Invitar alumnos</button>
      </div>

      <div class="kpi-grid">
        ${kpis.map(([l, v, st]) => `
          <div class="kpi">
            <div class="kpi-label">${l}</div>
            <div class="kpi-value" style="${st}">${v}</div>
          </div>`).join('')}
      </div>

      <div class="card card-pad">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2px;">
          <h3 style="font-family:var(--font-display); font-size:17px; font-weight:700;">Alumnos</h3>
          <span style="font-size:12px; color:var(--muted);">28 en total · mostrando 6</span>
        </div>
        ${alumnos.map(row).join('')}
      </div>

      <div id="invite-modal" onclick="if(event.target===this)closeInvite()" style="display:none; position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.45); align-items:center; justify-content:center; padding:20px;">
        <div style="background:var(--surface); border:1px solid var(--line); border-radius:18px; box-shadow:0 24px 70px rgba(0,0,0,0.3); width:100%; max-width:440px; padding:28px;">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
            <div>
              <h3 style="font-family:var(--font-display); font-size:20px; font-weight:800;">Invitar alumnos</h3>
              <p style="font-size:13px; color:var(--muted); margin-top:4px; line-height:1.5;">Compartí el código o el enlace para que se sumen a <strong>Economía · 5.º B</strong>.</p>
            </div>
            <button onclick="closeInvite()" class="icon-btn" style="flex-shrink:0;" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style="margin-top:20px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Código del aula</div>
            <div style="display:flex; gap:8px;">
              <div style="flex:1; display:flex; align-items:center; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font-family:var(--font-mono); font-size:17px; letter-spacing:0.1em; font-weight:600;">GEO-5B</div>
              <button class="btn btn-ghost" onclick="copyInvite(this,'GEO-5B')">${icon('copy', 14)} Copiar</button>
            </div>
          </div>
          <div style="margin-top:16px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Enlace de invitación</div>
            <div style="display:flex; gap:8px;">
              <div style="flex:1; min-width:0; display:flex; align-items:center; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font-size:13px; color:var(--ink-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">geolytics.app/aula/GEO-5B</div>
              <button class="btn btn-ghost" onclick="copyInvite(this,'geolytics.app/aula/GEO-5B')">${icon('copy', 14)} Copiar</button>
            </div>
          </div>
          <div style="margin-top:16px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Invitar por email</div>
            <div style="display:flex; gap:8px;">
              <input type="email" placeholder="alumno@email.com" style="flex:1; min-width:0; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font:inherit; font-size:13px; color:var(--ink);">
              <button class="btn btn-primary" onclick="closeInvite()">Enviar</button>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function openInviteDocente()  { const m = document.getElementById('invite-teacher-modal'); if (m) m.style.display = 'flex'; }

function closeInviteDocente() { const m = document.getElementById('invite-teacher-modal'); if (m) m.style.display = 'none'; }

function institucionHTML() {
  const aulas = [
    { name: 'Economía · 5.º B',    teacher: 'M. Torres',    al: 28, sims: 64, act: 0.92 },
    { name: 'Economía · 5.º A',    teacher: 'J. Pereyra',   al: 26, sims: 41, act: 0.60 },
    { name: 'Cs. Sociales · 4.º',  teacher: 'L. Fernández', al: 31, sims: 38, act: 0.54 },
    { name: 'Geografía · 6.º',     teacher: 'R. Acosta',    al: 24, sims: 52, act: 0.78 },
    { name: 'Economía · 6.º C',    teacher: 'P. Molina',    al: 22, sims: 19, act: 0.28 }
  ];
  const kpis = [['Docentes', '12'], ['Aulas', '18'], ['Alumnos', '430'], ['Simulaciones', '1.240']];
  const row = (a) => `
    <div style="display:flex; align-items:center; gap:16px; padding:14px 0; border-top:1px solid var(--line);">
      <div style="flex:1; min-width:0;">
        <div style="font-size:14px; font-weight:600;">${a.name}</div>
        <div style="font-size:12px; color:var(--muted);">${a.teacher} · ${a.al} alumnos</div>
      </div>
      <div style="width:110px; flex-shrink:0;" title="Actividad ${Math.round(a.act * 100)}%">
        <div style="height:6px; background:var(--line); border-radius:3px; overflow:hidden;">
          <div style="height:100%; width:${Math.round(a.act * 100)}%; background:var(--brand);"></div>
        </div>
      </div>
      <div style="font-family:var(--font-mono); font-size:13px; color:var(--ink-2); flex-shrink:0; width:62px; text-align:right;">${a.sims} sim.</div>
    </div>`;
  return `
    <section class="screen active" data-screen-label="Institucion">
      <div class="page-head">
        <div>
          <div class="eyebrow">Institución</div>
          <h2 class="page-title" style="margin-top:6px;">Colegio San Martín</h2>
          <p class="page-sub">Panel institucional: todas las aulas y docentes en un mismo lugar.</p>
        </div>
        <button class="btn btn-ghost btn-sm" data-nav="teachers">${icon('arrowL', 14)} Volver</button>
      </div>

      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:22px;">
        <span class="pill pill-accent">Plan Institución · activo</span>
        <button class="btn btn-primary btn-sm" onclick="openInviteDocente()">${icon('userPlus', 14)} Invitar docente</button>
      </div>

      <div class="kpi-grid">
        ${kpis.map(([l, v]) => `
          <div class="kpi">
            <div class="kpi-label">${l}</div>
            <div class="kpi-value">${v}</div>
          </div>`).join('')}
      </div>

      <div class="card card-pad">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2px;">
          <h3 style="font-family:var(--font-display); font-size:17px; font-weight:700;">Aulas</h3>
          <span style="font-size:12px; color:var(--muted);">18 aulas · mostrando 5</span>
        </div>
        ${aulas.map(row).join('')}
      </div>

      <div id="invite-teacher-modal" onclick="if(event.target===this)closeInviteDocente()" style="display:none; position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.45); align-items:center; justify-content:center; padding:20px;">
        <div style="background:var(--surface); border:1px solid var(--line); border-radius:18px; box-shadow:0 24px 70px rgba(0,0,0,0.3); width:100%; max-width:440px; padding:28px;">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
            <div>
              <h3 style="font-family:var(--font-display); font-size:20px; font-weight:800;">Invitar docente</h3>
              <p style="font-size:13px; color:var(--muted); margin-top:4px; line-height:1.5;">Sumá a un docente a <strong>Colegio San Martín</strong> para que cree sus propias aulas.</p>
            </div>
            <button onclick="closeInviteDocente()" class="icon-btn" style="flex-shrink:0;" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style="margin-top:20px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Email del docente</div>
            <input type="email" placeholder="docente@colegio.edu" style="width:100%; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font:inherit; font-size:13px; color:var(--ink);">
          </div>
          <div style="margin-top:16px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Rol</div>
            <select style="width:100%; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font:inherit; font-size:13px; color:var(--ink); cursor:pointer;">
              <option>Docente</option>
              <option>Coordinador/a</option>
            </select>
          </div>
          <div style="margin-top:16px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:7px;">Enlace de invitación</div>
            <div style="display:flex; gap:8px;">
              <div style="flex:1; min-width:0; display:flex; align-items:center; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 14px; font-size:13px; color:var(--ink-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">geolytics.app/inst/SANMARTIN</div>
              <button class="btn btn-ghost" onclick="copyInvite(this,'geolytics.app/inst/SANMARTIN')">${icon('copy', 14)} Copiar</button>
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%; justify-content:center; margin-top:22px;" onclick="closeInviteDocente()">Enviar invitación</button>
        </div>
      </div>
    </section>`;
}

