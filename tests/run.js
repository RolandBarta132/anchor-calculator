/* Regression harness for index.html.
   npm test                run all cases and compare with tests/expected.json
   npm run test:update     regenerate expected.json (review the printed changes before committing!)
   node tests/run.js --file path/to/other.html   test another version of the page
   node tests/run.js name1 name2                 run only some cases                          */
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path');
const args=process.argv.slice(2),update=args.includes('--update');
const fi=args.indexOf('--file'),file=fi>=0?args[fi+1]:path.join(__dirname,'..','index.html');
const only=args.filter((a,i)=>!a.startsWith('--')&&args[i-1]!=='--file');
const cases=JSON.parse(fs.readFileSync(path.join(__dirname,'cases.json'),'utf8'));
const expPath=path.join(__dirname,'expected.json');
const expected=fs.existsSync(expPath)?JSON.parse(fs.readFileSync(expPath,'utf8')):{};
const html=fs.readFileSync(file,'utf8').replace(/<script src=[^>]*><\/script>/g,'');
const sig=x=>typeof x!=='number'?x:!isFinite(x)?String(x):Number(x.toPrecision(6));

function run(c){
  const errors=[],vc=new VirtualConsole();
  try{const js=html.split('<script').slice(1).map(x=>x.slice(x.indexOf('>')+1,x.indexOf('</script>'))).join('\\n');new Function(js);}catch(e){errors.push('syntax check: '+e.message);}
  vc.on('jsdomError',e=>errors.push('script error: '+e.message));
  const d=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc}),w=d.window,D=w.document;
  const el=id=>{const e=D.getElementById(id);if(!e)throw new Error('unknown input id "'+id+'" in cases.json');return e};
  for(const k in c.set){const e=el(k);if(e.type==='checkbox')e.checked=!!c.set[k];else e.value=String(c.set[k]);}
  el('fck').dispatchEvent(new w.Event('input',{bubbles:true}));        // one recalculation with all values set
  if(!w.ENGINE) throw new Error('ENGINE not initialized; '+errors.join(' | '));
  const out=w.ENGINE.calculate();
  const V=out&&out.transfer||null;
  const res=(w.__RES||[]).map(r=>({id:r.id,l:r.l,u:sig(r.u),ref:!!r.reference,hidden:!!r.hidden,category:r.category,hint:r.h||''}));
  let explicit=null;
  if(c.multiLoad){
    explicit=w.ENGINE.loadTransfer(c.multiLoad).T.map(sig);
  }
  return {errors,warn:(w.__WARN||[]).slice(),banner:(()=>{const b=D.getElementById('calcerr');return b&&b.style.display!=='none'?b.textContent:''})(),
    stepRows:D.querySelectorAll('#steps tr').length,barsText:D.getElementById('bars').textContent,
    snap:{results:Object.fromEntries(res.map(r=>[r.id,{label:r.l,u:r.u,ref:r.ref,hidden:r.hidden}])),T:V?V.T.map(sig):null,qx:V?V.qx.map(sig):null,qy:V?V.qy.map(sig):null,manual:!!(V&&V.manual),explicitT:explicit},res};
}
function checkInvariants(name,c,r){
  const f=[];
  r.errors.forEach(e=>f.push(e));r.warn.forEach(e=>f.push('NaN guard: '+e));
  if(r.banner)f.push('calculation stopped: '+r.banner);
  if(r.res.length<15)f.push('only '+r.res.length+' utilisation rows (expected 15+)');
  if(r.stepRows<30)f.push('calculation steps table has only '+r.stepRows+' rows');
  r.res.forEach(x=>{if(typeof x.u==='number'&&isNaN(x.u))f.push('NaN utilisation: '+x.l)});
  const seen=new Set();
  r.res.forEach(x=>{
    if(!x.id||!/^[a-z][a-z0-9_]*$/.test(x.id))f.push('result without a valid id: '+x.l);
    else if(seen.has(x.id))f.push('duplicate result id: '+x.id);else seen.add(x.id);
    if(!x.l||!x.category)f.push('result '+x.id+' lacks a label or category');
    if(x.hidden&&!x.ref)f.push('result '+x.id+' is hidden but still active');
    if(!x.ref&&!x.hidden&&x.u>1&&!x.hint)f.push('failing check '+x.id+' has no remedy hint');});
  r.res.forEach(x=>{if(x.u==='NaN')f.push('NaN utilisation: '+x.l)});
  const T=r.snap.T||[],S=a=>a.reduce((s,x)=>s+x,0);
  if(c.independent){
    const tol=c.independent.tolPct==null?1:c.independent.tolPct;
    for(const k of ['T','qx','qy']){
      const actual=r.snap[k]||[],target=c.independent[k]||[];
      if(actual.length!==target.length)f.push('independent '+k+' length = '+actual.length+', expected '+target.length);
      else actual.forEach((v,i)=>{if(Math.abs(v-target[i])>Math.max(1e-6,Math.abs(target[i])*tol/100))f.push('independent '+k+'['+i+'] = '+v+', expected '+target[i]+' ('+c.independent.source+')');});
    }
  }
  if(c.multiLoad&&c.assert){}
  (c.assert||[]).forEach(a=>{
    const near=(x,t,p)=>Math.abs(x-t)<=Math.max(1e-6,Math.abs(t)*p/100);
    if(a.type==='sumTension'&&!near(S(T),a.target,a.tolPct))f.push('sum of anchor tension = '+S(T).toFixed(2)+', expected '+a.target);
    if(a.type==='symmetry'&&T.length>1&&!near(T[0],T[1],1))f.push('symmetric anchors differ: '+T[0]+' vs '+T[1]);
    if(a.type==='sumShear'){const q=S(r.snap[a.axis==='x'?'qx':'qy']);if(!near(q,a.target,a.tolPct))f.push('sum of anchor shear '+a.axis+' = '+q.toFixed(2)+', expected '+a.target);}
    if(a.type==='noTension'&&T.some(t=>t>1e-6))f.push('tension appeared where none expected: '+T.join(', '));
    if(a.type==='tensionOnlyAt'&&!(T[a.index]>1e-6&&T.every((t,i)=>i===a.index||t<=1e-6)))f.push('tension should act only on anchor '+a.index+': '+T.join(', '));
    if(a.type==='rowPresent'&&!r.barsText.includes(a.label))f.push('row "'+a.label+'" missing');
    if(a.type==='rowAbsent'&&r.barsText.includes(a.label))f.push('row "'+a.label+'" should be hidden');
    if(a.type==='manualMode'&&!r.snap.manual)f.push('manual-force mode did not return a manual transfer object');
    if(a.type==='explicitTension'){const x=r.snap.explicitT||[];if(x.length!==a.target.length||x.some((v,i)=>Math.abs(v-a.target[i])>Math.max(1e-6,Math.abs(a.target[i])*a.tolPct/100)))f.push('explicit load transfer T = ['+x.join(', ')+'], expected ['+a.target.join(', ')+']');}
  });
  return f;
}
function diff(a,b){
  const out=[],close=(x,y)=>x===y||(typeof x==='number'&&typeof y==='number'&&Math.abs(x-y)<=1e-6*Math.max(1,Math.abs(y)));
  for(const l of new Set([...Object.keys(a.results),...Object.keys(b.results)])){
    const x=a.results[l],y=b.results[l];
    if(!x)out.push('row removed: '+l);else if(!y)out.push('row added: '+l);
    else{if(!close(x.u,y.u))out.push(l+': '+y.u+' -> '+x.u);if(x.ref!==y.ref)out.push(l+': reference '+y.ref+' -> '+x.ref);if(x.hidden!==y.hidden)out.push(l+': hidden '+y.hidden+' -> '+x.hidden);}}
  ['T','qx','qy'].forEach(k=>{const x=a[k]||[],y=b[k]||[];if(x.length!==y.length||x.some((v,i)=>!close(v,y[i])))out.push('anchor '+k+': ['+y.join(', ')+'] -> ['+x.join(', ')+']');});
  if(a.manual!==b.manual)out.push('manual mode changed: '+b.manual+' -> '+a.manual);
  if((a.explicitT||[]).length||(b.explicitT||[]).length){const x=a.explicitT||[],y=b.explicitT||[];if(x.length!==y.length||x.some((v,i)=>!close(v,y[i])))out.push('explicit load transfer T changed: ['+y.join(', ')+'] -> ['+x.join(', ')+']');}
  return out;
}
let failed=0,changed=0;const next={};
for(const name of Object.keys(cases)){
  if(only.length&&!only.includes(name)){if(expected[name])next[name]=expected[name];continue;}
  let r;try{r=run(cases[name]);}catch(e){console.log('FAIL  '+name+'\n      '+e.message);failed++;continue;}
  const fl=checkInvariants(name,cases[name],r);
  const ex=expected[name],dd=ex?diff(r.snap,ex):[];
  if(update){next[name]=r.snap;if(fl.length){failed++;console.log('FAIL  '+name+' (not stored as a trustworthy reference)');fl.forEach(x=>console.log('      '+x));}
    if(dd.length){changed++;console.log('CHANGED '+name);dd.slice(0,12).forEach(x=>console.log('      '+x));if(dd.length>12)console.log('      ... '+(dd.length-12)+' more');}
    continue;}
  if(fl.length||dd.length){failed++;console.log('FAIL  '+name);fl.concat(dd).slice(0,14).forEach(x=>console.log('      '+x));}
  else console.log('ok    '+name);
}
if(update){fs.writeFileSync(expPath,JSON.stringify(next,null,1));console.log('\nexpected.json written. '+changed+' case(s) changed, '+failed+' with problems.');process.exit(failed?1:0);}
console.log('\n'+(failed?failed+' case(s) FAILED':'all cases passed'));process.exit(failed?1:0);
