// Faithful port of the simulation core in roya_cafe_simulacion.html
// Only change: Math.random -> seeded PRNG (mulberry32) so every replicate is reproducible.
// variant 'released' = code exactly as in the HTML file
// variant 'manuscript' = Eq. (1) of the manuscript: +0.10*fS(S) and +0.10*(1-V)
'use strict';
const COLS = 30, ROWS = 20, TOTAL = COLS * ROWS;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function factorTemp(t) { if (t >= 18 && t <= 24) return 1; if (t > 14 && t < 18) return (t - 14) / 4; if (t > 24 && t < 30) return (30 - t) / 6; return 0; }
function factorHR(h) { if (h >= 85) return 1; if (h >= 75) return (h - 75) / 10; return 0; }
function factorLluvia(l, u) { if (l >= u && l <= 15) return 1; if (l > 15 && l <= 40) return (40 - l) / 25; if (l < u && u > 0) return l / u * 0.4; if (l > 40) return 0; return 0; }
function factorSombra(s) { if (s > 70) return 0.35; if (s > 50) return 0.65; return 1; }
function inhibicion(p) { let inh = 0; if (p.temp < 15 || p.temp > 30) inh += 0.40; if (p.hr < 75) inh += 0.30; if (p.lluvia < p.umbral) inh += 0.15; if (p.sombra > 70) inh += 0.15; return Math.min(1, inh); }

function calcProb(vigor, p, variant) {
  const ft = factorTemp(p.temp), fh = factorHR(p.hr), fl = factorLluvia(p.lluvia, p.umbral), fs = factorSombra(p.sombra);
  let pr;
  if (variant === 'released') { const fv = 1 - vigor * 0.5; pr = ft * 0.30 + fh * 0.25 + fl * 0.25 + (1 - fs) * 0.10 + fv * 0.10; }
  else { pr = ft * 0.30 + fh * 0.25 + fl * 0.25 + fs * 0.10 + (1 - vigor) * 0.10; }
  if (p.fung) pr *= (1 - p.efic / 100);
  return Math.max(0, Math.min(1, pr));
}

function run(p, seed, variant = 'manuscript') {
  const R = mulberry32(seed);
  const patches = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const sombra = Math.max(0, Math.min(1, p.sombra / 100 + (R() * 0.3 - 0.15)));
    patches.push({ r, c, estado: 'sano', dias: 0, sombra, vigor: 0.3 + R() * 0.7 });
  }
  let esporas = [];
  for (let i = 0; i < p.inoculo; i++) esporas.push({ x: R() * COLS, y: R() * ROWS, edad: 0, energia: 1 });
  const inf = new Array(p.duracion), esp = new Array(p.duracion), rec = new Array(p.duracion);
  for (let tick = 1; tick <= p.duracion; tick++) {
    const paso = p.lluvia > p.umbral ? 1.5 : 0.6;
    esporas.forEach(e => {
      const ang = R() * Math.PI * 2;
      e.x = (e.x + Math.cos(ang) * (paso + R() * 0.5) + COLS) % COLS;
      e.y = (e.y + Math.sin(ang) * (paso + R() * 0.5) + ROWS) % ROWS;
      const idx = Math.floor(e.y) * COLS + Math.floor(e.x);
      const pat = patches[idx];
      if (pat && pat.estado === 'sano' && R() < calcProb(pat.vigor, p, variant)) { pat.estado = 'infectado'; pat.dias = 0; }
      const cond = pat ? calcProb(pat.vigor, p, variant) : 0;
      e.energia -= (1 - cond) * 0.15;
      if (p.temp < 10 || p.temp > 34) e.energia -= 0.2;
      e.edad++;
    });
    esporas = esporas.filter(e => e.energia > 0 && e.edad <= 15);
    const nuevas = [];
    patches.forEach(pat => {
      if (pat.estado === 'infectado') {
        pat.dias++;
        const vel = pat.sombra > 0.6 ? 0.5 : 1;
        pat.vigor = Math.max(0, pat.vigor - 0.02 * vel);
        if (pat.dias > 10 && R() < calcProb(pat.vigor, p, variant) * 0.5) nuevas.push({ x: pat.c + R(), y: pat.r + R(), edad: 0, energia: 1 });
        let rr = 0.005;
        if (p.fung) rr += p.efic / 3000;
        if (p.temp < 15 || p.temp > 30) rr += 0.02;
        if (p.hr < 75) rr += 0.01;
        if (R() < rr) { pat.estado = 'recuperado'; pat.dias = 0; pat.vigor = Math.min(1, pat.vigor + 0.1); }
      }
      if (pat.estado === 'recuperado' && R() < 0.005) pat.estado = 'sano';
    });
    esporas.push(...nuevas);
    let ni = 0, nr = 0; for (const q of patches) { if (q.estado === 'infectado') ni++; else if (q.estado === 'recuperado') nr++; }
    inf[tick - 1] = ni / TOTAL; esp[tick - 1] = esporas.length; rec[tick - 1] = nr / TOTAL;
  }
  return { inf, esp, rec };
}
module.exports = { run, inhibicion, factorTemp, factorHR, factorLluvia, factorSombra, TOTAL };
