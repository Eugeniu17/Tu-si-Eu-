const STORAGE_PREFIX = "intre-noi-doi-v2";
const MAILBOX = "intre-noi-mailbox-v1";

const el = {
  view: document.querySelector("#view"),
  chip: document.querySelector("#profileChip"),
  profileDialog: document.querySelector("#profileDialog"),
  profileContent: document.querySelector("#profileContent"),
  shareDialog: document.querySelector("#shareDialog"),
  shareContent: document.querySelector("#shareContent"),
  letterDialog: document.querySelector("#letterDialog"),
  letterContent: document.querySelector("#letterContent"),
  canvas: document.querySelector("#resultCanvas"),
  left: document.querySelector("#leftTraveler"),
  right: document.querySelector("#rightTraveler"),
  pills: document.querySelector("#statusPills"),
  title: document.querySelector("#routeTitle"),
  subtitle: document.querySelector("#routeSubtitle"),
  eyebrow: document.querySelector("#routeEyebrow")
};

let config, days;
let profile = localStorage.getItem("intre-noi-profile") || "";
let state = emptyState();
let pendingLetter = null;
let currentView = "today";

function emptyState(){return {answers:{},completed:{},interaction:{},tomorrow:[],introSeen:{},keepsakes:{}}}
function storageKey(){return `${STORAGE_PREFIX}-${profile || "guest"}`}
function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
function loadState(){const saved=readJSON(storageKey(),{});state={...emptyState(),...saved,answers:saved.answers||{},completed:saved.completed||{},interaction:saved.interaction||{},tomorrow:saved.tomorrow||[],introSeen:saved.introSeen||{},keepsakes:saved.keepsakes||{}}}
function save(){localStorage.setItem(storageKey(),JSON.stringify(state))}
function esc(v){const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML}
function person(){return config.people[profile]}
function otherId(){return profile==="alina"?"eugeniu":"alina"}
function other(){return config.people[otherId()]}

