const { run } = require('./model');
const base = { temp: 21, hr: 85, lluvia: 8, umbral: 2, sombra: 40, inoculo: 30, duracion: 365, fung: false, efic: 70 };
const sc = [['S1',{},1],['S3',{ temp: 26, hr: 65, lluvia: 0 },3],['S5',{fung:true},5]];
for (const [n,mod,si] of sc){ const p={...base,...mod}; const pk=[],auc=[];
 for(let r=0;r<500;r++){const {inf}=run(p,1000*si+r,'manuscript'); pk.push(Math.max(...inf)*100); auc.push(inf.reduce((a,b)=>a+b,0)/inf.length*100);}
 let prev=null; const line=[];
 for(const k of [25,50,100,200,500]){const a=pk.slice(0,k); const m=a.reduce((x,y)=>x+y)/k; const sd=Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/(k-1)); const hw=1.96*sd/Math.sqrt(k);
  const b=auc.slice(0,k); const mb=b.reduce((x,y)=>x+y)/k;
  line.push(`n=${k}: peak ${m.toFixed(2)} ±CI ${hw.toFixed(2)} (relCIw ${(2*hw/m*100).toFixed(2)}%) ${prev?('Δ '+(Math.abs(m-prev)/prev*100).toFixed(2)+'%'):''} | meanInf ${mb.toFixed(2)}`); prev=m;}
 console.log(n); console.log(line.join('\n'));}
