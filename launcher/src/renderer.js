let cosmetics=[],ownedCosmetics=[],equippedCosmetics={},currentCat='capes',profile=null;
const ICONS={cape_shadow:'🖤',cape_light:'🤍',cape_sun:'☀️',cape_rainbow:'🌈',cape_fire:'🔥',cape_ice:'❄️',hat_crown:'👑',hat_wizard:'🧙',hat_top:'🎩',hat_santa:'🎅',hat_viking:'⚔️',wings_angel:'😇',wings_demon:'😈',wings_dragon:'🐉',wings_butterfly:'🦋',aura_flame:'🔥',aura_snow:'🌨️',aura_hearts:'💕',aura_music:'🎵',aura_enchant:'✨'};

document.addEventListener('DOMContentLoaded',async()=>{
  // Titlebar
  document.getElementById('btn-min').onclick=()=>window.api.minimize();
  document.getElementById('btn-max').onclick=()=>window.api.maximize();
  document.getElementById('btn-close').onclick=()=>window.api.close();

  // Particles
  const pc=document.getElementById('particles');
  for(let i=0;i<30;i++){const p=document.createElement('div');p.className='particle';p.style.left=Math.random()*100+'%';p.style.animationDelay=Math.random()*6+'s';p.style.animationDuration=(4+Math.random()*4)+'s';const s=(2+Math.random()*4)+'px';p.style.width=p.style.height=s;pc.appendChild(p);}

  // Nav
  document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.getElementById('tab-'+b.dataset.tab).classList.add('active');});
  document.querySelectorAll('.cat-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.cat-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentCat=b.dataset.cat;renderCosmetics();});

  // Auth toggle
  document.getElementById('show-reg').onclick=e=>{e.preventDefault();document.getElementById('form-login').classList.add('hidden');document.getElementById('form-register').classList.remove('hidden');};
  document.getElementById('show-login').onclick=e=>{e.preventDefault();document.getElementById('form-register').classList.add('hidden');document.getElementById('form-login').classList.remove('hidden');};

  // Login
  const doLogin=async()=>{
    const u=document.getElementById('login-user').value.trim(),p=document.getElementById('login-pass').value;
    if(!u||!p)return showErr('login-error','Benutzername und Passwort eingeben');
    const r=await window.api.login(u,p);
    if(r.success){profile=r.profile;showMain();}else showErr('login-error',r.error);
  };
  document.getElementById('btn-login').onclick=doLogin;
  document.getElementById('login-pass').onkeydown=e=>{if(e.key==='Enter')doLogin();};
  document.getElementById('login-user').onkeydown=e=>{if(e.key==='Enter')document.getElementById('login-pass').focus();};

  // Register
  const doReg=async()=>{
    const u=document.getElementById('reg-user').value.trim(),p=document.getElementById('reg-pass').value,p2=document.getElementById('reg-pass2').value;
    if(!u||!p||!p2)return showErr('reg-error','Alle Felder ausfuellen');
    if(p!==p2)return showErr('reg-error','Passwoerter stimmen nicht ueberein');
    const r=await window.api.register(u,p);
    if(r.success){profile=r.profile;showMain();}else showErr('reg-error',r.error);
  };
  document.getElementById('btn-register').onclick=doReg;
  document.getElementById('reg-pass2').onkeydown=e=>{if(e.key==='Enter')doReg();};

  // Logout
  document.getElementById('btn-logout').onclick=async()=>{await window.api.logout();profile=null;document.getElementById('screen-main').classList.add('hidden');document.getElementById('screen-login').classList.remove('hidden');};

  // Play
  document.getElementById('btn-play').onclick=async()=>{
    document.getElementById('btn-play').classList.add('hidden');document.getElementById('play-status').classList.remove('hidden');
    const r=await window.api.launchGame();
    if(!r.success){toast('Fehler: '+r.error);document.getElementById('btn-play').classList.remove('hidden');document.getElementById('play-status').classList.add('hidden');}
  };

  // Coins event
  window.api.onCoinsUpdated(d=>{updateCoins(d.coins);if(d.earned>0)toast('+'+d.earned+' Coins! ('+d.minutes+' Min.)');document.getElementById('btn-play').classList.remove('hidden');document.getElementById('play-status').classList.add('hidden');});

  // Launch events
  window.api.onLaunchError(e=>{toast('Fehler: '+e);document.getElementById('btn-play').classList.remove('hidden');document.getElementById('play-status').classList.add('hidden');});
  window.api.onLaunchProgress(p=>{if(p.type){document.getElementById('play-status').innerHTML='<div class="spinner"></div><span>'+p.type+' ('+Math.round((p.task/p.total)*100)+'%)</span>';}});

  // Settings
  document.getElementById('btn-save').onclick=async()=>{await window.api.saveSettings({ram:document.getElementById('set-ram').value});toast('Gespeichert!');};
  const s=await window.api.getSettings();if(s.ram)document.getElementById('set-ram').value=s.ram;

  // Auto-login
  profile=await window.api.getProfile();
  if(profile)showMain();
});

