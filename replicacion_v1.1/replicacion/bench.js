const { chromium } = require('playwright');
const fs = require('fs');
const chartSrc = fs.readFileSync('node_modules/chart.js/dist/chart.umd.js','utf8');
const N = parseInt(process.argv[2]||'30');
const scen = { S1:{temp:21,hr:85,lluvia:8,sombra:40}, S3:{temp:26,hr:65,lluvia:0,sombra:40} };
function st(a){const s=[...a].sort((x,y)=>x-y),n=s.length,m=a.reduce((x,y)=>x+y,0)/n;const q=p=>s[Math.min(n-1,Math.floor((n-1)*p))];return{mean:m,sd:Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/Math.max(1,n-1)),median:q(.5),p95:q(.95),max:s[n-1]};}
(async()=>{
 const browser = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',headless:false,args:['--headless=new']});
 const results={browser:browser.version()};
 for (const profile of ['desktop','mobile4x']){
  const ctx = await browser.newContext(profile==='desktop'?{viewport:{width:1366,height:768}}:{viewport:{width:412,height:915},deviceScaleFactor:2.6,isMobile:true,hasTouch:true});
  const page = await ctx.newPage();
  await page.route(/cdnjs/, r=>r.fulfill({status:200,contentType:'application/javascript',body:chartSrc}));
  if(profile==='mobile4x'){const c=await ctx.newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate',{rate:4});}
  await page.goto('file://'+process.cwd()+'/sim.html'); await page.waitForTimeout(500);
  for (const [sn,sp] of Object.entries(scen)){
   const runs=[];
   for(let r=0;r<N;r++){
    const res = await page.evaluate((sp)=>{
      const set=(id,v)=>{document.getElementById(id).value=v;};
      set('sTemp',sp.temp);set('sHR',sp.hr);set('sLluvia',sp.lluvia);set('sSombra',sp.sombra);set('sDuracion',365);
      const params=getP(); tick=0; maxTicks=365; initPatches(params); initEsporas(params); initChart();
      const tSim=[],tDraw=[],tMon=[],tTot=[]; let maxSp=0;
      for(let k=0;k<365;k++){ tick++; const a=performance.now(); stepSim(params); const b=performance.now(); drawWorld(); const c=performance.now(); updateMonitores(params); monitorear(params); const d=performance.now();
        tSim.push(b-a);tDraw.push(c-b);tMon.push(d-c);tTot.push(d-a); maxSp=Math.max(maxSp,esporas.length);}
      const mean=a=>a.reduce((x,y)=>x+y,0)/a.length; const sorted=[...tTot].sort((x,y)=>x-y);
      return {sim:mean(tSim),draw:mean(tDraw),mon:mean(tMon),tot:mean(tTot),p95:sorted[Math.floor(.95*364)],max:sorted[364],maxSp,heap:(performance.memory||{}).usedJSHeapSize};
    }, sp);
    runs.push(res);
   }
   const agg={}; for(const k of ['sim','draw','mon','tot','p95','max','maxSp']) agg[k]=st(runs.map(r=>r[k])); agg.heapMB=st(runs.map(r=>(r.heap||0)/1048576));
   results[profile+'_'+sn]=agg;
   console.log(profile,sn,Object.entries(agg).map(([k,v])=>`${k}:${v.mean.toFixed(2)}±${v.sd.toFixed(2)}`).join(' '));
  }
  // real-time loop with iniciar(): wall time, long tasks
  const rt=[];
  for(let r=0;r<5;r++){
   const res=await page.evaluate(()=>new Promise(res=>{
     document.getElementById('sTemp').value=21;document.getElementById('sHR').value=85;document.getElementById('sLluvia').value=8;document.getElementById('sSombra').value=40;
     const lt=[]; const po=new PerformanceObserver(l=>l.getEntries().forEach(e=>lt.push(e.duration))); po.observe({type:'longtask',buffered:false});
     running=false; const t0=performance.now(); iniciar();
     const iv=setInterval(()=>{ if(!running){clearInterval(iv); po.disconnect(); res({wall:(performance.now()-t0)/1000,longTasks:lt.length,maxLong:lt.length?Math.max(...lt):0});}},50);
   }));
   rt.push(res);
  }
  results[profile+'_realtime']=rt; console.log(profile,'realtime',JSON.stringify(rt));
  await ctx.close();
 }
 fs.writeFileSync('bench_results.json',JSON.stringify(results,null,1));
 await browser.close();
})();
