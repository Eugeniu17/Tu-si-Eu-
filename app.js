const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec=s=>JSON.parse(decodeURIComponent(escape(atob(s))));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

const [config,days]=await Promise.all([fetch('config.json?v=15').then(r=>r.json()),fetch('days.json?v=15').then(r=>r.json())]);
const STORE='intre-noi-cinematic-v12'; // păstrăm progresul V12
const blank={profile:null,answers:{},steps:{},completed:{},otherDone:{},photos:{},photoModes:{},photoEffects:{},photoRotations:{},tomorrow:[],openedMusic:{},sealed:{},songLetters:[],celebrated:{},magic:{},sharedSecrets:[]};
let state={...blank,...JSON.parse(localStorage.getItem(STORE)||'{}')};
let profile=state.profile,currentDay=null,stage=0,view='today',selected=[],photoData='';

function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function dateParis(add=0){const now=new Date(Date.now()+add*864e5);return new Intl.DateTimeFormat('en-CA',{timeZone:config.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
function indexToday(){const d=dateParis();const i=days.findIndex(x=>x.date===d);if(i>=0)return i;return d<days[0].date?0:days.length-1}
function available(d){return d.date<=dateParis()}
function current(){const unlocked=days.filter(available);return unlocked.at(-1)||days[0]}
function me(){return config.people[profile]||null}
function otherKey(){return profile==='alina'?'eugeniu':'alina'}
function other(){return config.people[otherKey()]}

function init(){importHash();bindGlobal();if(!profile)chooseProfile();else openToday()}
function bindGlobal(){
 $('#profileBtn').onclick=chooseProfile;$('#homeBtn').onclick=openToday;$('#closeDialog').onclick=()=>$('#dialog').close();
 $$('.nav button').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
}
function chooseProfile(){
 $('#dialogBody').innerHTML=`<div class="kicker">POVESTEA ESTE PENTRU DOI</div><h2>Cine ești astăzi?</h2><p>Alegerea rămâne pe telefonul acesta.</p><div class="choices"><button class="choice" data-profile="alina">🦋 Sunt Alina · Menton</button><button class="choice" data-profile="eugeniu">❤️ Sunt Eugeniu · Paris</button></div>`;
 $('#dialog').showModal();$$('[data-profile]').forEach(b=>b.onclick=()=>{profile=b.dataset.profile;state.profile=profile;save();$('#dialog').close();openToday()})
}
function switchView(v){view=v;$$('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));if(v==='today')openToday();if(v==='journey')renderJourney();if(v==='album')renderAlbum();if(v==='music')renderMusic();if(v==='tomorrow')renderTomorrow()}
function openToday(){view='today';$$('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='today'));currentDay=current();stage=state.steps[currentDay.id]||0;photoData=state.photos[currentDay.id]||'';renderHero();renderChapter()}

function renderHero(advance=0){
 const d=currentDay||current(),completed=Object.keys(state.completed).filter(k=>state.completed[k]).length;
 const progress=Math.max(1,Math.min(15,d.id+advance)),t=(progress-1)/14;
 const leftX=92+312*t,rightX=808-312*t,midY=155-26*Math.sin(Math.PI*t);
 const final=progress===15&&state.completed[15]&&state.otherDone[15];
 $('#profileBtn').textContent=me()?`${me().emoji} ${me().name}`:'Alege profilul';
 $('#hero').innerHTML=`<div class="route-card ${final?'route-finale':''}">
  <div class="route-art meeting-map">
   <div class="sun"></div><div class="cloud c1">☁️</div><div class="cloud c2">☁️</div>
   <svg class="route-svg" viewBox="0 0 900 310" aria-label="Două inimi se apropie">
    <path class="route-path" d="M90 220 C210 65 340 245 450 142"/><path class="route-path" d="M810 95 C690 190 590 25 450 142"/>
    <path class="route-done left-route" d="M90 220 C210 65 340 245 450 142" pathLength="100" stroke-dasharray="${t*100} 100"/>
    <path class="route-done right-route" d="M810 95 C690 190 590 25 450 142" pathLength="100" stroke-dasharray="${t*100} 100"/>
    <text x="55" y="258" class="landmark">🗼</text><text x="43" y="288" class="city-label">Paris · Eugeniu</text>
    <text x="430" y="258" class="landmark">🏔️</text><text x="790" y="125" class="landmark">🌴</text><text x="742" y="67" class="city-label">Menton · Alina</text>
    <g class="traveler traveler-left" transform="translate(${leftX} ${midY})"><text text-anchor="middle" class="route-heart">❤️</text><text y="28" text-anchor="middle" class="traveler-name">E</text></g>
    <g class="traveler traveler-right" transform="translate(${rightX} ${midY-18})"><text text-anchor="middle" class="route-heart alina-heart">💗</text><text y="28" text-anchor="middle" class="traveler-name">A</text></g>
    ${final?'<g class="meeting-burst"><circle cx="450" cy="142" r="58"/><text x="450" y="166" text-anchor="middle">❤️</text></g>':''}
   </svg><div class="water"></div>
  </div>
  <div class="route-copy"><div class="kicker">DOUĂ DRUMURI · UN PUNCT DE ÎNTÂLNIRE</div>
   <h1>${final?'Ne-am întâlnit la mijloc.':`Ziua ${d.id}: amândoi facem un pas`}</h1><p>${d.story}</p>
   <div class="progress">${days.map(x=>`<i class="${x.id<=progress?'done':''}"></i>`).join('')}</div>
   <div class="progress-note"><span class="pill">${completed}/15 zile sigilate</span><span class="pill">${Math.max(0,15-progress)} pași până la mijloc</span><span class="pill">${state.otherDone[d.id]?'Amândoi azi ✓':'Așteptăm a doua inimă'}</span></div>
  </div></div>`;
 if(final&&!state.celebrated[15]){state.celebrated[15]=true;save();setTimeout(showFinalCelebration,500)}
}
function renderChapter(){
 const d=currentDay;document.body.dataset.theme=d.theme||'start';
 const labels=['Deschide',d.music?'Ascultăm & vorbim':(d.magicLabel||'Atmosferă'),'Gest','Întrebare','Alegere','Rugăciunea serii','Sigiliu'];
 $('#app').innerHTML=`<article class="chapter theme-${esc(d.theme||'start')}"><header class="chapter-head"><div class="kicker">CAPITOLUL ${d.id} · ${esc(d.date)}</div><div class="chapter-icon">${d.icon}</div><h2>${esc(d.title)}</h2><p>${esc(d.story)}</p><blockquote>${esc(d.scripture||'')}</blockquote></header><div class="step-map">${labels.map((l,i)=>`${i?'<span></span>':''}<button class="${i<stage?'done':i===stage?'current':''}" data-step="${i}" title="${esc(l)}"><em>${i<stage?'✓':i+1}</em><small>${esc(l)}</small></button>`).join('')}</div><div class="stage" id="stage"></div></article>`;
 $$('[data-step]').forEach(b=>b.onclick=()=>{const n=+b.dataset.step;if(n<=stage){stage=n;renderStage()}});renderStage()
}
function advance(){stage=Math.min(6,stage+1);state.steps[currentDay.id]=Math.max(state.steps[currentDay.id]||0,stage);save();renderChapter();scrollTo({top:$('#app').offsetTop-92,behavior:'smooth'})}
function card(title,html,intro=''){return `<div class="stage-card">${intro?`<div class="stage-intro">${intro}</div>`:''}<h3>${title}</h3>${html}</div>`}
function answer(){return state.answers[currentDay.id]||{}}
function setAns(k,v){state.answers[currentDay.id]={...answer(),[k]:v};save()}
function renderStage(){
 selected=(answer().selected||[]).slice();photoData=state.photos[currentDay.id]||'';const d=currentDay,root=$('#stage');
 if(stage===0)root.innerHTML=card('Deschide ziua',`${receivedLetter()}<div class="opening-ritual"><div class="tiny-cross">✦</div><p>Oprește-te o clipă. Ziua aceasta nu este un test. Este o conversație între doi oameni care Îl pun pe Dumnezeu în centru și pot vorbi despre orice cu sinceritate.</p></div><button class="primary" id="go">Deschide capitolul ${d.id}</button>`,`<b>${esc(d.scripture||'')}</b>`);
 if(stage===1)root.innerHTML=magicStage(d);
 if(stage===2)root.innerHTML=card('Un gest real, astăzi',`<p class="lead"><b>${esc(d.action)}</b></p><p>${esc(d.build)}</p>${d.photo?photoUI(d.photo):''}<textarea id="actionText" class="textarea" placeholder="Ce fac concret, când și cum?">${esc(answer().action||'')}</textarea><button class="primary" id="saveAction">Am ales gestul și momentul</button>`,'<b>Nu „după vacanță”. Nu „cândva”. Astăzi, în măsura în care pot.</b>');
 if(stage===3)root.innerHTML=card('Cunoaște-mă mai bine',`<p class="lead"><b>${esc(d.question)}</b></p>${d.options?.length?`<div class="choices map-choices">${d.options.map((o,i)=>`<button class="choice ${selected.includes(o)?'selected':''}" data-choice="${esc(o)}"><i>${i+1}</i>${esc(o)}</button>`).join('')}</div>`:''}<textarea id="answerText" class="textarea" placeholder="Scrie sincer. Poți spune orice; nu există răspunsul perfect.">${esc(answer().text||'')}</textarea><button class="primary" id="saveAnswer">Păstrează răspunsul</button>`);
 if(stage===4)root.innerHTML=card('Din adevăr într-o alegere',`<p>${esc(d.build)}</p><textarea id="buildText" class="textarea" placeholder="Pasul meu: ce fac, când îl fac și cum vei putea observa?">${esc(answer().build||'')}</textarea><details class="secret-box" ${answer().secret?'open':''}><summary>🤍 Ce mi-e greu sau rușine să spun… (opțional)</summary><p>${esc(d.secretPrompt||'Ceva ce încă nu am spus…')}</p><textarea id="secretText" class="textarea compact" placeholder="Acest gând poate rămâne în plic și se poate deschide mâine.">${esc(answer().secret||'')}</textarea><label class="checkline"><input type="checkbox" id="secretTomorrow" ${answer().secretTomorrow?'checked':''}> Trimite această mărturisire în secret pentru mâine</label></details><button class="primary" id="saveBuild">Îmi asum pasul acesta</button>`,'<b>Iubirea creștină nu este doar emoție. Este adevăr, alegere, slujire și har.</b>');
 if(stage===5){const oldPrayer=(answer().prayerText||answer().prayers?.filter(Boolean).join('\n• ')||'');root.innerHTML=card('Rugăciunea noastră pentru diseară',`${fastingBlock(d)}<p>Nu trebuie să împărțiți rugăciunea în trei puncte și nici să completați o listă. Scrie simplu ce aveți pe inimă pentru seara aceasta: pentru voi, pentru relație, pentru familie, biserică sau orice nevoie reală.</p><div class="prayer-suggestions">${(d.prayer||[]).map(p=>`<button class="prayer-chip" data-prayer-suggestion="${esc(p)}">+ ${esc(p)}</button>`).join('')}</div><textarea id="prayerText" class="textarea prayer-main" placeholder="În seara aceasta ne rugăm pentru…\n\nPoți scrie un singur motiv sau mai multe, exact așa cum sunt în inima ta.">${esc(oldPrayer)}</textarea><p class="soft-note">Puteți adăuga ceva împreună și mai târziu. Rugăciunea nu este un formular; este conversația voastră sinceră cu Dumnezeu.</p><button class="primary" id="savePrayer">Păstrează rugăciunea pentru diseară</button>`);}
 if(stage===6)root.innerHTML=sealScreen();bindStage()
}
function playableEmbed(url){
 try{const u=new URL(url);if(u.hostname.includes('open.spotify.com')){const p=u.pathname.split('/').filter(Boolean).filter(x=>x!=='embed');if(p.length>=2)return `https://open.spotify.com/embed/${p[0]}/${p[1]}`}
 if(u.hostname.includes('youtu.be')){const id=u.pathname.split('/').filter(Boolean)[0];if(id)return `https://www.youtube-nocookie.com/embed/${id}?rel=0`}
 if(u.hostname.includes('youtube.com')){const id=u.searchParams.get('v');if(id)return `https://www.youtube-nocookie.com/embed/${id}?rel=0`}
 if(u.hostname.includes('soundcloud.com'))return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&hide_related=true`;}catch{}return ''
}

function searchLinks(title,artist=''){
 const q=encodeURIComponent([title,artist].filter(Boolean).join(' '));
 return {
  spotify:`https://open.spotify.com/search/${q}`,
  youtube:`https://www.youtube.com/results?search_query=${q}`,
  apple:`https://music.apple.com/fr/search?term=${q}`
 };
}
function musicServiceButtons(title,artist,url=''){
 const l=searchLinks(title,artist);
 return `<div class="music-services">
  ${url?`<a href="${esc(url)}" target="_blank" rel="noopener" class="service direct">▶ Deschide linkul ales</a>`:''}
  <a href="${l.spotify}" target="_blank" rel="noopener" class="service spotify">Spotify</a>
  <a href="${l.youtube}" target="_blank" rel="noopener" class="service youtube">YouTube</a>
  <a href="${l.apple}" target="_blank" rel="noopener" class="service apple">Apple Music</a>
 </div>`;
}
function dailyMusicCard(d){
 if(!d.music)return '';
 const m=d.music,discussed=!!answer().musicDiscussed;
 return `<section class="daily-music-card guided-music ${discussed?'music-discussed':''}">
  <div class="record-wrap"><div class="record"><i></i></div><span>♫</span></div>
  <div class="daily-music-copy"><div class="kicker">PASUL 1 · ASCULTĂM ÎMPREUNĂ · OPȚIONAL</div><h4>${esc(m.title)}</h4><p class="artist">${esc(m.artist||'')}</p><p>${esc(m.note||'')}</p><small>${esc(m.moment||'Ascult-o când ai liniște.')}</small>${musicServiceButtons(m.title,m.artist)}
  <div class="music-flow">
   <div class="music-flow-step"><em>1</em><div><b>Deschide piesa</b><p>Alege Spotify, YouTube sau Apple Music. Revino aici după ce ai ascultat cât simți că ai nevoie.</p></div></div>
   <div class="music-flow-step"><em>2</em><div><b>Nu trecem imediat mai departe</b><p>Spune ce cuvânt, idee sau emoție a rămas cu tine. Nu analizăm cine a înțeles „mai bine”.</p></div></div>
  </div>
  <textarea id="musicDiscussion" class="textarea compact" placeholder="Ce ai simțit? Ce parte te-a făcut să te gândești la Dumnezeu, la noi sau la ceva ce îți este greu să spui?">${esc(answer().musicDiscussion||'')}</textarea>
  <div class="music-discussion-actions"><button class="secondary" id="shareMusicThought">Am ascultat — vreau să vorbim despre asta</button><button class="ghost" id="skipMusicThought">Astăzi prefer liniștea</button></div>
  ${discussed?`<div class="music-complete">✓ Momentul muzical a fost păstrat. Acum deschidem atmosfera și conversația zilei.</div>`:''}
  <details class="song-confession"><summary>🤍 Las muzica să spună ce mi-e greu să spun</summary><textarea id="dailySongConfession" class="textarea compact" placeholder="Ce ai vrea să înțeleagă din această piesă?">${esc(answer().dailySongConfession||'')}</textarea><button class="secondary" id="saveDailySongConfession">Păstrează gândul</button></details></div>
 </section>`;
}
function availableSongLetter(){return state.songLetters.find(x=>x.openDate<=dateParis()&&!x.used)}
function magicStage(d){
 const gifted=availableSongLetter(),saved=answer().magicDone;
 const gift=gifted?`<div class="gift-song"><div class="gift-ribbon">O PIESĂ LĂSATĂ ÎN TAINĂ</div><h4>${esc(gifted.title||'Pentru tine')}</h4><p>${esc(gifted.note||'Ascult-o când ai liniște.')}</p>${musicServiceButtons(gifted.title||'Pentru tine',gifted.artist||'',gifted.url)}<button class="secondary" id="useGiftSong">Am primit-o în inimă ❤️</button></div>`:'';
 const scenes={
  'first-light':`<div class="magic-scene first-light-scene"><div class="dawn-sky"><span class="dawn-sun"></span><i class="bird b1">⌁</i><i class="bird b2">⌁</i><div class="city paris-dawn"><b>Paris</b><span>🗼</span><small>Eugeniu</small></div><div class="heart-path"><i>♡</i><i>♡</i><i>♡</i></div><div class="city menton-dawn"><b>Menton</b><span>🌊</span><small>Alina</small></div><div class="petals"><i>✦</i><i>♡</i><i>✦</i><i>♡</i></div></div><div class="first-light-copy"><b>Începem vii, sinceri și cu bucurie.</b><p>Nu aprindem o lumânare de despărțire. Deschidem două ferestre spre aceeași dimineață și Îl rugăm pe Dumnezeu să ne învețe să iubim prin adevăr, tandrețe și fapte.</p></div></div>`,
  window:`<div class="magic-scene window-scene"><div class="window-pane paris"><span>Paris</span><b>🗼</b></div><div class="window-pane menton"><span>Menton</span><b>🌊</b></div><div class="window-thread">♡</div><p>Două ferestre. Aceeași curiozitate: „Arată-mi cum vezi tu lumea.”</p></div>`,
  constellation:`<div class="magic-scene constellation-scene" id="constellation">${['Pace','Dor','Oboseală','Bucurie','Teamă','Recunoștință'].map((x,i)=>`<button data-star="${x}" style="--i:${i}">✦<small>${x}</small></button>`).join('')}<svg><path d="M55 90 L150 45 L235 105 L325 55 L410 115 L500 60"/></svg></div>`,
  listening:`<div class="magic-scene listening-scene"><div class="wave">${'<i></i>'.repeat(22)}</div><div class="listen-timer" id="listenTimer">00:30</div><button class="secondary" id="startListen">30 de secunde în care nu pregătesc răspunsul</button></div>`,
  mirror:`<div class="magic-scene mirror-scene"><div class="mirror"><span>Privește cu blândețe omul pe care Dumnezeu îl formează.</span></div><button class="secondary" id="revealMirror">Aburesc oglinda și scriu adevărul</button></div>`,
  'prayer-river':`<div class="magic-scene river-scene"><div class="river"><i></i><i></i><i></i></div><div class="stones"><button>Starea mea</button><button>Nevoia mea</button><button>Sprijinul tău</button></div></div>`,
  'stained-glass':`<div class="magic-scene glass-scene"><div class="glass-window"><i></i><i></i><i></i><i></i><span>✦</span></div><p>Lasă lumina Cuvântului să cadă peste felul în care iubești astăzi.</p></div>`,
  'home-puzzle':`<div class="magic-scene home-scene"><div class="home-pieces">${['Respect','Pace','Adevăr','Tandrețe','Limite','Rugăciune'].map(x=>`<button data-home="${x}">${x}</button>`).join('')}</div><div class="little-home">⌂<span id="homeCount">0/3</span></div><p>Alege trei cărămizi fără de care „acasă” nu poate exista.</p></div>`,
  bridge:`<div class="magic-scene bridge-scene"><div class="cliffs"><span>Intenție</span><span>Faptă</span></div><div class="bridge-planks">${['Ascult','Întreb','Fac','Revin','Țin minte'].map(x=>`<button data-plank="${x}">${x}</button>`).join('')}</div></div>`,
  meteor:`<div class="magic-scene meteor-scene"><div class="night-sky"><i></i><i></i><i></i><div class="shooting-star"></div><button id="makeWish">Las o speranță să cadă în rugăciune ✦</button></div>${gift}<details class="song-proposal"><summary>🎵 O piesă pentru cerul de azi (opțional)</summary><input id="magicSongTitle" class="input" placeholder="Titlul piesei"><input id="magicSongUrl" class="input" placeholder="Link exact Spotify / YouTube / SoundCloud"><textarea id="magicSongNote" class="textarea compact" placeholder="De ce ai ales-o și când să o asculte?"></textarea></details></div>`,
  unknot:`<div class="magic-scene knot-scene"><div class="rope"><i></i><i></i></div><button id="untie">Nu câștig împotriva ta. Dezlegăm nodul împreună.</button></div>`,
  'love-language':`<div class="magic-scene language-scene">${['Cuvinte','Timp','Ajutor','Tandrețe','Dar','Rugăciune'].map((x,i)=>`<button data-language="${x}" style="--i:${i}"><span>♡</span>${x}</button>`).join('')}</div>`,
  growth:`<div class="magic-scene growth-scene"><div class="seed"><i></i></div><button id="growPlant">Arată-mi rodul pe care poate încă nu l-am observat</button></div>`,
  suitcase:`<div class="magic-scene suitcase-scene"><div class="suitcase"><span id="packedWords"></span></div><div class="pack-choices">${['Rugăciune','Sinceritate','Timp','Tandrețe','Ascultare','Fapte'].map(x=>`<button data-pack="${x}">${x}</button>`).join('')}</div></div>`,
  'final-hearts':`<div class="magic-scene final-magic"><div class="final-road"><span class="final-half left">♥</span><span class="final-half right">♥</span><div class="final-whole">♥</div></div><p>Nu ne întâlnim pentru că știm deja totul, ci pentru că am făcut pași adevărați și Îl rugăm pe Dumnezeu să ne conducă mai departe.</p>${gift}<details class="song-proposal"><summary>🎵 Alegeți împreună piesa care închide acest capitol (opțional)</summary><input id="magicSongTitle" class="input" placeholder="Titlul piesei"><input id="magicSongUrl" class="input" placeholder="Link exact"><textarea id="magicSongNote" class="textarea compact" placeholder="De ce este piesa voastră pentru final?"></textarea></details></div>`
 };
 if(d.music&&!answer().musicDiscussed){return card('Ascultăm și apoi vorbim',`${dailyMusicCard(d)}`,`<b>Muzica nu este decor. O ascultăm, ne oprim și discutăm înainte să deschidem următorul pas.</b>`)}
 return card(d.magicLabel||'Atmosfera zilei',`${d.music?dailyMusicCard(d):''}${gift}${scenes[d.magic]||scenes.window}<textarea id="magicNote" class="textarea compact" placeholder="Ce ai simțit și ce ai vrea să discutăm după acest moment?">${esc(answer().magicNote||'')}</textarea><button class="primary" id="magicDone">${saved?'Moment păstrat ✓':'Am trăit momentul — mergem la gestul de azi'}</button>`,`<b>Nu alergăm prin pași. Ascultăm, vorbim, apoi alegem un gest real.</b>`)
}
function bindStage(){
 $('#go')?.addEventListener('click',advance);
 bindMagic();
 $('#openReceivedLetter')?.addEventListener('click',openReceivedLetter);
 $$('[data-song]').forEach(b=>b.onclick=()=>{setAns('songChoice',b.dataset.song);renderStage()});
 $('#useGiftSong')?.addEventListener('click',()=>{const g=availableSongLetter();if(g){g.used=true;save();renderStage()}});
 $('#saveDailySongConfession')?.addEventListener('click',()=>{setAns('dailySongConfession',$('#dailySongConfession').value.trim());alert('Gândul a fost păstrat în ziua aceasta 🤍')});
 $('#shareMusicThought')?.addEventListener('click',()=>{const v=$('#musicDiscussion')?.value.trim();if(!v)return alert('Scrie măcar un gând sau o emoție rămasă după piesă.');state.answers[currentDay.id]={...answer(),musicDiscussion:v,musicDiscussed:true};save();renderStage();setTimeout(()=>$('.music-complete')?.scrollIntoView({behavior:'smooth',block:'center'}),80)});
 $('#skipMusicThought')?.addEventListener('click',()=>{state.answers[currentDay.id]={...answer(),musicDiscussion:'Astăzi am ales să păstrez liniștea.',musicDiscussed:true};save();renderStage()});
 $('#heard')?.addEventListener('click',()=>{setAns('music',$('#musicNote').value.trim()||'Am ascultat melodia.');const title=$('#songTitleTomorrow')?.value.trim(),url=$('#songUrlTomorrow')?.value.trim(),note=$('#songNoteTomorrow')?.value.trim();if(title&&url)setAns('songProposal',{title,url,note});state.openedMusic[currentDay.id]=true;save();advance()});
 $('#saveAction')?.addEventListener('click',()=>{const v=$('#actionText').value.trim();if(!v)return alert('Scrie cum vei face gestul.');setAns('action',v);advance()});
 $$('[data-choice]').forEach(b=>b.onclick=()=>{const v=b.dataset.choice;selected=selected.includes(v)?selected.filter(x=>x!==v):[...selected,v];b.classList.toggle('selected')});
 $('#saveAnswer')?.addEventListener('click',()=>{const text=$('#answerText').value.trim();if(!text&&!selected.length)return alert('Alege sau scrie un răspuns.');state.answers[currentDay.id]={...answer(),selected,text};save();advance()});
 $('#saveBuild')?.addEventListener('click',()=>{const v=$('#buildText').value.trim();if(!v)return alert('Scrie pasul concret.');const secret=$('#secretText')?.value.trim()||'';const secretTomorrow=$('#secretTomorrow')?.checked||false;state.answers[currentDay.id]={...answer(),build:v,secret,secretTomorrow};save();advance()});
 $$('[data-prayer-suggestion]').forEach(b=>b.addEventListener('click',()=>{const box=$('#prayerText'),line=b.dataset.prayerSuggestion.trim();if(!line)return;box.value=[box.value.trim(),`• ${line}`].filter(Boolean).join('\n');b.classList.add('used')}));
 $('#savePrayer')?.addEventListener('click',()=>{const prayerText=$('#prayerText').value.trim();if(!prayerText)return alert('Scrieți măcar un lucru pentru care vreți să vă rugați în seara aceasta.');state.answers[currentDay.id]={...answer(),prayerText,prayers:[prayerText],fast:$('#fastChoice')?.value||''};save();advance()});
 $$('[data-photo-mode]').forEach(b=>b.onclick=()=>{state.photoModes[currentDay.id]=b.dataset.photoMode;if(b.dataset.photoMode==='none')delete state.photos[currentDay.id];save();renderStage()});
 $('#photoInput')?.addEventListener('change',handlePhoto);
 $$('[data-effect]').forEach(b=>b.onclick=()=>{state.photoEffects[currentDay.id]=b.dataset.effect;save();renderStage()});
 $$('[data-rotate]').forEach(b=>b.onclick=()=>{state.photoRotations[currentDay.id]=((state.photoRotations[currentDay.id]||0)+Number(b.dataset.rotate)+360)%360;save();renderStage()});
 $('#removePhoto')?.addEventListener('click',()=>{delete state.photos[currentDay.id];save();renderStage()});$('#sealBtn')?.addEventListener('click',animateSeal);$('#shareResult')?.addEventListener('click',shareResult);$('#shareHeart')?.addEventListener('click',shareHeart);$('#tomorrowQuick')?.addEventListener('click',()=>switchView('tomorrow'))
}
function bindMagic(){
 $$('[data-star]').forEach(b=>b.onclick=()=>{$$('[data-star]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');setAns('magicChoice',b.dataset.star)});
 let seconds=30,timer;$('#startListen')?.addEventListener('click',e=>{e.currentTarget.disabled=true;timer=setInterval(()=>{seconds--;$('#listenTimer').textContent=`00:${String(seconds).padStart(2,'0')}`;if(seconds<=0){clearInterval(timer);$('#listenTimer').textContent='Am ascultat 🤍'}},1000)});
 $('#revealMirror')?.addEventListener('click',()=>$('.mirror-scene')?.classList.add('revealed'));
 $$('[data-home]').forEach(b=>b.onclick=()=>{b.classList.toggle('selected');const n=$$('[data-home].selected').length;if(n>3){b.classList.remove('selected');return}$('#homeCount').textContent=`${n}/3`});
 $$('[data-plank]').forEach((b,i)=>b.onclick=()=>{b.classList.add('placed');b.style.setProperty('--n',i)});
 $('#makeWish')?.addEventListener('click',()=>$('.meteor-scene')?.classList.add('wish-made'));
 $('#untie')?.addEventListener('click',()=>$('.knot-scene')?.classList.add('untied'));
 $$('[data-language]').forEach(b=>b.onclick=()=>b.classList.toggle('selected'));
 $('#growPlant')?.addEventListener('click',()=>$('.growth-scene')?.classList.add('grown'));
 $$('[data-pack]').forEach(b=>b.onclick=()=>{b.classList.toggle('selected');$('#packedWords').textContent=$$('[data-pack].selected').map(x=>x.dataset.pack).join(' · ')});
 $('#magicDone')?.addEventListener('click',()=>{const title=$('#magicSongTitle')?.value.trim(),url=$('#magicSongUrl')?.value.trim(),note=$('#magicSongNote')?.value.trim();setAns('magicNote',$('#magicNote')?.value.trim()||'Am trăit momentul.');setAns('magicDone',true);if(title&&url)setAns('songProposal',{title,url,note});advance()});
}
function fastingBlock(d){if(![6,13].includes(d.id))return '';return `<div class="notice"><b>Postul nostru</b><p>Înainte să începeți, întrebați-vă sincer dacă puteți și vreți să postiți. Sănătatea nu este lipsă de credință. Puteți alege post alimentar, o perioadă mai scurtă sau un timp special de rugăciune.</p><select id="fastChoice" class="textarea" style="min-height:58px"><option value="">Alege forma zilei</option><option>Postim împreună</option><option>Unul postește, celălalt susține și se roagă</option><option>Alegem o perioadă mai scurtă</option><option>Alegem rugăciune și liniște fără post alimentar</option><option>Mai întâi discutăm starea noastră</option></select></div>`}
function photoUI(label){
 const mode=state.photoModes[currentDay.id]||'none',effect=state.photoEffects[currentDay.id]||'warm',rotation=state.photoRotations[currentDay.id]||0;
 return `<div class="photo-box"><div class="optional-head"><div><b>📷 Amintire vizuală <span>opțional</span></b><p>${esc(label)}</p></div></div><div class="photo-mode"><button class="choice ${mode==='none'?'selected':''}" data-photo-mode="none">Astăzi fără fotografie</button><button class="choice ${mode==='gallery'?'selected':''}" data-photo-mode="gallery">Aleg ceva frumos din telefon</button></div>${mode==='gallery'?`<label class="gallery-button">Alege fotografia<input id="photoInput" type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/webp"></label>${photoData?`<div class="photo-editor"><img class="photo-preview effect-${effect}" style="transform:rotate(${rotation}deg)" src="${photoData}" alt="Fotografia aleasă"><div class="photo-tools"><button data-rotate="-90">↶ Rotește</button><button data-rotate="90">Rotește ↷</button><button id="removePhoto">Șterge</button></div><div class="effect-picker">${[['natural','Natural'],['warm','Cald'],['soft','Fin'],['film','Film'],['bw','Alb-negru'],['dream','Vis']].map(([id,n])=>`<button class="${effect===id?'selected':''}" data-effect="${id}">${n}</button>`).join('')}</div><small>Fotografia este inclusă numai dacă alegi tu. Efectul se păstrează și pe cardul trimis.</small></div>`:''}`:`<div class="photo-skip">Ziua rămâne completă și fără fotografie. Unele amintiri se păstrează mai bine în cuvinte.</div>`}</div>`
}
async function handlePhoto(e){
 const f=e.target.files?.[0];if(!f)return;
 try{
  let source;
  if('createImageBitmap' in window) source=await createImageBitmap(f,{imageOrientation:'from-image'});
  else source=await new Promise((resolve,reject)=>{const r=new FileReader;r.onload=()=>{const i=new Image;i.onload=()=>resolve(i);i.onerror=reject;i.src=r.result};r.onerror=reject;r.readAsDataURL(f)});
  const max=1400,scale=Math.min(1,max/Math.max(source.width,source.height));
  const c=document.createElement('canvas');c.width=Math.round(source.width*scale);c.height=Math.round(source.height*scale);
  const ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,c.width,c.height);
  source.close?.();state.photos[currentDay.id]=c.toDataURL('image/jpeg',.86);state.photoModes[currentDay.id]='gallery';state.photoEffects[currentDay.id]=state.photoEffects[currentDay.id]||'warm';state.photoRotations[currentDay.id]=0;save();renderStage();
 }catch(err){console.error(err);alert('Fotografia nu a putut fi citită. Încearcă o imagine JPG sau PNG din galerie.')}
}
function photoFilter(id){return ({natural:'none',warm:'saturate(1.08) contrast(1.03) sepia(.08)',soft:'brightness(1.06) contrast(.94) saturate(.92)',film:'contrast(1.12) saturate(.82) sepia(.14)',bw:'grayscale(1) contrast(1.08)',dream:'brightness(1.08) saturate(1.15) hue-rotate(-8deg)'}[id]||'none')}


function summaryHTML(){const a=answer();return `<div class="letter-preview"><h4>Ziua ${currentDay.id} · ${esc(currentDay.title)}</h4><ul><li><b>Atmosfera:</b> ${esc(a.magicNote||'trăită')}</li><li><b>Gestul:</b> ${esc(a.action||'—')}</li><li><b>Răspunsul:</b> ${esc([...(a.selected||[]),a.text].filter(Boolean).join(' · ')||'—')}</li><li><b>Pasul concret:</b> ${esc(a.build||'—')}</li><li><b>Rugăciunea pentru diseară:</b> ${esc(a.prayerText||(a.prayers||[]).filter(Boolean).join(' · ')||'—')}</li></ul></div>`}
function sealScreen(){
 const mine=!!state.completed[currentDay.id],otherDone=!!state.otherDone[currentDay.id],both=mine&&otherDone;
 if(!mine)return card('Ziua este gata. O transformăm într-un plic.',`${summaryHTML()}<p class="seal-instruction">Mai întâi foaia intră complet în plic. Apoi cele două jumătăți de inimă vin una spre cealaltă, se unesc și devin pecetea care închide ziua.</p><div class="seal-theatre airy" id="sealTheatre"><div class="floating-letter" id="floatingLetter"><div class="letter-mini-title">ZIUA ${currentDay.id}</div><b>${me().name} · pentru ${other().name}</b><small>gest · răspuns · pas · rugăciune</small></div><div class="stamp-pair"><span class="stamp-half stamp-left">♥</span><span class="stamp-half stamp-right">♥</span><span class="stamp-merged">♥</span></div><div class="envelope-shell"><div class="envelope-back"></div><div class="envelope-pocket"></div><div class="envelope-flap"></div><div class="wax-seal">♥</div><div class="envelope-address">Pentru ${other().name} · se deschide mâine</div></div><div class="seal-caption" id="sealCaption">Foaia este încă deschisă.</div></div><button class="primary" id="sealBtn">Gata — unim inimile și sigilăm</button>`);
 return card('Plic sigilat',`<div class="sealed-result"><div class="sealed-envelope-final"><div class="final-flap"></div><div class="final-wax heart-stamp">♥</div><div class="final-address">Pentru ${other().name} · mâine</div></div><div class="love-message show">Te iubesc</div>${heartMeetingHTML(both)}<div class="status-copy">${both?'Amândoi ați încheiat ziua. Inimile s-au întâlnit, au devenit o singură pecete și au închis plicul pentru mâine.':'Jumătatea ta este gata. Trimite confirmarea; când celălalt o deschide, cele două jumătăți se vor uni.'}</div><div class="final-map">${esc(currentDay.teaser)}</div><button class="primary" id="shareHeart">Trimite jumătatea inimii ❤️</button><button class="secondary" id="shareResult">Trimite rezultatul zilei</button><button class="secondary" id="tomorrowQuick">Pregătește plicul de mâine ✉</button></div>`)
}
function heartMeetingHTML(both){return both?`<div class="joined-heart-scene"><div class="half-piece hp-left">♥</div><div class="half-piece hp-right">♥</div><div class="joined-heart">♥</div><div class="joy-rays"></div><span>Două jumătăți. O singură inimă. O singură pecete.</span></div>`:`<div class="waiting-heart-scene"><div class="half-piece hp-left arrived">♥</div><div class="half-piece hp-right">♥</div><span>Jumătatea ta a ajuns la mijloc și o așteaptă pe cealaltă.</span></div>`}
function animateSeal(){
 const theatre=$('#sealTheatre'),btn=$('#sealBtn'),caption=$('#sealCaption');if(!theatre||btn.disabled)return;
 btn.disabled=true;theatre.classList.add('phase-lift');caption.textContent='Mai privim o dată ce am construit astăzi…';
 setTimeout(()=>{theatre.classList.add('phase-drop');caption.textContent='Foaia intră complet în plic…'},850);
 setTimeout(()=>{theatre.classList.add('phase-fold');caption.textContent='Clapeta se închide.'},2300);
 setTimeout(()=>{theatre.classList.add('phase-hearts');caption.textContent='Cele două jumătăți pornesc una spre cealaltă…'},3200);
 setTimeout(()=>{theatre.classList.add('phase-merge');caption.textContent='Inimile s-au întâlnit.'},4200);
 setTimeout(()=>{theatre.classList.add('phase-stamp');caption.textContent='Inima devine pecete și sigilează plicul pentru mâine.'},5050);
 setTimeout(()=>{theatre.classList.add('phase-love');caption.textContent='Te iubesc. Ne revedem în următoarea pagină.'},6000);
 setTimeout(()=>{state.completed[currentDay.id]=true;state.sealed[currentDay.id]=Date.now();save();renderHero(1);renderStage();const a=answer();if(a.secret&&a.secretTomorrow)setTimeout(()=>shareSecretTomorrow(a.secret),500)},7350)
}
function showFinalCelebration(){
 const box=document.createElement('div');box.className='final-celebration';box.innerHTML=`<div class="celebration-glow"></div><div class="celebration-heart">♥</div><h2>Două inimi au ajuns la mijloc</h2><p>Nu pentru că au devenit perfecte, ci pentru că au spus adevărul, s-au ascultat, s-au rugat și au ales fapte mici. Restul drumului îl descoperim sub călăuzirea lui Dumnezeu.</p><blockquote>„Nu vrem doar să ne iubim. Vrem să învățăm să iubim așa cum Hristos ne învață.”</blockquote><button>Continuăm cu Dumnezeu în centru ❤️</button>`;document.body.append(box);for(let i=0;i<28;i++){const p=document.createElement('i');p.style.setProperty('--x',`${Math.random()*100}vw`);p.style.setProperty('--d',`${Math.random()*1.7}s`);p.textContent=['♥','✦','🦋'][i%3];box.append(p)}box.querySelector('button').onclick=()=>box.remove()
}
function receivedLetter(){const idx=state.tomorrow.findIndex(x=>x.openDate<=dateParis()&&!x.read);if(idx<0)return '<div class="notice quiet">Dacă ai primit un plic, deschide linkul trimis. În ziua potrivită va apărea aici, sigilat.</div>';const letter=state.tomorrow[idx];return `<div class="received-letter-scene" id="receivedLetterScene" data-letter-index="${idx}"><div class="received-envelope"><div class="received-flap"></div><div class="received-paper"><div class="kicker">DE LA ${esc(letter.fromName||'CELĂLALT')}</div><h4>${esc(letter.kind||'Un plic pentru tine')}</h4><p>${esc(letter.text)}</p></div><div class="received-wax">♥</div></div><button class="primary open-letter-btn" id="openReceivedLetter">Deschide plicul cu inima ❤️</button><p class="received-hint">Pecetea se desface, clapeta se ridică, iar scrisoarea începe ziua.</p></div>`}
function openReceivedLetter(){const scene=$('#receivedLetterScene');if(!scene)return;const idx=Number(scene.dataset.letterIndex),letter=state.tomorrow[idx];scene.classList.add('opening');const btn=$('#openReceivedLetter');if(btn)btn.disabled=true;setTimeout(()=>scene.classList.add('opened'),1250);setTimeout(()=>{if(letter){letter.read=true;save()}},2600)}
function shareSecretTomorrow(text){const payload={id:crypto.randomUUID?.()||Date.now(),type:'letter',kind:'Taină',text,openDate:dateParis(1),from:profile,fromName:me().name};const url=location.origin+location.pathname+'#letter='+encodeURIComponent(enc(payload));share({title:'Un gând în taină pentru mâine',text:'Ți-am lăsat în plic ceva ce mi-a fost greu să spun. Deschide-l mâine 🤍',url})}
function shareHeart(){const url=location.origin+location.pathname+'#sync='+encodeURIComponent(enc({type:'done',day:currentDay.id,from:profile}));share({title:'Jumătatea inimii mele',text:`Am terminat ziua ${currentDay.id}. Deschide linkul ca să aprinzi și jumătatea mea pe telefonul tău ❤️`,url})}
function importHash(){try{if(location.hash.startsWith('#sync=')){const x=dec(decodeURIComponent(location.hash.slice(6)));if(x.type==='done')state.otherDone[x.day]=true}else if(location.hash.startsWith('#letter=')){const x=dec(decodeURIComponent(location.hash.slice(8)));if(!state.tomorrow.some(l=>l.id===x.id))state.tomorrow.push({...x,read:false})}else if(location.hash.startsWith('#song=')){const x=dec(decodeURIComponent(location.hash.slice(6)));if(!state.songLetters.some(l=>l.id===x.id))state.songLetters.push({...x,used:false})}save();if(location.hash)history.replaceState(null,'',location.pathname)}catch(e){console.warn(e)}}
async function share(data){if(navigator.share)try{return await navigator.share(data)}catch{}const text=[data.text,data.url].filter(Boolean).join('\n');await navigator.clipboard?.writeText(text);prompt('Copiază și trimite:',text)}

async function shareResult(){const a=answer(),text=`Ziua ${currentDay.id} — ${currentDay.title}\n\n✦ ${a.magicNote||'-'}\n\n❤️ Gestul meu:\n${a.action||'-'}\n\n💬 Răspunsul meu:\n${[...(a.selected||[]),a.text].filter(Boolean).join(' · ')||'-'}\n\n🌱 Pasul meu concret:\n${a.build||'-'}\n\n🙏 Rugăciunea noastră pentru diseară:\n${a.prayerText||(a.prayers||[]).filter(Boolean).join('\n')||'-'}\n\nTe iubesc ❤️`;
 const blob=await makeShareCard(text,state.photos[currentDay.id]);const file=new File([blob],`intre-noi-ziua-${currentDay.id}.jpg`,{type:'image/jpeg'});if(navigator.canShare?.({files:[file]}))try{return await navigator.share({title:`Ziua ${currentDay.id}`,text,files:[file]})}catch{}const aTag=document.createElement('a');aTag.href=URL.createObjectURL(blob);aTag.download=file.name;aTag.click();await navigator.clipboard?.writeText(text);alert('Imaginea a fost salvată, iar textul copiat. Trimite-le împreună în WhatsApp.')}
async function makeShareCard(text,photo){const c=$('#shareCanvas'),ctx=c.getContext('2d');ctx.fillStyle='#f5e5d8';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#fffaf4';rounded(ctx,55,55,970,1240,48);ctx.fill();ctx.fillStyle='#a74e6c';ctx.font='bold 31px sans-serif';ctx.fillText(`ÎNTRE NOI · ZIUA ${currentDay.id}`,100,125);ctx.fillStyle='#30292f';ctx.font='bold 58px Georgia';let y=205;y=wrap(ctx,currentDay.title,100,y,860,68);if(photo){const img=await loadImg(photo);const h=390;ctx.save();rounded(ctx,100,y+20,880,h,32);ctx.clip();ctx.filter=photoFilter(state.photoEffects[currentDay.id]||'natural');drawCoverRotated(ctx,img,100,y+20,880,h,state.photoRotations[currentDay.id]||0);ctx.filter='none';ctx.restore();y+=440}ctx.fillStyle='#5f5357';ctx.font='29px sans-serif';wrap(ctx,text,100,y+15,860,42);ctx.fillStyle='#a74e6c';ctx.font='bold 33px Georgia';ctx.fillText('Paris · Menton · alegem zilnic ❤️',100,1270);return await new Promise(r=>c.toBlob(r,'image/jpeg',.91))}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}function drawCover(ctx,img,x,y,w,h){const s=Math.max(w/img.width,h/img.height),nw=img.width*s,nh=img.height*s;ctx.drawImage(img,x+(w-nw)/2,y+(h-nh)/2,nw,nh)}function wrap(ctx,text,x,y,w,lh){for(const p of text.split('\n')){let line='';for(const word of p.split(' ')){if(ctx.measureText(line+word).width>w){ctx.fillText(line,x,y);y+=lh;line=''}line+=word+' '}ctx.fillText(line,x,y);y+=lh}return y}function loadImg(src){return new Promise(r=>{const i=new Image;i.onload=()=>r(i);i.src=src})}

function drawCoverRotated(ctx,img,x,y,w,h,deg=0){ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(deg*Math.PI/180);const swap=Math.abs(deg%180)===90;const tw=swap?h:w,th=swap?w:h;const r=Math.max(tw/img.width,th/img.height),iw=img.width*r,ih=img.height*r;ctx.drawImage(img,-iw/2,-ih/2,iw,ih);ctx.restore()}

function renderJourney(){renderHero();$('#app').innerHTML=`<div class="days-grid">${days.map(d=>`<button class="tile ${available(d)?'':'locked'}" data-day="${d.id}" ${available(d)?'':'disabled'}><b>Ziua ${d.id}</b><h3>${d.icon} ${esc(d.title)}</h3><small>${state.completed[d.id]?'✓ Sigilată':available(d)?'Disponibilă':'Se deschide la data ei'}</small></button>`).join('')}</div>`;$$('[data-day]').forEach(b=>b.onclick=()=>{currentDay=days.find(d=>d.id==b.dataset.day);stage=state.steps[currentDay.id]||0;renderHero();renderChapter()})}
function renderAlbum(){renderHero();const items=days.filter(d=>state.completed[d.id]);$('#app').innerHTML=items.length?`<div class="album-grid">${items.map(d=>`<div class="tile">${state.photos[d.id]?`<img src="${state.photos[d.id]}" alt="Ziua ${d.id}">`:`<div style="font-size:50px">${d.icon}</div>`}<b>Ziua ${d.id}</b><h3>${esc(d.title)}</h3><small>${esc(state.answers[d.id]?.text||state.answers[d.id]?.build||'Păstrată în poveste')}</small></div>`).join('')}</div>`:`<div class="panel"><h2>Albumul vostru începe cu primul plic sigilat</h2><p>Fotografiile rămân pe telefonul pe care au fost alese și intră în imaginea rezultatului.</p></div>`}

function renderMusic(){
 renderHero();
 const catalog=[
  {title:'Scopul Meu',artist:'Alin și Emima Timofte',why:'Piesa de început a drumului vostru.'},
  {title:'Pentru tine',artist:'Ramona Hanganu',why:'Pentru cuvintele pe care uneori le spune mai bine muzica.'},
  {title:'I Prayed for You',artist:'alegeți versiunea preferată',why:'Despre rugăciune, așteptare și recunoștință.'},
  {title:'Te-am cerut în rugăciune',artist:'alegeți versiunea preferată',why:'Pentru o seară liniștită și o mărturisire fără grabă.'},
  {title:'Dumnezeu mi te-a dat',artist:'alegeți versiunea preferată',why:'Pentru mulțumire, nu pentru promisiuni grăbite.'}
 ];
 const received=state.songLetters.filter(x=>x.openDate<=dateParis());
 $('#app').innerHTML=`<div class="music-page">
  <section class="music-hero panel"><div class="record-big"><i></i></div><div><div class="kicker">PLAYLIST-UL NOSTRU</div><h2>Uneori o melodie spune ceea ce încă nu știm să spunem</h2><p>Aici puteți asculta, căuta și trimite o piesă cu o explicație personală. Site-ul nu forțează muzica în fiecare zi.</p></div></section>
  <section class="music-catalog">${catalog.map(x=>`<article class="music-tile"><span class="music-note">♫</span><h3>${esc(x.title)}</h3><b>${esc(x.artist)}</b><p>${esc(x.why)}</p>${musicServiceButtons(x.title,x.artist)}<button class="secondary choose-song" data-title="${esc(x.title)}" data-artist="${esc(x.artist)}">O las pentru mâine</button></article>`).join('')}</section>
  ${received.length?`<section class="panel"><div class="kicker">PRIMITE DE LA CELĂLALT</div><h2>Piese lăsate în plic</h2>${received.map(x=>`<div class="received-song-row"><div><b>${esc(x.title)}</b><p>${esc(x.note||'Fără explicație — lasă muzica să vorbească.')}</p></div>${musicServiceButtons(x.title,x.artist||'',x.url)}</div>`).join('')}</section>`:''}
  <section class="panel song-maker"><div class="kicker">O PIESĂ ÎN LOCUL CUVINTELOR</div><h2>Lasă-i ceva ce îți este greu să spui direct</h2><input id="musicMakeTitle" class="input" placeholder="Titlul piesei"><input id="musicMakeArtist" class="input" placeholder="Artistul (opțional)"><input id="musicMakeUrl" class="input" placeholder="Link Spotify / YouTube / Apple Music / SoundCloud"><textarea id="musicMakeNote" class="textarea" placeholder="De ce tocmai această piesă? Ce ai vrea să înțeleagă? De exemplu: «Ascultă refrenul. Acolo este ceva ce încă mi-e rușine să spun.»"></textarea><div class="choices listening-time"><button class="choice selected" data-listen="când ai liniște">Când ai liniște</button><button class="choice" data-listen="înainte de culcare">Înainte de culcare</button><button class="choice" data-listen="când vezi marea sau cerul">La mare / sub cer</button><button class="choice" data-listen="după rugăciune">După rugăciune</button></div><button class="primary" id="sendMusicLetter">Sigilează piesa pentru mâine ♫</button></section>
 </div>`;
 let listen='când ai liniște';$$('[data-listen]').forEach(b=>b.onclick=()=>{$$('[data-listen]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');listen=b.dataset.listen});
 $$('.choose-song').forEach(b=>b.onclick=()=>{$('#musicMakeTitle').value=b.dataset.title;$('#musicMakeArtist').value=b.dataset.artist;$('#musicMakeUrl').focus();scrollTo({top:$('.song-maker').offsetTop-90,behavior:'smooth'})});
 $('#sendMusicLetter').onclick=()=>{const title=$('#musicMakeTitle').value.trim(),artist=$('#musicMakeArtist').value.trim(),url=$('#musicMakeUrl').value.trim(),note=$('#musicMakeNote').value.trim();if(!title||!url)return alert('Scrie titlul și lipește linkul exact al piesei.');const fullNote=[note,`Ascult-o ${listen}.`].filter(Boolean).join(' ');const payload={id:crypto.randomUUID?.()||Date.now(),type:'song',title,artist,url,note:fullNote,openDate:dateParis(1),from:profile,fromName:me().name};const link=location.origin+location.pathname+'#song='+encodeURIComponent(enc(payload));animateTomorrowSeal({title:'O piesă pentru mâine',text:`Ți-am lăsat o melodie care spune ceva ce poate nu reușesc încă să spun direct: ${title} ♫`,url:link},title)};
}

function renderTomorrow(){
 renderHero();const unread=state.tomorrow.filter(x=>x.openDate<=dateParis()),proposal=answer()?.songProposal;
 $('#app').innerHTML=`<div class="panel tomorrow-box"><div class="kicker">DIN ASTĂZI PENTRU MÂINE</div><h2>Lasă ceva care merită așteptat</h2><p>Mesajul sau piesa ajunge printr-un link, dar se deschide mâine. Așa fiecare zi poate începe cu ceva ales personal de celălalt.</p>${unread.map(l=>`<div class="sealed-letter"><b>💌 ${esc(l.fromName||'Plic primit')}</b><p>${esc(l.text)}</p></div>`).join('')}<div class="choices tomorrow-kinds"><button class="choice selected" data-kind="Întrebare">Întrebare</button><button class="choice" data-kind="Gând">Gând</button><button class="choice" data-kind="Rugăciune">Rugăciune</button><button class="choice" data-kind="Taină">🤍 Ce mi-e greu să spun</button><button class="choice" data-kind="Verset">📖 Verset</button><button class="choice" data-kind="Surpriză">Surpriză</button><button class="choice" data-kind="Piesă">🎵 Piesă</button></div><div id="normalTomorrow"><textarea id="tomorrowText" class="textarea" placeholder="Ce vrei să găsească mâine în plic? Poți spune ceva ce în chat ți-ar fi greu să scrii."></textarea></div><div id="songTomorrow" class="hidden"><input id="tomorrowSongTitle" class="input" placeholder="Titlul piesei" value="${esc(proposal?.title||'')}"><input id="tomorrowSongUrl" class="input" placeholder="Link Spotify sau YouTube" value="${esc(proposal?.url||'')}"><textarea id="tomorrowSongNote" class="textarea compact" placeholder="De ce ai ales această piesă?">${esc(proposal?.note||'')}</textarea><div class="notice">Mâine va apărea o felicitare muzicală cu linkul ales și butoane Spotify, YouTube și Apple Music. Astfel nu depindem de playere blocate.</div></div><button class="primary" id="sendTomorrow">Sigilează și trimite pentru mâine ✉</button></div>`;
 let kind='Întrebare';$$('[data-kind]').forEach(b=>b.onclick=()=>{$$('[data-kind]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');kind=b.dataset.kind;$('#normalTomorrow').classList.toggle('hidden',kind==='Piesă');$('#songTomorrow').classList.toggle('hidden',kind!=='Piesă')});
 $('#sendTomorrow').onclick=()=>{if(kind==='Piesă'){const title=$('#tomorrowSongTitle').value.trim(),url=$('#tomorrowSongUrl').value.trim(),note=$('#tomorrowSongNote').value.trim();if(!title||!url)return alert('Scrie titlul și lipește linkul piesei.');const payload={id:crypto.randomUUID?.()||Date.now(),type:'song',title,url,note,openDate:dateParis(1),from:profile,fromName:me().name};const link=location.origin+location.pathname+'#song='+encodeURIComponent(enc(payload));return animateTomorrowSeal({title:'O piesă pentru mâine',text:`Ți-am ales o piesă pentru mâine 🎵`,url:link},title)}const text=$('#tomorrowText').value.trim();if(!text)return alert('Scrie mesajul pentru mâine.');const payload={id:crypto.randomUUID?.()||Date.now(),type:'letter',kind,text,openDate:dateParis(1),from:profile,fromName:me().name};const url=location.origin+location.pathname+'#letter='+encodeURIComponent(enc(payload));animateTomorrowSeal({title:'Un plic pentru mâine',text:`Ți-am lăsat un plic pentru mâine 💌`,url},kind)}
}
function animateTomorrowSeal(shareData,label='Pentru mâine'){
 const overlay=document.createElement('div');overlay.className='tomorrow-seal-overlay';overlay.innerHTML=`<div class="tomorrow-seal-card"><div class="kicker">DIN DOUĂ INIMI PENTRU MÂINE</div><h2>Sigilăm ceva care merită așteptat</h2><div class="tomorrow-theatre"><div class="tomorrow-hearts"><span class="th-left">♥</span><span class="th-right">♥</span><span class="th-one">♥</span></div><div class="tomorrow-envelope"><div class="tomorrow-flap"></div><div class="tomorrow-note"><b>${esc(label)}</b><small>se deschide mâine</small></div><div class="tomorrow-wax">♥</div></div></div><p id="tomorrowSealText">Cele două jumătăți pornesc una spre cealaltă…</p></div>`;document.body.append(overlay);requestAnimationFrame(()=>overlay.classList.add('run'));setTimeout(()=>$('#tomorrowSealText',overlay).textContent='Inimile s-au unit.',1200);setTimeout(()=>$('#tomorrowSealText',overlay).textContent='Pecetea coboară pe plic.',2350);setTimeout(()=>$('#tomorrowSealText',overlay).textContent='Plicul pentru mâine este sigilat. Te iubesc.',3500);setTimeout(async()=>{await share(shareData);overlay.remove()},4550)
}

init();
