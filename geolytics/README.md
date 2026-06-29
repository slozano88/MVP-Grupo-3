# Geolytics

Plataforma educativa de simulación económica. Transforma eventos globales —crisis, guerras, pandemias— en escenarios interactivos y explicables: elegís un escenario, ajustás intensidad, duración y país, y observás cómo se mueven los mercados, el dólar, los commodities y el empleo.

Web pura (HTML + CSS + JavaScript, sin frameworks ni build), datos reales de la API del Banco Mundial y persistencia en Supabase con respaldo en `localStorage`.

## Estructura

```text
geolytics-repo/
├── index.html              # punto de entrada (redirige a la app / captura OAuth)
├── *.html                  # pantallas de la app
├── styles.css              # hoja de estilos única (tokens + componentes + temas claro/oscuro)
├── assets/                 # logos e imágenes
└── js/
    ├── common/             # núcleo compartido
    │   ├── core.js             # estado, ruteo, chrome, tweaks y boot()
    │   ├── data.js             # escenarios, países, simulate() y API Banco Mundial
    │   ├── supabase-config.js  # configuración de Supabase
    │   └── supabase-data.js    # capa de datos (auth, perfiles, simulaciones)
    ├── acceso/             # login, registro, recuperación, onboarding, loading
    │   └── screens-acceso.js
    ├── simulaciones/       # escenarios, resultados, comparar, exportar
    │   └── screens-simulacion.js
    ├── geolytics/          # inicio, detalle, historial, acerca, glosario
    │   └── screens-inicio.js
    └── administracion/     # perfil, configuración, docentes, aula, institución
        └── screens-cuenta.js
```

## Orden de carga

Todos los HTML cargan los scripts en este orden (importa):

```text
supabase (CDN) → js/common/supabase-config.js → js/common/supabase-data.js →
js/common/data.js → js/acceso/… → js/simulaciones/… → js/geolytics/… →
js/administracion/… → js/common/core.js   (core va ÚLTIMO: llama a boot())
```

## Datos y metodología

Cada simulación parte de indicadores oficiales del Banco Mundial (PIB, inflación, desempleo, tipo de cambio, deuda) para el país elegido, y sobre esa base aplica el shock del escenario usando relaciones económicas conocidas. Prioriza la **coherencia** antes que la predicción. Los datos se cachean 24 h en el navegador.

- **6** escenarios base · **12** variables observables · **8** países con datos reales
- `simulate()` proyecta cada variable en el tiempo con curvas propias por indicador (retardo, rampa y rebote distintos).

## Cómo correrlo

Abrir `index.html` con cualquier servidor estático (o el deploy de Netlify). No requiere build ni dependencias.

https://geolytics.netlify.app