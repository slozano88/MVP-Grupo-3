// Genera la pantalla de carga inicial
// Es la pantalla que se muestra mientras el sistema procesa la simulación configurada
function loadingHTML() {
  // Obtiene el escenario seleccionado por el usuario
  const sc = getScenario(state.selectedScenario);

  // Calcula la duración configurada en meses
  const months = DURATIONS[durIdx(state.duration)];

  return `
    <section class="screen active loading-screen" data-screen-label="Loading">
      <div class="loading-wrap">

        // Animación principal
        <div class="loading-spinner">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="26" stroke="var(--line)" stroke-width="3" fill="none"/>
            <circle cx="32" cy="32" r="26" stroke="var(--brand)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="40 200" transform="rotate(-90 32 32)">
              <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="1.2s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>

        // Texto principal de estado
        <div class="eyebrow" style="margin-top:22px;">Procesando</div>
        <h2 class="loading-title">Simulando escenario...</h2>

        // Resumen de la simulación que se esta procesando
        <p class="loading-sub">
          Estamos calculando el impacto de <strong>${sc.name}</strong>
          con intensidad <strong>${intensityLabel(state.intensity).toLowerCase()}</strong>
          durante <strong>${months} meses</strong>.
        </p>

        // Barra de progresp
        <div class="loading-progress">
          <div class="loading-progress-fill"></div>
        </div>

        // Mensajes del proceso de la simulación
        <div class="loading-log" id="loading-log">
          <div class="loading-log-line">› Cargando baseline macro...</div>
          <div class="loading-log-line">› Aplicando factor de intensidad (${intensityLabel(state.intensity)})...</div>
          <div class="loading-log-line">› Propagando shock a variables observadas...</div>
          <div class="loading-log-line">› Generando explicación causal...</div>
        </div>

        // Parámetros principales usados para ejecutar la simulación
        <div class="loading-params">
          <div class="loading-param">
            <div class="loading-param-l">Escenario</div>
            <div class="loading-param-v">${sc.glyph} ${sc.name}</div>
          </div>

          <div class="loading-param">
            <div class="loading-param-l">Intensidad</div>
            <div class="loading-param-v">${intensityLabel(state.intensity)}</div>
          </div>

          <div class="loading-param">
            <div class="loading-param-l">Duración</div>
            <div class="loading-param-v">${months} meses</div>
          </div>
        </div>
      </div>
    </section>
  `;
}
