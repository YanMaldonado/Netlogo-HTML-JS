const { run } = require('./model'); const fs=require('fs');
const base = { temp: 21, hr: 85, lluvia: 8, umbral: 2, sombra: 40, inoculo: 30, duracion: 365, fung: false, efic: 70 };
const scen = [['S1 Favorable',{}],['S2 High temperature',{temp:31}],['S3 Dry season',{temp:26,hr:65,lluvia:0}],['S4 Dense shade',{sombra:80}],['S5 Fungicide',{fung:true}],['S6 Dense shade + fungicide',{sombra:80,fung:true}]];
const out={};
scen.forEach(([n,m],si)=>{const p={...base,...m}; const all=[]; for(let r=0;r<100;r++) all.push(run(p,1000*(si+1)+r,'manuscript').inf);
 const mean=[],lo=[],hi=[]; for(let d=0;d<365;d++){const v=all.map(a=>a[d]*100).sort((a,b)=>a-b); mean.push(v.reduce((a,b)=>a+b)/100); lo.push(v[2]); hi.push(v[97]);} out[n]={mean,lo,hi};});
fs.writeFileSync('series.json',JSON.stringify(out));
