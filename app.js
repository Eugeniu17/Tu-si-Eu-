const VERSION = "20260803-v4";
const STORAGE_PREFIX = "intre-noi-v4";
const MAILBOX_KEY = "intre-noi-mailbox-v4";

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = value => { const d=document.createElement("div"); d.textContent=String(value ?? ""); return d.innerHTML; };
const readJSON = (key,fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

const ui = {
  view: $("#view"), chip: $("#profileChip"), profileDialog: $("#profileDialog"), profileContent: $("#profileContent"),
  shareDialog: $("#shareDialog"), shareContent: $("#shareContent"), letterDialog: $("#letterDialog"), letterContent: $("#letterContent"),
  canvas: $("#resultCanvas"), routePath: $("#routePathDone"), routeHeart: $("#routeHeart"), routeSteps: $("#routeSteps"),
  progress: $("#journeyProgress"), countdown: $("#journeyCountdown"), myHalf: $("#myHalf"), theirHalf: $("#theirHalf"),
  heartPair: $(".heart-pair"), heartTitle: $("#heartStatusTitle"), heartText: $("#heartStatusText")
};

let config, days, profile = localStorage.getItem("intre-noi-profile-v4") || "";
let state = emptyState(), currentView = "today", imported = null;

function emptyState(){ return {answers:{},completed:{},partnerCompleted:{},stage:{},prayers:{},tomorrow:[],sealed:{},introSeen:{}}; }
function storageKey(){ return `${STORAGE_PREFIX}-${profile || "guest"}`; }
function loadState(){ const saved=readJSON(storageKey(),{}); state={...emptyState(),...saved}; }
function save(){ localStorage.setItem(storageKey(),JSON.stringify(state)); }
function person(){ return config.people[profile]; }
function otherId(){ return profile === "alina" ? "eugeniu" : "alina"; }
function other(){ return config.people[otherId()]; }
function parisToday(){ return new Intl.DateTimeFormat("en-CA",{timeZone:config.timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
function todayIndex(){ const t=parisToday(); let i=days.findIndex(d=>d.date===t); if(i<0) i=t<days[0].date?0:days.length-1; return i; }
function dayUnlocked(day){ return parisToday() >= day.date; }
function currentDay(){ const unlocked=days.filter(dayUnlocked); return unlocked.at(-1) || days[0]; }
function dayState(day){ return state.stage[day.id] || 0; }
function setDayStage(day,n){ state.stage[day.id]=n; save(); }

async function load(){
  const [c,d]=await Promise.all([
    fetch(`./config.json?v=${VERSION}`,{cache:"no-store"}), fetch(`./days.json?v=${VERSION}`,{cache:"no-store"})
  ]);
  if(!c.ok || !d.ok) throw new Error("Fișierele proiectului nu s-au încărcat.");
  config=await c.json(); days=await d.json();
  imported=importFromURL(); bind(); drawMap();
  if(!profile) chooseProfile(); else boot();
}

function bind(){
  ui.chip.onclick=chooseProfile;
  $$('[data-close]').forEach(b=>b.onclick=()=>$("#"+b.dataset.close).close());
  $$(".nav__item").forEach(b=>b.onclick=()=>{
    $$(".nav__item").forEach(x=>x.classList.remove("is-active")); b.classList.add("is-active"); currentView=b.dataset.view;
    ({today:renderToday,path:renderPath,traces:renderTraces,tomorrow:renderTomorrow}[currentView]||renderToday)();
  });
}

function chooseProfile(){
  ui.profileContent.innerHTML=`
    <span class="kicker">Alege partea ta de drum</span><h2>Cine deschide povestea?</h2>
    <p style="color:var(--muted);line-height:1.6">Fiecare răspunde pe telefonul său. Alegerea și progresul rămân salvate aici.</p>
    <div class="profile-options">
      <button class="profile-option" data-profile="alina"><span>🦋</span><strong>Sunt Alina</strong><small>Menton</small></button>
      <button class="profile-option" data-profile="eugeniu"><span>❤️</span><strong>Sunt Eugeniu</strong><small>Paris</small></button>
    </div>`;
  ui.profileDialog.showModal();
  $$('[data-profile]',ui.profileContent).forEach(b=>b.onclick=()=>{
    profile=b.dataset.profile; localStorage.setItem("intre-noi-profile-v4",profile); loadState(); ui.profileDialog.close(); boot();
  });
}

function boot(){
  loadState(); ui.chip.textContent=`${person().emoji} ${person().name}`; updateJourney(); updateHeartStatus(); renderToday();
  if(imported){ setTimeout(()=>showImported(imported),350); imported=null; }
}

function drawMap(){
  const path=$("#routePathBg"); if(!path) return;
  const length=path.getTotalLength(); ui.routeSteps.innerHTML="";
  for(let i=0;i<15;i++){
    const p=path.getPointAtLength(length*(i/14));
    const c=document.createElementNS("http://www.w3.org/2000/svg","circle"); c.setAttribute("cx",p.x); c.setAttribute("cy",p.y); c.setAttribute("r",i===0||i===14?7:5); c.dataset.step=i; ui.routeSteps.appendChild(c);
  }
}

function updateJourney(){
  if(!days) return; const idx=todayIndex(); const completed=Object.keys(state.completed).filter(k=>state.completed[k]).length;
  const progress=Math.max(idx,completed?Math.min(completed,14):0); const path=$("#routePathBg"); const len=path.getTotalLength();
  ui.routePath.style.strokeDasharray=`${len*progress/14} ${len}`;
  const p=path.getPointAtLength(len*progress/14); ui.routeHeart.setAttribute("transform",`translate(${p.x-18} ${p.y+12})`);
  $$("circle",ui.routeSteps).forEach((c,i)=>c.classList.toggle("is-done",i<=progress));
  ui.progress.textContent=`Ziua ${Math.min(progress+1,15)} din 15`;
  ui.countdown.textContent=progress>=14?"Astăzi distanța devine revedere.":`Mai sunt ${14-progress} pași până la revedere.`;
}

function updateHeartStatus(day=currentDay()){
  const mine=!!state.completed[day.id], theirs=!!state.partnerCompleted[day.id];
  ui.myHalf.classList.toggle("is-ready",mine); ui.theirHalf.classList.toggle("is-ready",theirs); ui.heartPair.classList.toggle("is-complete",mine&&theirs);
  if(mine&&theirs){ ui.heartTitle.textContent="Amândoi am răspuns."; ui.heartText.textContent="Cele două jumătăți s-au unit. Inima noastră bate și drumul devine puțin mai scurt."; }
  else if(mine){ ui.heartTitle.textContent="Partea ta este gata."; ui.heartText.textContent=`Jumătatea ta a inimii îl așteaptă pe ${other().name}. Trimite-i legătura de confirmare.`; }
  else if(theirs){ ui.heartTitle.textContent=`${other().name} a răspuns deja.`; ui.heartText.textContent="Cealaltă jumătate te așteaptă. Acum este rândul tău."; }
  else { ui.heartTitle.textContent="Astăzi începem din nou."; ui.heartText.textContent="Când amândoi răspundem, cele două jumătăți se unesc și inima începe să bată."; }
}

function scene(day,content=""){
  return `<article class="chapter stage"><div class="chapter__top"><span class="chapter__number">Capitolul ${day.id} · ${day.date.split("-").reverse().slice(0,2).join(".")}</span><div class="chapter__icon">${day.icon}</div><h2>${esc(day.title)}</h2><p class="chapter__lead">${esc(day.intro?.[profile]||day.prelude||"")}</p></div>${content}</article>`;
}

function stagesFor(day){
  const special=specialDay(day);
  return [
    ["Deschide ziua","O pagină nouă și, dacă există, plicul de ieri.","✦"],
    ["Ascultă și simte",day.song?"Melodia zilei și o întrebare pentru inimă.":"O clipă liniștită înainte de răspuns.","♫"],
    [special.title,special.subtitle,special.icon],
    ["Cunoaște-mă mai bine","Răspunsul zilei, pas cu pas.","♡"],
    ["Trei motive de rugăciune","Pentru tine, pentru noi și pentru cei dragi.","🙏"],
    ["Sigilează plicul","Închidem ziua, unim inimile și așteptăm mâine.","✉"]
  ];
}

function renderTrail(day,active){
  const stages=stagesFor(day);
  return `<div class="trail">${stages.map((s,i)=>`<button class="trail-step ${i<active?"is-done":i===active?"is-current":""}" ${i>active?"disabled":""} data-stage="${i}"><span class="trail-step__dot">${i<active?"✓":s[2]}</span><span><strong>${s[0]}</strong><small>${s[1]}</small></span><span class="trail-step__arrow">${i===active?"›":""}</span></button>`).join("")}</div>`;
}

function renderToday(){
  if(!profile) return chooseProfile();
  const day=currentDay(); updateJourney(); updateHeartStatus(day);
  if(state.sealed[day.id]) return renderSealed(day);
  const active=Math.min(dayState(day),5);
  ui.view.innerHTML=scene(day,renderTrail(day,active)+`<div id="stageArea"></div>`);
  renderStage(day,active);
}

function renderStage(day,stage){
  const area=$("#stageArea"); if(!area) return;
  const next=()=>{ const n=Math.min(stage+1,5); setDayStage(day,n); renderToday(); window.scrollTo({top:ui.view.offsetTop-100,behavior:"smooth"}); };
  if(stage===0){
    const letter=getAvailableLetter();
    area.innerHTML=`<section class="stage-card"><span class="stage-card__label">Deschiderea zilei</span><h3>${letter?"Ai primit ceva de ieri 💌":"O nouă pagină ne așteaptă"}</h3><p>${letter?`Un plic de la ${esc(config.people[letter.from].name)} a așteptat această zi.`:"Nu ne grăbim. Astăzi facem un singur pas, dar îl facem cu inimă."}</p>${letter?`<button class="primary" id="openLetter">Deschide plicul</button>`:`<button class="primary" id="startDay">Deschide ziua</button>`}</section>`;
    if(letter) $("#openLetter").onclick=()=>{ showLetter(letter); next(); }; else $("#startDay").onclick=next;
  } else if(stage===1){
    area.innerHTML=`<section class="stage-card"><span class="stage-card__label">O clipă pentru noi</span><h3>${day.song?"Melodia zilei":"Respirăm înainte să răspundem"}</h3><p>${day.song?"Ascult-o acum sau păstreaz-o pentru un moment liniștit. Important este gândul pe care îl trimitem unul spre celălalt.":"Închide ochii pentru câteva secunde și amintește-ți că, sub același cer, cineva se gândește la tine."}</p>${day.song?`<a class="song" href="${day.song[2]}" target="_blank" rel="noopener"><span class="song__disc">♥</span><span><strong>${esc(day.song[0])}</strong><small>${esc(day.song[1])}</small></span><span class="song__play">▶</span></a>`:""}<button class="primary" id="songDone" style="margin-top:16px">Continuă spre următorul pas</button></section>`;
    $("#songDone").onclick=next;
  } else if(stage===2){
    renderSpecial(day,area,next);
  } else if(stage===3){
    renderQuestion(day,area,next);
  } else if(stage===4){
    renderPrayers(day,area,next);
  } else {
    renderSeal(day,area);
  }
}

function specialDay(day){
  const d=new Date(`${day.date}T12:00:00+02:00`).getDay();
  if(day.id===14) return {title:"Revenirea acasă",subtitle:"Alina se întoarce și distanța începe să se închidă.",icon:"🏡",type:"return"};
  if(day.id===15) return {title:"Prima zi după vacanță",subtitle:"Nu promitem doar viitorul. Alegem cum îl construim azi.",icon:"🌅",type:"work"};
  if(d===6) return {title:"Post și rugăciune",subtitle:"Alegem împreună dacă păstrăm postul și ce punem înaintea lui Dumnezeu.",icon:"🕊",type:"fast"};
  if(d===0) return {title:"Duminică împreună",subtitle:"Biserică, mulțumire și aceeași direcție.",icon:"⛪",type:"sunday"};
  return {title:"Un gest de astăzi",subtitle:"Un lucru mic, real, pe care îl facem acum — nu cândva.",icon:"✦",type:"gesture"};
}

function renderSpecial(day,area,next){
  const s=specialDay(day);
  if(s.type==="fast"){
    area.innerHTML=`<section class="stage-card"><span class="stage-card__label">Sâmbăta noastră</span><h3>Vrem să postim împreună?</h3><p>Răspunsul nu este o obligație. Îl alegem sincer și stabilim ce vrem să aducem înaintea lui Dumnezeu.</p><div class="answers"><button class="answer" data-fast="Da, postim împreună">Da, postim împreună 🕊</button><button class="answer" data-fast="Ne rugăm, dar alegem altă formă">Ne rugăm, dar alegem altă formă</button><button class="answer" data-fast="Vorbim mai întâi despre cum facem">Vorbim mai întâi despre cum facem</button></div><textarea class="textarea" id="fastNote" placeholder="Cum vrem să organizăm sâmbăta aceasta?"></textarea><button class="continue" id="specialNext">Păstrez alegerea</button></section>`;
    let choice=""; $$('[data-fast]',area).forEach(b=>b.onclick=()=>{choice=b.dataset.fast;$$('[data-fast]',area).forEach(x=>x.classList.remove('is-selected'));b.classList.add('is-selected');$("#specialNext").classList.add('is-visible')});
    $("#specialNext").onclick=()=>{state.answers[`${day.id}-special`]={choice,note:$("#fastNote").value.trim()};save();next()};
  } else if(s.type==="sunday"){
    area.innerHTML=`<section class="stage-card"><span class="stage-card__label">Duminica noastră</span><h3>Pentru ce Îi mulțumim astăzi lui Dumnezeu?</h3><p>Chiar dacă suntem în două locuri, putem merge în aceeași direcție.</p><textarea class="textarea" id="specialText" placeholder="O mulțumire, un verset sau un gând din biserică…"></textarea><button class="continue" id="specialNext">Păstrez acest gând</button></section>`;
    $("#specialText").oninput=e=>$("#specialNext").classList.toggle('is-visible',!!e.target.value.trim()); $("#specialNext").onclick=()=>{state.answers[`${day.id}-special`]=$("#specialText").value.trim();save();next()};
  } else {
    const prompts=s.type==="return"?["Îi spun ce mi-a lipsit cel mai mult","Pregătesc un gest mic pentru revenirea ei","Îi las timp să se odihnească și rămân aproape"]:s.type==="work"?["O încurajez fără să o sufoc","Întreb concret cum o pot ajuta","Păstrez seara liniștită pentru noi"]:["Trimit un mesaj scurt și sincer","Fac o fotografie cu ceva ce mi-a amintit de noi","Mă rog două minute pentru celălalt","Ascult fără să pregătesc imediat răspunsul"];
    area.innerHTML=`<section class="stage-card"><span class="stage-card__label">Nu mai târziu. Astăzi.</span><h3>${esc(s.title)}</h3><p>${esc(s.subtitle)}</p><div class="answers">${prompts.map(x=>`<button class="answer" data-gesture="${esc(x)}">${esc(x)}</button>`).join("")}</div><button class="continue" id="specialNext">Aleg acest gest</button></section>`;
    let val=""; $$('[data-gesture]',area).forEach(b=>b.onclick=()=>{val=b.dataset.gesture;$$('[data-gesture]',area).forEach(x=>x.classList.remove('is-selected'));b.classList.add('is-selected');$("#specialNext").classList.add('is-visible')});
    $("#specialNext").onclick=()=>{state.answers[`${day.id}-special`]=val;save();next()};
  }
}

function renderQuestion(day,area,next){
  const q=day.question?.[profile] || "Ce ai vrea să-mi spui astăzi?"; const opts=day.options?.[profile] || [];
  area.innerHTML=`<section class="stage-card"><span class="stage-card__label">Cunoaște-mă mai bine</span><h3>${esc(q)}</h3><p>Nu căutăm răspunsul perfect. Căutăm răspunsul sincer.</p>${opts.length?`<div class="answers">${opts.map(o=>`<button class="answer" data-answer="${esc(o)}">${esc(o)}</button>`).join("")}</div>`:""}<textarea class="textarea" id="answerText" placeholder="${opts.length?"Poți adăuga ceva în cuvintele tale…":"Scrie sincer, în ritmul tău…"}"></textarea><button class="continue" id="questionNext">Păstrez răspunsul</button></section>`;
  const selected=[]; const multi=!!day.multi;
  const refresh=()=>$("#questionNext").classList.toggle('is-visible',selected.length>0 || !!$("#answerText").value.trim());
  $$('[data-answer]',area).forEach(b=>b.onclick=()=>{
    const v=b.dataset.answer;
    if(multi){ b.classList.toggle('is-selected'); const i=selected.indexOf(v); i>=0?selected.splice(i,1):selected.push(v); }
    else { $$('[data-answer]',area).forEach(x=>x.classList.remove('is-selected')); b.classList.add('is-selected'); selected.splice(0,selected.length,v); }
    refresh();
  });
  $("#answerText").oninput=refresh;
  $("#questionNext").onclick=()=>{ const text=$("#answerText").value.trim(); const parts=[...selected]; if(text)parts.push(text); state.answers[day.id]={question:q,answer:parts.join(" • "),date:new Date().toISOString()}; save(); next(); };
}

function renderPrayers(day,area,next){
  const saved=state.prayers[day.id] || ["","",""];
  area.innerHTML=`<section class="stage-card"><span class="stage-card__label">Trei motive de rugăciune</span><h3>Ce punem astăzi înaintea lui Dumnezeu?</h3><p>Un motiv pentru tine, unul pentru noi și unul pentru familiile noastre, biserică sau ziua de mâine.</p><div class="prayer-grid">
    <label class="prayer-item"><span>1</span><input id="p1" value="${esc(saved[0])}" placeholder="Pentru mine / starea mea…"></label>
    <label class="prayer-item"><span>2</span><input id="p2" value="${esc(saved[1])}" placeholder="Pentru noi / relația noastră…"></label>
    <label class="prayer-item"><span>3</span><input id="p3" value="${esc(saved[2])}" placeholder="Pentru familie, biserică sau mâine…"></label>
  </div><button class="continue" id="prayerNext">Păstrez cele trei motive</button></section>`;
  const refresh=()=>$("#prayerNext").classList.toggle('is-visible',[1,2,3].every(i=>$("#p"+i).value.trim()));
  [1,2,3].forEach(i=>$("#p"+i).oninput=refresh); refresh();
  $("#prayerNext").onclick=()=>{state.prayers[day.id]=[1,2,3].map(i=>$("#p"+i).value.trim());save();next()};
}

function renderSeal(day,area){
  const r=state.answers[day.id];
  area.innerHTML=`<section class="stage-card envelope-stage"><span class="stage-card__label">Ziua este gata</span><h3>Adunăm toate răspunsurile într-un singur plic.</h3><p>După sigilare, jumătatea ta de inimă se aprinde. Când primești confirmarea celuilalt, cele două jumătăți se unesc.</p><div class="envelope" id="envelope"><div class="envelope__body"></div><div class="envelope__paper"><strong>${esc(person().name)} ❤️ ${esc(other().name)}</strong><p>${esc(r?.answer||"")}<br><br>🙏 ${(state.prayers[day.id]||[]).map(esc).join(" · ")}</p></div><div class="envelope__flap"></div><button class="envelope__seal" aria-label="Sigilează">♥</button></div><div class="sealed-message"><strong>Te iubesc.</strong><p>Așteptăm următoarea zi și continuăm să devenim, pas cu pas, oamenii cu care vrem să construim o viață.</p></div><button class="seal-button" id="sealDay">Gata — sigilează ziua</button></section>`;
  $("#sealDay").onclick=()=>{
    $("#envelope").classList.add("is-sealed"); $("#sealDay").disabled=true;
    setTimeout(()=>{ state.completed[day.id]=true; state.sealed[day.id]=true; save(); updateJourney(); updateHeartStatus(day); celebrate(); setTimeout(()=>renderSealed(day),900); },1700);
  };
}

function renderSealed(day){
  const both=state.completed[day.id]&&state.partnerCompleted[day.id];
  ui.view.innerHTML=scene(day,`<section class="stage-card envelope-stage"><span class="stage-card__label">Plic sigilat</span><div class="envelope is-sealed"><div class="envelope__body"></div><div class="envelope__paper"><strong>Ziua ${day.id} este păstrată.</strong><p>Răspunsul, gestul și cele trei motive de rugăciune au rămas în povestea noastră.</p></div><div class="envelope__flap"></div><div class="envelope__seal">♥</div></div><div class="sealed-message"><strong>${both?"Inima noastră bate ❤️":"Jumătatea ta este gata"}</strong><p>${both?"Amândoi am răspuns. Astăzi suntem puțin mai aproape.":`Trimite-i lui ${other().name} confirmarea. Când o deschide, a doua jumătate se va aprinde.`}</p></div><div class="map-reveal"><strong>Am mai făcut un pas.</strong><p>${day.teaser||"Mâine deschidem o altă pagină."}</p></div><div class="result-actions"><button class="primary" id="shareCompletion">Trimite jumătatea inimii ❤️</button><button class="secondary" id="shareResult">Trimite răspunsul zilei</button><button class="secondary" id="leaveTomorrow">Lasă un plic pentru mâine ✉</button></div></section>`);
  $("#shareCompletion").onclick=()=>shareCompletion(day); $("#shareResult").onclick=()=>shareResult(day); $("#leaveTomorrow").onclick=()=>{ $('[data-view="tomorrow"]').click(); };
}

function encode(obj){ return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""); }
function decode(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4)s+="="; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
function shareUrl(payload,param="sync"){ const u=new URL(location.origin+location.pathname); u.searchParams.set(param,encode(payload)); return u.toString(); }

async function shareCompletion(day){
  const payload={type:"completion",day:day.id,from:profile,to:otherId(),created:new Date().toISOString()};
  const text=`Am terminat Ziua ${day.id} din „Între noi”. Deschide legătura ca jumătățile inimii noastre să se unească ❤️\n${shareUrl(payload)}`;
  await nativeShare("Jumătatea inimii mele ❤️",text);
}
async function shareResult(day){
  const r=state.answers[day.id]; const prayers=state.prayers[day.id]||[];
  const text=`ÎNTRE NOI ❤️\nZiua ${day.id} — ${day.title}\n\n${r?.question||""}\n${r?.answer||""}\n\n🙏 Motivele mele:\n1. ${prayers[0]||""}\n2. ${prayers[1]||""}\n3. ${prayers[2]||""}`;
  await nativeShare("Între noi ❤️",text);
}
async function nativeShare(title,text){ try{ if(navigator.share) await navigator.share({title,text}); else {await navigator.clipboard.writeText(text);alert("Textul a fost copiat")}}catch(e){if(e?.name!=="AbortError")console.warn(e)} }

function renderPath(){
  ui.view.innerHTML=`<article class="chapter"><div class="chapter__top"><span class="chapter__number">Drumul nostru</span><div class="chapter__icon">⌁</div><h2>15 capitole. Un singur sens.</h2><p class="chapter__lead">Fiecare zi se deschide de la 00:00. Poți intra dimineața la 05:00, în pauza de prânz sau seara.</p></div><div class="days-grid">${days.map(d=>`<button class="day-card ${!dayUnlocked(d)?"is-locked":""} ${state.completed[d.id]?"is-done":""}" data-day="${d.id}" ${!dayUnlocked(d)?"disabled":""}><span class="day-card__num">ZIUA ${d.id}</span><span class="day-card__icon">${d.icon}</span><strong>${esc(d.title)}</strong><small>${state.completed[d.id]?"Păstrată împreună ✓":dayUnlocked(d)?"Poate fi deschisă":"Se deschide la data ei 🔒"}</small></button>`).join("")}</div></article>`;
  $$('[data-day]',ui.view).forEach(b=>b.onclick=()=>{ const d=days.find(x=>x.id===Number(b.dataset.day)); if(d.id===currentDay().id){ $('[data-view="today"]').click(); } else showPastDay(d); });
}
function showPastDay(day){ const r=state.answers[day.id]; ui.letterContent.innerHTML=`<span class="kicker">Ziua ${day.id}</span><h2>${esc(day.title)}</h2>${r?`<div class="status-card"><h3>${esc(r.question)}</h3><p>${esc(r.answer)}</p></div>`:"<p>Această pagină nu a fost completată pe telefonul acesta.</p>"}`;ui.letterDialog.showModal(); }
function renderTraces(){
  const completed=days.filter(d=>state.completed[d.id]);
  ui.view.innerHTML=`<article class="chapter"><div class="chapter__top"><span class="chapter__number">Urmele noastre</span><div class="chapter__icon">♡</div><h2>Ceea ce am construit deja</h2><p class="chapter__lead">Nu promisiuni pentru cândva, ci pași făcuți cu adevărat.</p></div><div class="trace-list">${completed.length?completed.map(d=>`<div class="trace"><h3>${d.icon} Ziua ${d.id} · ${esc(d.title)}</h3><p>${esc(state.answers[d.id]?.answer||"")}</p></div>`).join(""):`<div class="status-card"><h3>Prima urmă apare după sigilarea zilei.</h3><p>Aici se va forma jurnalul vostru.</p></div>`}</div></article>`;
}

function renderTomorrow(){
  ui.view.innerHTML=`<article class="chapter"><div class="chapter__top"><span class="chapter__number">Din astăzi pentru mâine</span><div class="chapter__icon">✉</div><h2>Lasă ceva care merită așteptat</h2><p class="chapter__lead">Plicul se deschide după 00:00, deci poate fi citit și la 05:00 dimineața.</p></div><section class="stage-card"><div class="type-tabs"><button class="type-tab is-active" data-kind="question">Întrebare</button><button class="type-tab" data-kind="thought">Gând</button><button class="type-tab" data-kind="surprise">Surpriză</button></div><textarea class="textarea" id="tomorrowText" placeholder="Scrie ceva care să-i facă plăcere să deschidă ziua de mâine…"></textarea><button class="continue" id="createTomorrow">Sigilează pentru mâine</button><div class="feedback" id="tomorrowFeedback"></div></section></article>`;
  let kind="question"; $$('[data-kind]',ui.view).forEach(b=>b.onclick=()=>{$$('[data-kind]',ui.view).forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');kind=b.dataset.kind});
  $("#tomorrowText").oninput=e=>$("#createTomorrow").classList.toggle('is-visible',!!e.target.value.trim());
  $("#createTomorrow").onclick=()=>createTomorrow(kind,$("#tomorrowText").value.trim());
}
function nextDate(){ const d=new Date(`${parisToday()}T12:00:00+02:00`); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); }
async function createTomorrow(kind,text){
  const payload={type:"letter",from:profile,to:otherId(),kind,text,openDate:nextDate(),created:new Date().toISOString()};
  const message=`Ți-am lăsat un plic în „Între noi”. Se deschide mâine după 00:00 💌\n${shareUrl(payload,"letter")}`;
  $("#tomorrowFeedback").className="feedback is-visible"; $("#tomorrowFeedback").innerHTML="Plicul a fost sigilat. Acum trebuie doar trimis. ❤️";
  await nativeShare("Pentru mâine 💌",message);
}

function importFromURL(){
  const u=new URL(location.href); let raw=u.searchParams.get("sync"),param="sync"; if(!raw){raw=u.searchParams.get("letter");param="letter"} if(!raw)return null;
  try{ const payload=decode(raw); u.searchParams.delete(param); history.replaceState({},"",u); return payload; }catch{return null;}
}
function showImported(payload){
  if(payload.to!==profile){ ui.letterContent.innerHTML=`<h2>Acest plic este pentru ${esc(config.people[payload.to]?.name||"celălalt profil")}</h2><p>Schimbă profilul pe telefonul potrivit.</p>`; ui.letterDialog.showModal(); return; }
  if(payload.type==="completion"){
    state.partnerCompleted[payload.day]=true; save(); updateHeartStatus(days.find(d=>d.id===payload.day));
    ui.letterContent.innerHTML=`<span class="kicker">Două jumătăți</span><h2>${esc(config.people[payload.from].name)} a terminat Ziua ${payload.day} ❤️</h2><div class="heart-pair is-complete" style="margin:25px auto"><span class="half-heart half-heart--mine is-ready">♥</span><span class="half-heart half-heart--theirs is-ready">♥</span></div><p>Confirmarea a ajuns. Dacă ai răspuns și tu, inima voastră este acum întreagă.</p>`; ui.letterDialog.showModal(); renderToday();
  } else {
    const box=readJSON(MAILBOX_KEY,[]); if(!box.some(x=>x.created===payload.created)){box.push(payload);localStorage.setItem(MAILBOX_KEY,JSON.stringify(box));}
    showLetter(payload);
  }
}
function getAvailableLetter(){ const box=readJSON(MAILBOX_KEY,[]); return box.find(x=>x.to===profile && x.openDate<=parisToday() && !x.opened); }
function showLetter(letter){
  if(letter.openDate>parisToday()){ ui.letterContent.innerHTML=`<h2>Plicul încă doarme 🔒</h2><p>Se deschide în data de ${letter.openDate.split('-').reverse().join('.')} după 00:00.</p>`; }
  else { ui.letterContent.innerHTML=`<span class="kicker">De la ${esc(config.people[letter.from].name)}</span><h2>${letter.kind==="question"?"O întrebare pentru tine":letter.kind==="surprise"?"O mică surpriză":"Un gând păstrat pentru azi"}</h2><div class="status-card"><p style="font-family:Georgia,serif;font-size:22px;color:var(--ink)">${esc(letter.text)}</p></div>`; const box=readJSON(MAILBOX_KEY,[]); const f=box.find(x=>x.created===letter.created); if(f)f.opened=true;localStorage.setItem(MAILBOX_KEY,JSON.stringify(box)); }
  ui.letterDialog.showModal();
}
function celebrate(){ const burst=document.createElement('div');burst.style.cssText='position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden';burst.innerHTML=Array.from({length:20},(_,i)=>`<span style="position:absolute;left:${10+Math.random()*80}%;top:55%;font-size:${18+Math.random()*18}px;animation:stageIn .7s ease forwards;transform:translateY(${Math.random()*-250}px)">${i%2?'♥':'✦'}</span>`).join('');document.body.appendChild(burst);setTimeout(()=>burst.remove(),1200); }

load().catch(error=>{ console.error(error); ui.view.innerHTML=`<article class="chapter"><h2>Site-ul nu s-a încărcat</h2><p>${esc(error.message)}</p><p>Verifică dacă index.html, style.css, app.js, config.json și days.json sunt în același loc.</p></article>`; });