function showErr(id,msg){const e=document.getElementById(id);e.textContent=msg;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),4000);}

async function showMain(){
  document.getElementById('screen-login').classList.add('hidden');document.getElementById('screen-main').classList.remove('hidden');
  document.getElementById('pname').textContent=profile.name;
  document.getElementById('avatar').src='https://mc-heads.net/avatar/'+profile.name+'/36';
  if(profile.isOwner){document.getElementById('owner').classList.remove('hidden');document.getElementById('vip').classList.add('hidden');}
  else if(profile.isVIP){document.getElementById('vip').classList.remove('hidden');document.getElementById('owner').classList.add('hidden');}
  else{document.getElementById('vip').classList.add('hidden');document.getElementById('owner').classList.add('hidden');}
  cosmetics=await window.api.getCosmetics();ownedCosmetics=await window.api.getOwnedCosmetics();equippedCosmetics=await window.api.getEquippedCosmetics();
  updateCoins(await window.api.getCoins());renderCosmetics();updateSlots();
}

function updateCoins(n){document.getElementById('coins').textContent=n.toLocaleString('de-DE');document.getElementById('shop-coins').textContent=n.toLocaleString('de-DE');}

function renderCosmetics(){
  const g=document.getElementById('cosm-grid');
  g.innerHTML=cosmetics.filter(c=>c.category===currentCat).map(c=>{
    const own=ownedCosmetics.includes(c.id),eq=equippedCosmetics[c.category]===c.id,ico=ICONS[c.id]||'?';
    let cls='cosm-card',badge='';
    if(eq){cls+=' equipped';badge='<span class="badge badge-equipped">Ausgeruestet</span>';}
    else if(own){cls+=' owned';badge='<span class="badge badge-owned">Besitzt</span>';}
    else if(profile&&profile.isVIP)badge='<span class="badge badge-vip">VIP Gratis</span>';
    else badge='<span class="badge badge-buy">Kaufen</span>';
    return '<div class="'+cls+'" onclick="cosClick(\''+c.id+'\')"><div class="cosm-icon">'+ico+'</div><div class="cosm-name">'+c.name+'</div><div class="cosm-desc">'+c.description+'</div><div class="cosm-foot"><span class="cosm-price">🪙 '+c.price+'</span>'+badge+'</div></div>';
  }).join('');
}

window.cosClick=async function(id){
  if(!ownedCosmetics.includes(id)){const r=await window.api.buyCosmetic(id);if(r.success){ownedCosmetics.push(id);updateCoins(r.coins);toast('Gekauft!');}else{toast(r.error);return;}}
  const r=await window.api.equipCosmetic(id);if(r.success){equippedCosmetics=r.equipped;renderCosmetics();updateSlots();const c=cosmetics.find(x=>x.id===id);toast(equippedCosmetics[c.category]===id?c.name+' ausgeruestet!':c.name+' abgelegt.');}
};

function updateSlots(){
  const m={capes:'sl-cape',hats:'sl-hat',wings:'sl-wings',auras:'sl-aura'};
  for(const[cat,sid]of Object.entries(m)){const eid=equippedCosmetics[cat];document.getElementById(sid).textContent=eid?cosmetics.find(c=>c.id===eid)?.name||'Keins':'Keins';}
}

function toast(msg){const t=document.getElementById('toast');document.getElementById('toast-msg').textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3000);}
