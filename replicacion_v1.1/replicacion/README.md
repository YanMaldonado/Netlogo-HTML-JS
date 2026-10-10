# Replication package (v1.1)

- model.js: simulation engine ported from roya_cafe_simulacion_v1.1.html (Math.random -> seeded Mulberry32). `variant='manuscript'` = v1.1 (Eq. 1); `'released'` = v1.0 for comparison.
- experiment.js: `node experiment.js manuscript 100` -> Table 7 (results_manuscript_100.json, replicates_manuscript_100.csv). Seeds: 1000*s + r.
- conv.js: convergence check (25-500 replicates; Supplementary S2).
- series.js + fig4.py: Fig. 4.
- bench.js: browser benchmark (Table 8); requires playwright and chart.js 4.4.1, run next to sim.html (= v1.1 HTML).
