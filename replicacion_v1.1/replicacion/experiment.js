'use strict';
const { run, inhibicion } = require('./model');
const fs = require('fs');
const variant = process.argv[2] || 'manuscript';
const N = parseInt(process.argv[3] || '100');

const base = { temp: 21, hr: 85, lluvia: 8, umbral: 2, sombra: 40, inoculo: 30, duracion: 365, fung: false, efic: 70 };
const scen = [
  ['S1 Favorable', {}],
  ['S2 High temperature', { temp: 31 }],
  ['S3 Dry season', { temp: 26, hr: 65, lluvia: 0 }],
  ['S4 Dense shade', { sombra: 80 }],
  ['S5 Fungicide', { fung: true }],
  ['S6 Dense shade + fungicide', { sombra: 80, fung: true }],
];

function stats(a) {
  const s = [...a].sort((x, y) => x - y), n = s.length;
  const mean = a.reduce((x, y) => x + y, 0) / n;
  const sd = Math.sqrt(a.reduce((x, y) => x + (y - mean) ** 2, 0) / (n - 1));
  const q = p => { const i = (n - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
  // percentile bootstrap CI of mean, fixed seed
  let st = 12345; const rnd = () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
  const bm = []; for (let b = 0; b < 2000; b++) { let t = 0; for (let k = 0; k < n; k++) t += a[Math.floor(rnd() * n)]; bm.push(t / n); }
  bm.sort((x, y) => x - y);
  return { mean, sd, median: q(.5), q1: q(.25), q3: q(.75), lo: bm[49], hi: bm[1949], min: s[0], max: s[n - 1] };
}

const out = [];
const rows = [];
scen.forEach(([name, mod], si) => {
  const p = { ...base, ...mod };
  const m = { peak: [], peakDay: [], mean: [], final: [], above25: [], extinct: [], rec: [] };
  for (let r = 0; r < N; r++) {
    const seed = 1000 * (si + 1) + r;
    const { inf, esp, rec } = run(p, seed, variant);
    let pk = 0, pd = 0; inf.forEach((v, i) => { if (v > pk) { pk = v; pd = i + 1; } });
    m.peak.push(pk * 100); m.peakDay.push(pd);
    m.mean.push(inf.reduce((x, y) => x + y, 0) / inf.length * 100);
    m.final.push(inf[inf.length - 1] * 100);
    m.above25.push(inf.filter(v => v > 0.25).length);
    m.extinct.push(inf[inf.length - 1] === 0 && esp[esp.length - 1] === 0 ? 1 : 0);
    m.rec.push(rec[rec.length - 1] * 100);
    rows.push([name, seed, (pk * 100).toFixed(2), pd, (m.mean.at(-1)).toFixed(2), (inf.at(-1) * 100).toFixed(2), m.above25.at(-1), m.extinct.at(-1)].join(','));
  }
  const res = { scenario: name, params: p, inhibition: inhibicion(p), N };
  for (const k of Object.keys(m)) res[k] = stats(m[k]);
  res.extinctPct = m.extinct.reduce((a, b) => a + b, 0) / N * 100;
  out.push(res);
});
fs.writeFileSync(`results_${variant}_${N}.json`, JSON.stringify(out, null, 1));
fs.writeFileSync(`replicates_${variant}_${N}.csv`, 'scenario,seed,peak_pct,peak_day,mean_inf_pct,final_inf_pct,days_above_25,extinct\n' + rows.join('\n'));
const f = (s, d = 1) => `${s.mean.toFixed(d)} ± ${s.sd.toFixed(d)} [${s.lo.toFixed(d)}, ${s.hi.toFixed(d)}]`;
for (const r of out) console.log(r.scenario.padEnd(28), 'inh', r.inhibition.toFixed(2), '| peak', f(r.peak), '| med', r.peak.median.toFixed(1), `(${r.peak.q1.toFixed(1)}–${r.peak.q3.toFixed(1)})`, '| day', f(r.peakDay, 0), '| meanInf', f(r.mean), '| final', f(r.final), '| >25%', f(r.above25, 0), '| ext%', r.extinctPct);
