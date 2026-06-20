// ============================================================
// PERSONA 3 — Glosario
// Archivo suelto asignado a P3 por coherencia con navegación educativa.
// ============================================================

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