async function load(){
  const [c,d]=await Promise.all([fetch("./config.json?v=20260803-journey-v2",{cache:"no-store"}),fetch("./days.json?v=20260803-journey-v2",{cache:"no-store"})]);
  if(!c.ok) throw new Error(`config.json: HTTP ${c.status}`);
  if(!d.ok) throw new Error(`days.json: HTTP ${d.status}`);
  config=await c.json(); days=await d.json();
  if(!config?.people || !Array.isArray(days) || !days.length) throw new Error("Date invalide în config.json sau days.json");
  pendingLetter=importLetterFromURL();
  bind();
  createSky();
  if(!profile) chooseProfile(); else boot();
}
function chooseProfile(){
  el.profileContent.innerHTML=`
    <h2>Cine ești în povestea aceasta?</h2>
    <p style="color:var(--muted);line-height:1.55">Alegerea rămâne pe acest telefon. Fiecare vede propria versiune a zilei.</p>
    <div class="profile-options">
      <button class="profile-option" data-profile="alina"><span>🦋</span><strong>Sunt Alina</strong><br><small>Menton</small></button>
      <button class="profile-option" data-profile="eugeniu"><span>❤️</span><strong>Sunt Eugeniu</strong><br><small>Paris</small></button>
    </div>`;
  el.profileDialog.showModal();
  el.profileContent.querySelectorAll("[data-profile]").forEach(b=>b.onclick=()=>{
    profile=b.dataset.profile;localStorage.setItem("intre-noi-profile",profile);loadState();el.profileDialog.close();boot()
  });
}
function boot(){
  loadState();
  el.chip.textContent=`${person().emoji} ${person().name} · ${person().city}`;
  updateHeader(); renderToday();
  if(pendingLetter){setTimeout(()=>showImportedLetter(pendingLetter),250);pendingLetter=null}
}
function bind(){
  el.chip.onclick=chooseProfile;
  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>document.querySelector("#"+b.dataset.close).close());
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("is-active"));b.classList.add("is-active");
    currentView=b.dataset.view;
    ({today:renderToday,path:renderPath,traces:renderTraces,tomorrow:renderTomorrow})[currentView]();
  });
}
function nowParts(date=new Date()){
  return Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:config.timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(date).map(p=>[p.type,p.value]));
}
function calendarDate(offsetDays=0){
  const now=new Date(Date.now()+offsetDays*86400000),p=nowParts(now);
  return `${p.year}-${p.month}-${p.day}`;
}
function today(){
  const p=nowParts();
  if(Number(p.hour)<8) return calendarDate(-1);
  return `${p.year}-${p.month}-${p.day}`;
}
function currentIndex(){
  if(today()<config.startDate)return -1;if(today()>config.endDate)return days.length-1;
  return days.findIndex(d=>d.date===today())
}
function unlocked(day){return day.date<=today()}
function updateHeader(){
  const idx=Math.max(0,currentIndex()),pct=Math.max(0,Math.min(1,idx/(days.length-1)));
  const oldPct=Math.min(43,pct*43);
  el.left.style.left=`${oldPct}%`;el.right.style.right=`${oldPct}%`;
  const done=Object.keys(state.completed).length;
  el.pills.innerHTML=`<span>${done}/${days.length} zile păstrate</span><span>${profile?person().name:"Profil neales"}</span><span>${mailbox().length} mesaje primite</span>`;
  updateJourneyMap(idx,pct);
}
function updateJourneyMap(idx,pct){
  const path=document.querySelector("#journeyPath"),heart=document.querySelector("#journeyHeart");
  if(path&&heart){
    const length=path.getTotalLength(),point=path.getPointAtLength(length*pct);
    heart.setAttribute("transform",`translate(${point.x} ${point.y})`);
    path.style.strokeDasharray=`${Math.max(1,length*pct)} ${length}`;
  }
  const progress=document.querySelector("#journeyProgress"),countdown=document.querySelector("#journeyCountdown");
  if(progress) progress.textContent=idx===0?"Primul pas este deja al nostru.":idx>=days.length-1?"Am ajuns din nou unul lângă celălalt. ❤️":`Ziua ${idx+1} din ${days.length}: suntem mai aproape decât ieri.`;
  if(countdown){const left=Math.max(0,days.length-1-idx);countdown.textContent=left===0?"Drumul nu se încheie aici. De aici continuă împreună.":left===1?"Mai este un singur pas până la revedere.":`Mai sunt ${left} pași până când distanța devine îmbrățișare.`}
  document.body.dataset.chapter=String(idx+1);
}
function scene(day,body){return `<article class="scene"><div class="scene__eyebrow">${day.chapter}</div><div class="scene__icon">${day.icon}</div><h2>${day.title}</h2><p class="scene__lead">${day.intro[profile]}</p>${body}</article>`}
function renderToday(){
  if(!profile)return chooseProfile();
  if(currentIndex()<0){el.view.innerHTML=`<article class="scene"><div class="scene__icon">🔒</div><h2>Prima zi se deschide pe 3 august</h2><p class="scene__lead">Până atunci, povestea păstrează puțin mister.</p></article>`;return}
  renderDay(days[currentIndex()])
}
function renderDay(day){
  if(!unlocked(day)){el.view.innerHTML=scene(day,`<div class="quote">Ziua aceasta se va deschide la data ei. 🔒</div>`);return}
  if(state.completed[day.id])return renderCompleted(day);
  if(day.id>1 && !state.introSeen[day.id]) return renderPrelude(day);
  renderInteraction(day)
}
function renderPrelude(day){
  const ready=mailbox().filter(m=>m.openDate<=today());
  const letter=ready.length?ready[ready.length-1]:null;
  const song=day.song;
  const letterHtml=letter?`<button class="sealed-letter" id="openPreludeLetter"><span>💌</span><strong>Ai primit ceva de ieri</strong><small>Apasă ca să deschizi plicul</small></button>`:`<div class="sealed-letter sealed-letter--empty"><span>✨</span><strong>O nouă pagină s-a deschis</strong><small>Ce ai trimis ieri rămâne parte din drumul nostru.</small></div>`;
  const songHtml=song?`<a class="song-card" href="${esc(song[2])}" target="_blank" rel="noopener"><span class="song-card__disc">♫</span><span><small>Melodia capitolului</small><strong>${esc(song[0])}</strong><em>${esc(song[1])}</em></span><b>▶</b></a>`:"";
  el.view.innerHTML=`<article class="scene prelude scene-effect--${esc(day.effect||"stars")}"><div class="chapter-number">CAPITOLUL ${day.id}</div><div class="scene__icon">${day.icon}</div><h2>${esc(day.title)}</h2><p class="scene__lead">${esc(day.prelude||day.intro[profile])}</p>${letterHtml}${songHtml}<div class="keepsake"><span>Astăzi păstrăm</span><strong>${esc(day.keepsake||"Un pas")}</strong></div><button class="continue is-visible" id="beginChapter">Deschide capitolul ❤️</button></article>`;
  const letterButton=document.querySelector("#openPreludeLetter");if(letterButton)letterButton.onclick=()=>showImportedLetter(letter);
  document.querySelector("#beginChapter").onclick=()=>{state.introSeen[day.id]=true;save();renderInteraction(day)};
}
function renderInteraction(day){
  const type=day.interaction;
  if(type==="meet")return interactionMeet(day);
  if(type==="fog")return interactionFog(day);
  if(type==="emotion")return interactionEmotion(day);
  if(type==="hold")return interactionHold(day);
  if(type==="cards")return interactionCards(day);
  if(type==="puzzle")return interactionPuzzle(day);
  if(type==="trap")return interactionTrap(day);
  if(type==="symbols")return interactionSymbols(day);
  if(type==="bridge")return interactionBridge(day);
  if(type==="stars")return interactionStars(day);
  if(type==="meteor")return interactionMeteor(day);
  if(type==="release")return interactionRelease(day);
  if(type==="words")return interactionWords(day);
  if(type==="future")return interactionFuture(day);
  if(type==="final")return interactionFinal(day);
  showQuestion(day)
}
function interactionMeet(day){
  el.view.innerHTML=scene(day,`<div class="interactive-box"><p>Atinge inima până când partea ta ajunge la mijloc.</p><button class="answer answer--primary" id="walk">Fac un pas ❤️</button><div class="progress-mini"><span id="bar"></span></div></div>`);
  let n=0;document.querySelector("#walk").onclick=()=>{n++;document.querySelector("#bar").style.width=`${Math.min(100,n*20)}%`;if(n>=5)showQuestion(day)}
}
function interactionFog(day){
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="cloud" id="cloud"><div class="cloud__city">${profile==="alina"?"🌊":"🗼"}</div><div class="cloud__fog" id="fog"></div></div><p>Glisează peste ceață ca să deschizi fereastra.</p></div>`);
  let n=0;const fog=document.querySelector("#fog");document.querySelector("#cloud").onpointermove=e=>{if(e.buttons||e.pointerType==="touch"){n+=5;fog.style.opacity=String(Math.max(0,1-n/100));if(n>=100)setTimeout(()=>showQuestion(day),500)}}
}
function interactionEmotion(day){
  const vals=[["🕊️","Pace"],["😊","Bucurie"],["💗","Tandrețe"],["🌱","Curaj"],["🥹","Dor"],["✨","Speranță"]];
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="emotion-grid">${vals.map(v=>`<button class="emotion" data-v="${v[1]}"><span>${v[0]}</span>${v[1]}</button>`).join("")}</div></div>`);
  document.querySelectorAll(".emotion").forEach(b=>b.onclick=()=>{state.interaction[day.id]=b.dataset.v;save();showQuestion(day)})
}
function interactionHold(day){
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="hold-circle" id="hold"><span id="heart">🤗</span></div><div class="progress-mini"><span id="bar"></span></div><div class="feedback" id="fb"></div></div>`);
  let start=0,raf;const h=document.querySelector("#hold"),bar=document.querySelector("#bar"),fb=document.querySelector("#fb");
  const tick=()=>{const p=Math.min(100,(performance.now()-start)/55);bar.style.width=p+"%";document.querySelector("#heart").style.transform=`scale(${1+p/190})`;if(p>=100)return showQuestion(day);raf=requestAnimationFrame(tick)};
  h.onpointerdown=e=>{start=performance.now();h.setPointerCapture(e.pointerId);raf=requestAnimationFrame(tick)};
  h.onpointerup=()=>{cancelAnimationFrame(raf);if(parseFloat(bar.style.width||0)<100){bar.style.width="0";fb.innerHTML=`<span class="feedback__emoji">😄</span>Așa repede? Îmbrățișările adevărate nu se grăbesc.`;fb.classList.add("is-visible")}}
}
function interactionCards(day){
  const cards=["Puterea","Sensibilitatea","Partea copilăroasă","Oboseala ascunsă"];
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="puzzle">${cards.map((x,i)=>`<button data-card="${i}">?</button>`).join("")}</div><div class="feedback" id="fb"></div></div>`);
  document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>{b.textContent=["💪","🤍","🎈","🌙"][b.dataset.card];document.querySelector("#fb").innerHTML=`Uneori oamenii văd rezultatul, dar nu și partea din tine care l-a purtat.`;document.querySelector("#fb").classList.add("is-visible");setTimeout(()=>showQuestion(day),900)})
}
function interactionPuzzle(day){
  const pieces=["S","I","N","C","E","R","I","T","A","T","E"];let found=0;
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="puzzle">${pieces.map((x,i)=>`<button data-p="${i}">🧩</button>`).join("")}</div><p id="word"></p></div>`);
  document.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{if(b.disabled)return;b.disabled=true;b.textContent=pieces[b.dataset.p];found++;document.querySelector("#word").textContent=pieces.slice(0,found).join("");if(found===pieces.length)setTimeout(()=>showQuestion(day),600)})
}
function interactionTrap(day){
  if(profile==="eugeniu"){
    el.view.innerHTML=scene(day,`<div class="interactive-box"><p>Apasă inima de câte ori crezi că te-ai gândit astăzi la Alina.</p><button class="answer answer--primary" id="countHeart">❤️ <span id="heartCount">0</span></button><div class="feedback" id="fb"></div></div>`);
    let count=0;const button=document.querySelector("#countHeart"),number=document.querySelector("#heartCount"),fb=document.querySelector("#fb");
    button.onclick=()=>{count++;number.textContent=count;button.style.transform=`scale(${Math.min(1.32,1+count*.025)})`;if(count===8){fb.innerHTML=`<span class="feedback__emoji">😄</span>Site-ul a înțeles. Numărătoarea reală este, probabil, imposibilă.`;fb.classList.add("is-visible");setTimeout(()=>showQuestion(day),900)}};
    return;
  }
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="answers" id="trap"><button class="answer answer--primary" id="yes">Da ❤️</button><button class="answer" id="no">Nu</button></div><div class="feedback" id="fb"></div></div>`);
  let n=0;const yes=document.querySelector("#yes"),no=document.querySelector("#no"),fb=document.querySelector("#fb");
  yes.onclick=()=>{n++;if(n===1){move(yes);fb.innerHTML=`<span class="feedback__emoji">😄</span>Prea repede. Mai încearcă.`;fb.classList.add("is-visible")}else{yes.style.display="none";fb.innerHTML=`<span class="feedback__emoji">🤨</span>Acum apasă „Nu”. Ai încredere.`}};
  no.onclick=()=>{fb.innerHTML=`<span class="feedback__emoji">🤨</span>Tu și…?`;no.textContent="Da, mi-e foarte dor ❤️";no.className="answer answer--primary";no.onclick=()=>showQuestion(day)}
}
function move(b){const p=b.parentElement;b.style.position="absolute";b.style.left=Math.random()*Math.max(10,p.clientWidth-b.offsetWidth)+"px";b.style.top=Math.random()*90+"px"}
function interactionSymbols(day){
  const s=[["🤲","Mâna"],["🤗","Îmbrățișarea"],["💬","Conversația"],["🙏","Rugăciunea"],["👀","Privirea"],["😘","Sărutul"]];
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="emotion-grid">${s.map(x=>`<button class="emotion"><span>${x[0]}</span>${x[1]}</button>`).join("")}</div></div>`);
  document.querySelectorAll(".emotion").forEach(b=>b.onclick=()=>showQuestion(day))
}
function interactionBridge(day){
  const p=["Comunicare","Rugăciune","Respect","Răbdare","Responsabilitate"];let n=0;
  el.view.innerHTML=scene(day,`<div class="interactive-box"><p>Alege trei scânduri pentru podul nostru.</p><div class="answers">${p.map(x=>`<button class="answer" data-b="${x}">${x}</button>`).join("")}</div></div>`);
  document.querySelectorAll("[data-b]").forEach(b=>b.onclick=()=>{if(b.classList.contains("is-selected"))return;b.classList.add("is-selected");n++;if(n>=3)setTimeout(()=>showQuestion(day),500)})
}
function interactionStars(day){
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="star-board">${Array.from({length:15},(_,i)=>`<button class="star-button" data-s="${i}">★</button>`).join("")}</div></div>`);
  let n=0;document.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{if(b.classList.contains("is-lit"))return;b.classList.add("is-lit");n++;if(n>=10)setTimeout(()=>showQuestion(day),500)})
}
function interactionMeteor(day){
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div style="font-size:100px;animation:floatUp 2.5s linear infinite">☄️</div><button class="answer answer--primary" id="seen">Am văzut una ✨</button><button class="answer" id="notSeen">Încă nu</button></div>`);
  document.querySelector("#seen").onclick=()=>showQuestion(day);document.querySelector("#notSeen").onclick=()=>{document.querySelector("#notSeen").textContent="Mai privesc puțin cerul 🌌";setTimeout(()=>showQuestion(day),900)}
}
function interactionRelease(day){
  const worries=["Griji","Frică","Oboseală","Nesiguranță","Singurătate"];
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="answers">${worries.map(x=>`<button class="answer" data-w="${x}">${x}</button>`).join("")}</div></div>`);
  let n=0;document.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{b.style.opacity="0";b.style.transform="translateY(35px)";b.disabled=true;n++;if(n===worries.length)setTimeout(()=>showQuestion(day),500)})
}
function interactionWords(day){
  el.view.innerHTML=scene(day,`<div class="interactive-box"><h2 id="changing">Sentiment</h2><p>Privește ce rămâne.</p></div>`);
  setTimeout(()=>{document.querySelector("#changing").style.opacity=".2";setTimeout(()=>{document.querySelector("#changing").textContent="Alegere";document.querySelector("#changing").style.opacity="1";setTimeout(()=>showQuestion(day),900)},800)},1100)
}
function interactionFuture(day){
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="cloud"><div class="cloud__city">🏡</div><div class="cloud__fog" id="futureFog"></div></div><button class="answer answer--primary" id="clearFuture">Privesc o seară simplă</button></div>`);
  document.querySelector("#clearFuture").onclick=()=>{document.querySelector("#futureFog").style.opacity="0";setTimeout(()=>showQuestion(day),800)}
}
function interactionFinal(day){
  el.view.innerHTML=scene(day,`<div class="interactive-box"><div class="puzzle">${Array.from({length:9},(_,i)=>`<button data-f="${i}">🧩</button>`).join("")}</div><p id="finalText"></p></div>`);
  let n=0;document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{if(b.disabled)return;b.disabled=true;b.textContent=["🤍","🙏","🤝","💬","🕊️","✨","🤗","♾️","❤️"][b.dataset.f];n++;if(n===9){document.querySelector("#finalText").textContent="Toate piesele au ajuns la locul lor.";setTimeout(()=>showQuestion(day),800)}})
}
function showQuestion(day){
  const q=day.question[profile], opts=day.options?.[profile] || [];
  const multi=Boolean(day.multi), allowCustom=day.allowCustom!==false;
  const optionsHtml=opts.length?`<div class="answers" id="opts">${opts.map(x=>`<button class="answer" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div>`:"";
  const customHtml=allowCustom&&opts.length?`<div class="custom-answer"><label for="customText">Alt răspuns, în cuvintele mele</label><textarea class="textarea textarea--compact" id="customText" maxlength="800" placeholder="Scrie aici ceva ce nu se regăsește în variante…"></textarea></div>`:"";
  const freeTextHtml=!opts.length?`<textarea class="textarea" id="text" maxlength="1000" placeholder="Scrie sincer, în ritmul tău…"></textarea>`:"";
  el.view.innerHTML=scene(day,`<div class="quote">${esc(q)}</div>${multi&&opts.length?`<p class="small-note">Poți alege mai multe variante și poți adăuga propriul răspuns.</p>`:""}${optionsHtml}${freeTextHtml}${customHtml}<p class="small-note">Răspunsul rămâne pe telefonul tău până când alegi să-l trimiți.</p><div class="feedback" id="fb"></div><button class="continue" id="saveAnswer">Păstrez răspunsul ❤️</button>`);
  const selected=[];
  const custom=document.querySelector("#customText");
  const free=document.querySelector("#text");
  const saveButton=document.querySelector("#saveAnswer");
  const update=()=>{
    const parts=[...selected];
    const freeValue=free?.value.trim();
    const customValue=custom?.value.trim();
    if(freeValue) parts.push(freeValue);
    if(customValue) parts.push(customValue);
    saveButton.classList.toggle("is-visible",parts.length>0);
    return parts;
  };
  document.querySelectorAll("[data-v]").forEach(button=>button.onclick=()=>{
    const value=button.dataset.v;
    if(multi){
      button.classList.toggle("is-selected");
      const i=selected.indexOf(value);
      if(i>=0) selected.splice(i,1); else selected.push(value);
    }else{
      document.querySelectorAll("[data-v]").forEach(x=>x.classList.remove("is-selected"));
      button.classList.add("is-selected"); selected.splice(0,selected.length,value);
    }
    update();
  });
  if(custom) custom.oninput=update;
  if(free) free.oninput=update;
  saveButton.onclick=()=>{
    const parts=update();
    if(!parts.length) return;
    complete(day,parts.join(" • "));
  };
}
function complete(day,answer){
  state.answers[day.id]={answer,question:day.question[profile],profile,thought:day.thought,date:new Date().toISOString()};
  state.completed[day.id]=true;state.keepsakes[day.id]=day.keepsake||day.title;save();updateHeader();celebrate(day);renderCompleted(day)
}
function celebrate(day){
  const burst=document.createElement("div");burst.className="celebration";burst.innerHTML=Array.from({length:18},(_,i)=>`<span style="--i:${i}">${i%3===0?"❤️":i%3===1?"✨":"✦"}</span>`).join("");document.body.appendChild(burst);setTimeout(()=>burst.remove(),1800);
}
function renderCompleted(day){
  const r=state.answers[day.id];
  el.view.innerHTML=scene(day,`<div class="feedback is-visible"><span class="feedback__emoji">✨</span>${esc(day.thought)}</div><div class="quote"><strong>Întrebarea mea:</strong><br>${esc(r.question)}<br><br><strong>Răspunsul meu:</strong><br>${esc(r.answer)}</div><div class="result-panel"><h3>Partea mea de drum este gata</h3><p>Creează o imagine și trimite-o celuilalt prin WhatsApp. Apoi comparați răspunsurile fără să căutați cine a răspuns „mai bine”.</p><div class="action-grid"><button class="primary" id="makeCard">Creează imaginea ❤️</button><button id="shareText">Trimite textul</button></div></div><div class="result-panel ritual-panel"><h3>🙏 Rugăciunea capitolului</h3><p>${esc(day.prayer||"Doamne, păzește-ne și apropie-ne inimile.")}</p></div><div class="result-panel teaser-panel"><h3>🌙 Până mâine…</h3><p>${esc(day.teaser||"Mâine vom face încă un pas.")}</p></div><div class="result-panel"><h3>Lasă ceva pentru mâine</h3><p>Poți lăsa o întrebare, un gând sau o mică surpriză. Vei primi o legătură specială pentru ${other().name}.</p><div class="action-grid"><button id="goTomorrow">Scrie pentru mâine 💌</button><button id="openInbox">Deschide ce am primit</button></div></div>`);
  document.querySelector("#makeCard").onclick=()=>makeCard(day,r);
  document.querySelector("#shareText").onclick=()=>shareText(day,r);
  document.querySelector("#goTomorrow").onclick=()=>{document.querySelector('[data-view="tomorrow"]').click()};
  document.querySelector("#openInbox").onclick=openInbox;
}
function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines=20){
  const words=String(text).trim().split(/\s+/).filter(Boolean);let line="",lines=0;
  for(let index=0;index<words.length;index++){
    const word=words[index],test=line?`${line} ${word}`:word;
    if(ctx.measureText(test).width>maxWidth&&line){
      lines++;
      if(lines>=maxLines){ctx.fillText(`${line.replace(/[.,;:!?]*$/,"")}…`,x,y);return y+lineHeight}
      ctx.fillText(line,x,y);y+=lineHeight;line=word;
    }else line=test;
  }
  if(line)ctx.fillText(line,x,y);return y+lineHeight
}
async function makeCard(day,r){
  const c=el.canvas,ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);
  const g=ctx.createLinearGradient(0,0,1080,1350);g.addColorStop(0,profile==="alina"?"#251326":"#10243c");g.addColorStop(1,"#0b1020");ctx.fillStyle=g;ctx.fillRect(0,0,1080,1350);
  for(let i=0;i<55;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.35})`;ctx.beginPath();ctx.arc(Math.random()*1080,Math.random()*700,Math.random()*2.6+1,0,Math.PI*2);ctx.fill()}
  ctx.textAlign="center";ctx.fillStyle="#ffb1cb";ctx.font="700 30px Arial";ctx.fillText("ÎNTRE NOI",540,90);
  ctx.fillStyle="#fff";ctx.font="700 58px Arial";ctx.fillText(`Ziua ${day.id} · ${day.title}`,540,175);
  ctx.font="90px Arial";ctx.fillText(day.icon,540,285);
  ctx.fillStyle="#c9c6d5";ctx.font="34px Arial";ctx.fillText(`${person().name} · ${person().city}`,540,350);
  ctx.textAlign="left";ctx.fillStyle="#ffb1cb";ctx.font="700 31px Arial";ctx.fillText("Întrebarea mea",100,440);
  ctx.fillStyle="#fff";ctx.font="36px Arial";let y=wrapText(ctx,r.question,100,495,880,48,5);
  ctx.fillStyle="#79ddb3";ctx.font="700 31px Arial";ctx.fillText("Răspunsul meu",100,y+25);
  ctx.fillStyle="#fff";ctx.font="38px Arial";y=wrapText(ctx,r.answer,100,y+82,880,52,8);
  ctx.fillStyle="#c9c6d5";ctx.font="italic 31px Arial";wrapText(ctx,day.thought,100,1110,880,43,4);
  ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="42px Arial";ctx.fillText(profile==="alina"?"Menton  ✦────❤️────✦  Paris":"Paris  ✦────❤️────✦  Menton",540,1280);
  const blob=await new Promise(res=>c.toBlob(res,"image/png"));const file=new File([blob],`intre-noi-ziua-${day.id}-${profile}.png`,{type:"image/png"});const url=URL.createObjectURL(blob);
  el.shareContent.innerHTML=`<h2>Imaginea este gata</h2><img class="preview-image" src="${url}" alt="Rezultatul zilei"><div class="action-grid"><button class="primary" id="shareImage">Trimite prin WhatsApp ❤️</button><button id="downloadImage">Salvează imaginea</button></div><p class="small-note">Pe iPhone se va deschide meniul de distribuire. Alege WhatsApp, Mesaje sau aplicația dorită.</p>`;
  el.shareDialog.showModal();
  document.querySelector("#shareImage").onclick=async()=>{
    try{
      if(navigator.canShare?.({files:[file]})) await navigator.share({files:[file],title:"Între noi ❤️",text:`Ziua ${day.id} — partea mea de drum`});
      else download(url,file.name);
    }catch(error){if(error?.name!=="AbortError") download(url,file.name)}
  };
  document.querySelector("#downloadImage").onclick=()=>download(url,file.name)
}
function download(url,name){const a=document.createElement("a");a.href=url;a.download=name;a.click()}
async function shareText(day,r){
  const text=`ÎNTRE NOI ❤️\nZiua ${day.id} — ${day.title}\n\n${r.question}\n\nRăspunsul meu (${person().name}):\n${r.answer}\n\n${day.thought}`;
  try{
    if(navigator.share) await navigator.share({title:"Între noi ❤️",text});
    else {await navigator.clipboard.writeText(text);alert("Textul a fost copiat")}
  }catch(error){if(error?.name!=="AbortError"){await navigator.clipboard.writeText(text);alert("Textul a fost copiat")}}
}
function renderTomorrow(){
  if(!profile)return chooseProfile();
  el.view.innerHTML=`<article class="scene"><div class="scene__eyebrow">Din astăzi pentru mâine</div><div class="scene__icon">💌</div><h2>Lasă ceva pentru ${other().name}</h2><p class="scene__lead">Alege forma mesajului. Linkul poate fi trimis astăzi, dar conținutul se va deschide abia mâine.</p><div class="tomorrow-card"><div class="type-tabs"><button class="is-active" data-kind="question">Întrebare</button><button data-kind="thought">Gând</button><button data-kind="surprise">Surpriză</button></div><textarea class="textarea" id="tomorrowText" placeholder="Scrie ceva care merită să aștepte până mâine…"></textarea><div class="answers answers--single"><button class="answer answer--primary" id="createLetter">Creează legătura pentru mâine 💌</button></div><div class="feedback" id="letterFb"></div></div><div class="inbox" id="inbox"></div></article>`;
  let kind="question";document.querySelectorAll("[data-kind]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-kind]").forEach(x=>x.classList.remove("is-active"));b.classList.add("is-active");kind=b.dataset.kind});
  document.querySelector("#createLetter").onclick=()=>createTomorrowLink(kind,document.querySelector("#tomorrowText").value.trim());
  renderInboxInline()
}
function tomorrowISO(){
  const [year,month,day]=today().split("-").map(Number);
  const next=new Date(Date.UTC(year,month-1,day+1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth()+1).padStart(2,"0")}-${String(next.getUTCDate()).padStart(2,"0")}`
}
function encodePayload(obj){return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}
function decodePayload(s){s=s.replaceAll("-","+").replaceAll("_","/");while(s.length%4)s+="=";return JSON.parse(decodeURIComponent(escape(atob(s))))}
function createTomorrowLink(kind,text){
  const fb=document.querySelector("#letterFb");if(!text){fb.textContent="Scrie mai întâi mesajul.";fb.classList.add("is-visible");return}
  const payload={from:profile,to:otherId(),kind,text,openDate:tomorrowISO(),created:new Date().toISOString()};
  const url=new URL(location.origin+location.pathname);url.searchParams.set("letter",encodePayload(payload));
  const share=`Am lăsat ceva pentru tine în „Între noi”. Se va deschide mâine 💌\n${url}`;
  fb.innerHTML=`<span class="feedback__emoji">🔒</span>Mesajul a fost sigilat pentru mâine.<div class="action-grid"><button class="primary" id="shareLetter">Trimite prin WhatsApp</button><button id="copyLetter">Copiază legătura</button></div>`;fb.classList.add("is-visible");
  document.querySelector("#shareLetter").onclick=async()=>navigator.share?navigator.share({title:"Pentru mâine 💌",text:share}):navigator.clipboard.writeText(share);
  document.querySelector("#copyLetter").onclick=async()=>{await navigator.clipboard.writeText(share);alert("Legătura a fost copiată")}
}
function importLetterFromURL(){
  const u=new URL(location.href),raw=u.searchParams.get("letter");if(!raw)return null;
  try{
    const payload=decodePayload(raw);
    const all=readJSON(MAILBOX,[]);
    if(!all.some(item=>item.created===payload.created)){all.push(payload);localStorage.setItem(MAILBOX,JSON.stringify(all))}
    u.searchParams.delete("letter");history.replaceState({},"",u);
    return payload;
  }catch(error){console.warn("Legătura primită nu a putut fi citită",error);return null}
}
function showImportedLetter(message){
  if(message.to!==profile){
    el.letterContent.innerHTML=`<h2>Mesaj pentru ${esc(config.people[message.to]?.name||"celălalt profil")}</h2><p>Acest plic aparține celuilalt profil de pe site. Schimbă profilul doar dacă acesta este telefonul lui.</p>`;
  }else if(today()<message.openDate){
    el.letterContent.innerHTML=`<h2>Un plic a ajuns de la ${esc(config.people[message.from].name)} 💌</h2><div class="envelope"><strong>🔒 Se deschide pe ${esc(message.openDate)}</strong><p>Mesajul este păstrat pe acest dispozitiv și va putea fi citit la data stabilită.</p></div>`;
  }else{
    el.letterContent.innerHTML=`<h2>Ai primit ceva de la ${esc(config.people[message.from].name)} 💌</h2><div class="envelope"><strong>${message.kind==="question"?"Întrebare":message.kind==="thought"?"Gând":"Surpriză"}</strong><p>${esc(message.text)}</p></div>`;
  }
  el.letterDialog.showModal();
}
function mailbox(){return readJSON(MAILBOX,[]).filter(x=>!profile||x.to===profile)}
function openInbox(){
  const box=mailbox();el.letterContent.innerHTML=`<h2>Ce ai primit</h2>${box.length?box.map((m,i)=>{const locked=today()<m.openDate;return `<div class="envelope"><strong>${locked?"🔒 Se deschide "+m.openDate:"💌 De la "+config.people[m.from].name}</strong><p>${locked?"Mesajul este deja aici, dar încă doarme.":esc(m.text)}</p></div>`}).join(""):`<p>Nu ai primit încă niciun mesaj pentru mâine.</p>`}`;el.letterDialog.showModal()
}
function renderInboxInline(){
  const box=mailbox(),target=document.querySelector("#inbox");if(!target)return;
  target.innerHTML=box.length?`<h3>Mesaje primite</h3>`+box.map(m=>`<div class="envelope"><strong>${today()<m.openDate?"🔒 Se deschide "+m.openDate:"💌 "+config.people[m.from].name}</strong><p>${today()<m.openDate?"Conținutul rămâne ascuns până mâine.":esc(m.text)}</p></div>`).join(""):""
}
function renderPath(){
  const cards=days.map(d=>`<button class="day-card ${!unlocked(d)?"is-locked":""} ${state.completed[d.id]?"is-complete":""}" data-day="${d.id}" ${!unlocked(d)?"disabled":""}><span class="day-card__num">Ziua ${d.id}</span><span class="day-card__title">${d.icon} ${d.title}</span><span class="day-card__status">${state.completed[d.id]?"Urma mea este păstrată ✨":unlocked(d)?"Deschisă":"Se deschide la data ei 🔒"}</span></button>`).join("");
  el.view.innerHTML=`<div class="day-grid">${cards}</div>`;document.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>renderDay(days[Number(b.dataset.day)-1]))
}
function renderTraces(){
  const done=days.filter(d=>state.completed[d.id]);
  el.view.innerHTML=done.length?`<div class="trace-list">${done.map(d=>{const r=state.answers[d.id];return `<article class="trace"><h3>Ziua ${d.id} · ${d.title}</h3><p><strong>Întrebare:</strong> ${esc(r.question)}</p><p><strong>Răspuns:</strong> ${esc(r.answer)}</p><p>${esc(d.thought)}</p></article>`}).join("")}</div>`:`<article class="scene"><div class="scene__icon">✨</div><h2>Prima urmă încă nu a apărut</h2><p class="scene__lead">După primul răspuns, el va rămâne aici.</p></article>`
}
function createSky(){
  const sky=document.querySelector("#sky"),chars=["✦","✧","·","♡","🦋"];
  setInterval(()=>{const s=document.createElement("span");s.className="star";s.textContent=chars[Math.floor(Math.random()*chars.length)];s.style.left=Math.random()*100+"vw";s.style.fontSize=10+Math.random()*20+"px";s.style.animationDuration=8+Math.random()*8+"s";sky.appendChild(s);setTimeout(()=>s.remove(),17000)},900);
  setInterval(()=>{const m=document.createElement("span");m.className="shooting-star";m.textContent="✦";m.style.top=8+Math.random()*35+"vh";sky.appendChild(m);setTimeout(()=>m.remove(),1800)},14000);
}
load().catch(error=>{
  console.error("Între noi — eroare de pornire",error);
  const box=document.querySelector("#loadError");
  if(box){box.style.display="block";box.textContent=`Site-ul nu a pornit: ${error.message}. Toate cele 5 fișiere trebuie încărcate în rădăcina repository-ului.`}
  if(el.view) el.view.innerHTML=`<article class="scene"><div class="scene__icon">⚠️</div><h2>Pagina nu s-a încărcat complet</h2><p class="scene__lead">Verifică dacă index.html, style.css, app.js, config.json și days.json sunt unul lângă altul în GitHub.</p></article>`;
});
