const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec=s=>JSON.parse(decodeURIComponent(escape(atob(s))));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

const [config,days]=await Promise.all([fetch('config.json?v=10').then(r=>r.json()),fetch('days.json?v=10').then(r=>r.json())]);
const STORE='intre-noi-final-v8';
const blank={profile:null,answers:{},steps:{},completed:{},otherDone:{},photos:{},photoModes:{},photoEffects:{},photoRotations:{},tomorrow:[],openedMusic:{},sealed:{},songLetters:[],celebrated:{}};
let state={...blank,...JSON.parse(localStorage.getItem(STORE)||'{}')};
let profile=state.profile,currentDay=null,stage=0,view='today',selected=[],photoData='';

const extra={
1:{story:'Nu pornim cu planuri despre o viață întreagă. Pornim cu adevărul despre cine suntem astăzi.',build:'Scrie ce vei face azi ca celălalt să simtă sinceritate și pace, nu presiune.',teaser:'Mâine vă împrumutați privirea unul altuia.'},
2:{story:'Două orașe, două zile diferite. Apropiera începe când devin curios de lumea ta, nu când presupun că o cunosc.',build:'Alege un detaliu din zi și explică de ce a contat pentru tine.',teaser:'Mâine nu povestim doar ce am făcut, ci cum suntem.'},
3:{story:'Intimitatea începe când „sunt bine” poate fi înlocuit cu adevărul spus fără teamă.',build:'Spune clar ce fel de sprijin îți face bine astăzi.',teaser:'Mâine exersăm darul rar de a asculta fără să ne apărăm.'},
4:{story:'A asculta înseamnă să intri pentru o clipă în lumea celuilalt, fără să-i iei povestea din mână.',build:'Răspunde mai întâi prin ce ai înțeles, nu prin soluția ta.',teaser:'Mâine deschidem o ușă spre ceea ce purtăm în tăcere.'},
5:{story:'Nu promitem că într-o zi vom purta totul împreună. Învățăm acum să observăm ce duce celălalt singur.',build:'Alege o grijă pe care o poți purta astăzi prin ascultare, rugăciune sau ajutor concret.',teaser:'Mâine postim cu grijă unul pentru altul.'},
6:{story:'Postul nu este performanță. Este adevăr, rugăciune și grijă pentru starea celuilalt.',build:'Stabiliți împreună forma postului, trei momente de verificare și o încurajare.',teaser:'Mâine luăm din biserică un adevăr pe care îl trăim.'},
7:{story:'Cuvântul devine viu când schimbă felul în care vorbim, iertăm și ne purtăm.',build:'Transformă o idee auzită într-un gest pentru următoarele 24 de ore.',teaser:'Mâine descoperim ce înseamnă „acasă” pentru fiecare.'},
8:{story:'„Acasă” nu este încă un plan comun. Este sentimentul că pot fi eu și nu voi fi pedepsit pentru sinceritate.',build:'Creează un moment de siguranță emoțională astăzi.',teaser:'Mâine traducem iubirea într-un gest vizibil.'},
9:{story:'Iubirea serioasă devine credibilă prin lucruri mici făcute la timp.',build:'Alege un gest pentru următoarele 24 de ore și spune când îl faci.',teaser:'Mâine privim același cer și așezăm o speranță înaintea lui Dumnezeu.'},
10:{story:'Sub același cer putem visa, dar fără să grăbim răspunsurile pe care încă le descoperim.',build:'Leagă speranța de o rugăciune și de un pas sănătos, nu de presiune.',teaser:'Mâine învățăm să rămânem de aceeași parte.'},
11:{story:'Relațiile lungi nu sunt fără tensiuni. Sunt relații în care problema nu devine mai importantă decât omul.',build:'Scrieți o regulă de conflict pe care amândoi o puteți respecta.',teaser:'Mâine descoperim limba în care iubirea se aude cel mai clar.'},
12:{story:'Putem iubi sincer și totuși să nu fim înțeleși. Astăzi învățăm traducerea.',build:'Alege două gesturi realiste și frecvența care ți-ar face bine.',teaser:'Mâine privim ce a lucrat Dumnezeu între cele două sâmbete.'},
13:{story:'Al doilea post întreabă nu doar ce am cerut, ci și ce s-a schimbat în noi.',build:'Spune unde vezi creștere și unde ai nevoie să fii purtat(ă) încă.',teaser:'Mâine alegem ce păstrăm când revine rutina.'},
14:{story:'Întoarcerea nu cere promisiuni mari. Cere să nu pierdem binele pe care l-am exersat.',build:'Alege trei lucruri concrete pe care le păstrați în săptămâna următoare.',teaser:'Mâine, abia după tot drumul, vorbim despre ce vrem să construim mai departe.'},
15:{story:'Acum putem vorbi despre viitor nu ca doi oameni care se idealizează, ci ca doi oameni care s-au ascultat, s-au sprijinit și s-au rugat.',build:'Alegeți un pas comun pentru 30 de zile și o dată când îl veți verifica.',teaser:'Drumul de pe ecran se încheie. Alegerea de a ne cunoaște și iubi continuă.'}
};
for(const d of days) Object.assign(d,extra[d.id]||{});
const MUSIC_LIBRARY=[
 {id:'scopul',title:'Scopul Meu',artist:'Alin și Emima Timofte',query:'Scopul Meu Alin Emima Timofte',note:'Pentru zilele în care vreți să vă amintiți direcția și scopul comun.'},
 {id:'pentru-tine',title:'Pentru tine',artist:'Ramona Hanganu',query:'Ramona Hanganu Pentru tine',note:'O alegere romantică, potrivită pentru dor și apropiere.'},
 {id:'prayed',title:'I Prayed for You',artist:'The I Do Wedding Playlist',query:'I Prayed for You Christian Wedding Song Faithful Love Story Duet',note:'Pentru rugăciune, așteptare și recunoștință.'},
 {id:'inima-ta',title:'Un om după inima Ta',artist:'Rivers of Life',query:'Un om dupa inima Ta Rivers of Life',note:'Pentru zilele în care puneți caracterul și credința înaintea emoției.'},
 {id:'marriage-prayer',title:'The Marriage Prayer',artist:'John Waller',query:'The Marriage Prayer John Waller',note:'Pentru angajament, slujire reciprocă și viitor.'},
 {id:'god-made-you',title:'When God Made You',artist:'Newsong & Natalie Grant',query:'When God Made You Newsong Natalie Grant',note:'Pentru recunoștința că Dumnezeu a așezat doi oameni unul lângă altul.'}
];
function youtubeSearchEmbed(query){return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&rel=0&modestbranding=1`}
function defaultSongEmbed(song){return youtubeSearchEmbed(song.query)}
function songFallbackUrl(song){return `https://www.youtube.com/results?search_query=${encodeURIComponent(song.query)}`}
function songsForDay(d){const wanted=[d.song?.title];const rotation=[[0,1,2],[1,3,0],[2,4,3],[3,0,5],[4,1,2]];const ids=rotation[(d.id-1)%rotation.length];const picks=ids.map(i=>MUSIC_LIBRARY[i]);const main=MUSIC_LIBRARY.find(x=>x.title===wanted[0]);return [...new Map([main,...picks].filter(Boolean).map(x=>[x.id,x])).values()].slice(0,3)}


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
function switchView(v){view=v;$$('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));if(v==='today')openToday();if(v==='journey')renderJourney();if(v==='album')renderAlbum();if(v==='tomorrow')renderTomorrow()}
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
function renderChapter(){const d=currentDay;const labels=['Deschide','Muzică','Gest','Întrebare','Construim','Rugăciune','Sigiliu'];$('#app').innerHTML=`<article class="chapter"><header class="chapter-head"><div class="kicker">CAPITOLUL ${d.id}</div><div class="chapter-icon">${d.icon}</div><h2>${d.title}</h2><p>${d.story}</p></header><div class="step-map">${labels.map((l,i)=>`${i?'<span></span>':''}<button class="${i<stage?'done':i===stage?'current':''}" data-step="${i}" title="${l}">${i<stage?'✓':i+1}</button>`).join('')}</div><div class="stage" id="stage"></div></article>`;$$('[data-step]').forEach(b=>b.onclick=()=>{const n=+b.dataset.step;if(n<=stage){stage=n;renderStage()}});renderStage()}
function advance(){stage=Math.min(6,stage+1);state.steps[currentDay.id]=Math.max(state.steps[currentDay.id]||0,stage);save();renderChapter();scrollTo({top:$('#app').offsetTop-92,behavior:'smooth'})}
function card(title,html,intro=''){return `<div class="stage-card">${intro?`<div class="stage-intro">${intro}</div>`:''}<h3>${title}</h3>${html}</div>`}
function answer(){return state.answers[currentDay.id]||{}}
function setAns(k,v){state.answers[currentDay.id]={...answer(),[k]:v};save()}
function renderStage(){selected=(answer().selected||[]).slice();photoData=state.photos[currentDay.id]||'';const d=currentDay,root=$('#stage');
 if(stage===0)root.innerHTML=card('Deschide ziua',`${receivedLetter()}<p>Astăzi nu încercăm să fim perfecți. Încercăm să fim sinceri, atenți și prezenți.</p><button class="primary" id="go">Deschide capitolul</button>`,'<b>Un pas mic făcut astăzi valorează mai mult decât o promisiune mare pentru „cândva”.</b>');
 if(stage===1)root.innerHTML=musicStage(d);
 if(stage===2)root.innerHTML=card('Un gest real, astăzi',`<p><b>${esc(d.action)}</b></p><p>${esc(d.build)}</p>${d.photo?photoUI(d.photo):''}<textarea id="actionText" class="textarea" placeholder="Ce fac concret, când și cum?">${esc(answer().action||'')}</textarea><button class="primary" id="saveAction">Am ales gestul și momentul</button>`,'<b>Nu „după vacanță”. Nu „când vom locui împreună”. Astăzi.</b>');
 if(stage===3)root.innerHTML=card('Cunoaște-mă mai bine',`<p><b>${esc(d.question)}</b></p>${d.options?.length?`<div class="choices">${d.options.map(o=>`<button class="choice ${selected.includes(o)?'selected':''}" data-choice="${esc(o)}">${esc(o)}</button>`).join('')}</div>`:''}<textarea id="answerText" class="textarea" placeholder="Scrie sincer. Nu există răspunsul perfect.">${esc(answer().text||'')}</textarea><button class="primary" id="saveAnswer">Păstrează răspunsul</button>`);
 if(stage===4)root.innerHTML=card('Transformăm răspunsul într-un pas',`<p>${esc(d.build)}</p><textarea id="buildText" class="textarea" placeholder="Pasul meu: ce fac, când îl fac și cum vei putea observa?">${esc(answer().build||'')}</textarea><button class="primary" id="saveBuild">Îmi asum pasul acesta</button>`,'<b>O relație pentru o viață se construiește din lucruri care pot fi văzute, nu doar auzite.</b>');
 if(stage===5)root.innerHTML=card('Trei motive de rugăciune',`${fastingBlock(d)}<p>Scrieți și starea, și nevoia, și felul în care celălalt poate susține.</p><div class="prayers">${d.prayer.map((p,i)=>`<div class="prayer-row"><b>${i+1}. ${esc(p)}</b><textarea class="textarea" data-prayer="${i}" placeholder="Cum mă simt? Ce cer lui Dumnezeu? Cum mă poți susține?">${esc(answer().prayers?.[i]||'')}</textarea></div>`).join('')}</div><button class="primary" id="savePrayer">Păstrează motivele noastre</button>`);
 if(stage===6)root.innerHTML=sealScreen();bindStage()}

function playableEmbed(url,query=''){
 try{
  const u=new URL(url);
  if(u.hostname.includes('open.spotify.com')){
   const parts=u.pathname.split('/').filter(Boolean).filter(x=>x!=='embed');
   if(parts.length>=2&&['track','album','playlist','episode','show'].includes(parts[0])) return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`;
  }
  if(u.hostname.includes('youtu.be')){const id=u.pathname.split('/').filter(Boolean)[0];if(id)return `https://www.youtube-nocookie.com/embed/${id}?rel=0`}
  if(u.hostname.includes('youtube.com')){const id=u.searchParams.get('v');if(id)return `https://www.youtube-nocookie.com/embed/${id}?rel=0`}
  if(u.hostname.includes('soundcloud.com'))return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true`;
 }catch{}
 return youtubeSearchEmbed(query||url)
}
function availableSongLetter(){return state.songLetters.find(x=>x.openDate<=dateParis()&&!x.used)}
function musicStage(d){
 const gifted=availableSongLetter(),choices=songsForDay(d),saved=answer().songChoice||choices[0]?.id,active=choices.find(x=>x.id===saved)||choices[0];
 const giftedHTML=gifted?`<div class="gift-song"><div class="gift-ribbon">O PIESĂ ALEASĂ PENTRU TINE</div><h4>${esc(gifted.title||'Piesa de ieri')}</h4><p>${esc(gifted.note||`Trimisă de ${gifted.fromName||'celălalt'}`)}</p><div class="inline-player tall"><iframe src="${playableEmbed(gifted.url,gifted.title)}" title="${esc(gifted.title)}" allow="autoplay; encrypted-media; picture-in-picture" loading="lazy"></iframe></div><button class="secondary" id="useGiftSong">Am ascultat piesa aleasă pentru mine ❤️</button></div>`:'';
 return card('Ascultăm și ne trimitem muzică',`${giftedHTML}<div class="music-picker">${choices.map(x=>`<button class="music-choice ${x.id===active.id?'selected':''}" data-song="${x.id}"><span>♫</span><b>${esc(x.title)}</b><small>${esc(x.artist)}</small></button>`).join('')}</div><div class="inline-player tall"><iframe title="${esc(active.title)}" src="${defaultSongEmbed(active)}" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe></div><a class="player-fallback" href="${songFallbackUrl(active)}" target="_blank" rel="noopener">Playerul nu pornește? Deschide piesa originală ↗</a><div class="song-thought"><b>${esc(active.title)}</b><p>${esc(active.note)}</p></div><textarea id="musicNote" class="textarea" placeholder="Ce ai simțit sau ce cuvânt a rămas cu tine?">${esc(answer().music||'')}</textarea><details class="song-proposal"><summary>🎁 Propune o piesă pentru mâine (opțional)</summary><input id="songTitleTomorrow" class="input" placeholder="Titlul piesei"><input id="songUrlTomorrow" class="input" placeholder="Lipește linkul exact Spotify, YouTube sau SoundCloud"><textarea id="songNoteTomorrow" class="textarea compact" placeholder="De ce ai ales-o pentru mine?"></textarea></details><button class="primary" id="heard">Păstrez gândul și merg mai departe ❤️</button>`)
}
function bindStage(){
 $('#go')?.addEventListener('click',advance);
 $('#openReceivedLetter')?.addEventListener('click',openReceivedLetter);
 $$('[data-song]').forEach(b=>b.onclick=()=>{setAns('songChoice',b.dataset.song);renderStage()});
 $('#useGiftSong')?.addEventListener('click',()=>{const g=availableSongLetter();if(g){g.used=true;save();renderStage()}});
 $('#heard')?.addEventListener('click',()=>{setAns('music',$('#musicNote').value.trim()||'Am ascultat melodia.');const title=$('#songTitleTomorrow')?.value.trim(),url=$('#songUrlTomorrow')?.value.trim(),note=$('#songNoteTomorrow')?.value.trim();if(title&&url)setAns('songProposal',{title,url,note});state.openedMusic[currentDay.id]=true;save();advance()});
 $('#saveAction')?.addEventListener('click',()=>{const v=$('#actionText').value.trim();if(!v)return alert('Scrie cum vei face gestul.');setAns('action',v);advance()});
 $$('[data-choice]').forEach(b=>b.onclick=()=>{const v=b.dataset.choice;selected=selected.includes(v)?selected.filter(x=>x!==v):[...selected,v];b.classList.toggle('selected')});
 $('#saveAnswer')?.addEventListener('click',()=>{const text=$('#answerText').value.trim();if(!text&&!selected.length)return alert('Alege sau scrie un răspuns.');state.answers[currentDay.id]={...answer(),selected,text};save();advance()});
 $('#saveBuild')?.addEventListener('click',()=>{const v=$('#buildText').value.trim();if(!v)return alert('Scrie pasul concret.');setAns('build',v);advance()});
 $('#savePrayer')?.addEventListener('click',()=>{const ps=$$('[data-prayer]').map(x=>x.value.trim());if(ps.some(x=>!x))return alert('Completați cele trei motive.');state.answers[currentDay.id]={...answer(),prayers:ps,fast:$('#fastChoice')?.value||''};save();advance()});
 $$('[data-photo-mode]').forEach(b=>b.onclick=()=>{state.photoModes[currentDay.id]=b.dataset.photoMode;if(b.dataset.photoMode==='none')delete state.photos[currentDay.id];save();renderStage()});
 $('#photoInput')?.addEventListener('change',handlePhoto);
 $$('[data-effect]').forEach(b=>b.onclick=()=>{state.photoEffects[currentDay.id]=b.dataset.effect;save();renderStage()});
 $$('[data-rotate]').forEach(b=>b.onclick=()=>{state.photoRotations[currentDay.id]=((state.photoRotations[currentDay.id]||0)+Number(b.dataset.rotate)+360)%360;save();renderStage()});
 $('#removePhoto')?.addEventListener('click',()=>{delete state.photos[currentDay.id];save();renderStage()});$('#sealBtn')?.addEventListener('click',animateSeal);$('#shareResult')?.addEventListener('click',shareResult);$('#shareHeart')?.addEventListener('click',shareHeart);$('#tomorrowQuick')?.addEventListener('click',()=>switchView('tomorrow'))
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


function summaryHTML(){const a=answer();return `<div class="letter-preview"><h4>Ziua ${currentDay.id} · ${esc(currentDay.title)}</h4><ul><li><b>Melodia:</b> ${esc(a.music||'ascultată')}</li><li><b>Gestul:</b> ${esc(a.action||'—')}</li><li><b>Răspunsul:</b> ${esc([...(a.selected||[]),a.text].filter(Boolean).join(' · ')||'—')}</li><li><b>Pasul concret:</b> ${esc(a.build||'—')}</li><li><b>Rugăciunea:</b> ${(a.prayers||[]).filter(Boolean).length}/3 motive</li></ul></div>`}
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
 setTimeout(()=>{state.completed[currentDay.id]=true;state.sealed[currentDay.id]=Date.now();save();renderHero(1);renderStage()},7350)
}
function showFinalCelebration(){
 const box=document.createElement('div');box.className='final-celebration';box.innerHTML=`<div class="celebration-glow"></div><div class="celebration-heart">♥</div><h2>Două inimi au ajuns la mijloc</h2><p>Nu pentru că au știut totul de la început, ci pentru că au ales să facă fiecare câte un pas.</p><button>Continuăm povestea ❤️</button>`;document.body.append(box);for(let i=0;i<28;i++){const p=document.createElement('i');p.style.setProperty('--x',`${Math.random()*100}vw`);p.style.setProperty('--d',`${Math.random()*1.7}s`);p.textContent=['♥','✦','🦋'][i%3];box.append(p)}box.querySelector('button').onclick=()=>box.remove()
}
function receivedLetter(){const idx=state.tomorrow.findIndex(x=>x.openDate<=dateParis()&&!x.read);if(idx<0)return '<div class="notice quiet">Dacă ai primit un plic, deschide linkul trimis. În ziua potrivită va apărea aici, sigilat.</div>';const letter=state.tomorrow[idx];return `<div class="received-letter-scene" id="receivedLetterScene" data-letter-index="${idx}"><div class="received-envelope"><div class="received-flap"></div><div class="received-paper"><div class="kicker">DE LA ${esc(letter.fromName||'CELĂLALT')}</div><h4>${esc(letter.kind||'Un plic pentru tine')}</h4><p>${esc(letter.text)}</p></div><div class="received-wax">♥</div></div><button class="primary open-letter-btn" id="openReceivedLetter">Deschide plicul cu inima ❤️</button><p class="received-hint">Pecetea se desface, clapeta se ridică, iar scrisoarea începe ziua.</p></div>`}
function openReceivedLetter(){const scene=$('#receivedLetterScene');if(!scene)return;const idx=Number(scene.dataset.letterIndex),letter=state.tomorrow[idx];scene.classList.add('opening');const btn=$('#openReceivedLetter');if(btn)btn.disabled=true;setTimeout(()=>scene.classList.add('opened'),1250);setTimeout(()=>{if(letter){letter.read=true;save()}},2600)}
function shareHeart(){const url=location.origin+location.pathname+'#sync='+encodeURIComponent(enc({type:'done',day:currentDay.id,from:profile}));share({title:'Jumătatea inimii mele',text:`Am terminat ziua ${currentDay.id}. Deschide linkul ca să aprinzi și jumătatea mea pe telefonul tău ❤️`,url})}
function importHash(){try{if(location.hash.startsWith('#sync=')){const x=dec(decodeURIComponent(location.hash.slice(6)));if(x.type==='done')state.otherDone[x.day]=true}else if(location.hash.startsWith('#letter=')){const x=dec(decodeURIComponent(location.hash.slice(8)));if(!state.tomorrow.some(l=>l.id===x.id))state.tomorrow.push({...x,read:false})}else if(location.hash.startsWith('#song=')){const x=dec(decodeURIComponent(location.hash.slice(6)));if(!state.songLetters.some(l=>l.id===x.id))state.songLetters.push({...x,used:false})}save();if(location.hash)history.replaceState(null,'',location.pathname)}catch(e){console.warn(e)}}
async function share(data){if(navigator.share)try{return await navigator.share(data)}catch{}const text=[data.text,data.url].filter(Boolean).join('\n');await navigator.clipboard?.writeText(text);prompt('Copiază și trimite:',text)}

async function shareResult(){const a=answer(),text=`Ziua ${currentDay.id} — ${currentDay.title}\n\n🎵 ${a.music||'-'}\n\n❤️ Gestul meu:\n${a.action||'-'}\n\n💬 Răspunsul meu:\n${[...(a.selected||[]),a.text].filter(Boolean).join(' · ')||'-'}\n\n🌱 Pasul meu concret:\n${a.build||'-'}\n\n🙏 Cele trei motive:\n${(a.prayers||[]).map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nTe iubesc ❤️`;
 const blob=await makeShareCard(text,state.photos[currentDay.id]);const file=new File([blob],`intre-noi-ziua-${currentDay.id}.jpg`,{type:'image/jpeg'});if(navigator.canShare?.({files:[file]}))try{return await navigator.share({title:`Ziua ${currentDay.id}`,text,files:[file]})}catch{}const aTag=document.createElement('a');aTag.href=URL.createObjectURL(blob);aTag.download=file.name;aTag.click();await navigator.clipboard?.writeText(text);alert('Imaginea a fost salvată, iar textul copiat. Trimite-le împreună în WhatsApp.')}
async function makeShareCard(text,photo){const c=$('#shareCanvas'),ctx=c.getContext('2d');ctx.fillStyle='#f5e5d8';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#fffaf4';rounded(ctx,55,55,970,1240,48);ctx.fill();ctx.fillStyle='#a74e6c';ctx.font='bold 31px sans-serif';ctx.fillText(`ÎNTRE NOI · ZIUA ${currentDay.id}`,100,125);ctx.fillStyle='#30292f';ctx.font='bold 58px Georgia';let y=205;y=wrap(ctx,currentDay.title,100,y,860,68);if(photo){const img=await loadImg(photo);const h=390;ctx.save();rounded(ctx,100,y+20,880,h,32);ctx.clip();ctx.filter=photoFilter(state.photoEffects[currentDay.id]||'natural');drawCoverRotated(ctx,img,100,y+20,880,h,state.photoRotations[currentDay.id]||0);ctx.filter='none';ctx.restore();y+=440}ctx.fillStyle='#5f5357';ctx.font='29px sans-serif';wrap(ctx,text,100,y+15,860,42);ctx.fillStyle='#a74e6c';ctx.font='bold 33px Georgia';ctx.fillText('Paris · Menton · alegem zilnic ❤️',100,1270);return await new Promise(r=>c.toBlob(r,'image/jpeg',.91))}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}function drawCover(ctx,img,x,y,w,h){const s=Math.max(w/img.width,h/img.height),nw=img.width*s,nh=img.height*s;ctx.drawImage(img,x+(w-nw)/2,y+(h-nh)/2,nw,nh)}function wrap(ctx,text,x,y,w,lh){for(const p of text.split('\n')){let line='';for(const word of p.split(' ')){if(ctx.measureText(line+word).width>w){ctx.fillText(line,x,y);y+=lh;line=''}line+=word+' '}ctx.fillText(line,x,y);y+=lh}return y}function loadImg(src){return new Promise(r=>{const i=new Image;i.onload=()=>r(i);i.src=src})}

function drawCoverRotated(ctx,img,x,y,w,h,deg=0){ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(deg*Math.PI/180);const swap=Math.abs(deg%180)===90;const tw=swap?h:w,th=swap?w:h;const r=Math.max(tw/img.width,th/img.height),iw=img.width*r,ih=img.height*r;ctx.drawImage(img,-iw/2,-ih/2,iw,ih);ctx.restore()}

function renderJourney(){renderHero();$('#app').innerHTML=`<div class="days-grid">${days.map(d=>`<button class="tile ${available(d)?'':'locked'}" data-day="${d.id}" ${available(d)?'':'disabled'}><b>Ziua ${d.id}</b><h3>${d.icon} ${esc(d.title)}</h3><small>${state.completed[d.id]?'✓ Sigilată':available(d)?'Disponibilă':'Se deschide la data ei'}</small></button>`).join('')}</div>`;$$('[data-day]').forEach(b=>b.onclick=()=>{currentDay=days.find(d=>d.id==b.dataset.day);stage=state.steps[currentDay.id]||0;renderHero();renderChapter()})}
function renderAlbum(){renderHero();const items=days.filter(d=>state.completed[d.id]);$('#app').innerHTML=items.length?`<div class="album-grid">${items.map(d=>`<div class="tile">${state.photos[d.id]?`<img src="${state.photos[d.id]}" alt="Ziua ${d.id}">`:`<div style="font-size:50px">${d.icon}</div>`}<b>Ziua ${d.id}</b><h3>${esc(d.title)}</h3><small>${esc(state.answers[d.id]?.text||state.answers[d.id]?.build||'Păstrată în poveste')}</small></div>`).join('')}</div>`:`<div class="panel"><h2>Albumul vostru începe cu primul plic sigilat</h2><p>Fotografiile rămân pe telefonul pe care au fost alese și intră în imaginea rezultatului.</p></div>`}
function renderTomorrow(){
 renderHero();const unread=state.tomorrow.filter(x=>x.openDate<=dateParis()),proposal=answer()?.songProposal;
 $('#app').innerHTML=`<div class="panel tomorrow-box"><div class="kicker">DIN ASTĂZI PENTRU MÂINE</div><h2>Lasă ceva care merită așteptat</h2><p>Mesajul sau piesa ajunge printr-un link, dar se deschide mâine. Așa fiecare zi poate începe cu ceva ales personal de celălalt.</p>${unread.map(l=>`<div class="sealed-letter"><b>💌 ${esc(l.fromName||'Plic primit')}</b><p>${esc(l.text)}</p></div>`).join('')}<div class="choices tomorrow-kinds"><button class="choice selected" data-kind="Întrebare">Întrebare</button><button class="choice" data-kind="Gând">Gând</button><button class="choice" data-kind="Rugăciune">Rugăciune</button><button class="choice" data-kind="Surpriză">Surpriză</button><button class="choice" data-kind="Piesă">🎵 Piesă</button></div><div id="normalTomorrow"><textarea id="tomorrowText" class="textarea" placeholder="Ce vrei să găsească mâine?"></textarea></div><div id="songTomorrow" class="hidden"><input id="tomorrowSongTitle" class="input" placeholder="Titlul piesei" value="${esc(proposal?.title||'')}"><input id="tomorrowSongUrl" class="input" placeholder="Link Spotify sau YouTube" value="${esc(proposal?.url||'')}"><textarea id="tomorrowSongNote" class="textarea compact" placeholder="De ce ai ales această piesă?">${esc(proposal?.note||'')}</textarea><div class="notice">Piesa se va deschide mâine într-un player direct în site, fără să fie nevoie să părăsească povestea.</div></div><button class="primary" id="sendTomorrow">Sigilează și trimite pentru mâine ✉</button></div>`;
 let kind='Întrebare';$$('[data-kind]').forEach(b=>b.onclick=()=>{$$('[data-kind]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');kind=b.dataset.kind;$('#normalTomorrow').classList.toggle('hidden',kind==='Piesă');$('#songTomorrow').classList.toggle('hidden',kind!=='Piesă')});
 $('#sendTomorrow').onclick=()=>{if(kind==='Piesă'){const title=$('#tomorrowSongTitle').value.trim(),url=$('#tomorrowSongUrl').value.trim(),note=$('#tomorrowSongNote').value.trim();if(!title||!url)return alert('Scrie titlul și lipește linkul piesei.');const payload={id:crypto.randomUUID?.()||Date.now(),type:'song',title,url,note,openDate:dateParis(1),from:profile,fromName:me().name};const link=location.origin+location.pathname+'#song='+encodeURIComponent(enc(payload));return animateTomorrowSeal({title:'O piesă pentru mâine',text:`Ți-am ales o piesă pentru mâine 🎵`,url:link},title)}const text=$('#tomorrowText').value.trim();if(!text)return alert('Scrie mesajul pentru mâine.');const payload={id:crypto.randomUUID?.()||Date.now(),type:'letter',kind,text,openDate:dateParis(1),from:profile,fromName:me().name};const url=location.origin+location.pathname+'#letter='+encodeURIComponent(enc(payload));animateTomorrowSeal({title:'Un plic pentru mâine',text:`Ți-am lăsat un plic pentru mâine 💌`,url},kind)}
}
function animateTomorrowSeal(shareData,label='Pentru mâine'){
 const overlay=document.createElement('div');overlay.className='tomorrow-seal-overlay';overlay.innerHTML=`<div class="tomorrow-seal-card"><div class="kicker">DIN DOUĂ INIMI PENTRU MÂINE</div><h2>Sigilăm ceva care merită așteptat</h2><div class="tomorrow-theatre"><div class="tomorrow-hearts"><span class="th-left">♥</span><span class="th-right">♥</span><span class="th-one">♥</span></div><div class="tomorrow-envelope"><div class="tomorrow-flap"></div><div class="tomorrow-note"><b>${esc(label)}</b><small>se deschide mâine</small></div><div class="tomorrow-wax">♥</div></div></div><p id="tomorrowSealText">Cele două jumătăți pornesc una spre cealaltă…</p></div>`;document.body.append(overlay);requestAnimationFrame(()=>overlay.classList.add('run'));setTimeout(()=>$('#tomorrowSealText',overlay).textContent='Inimile s-au unit.',1200);setTimeout(()=>$('#tomorrowSealText',overlay).textContent='Pecetea coboară pe plic.',2350);setTimeout(()=>$('#tomorrowSealText',overlay).textContent='Plicul pentru mâine este sigilat. Te iubesc.',3500);setTimeout(async()=>{await share(shareData);overlay.remove()},4550)
}

init();
