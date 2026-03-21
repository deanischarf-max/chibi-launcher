let cosmetics=[],ownedCosmetics=[],equippedCosmetics={},currentCat='capes',profile=null;
let currentInstance=null, browseType='modpack';
const ICONS={cape_shadow:'🖤',cape_light:'🤍',cape_sun:'☀️',cape_rainbow:'🌈',cape_fire:'🔥',cape_ice:'❄️',cape_void:'🕳️',cape_emerald:'💎',cape_redstone:'🔴',cape_ender:'🟣',cape_nether:'🟠',cape_cherry:'🌸',cape_galaxy:'🌌',cape_phantom:'👻',hat_crown:'👑',hat_wizard:'🧙',hat_top:'🎩',hat_santa:'🎅',hat_viking:'⚔️',hat_pirate:'🏴‍☠️',hat_samurai:'🗡️',hat_astronaut:'🧑‍🚀',hat_knight:'🛡️',hat_beret:'🎨',hat_mushroom:'🍄',hat_halo:'😇',hat_devil:'😈',wings_angel:'👼',wings_demon:'🦇',wings_dragon:'🐉',wings_butterfly:'🦋',wings_phoenix:'🔥',wings_bee:'🐝',wings_crystal:'💠',wings_bat:'🦇',wings_fairy:'🧚',wings_steampunk:'⚙️',aura_flame:'🔥',aura_snow:'🌨️',aura_hearts:'💕',aura_music:'🎵',aura_enchant:'✨',aura_lightning:'⚡',aura_cherry:'🌸',aura_void:'🌑',aura_rainbow:'🌈',aura_bubbles:'🫧',aura_skulls:'💀',aura_diamond:'💎',aura_bats:'🦇',emote_dab:'🙆',emote_wave:'👋',emote_salute:'🫡',emote_breakdance:'🕺',emote_floss:'💃',emote_headbang:'🤘',emote_clap:'👏',emote_facepalm:'🤦',pet_cat:'🐱',pet_dog:'🐶',pet_parrot:'🦜',pet_fox:'🦊',pet_axolotl:'🐙',pet_bee:'🐝',pet_dragon:'🐲',pet_ghost:'👻',trail_fire:'🔥',trail_ice:'❄️',trail_rainbow:'🌈',trail_flowers:'🌺',trail_lightning:'⚡',trail_shadow:'🌑'};

document.addEventListener('DOMContentLoaded', async () => {
  // Titlebar
  document.getElementById('btn-min').onclick = () => window.api.minimize();
  document.getElementById('btn-max').onclick = () => window.api.maximize();
  document.getElementById('btn-close').onclick = () => window.api.close();

  // Particles
  const pc = document.getElementById('particles');
  for (let i = 0; i < 30; i++) { const p = document.createElement('div'); p.className = 'particle'; p.style.left = Math.random()*100+'%'; p.style.animationDelay = Math.random()*6+'s'; p.style.animationDuration = (4+Math.random()*4)+'s'; const s=(2+Math.random()*4)+'px'; p.style.width=p.style.height=s; pc.appendChild(p); }

  // Nav
  document.querySelectorAll('.nav-btn').forEach(b => b.onclick = () => { document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); document.getElementById('tab-'+b.dataset.tab).classList.add('active'); });
  document.querySelectorAll('.cat-btn').forEach(b => b.onclick = () => { document.querySelectorAll('.cat-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); currentCat=b.dataset.cat; renderCosmetics(); });

  // Auth
  document.getElementById('show-reg').onclick = e => { e.preventDefault(); document.getElementById('form-login').classList.add('hidden'); document.getElementById('form-register').classList.remove('hidden'); };
  document.getElementById('show-login').onclick = e => { e.preventDefault(); document.getElementById('form-register').classList.add('hidden'); document.getElementById('form-login').classList.remove('hidden'); };
  const doLogin = async () => { const u=document.getElementById('login-user').value.trim(),p=document.getElementById('login-pass').value; if(!u||!p)return showErr('login-error','Benutzername und Passwort eingeben'); const r=await window.api.login(u,p); if(r.success){profile=r.profile;showMain();}else showErr('login-error',r.error); };
  document.getElementById('btn-login').onclick = doLogin;
  document.getElementById('login-pass').onkeydown = e => { if(e.key==='Enter') doLogin(); };
  document.getElementById('login-user').onkeydown = e => { if(e.key==='Enter') document.getElementById('login-pass').focus(); };
  const doReg = async () => { const u=document.getElementById('reg-user').value.trim(),p=document.getElementById('reg-pass').value,p2=document.getElementById('reg-pass2').value; if(!u||!p||!p2)return showErr('reg-error','Alle Felder ausfuellen'); if(p!==p2)return showErr('reg-error','Passwoerter stimmen nicht ueberein'); const r=await window.api.register(u,p); if(r.success){profile=r.profile;showMain();}else showErr('reg-error',r.error); };
  document.getElementById('btn-register').onclick = doReg;
  document.getElementById('reg-pass2').onkeydown = e => { if(e.key==='Enter') doReg(); };
  document.getElementById('btn-logout').onclick = async () => { await window.api.logout(); profile=null; document.getElementById('screen-main').classList.add('hidden'); document.getElementById('screen-login').classList.remove('hidden'); };

  // ── Instanzen ──
  document.getElementById('btn-new-instance').onclick = () => document.getElementById('modal-new-instance').classList.remove('hidden');
  document.getElementById('modal-close-instance').onclick = () => document.getElementById('modal-new-instance').classList.add('hidden');
  document.getElementById('btn-create-instance').onclick = async () => {
    const name = document.getElementById('inst-name').value.trim();
    const version = document.getElementById('inst-version').value;
    const loader = document.getElementById('inst-loader').value;
    if (!name) return toast('Name eingeben!');
    if (loader === 'forge') return toast('Forge wird noch nicht unterstuetzt. Bitte Fabric oder Vanilla waehlen.');
    const r = await window.api.createInstance(name, version, loader);
    if (r.success) { toast('Instanz "'+name+'" erstellt!'); document.getElementById('modal-new-instance').classList.add('hidden'); document.getElementById('inst-name').value=''; renderInstances(); }
    else toast('Fehler: '+r.error);
  };
  document.getElementById('btn-back-instances').onclick = () => { currentInstance=null; document.getElementById('instance-detail').classList.add('hidden'); document.getElementById('instance-grid').classList.remove('hidden'); document.getElementById('btn-new-instance').classList.remove('hidden'); document.querySelector('.tab-header h2').textContent='Meine Instanzen'; renderInstances(); };

  // Instance tabs
  document.querySelectorAll('.inst-tab').forEach(b => b.onclick = () => { document.querySelectorAll('.inst-tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); document.querySelectorAll('.inst-panel').forEach(p=>p.classList.remove('active')); document.getElementById('ipanel-'+b.dataset.itab).classList.add('active'); });

  // Instance mod/rp/shader search
  document.getElementById('inst-mod-search-btn').onclick = () => searchForInstance('mod', document.getElementById('inst-mod-search').value, 'inst-mod-results');
  document.getElementById('inst-mod-search').onkeydown = e => { if(e.key==='Enter') document.getElementById('inst-mod-search-btn').click(); };
  document.getElementById('inst-rp-search-btn').onclick = () => searchForInstance('resourcepack', document.getElementById('inst-rp-search').value, 'inst-rp-results');
  document.getElementById('inst-rp-search').onkeydown = e => { if(e.key==='Enter') document.getElementById('inst-rp-search-btn').click(); };
  document.getElementById('inst-shader-search-btn').onclick = () => searchForInstance('shader', document.getElementById('inst-shader-search').value, 'inst-shader-results');
  document.getElementById('inst-shader-search').onkeydown = e => { if(e.key==='Enter') document.getElementById('inst-shader-search-btn').click(); };

  // Play
  document.getElementById('btn-play').onclick = async () => {
    if (!currentInstance) return toast('Keine Instanz ausgewaehlt');
    document.getElementById('btn-play').classList.add('hidden'); document.getElementById('play-status').classList.remove('hidden'); document.getElementById('error-log').classList.add('hidden');
    const r = await window.api.launchInstance(currentInstance.id);
    if (!r.success) { toast('Fehler: '+r.error); document.getElementById('btn-play').classList.remove('hidden'); document.getElementById('play-status').classList.add('hidden'); }
  };

  // Microsoft Account
  document.getElementById('btn-mc-login').onclick = async () => {
    const btn = document.getElementById('btn-mc-login'); btn.textContent='Anmelden...'; btn.disabled=true;
    const r = await window.api.mcLogin();
    if (r.success) { toast('Microsoft Account verknuepft: '+r.name); updateMcAccount(); }
    else { toast('Fehler: '+r.error); btn.textContent='Microsoft Account verknuepfen'; btn.disabled=false; }
  };

  // Events
  window.api.onCoinsUpdated(d => { updateCoins(d.coins); if(d.earned>0) toast('+'+d.earned+' Coins!'); document.getElementById('btn-play').classList.remove('hidden'); document.getElementById('play-status').classList.add('hidden'); });
  window.api.onLaunchError(e => { document.getElementById('btn-play').classList.remove('hidden'); document.getElementById('play-status').classList.add('hidden'); document.getElementById('error-log').textContent=e; document.getElementById('error-log').classList.remove('hidden'); });
  window.api.onLaunchProgress(p => { if(p.type) document.getElementById('play-status').innerHTML='<div class="spinner"></div><span>'+p.type+' ('+Math.round((p.task/p.total)*100)+'%)</span>'; });
  window.api.onUpdateStatus(msg => toast(msg));

  // ── Browse Tab ──
  document.querySelectorAll('.src-btn').forEach(b => b.onclick = () => { document.querySelectorAll('.src-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); browseType=b.dataset.btype; searchBrowse(''); });
  document.getElementById('browse-search-btn').onclick = () => searchBrowse(document.getElementById('browse-search').value);
  document.getElementById('browse-search').onkeydown = e => { if(e.key==='Enter') searchBrowse(document.getElementById('browse-search').value); };

  // Settings
  document.getElementById('btn-save').onclick = async () => { await window.api.saveSettings({ram:document.getElementById('set-ram').value, javaPath:document.getElementById('set-java').value}); toast('Gespeichert!'); };
  const s = await window.api.getSettings(); if(s.ram) document.getElementById('set-ram').value=s.ram; if(s.javaPath) document.getElementById('set-java').value=s.javaPath;

  // Auto-login
  profile = await window.api.getProfile();
  if (profile) showMain();
});

function showErr(id,msg) { const e=document.getElementById(id); e.textContent=msg; e.classList.remove('hidden'); setTimeout(()=>e.classList.add('hidden'),4000); }

async function showMain() {
  document.getElementById('screen-login').classList.add('hidden'); document.getElementById('screen-main').classList.remove('hidden');
  document.getElementById('pname').textContent=profile.name;
  document.getElementById('avatar').src='https://mc-heads.net/avatar/'+profile.name+'/36';
  if(profile.isOwner){document.getElementById('owner').classList.remove('hidden');document.getElementById('vip').classList.add('hidden');}
  else if(profile.isVIP){document.getElementById('vip').classList.remove('hidden');document.getElementById('owner').classList.add('hidden');}
  else{document.getElementById('vip').classList.add('hidden');document.getElementById('owner').classList.add('hidden');}
  cosmetics=await window.api.getCosmetics(); ownedCosmetics=await window.api.getOwnedCosmetics(); equippedCosmetics=await window.api.getEquippedCosmetics();
  updateCoins(await window.api.getCoins()); renderCosmetics(); renderInstances(); updateMcAccount();
  searchBrowse('');
}

function updateCoins(n) { document.getElementById('coins').textContent=n.toLocaleString('de-DE'); document.getElementById('shop-coins').textContent=n.toLocaleString('de-DE'); }

// ── Instanzen ──
async function renderInstances() {
  const instances = await window.api.getInstances();
  const grid = document.getElementById('instance-grid');
  if (!instances || instances.length === 0) { grid.innerHTML='<div class="instance-empty"><p>Noch keine Instanzen erstellt.</p><p class="dim">Erstelle eine neue Instanz um zu spielen!</p></div>'; return; }
  grid.innerHTML = instances.map(i => `
    <div class="instance-card" onclick="openInstance('${i.id}')">
      <button class="inst-delete" onclick="event.stopPropagation();deleteInstance('${i.id}')">&times;</button>
      <div class="inst-name">${esc(i.name)}</div>
      <div class="inst-meta">
        <span class="pill">${i.version}</span>
        <span class="pill${i.loader==='fabric'?' pill-fabric':i.loader==='forge'?' pill-forge':''}">${i.loader}</span>
      </div>
      <div class="inst-mods">${(i.mods||[]).length} Mods &bull; ${(i.resourcepacks||[]).length} Packs &bull; ${(i.shaders||[]).length} Shaders</div>
      <button class="inst-play-btn" onclick="event.stopPropagation();quickPlay('${i.id}')">&#9654; Spielen</button>
    </div>
  `).join('');
}

window.openInstance = async function(id) {
  const instances = await window.api.getInstances();
  currentInstance = instances.find(i => i.id === id);
  if (!currentInstance) return;
  document.getElementById('instance-grid').classList.add('hidden');
  document.getElementById('btn-new-instance').classList.add('hidden');
  document.querySelector('.tab-header h2').textContent = '';
  document.getElementById('instance-detail').classList.remove('hidden');
  document.getElementById('inst-detail-name').textContent = currentInstance.name;
  document.getElementById('inst-detail-version').textContent = currentInstance.version;
  document.getElementById('inst-detail-loader').textContent = currentInstance.loader;
  document.getElementById('inst-detail-modcount').textContent = (currentInstance.mods||[]).length + ' Mods';
  renderInstanceContent();
};

window.deleteInstance = async function(id) {
  await window.api.deleteInstance(id);
  toast('Instanz geloescht');
  renderInstances();
};

window.quickPlay = async function(id) {
  currentInstance = (await window.api.getInstances()).find(i => i.id === id);
  if (!currentInstance) return;
  toast('Starte '+currentInstance.name+'...');
  const r = await window.api.launchInstance(id);
  if (!r.success) toast('Fehler: '+r.error);
};

function renderInstanceContent() {
  // Mods
  const mods = currentInstance.mods || [];
  document.getElementById('inst-mod-list').innerHTML = mods.length === 0 ? '<span class="dim">Keine Mods</span>' :
    mods.map(m => `<span class="installed-tag">${esc(m.name)} <span class="remove" onclick="removeFromInstance('${currentInstance.id}','${esc(m.file)}','mod')">&times;</span></span>`).join('');
  // Resource Packs
  const rps = currentInstance.resourcepacks || [];
  document.getElementById('inst-rp-list').innerHTML = rps.length === 0 ? '<span class="dim">Keine Resource Packs</span>' :
    rps.map(m => `<span class="installed-tag">${esc(m.name)} <span class="remove" onclick="removeFromInstance('${currentInstance.id}','${esc(m.file)}','resourcepack')">&times;</span></span>`).join('');
  // Shaders
  const shaders = currentInstance.shaders || [];
  document.getElementById('inst-shader-list').innerHTML = shaders.length === 0 ? '<span class="dim">Keine Shaders</span>' :
    shaders.map(m => `<span class="installed-tag">${esc(m.name)} <span class="remove" onclick="removeFromInstance('${currentInstance.id}','${esc(m.file)}','shader')">&times;</span></span>`).join('');
  document.getElementById('inst-detail-modcount').textContent = mods.length + ' Mods';
}

window.removeFromInstance = async function(instId, file, type) {
  await window.api.removeFromInstance(instId, file, type);
  currentInstance = (await window.api.getInstances()).find(i => i.id === instId);
  renderInstanceContent();
  toast('Entfernt');
};

// ── Search for instance content ──
async function searchForInstance(type, query, gridId) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:10px;color:var(--dim)"><div class="spinner"></div>Suche...</div>';
  const results = await window.api.searchModrinth(type, query);
  if (!results || results.length === 0) { grid.innerHTML = '<span class="dim">Keine Ergebnisse</span>'; return; }
  grid.innerHTML = results.map(r => `
    <div class="browse-card">
      <img class="browse-icon" src="${r.icon_url||''}" onerror="this.style.display='none'" alt="">
      <div class="browse-info">
        <div class="browse-name">${esc(r.title)}</div>
        <div class="browse-desc">${esc(r.description||'')}</div>
        <div class="browse-meta"><span>&#11015; ${formatNum(r.downloads)}</span></div>
      </div>
      <div class="browse-actions">
        <button class="btn-green" onclick="addToInstance('${r.slug}','${esc(r.title)}','${type}')">+ Hinzufuegen</button>
      </div>
    </div>
  `).join('');
}

window.addToInstance = async function(slug, title, type) {
  if (!currentInstance) return toast('Keine Instanz offen');
  toast(title+' wird heruntergeladen...');
  const r = await window.api.addToInstance(currentInstance.id, slug, type);
  if (r.success) {
    toast(title+' hinzugefuegt!');
    currentInstance=(await window.api.getInstances()).find(i=>i.id===currentInstance.id);
    renderInstanceContent();
    // Update loader badge (auto-upgrade to fabric when mods added)
    if (currentInstance) {
      document.getElementById('inst-detail-loader').textContent = currentInstance.loader;
      document.getElementById('inst-detail-loader').className = 'pill' + (currentInstance.loader==='fabric'?' pill-fabric':'');
    }
  }
  else toast('Fehler: '+r.error);
};

// ── Browse Tab ──
async function searchBrowse(query) {
  const grid = document.getElementById('browse-grid');
  grid.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:10px;color:var(--dim)"><div class="spinner"></div>Laden...</div>';
  const results = await window.api.searchModrinth(browseType, query);
  if (!results || results.length === 0) { grid.innerHTML = '<span class="dim">Keine Ergebnisse</span>'; return; }
  grid.innerHTML = results.map(r => `
    <div class="browse-card">
      <img class="browse-icon" src="${r.icon_url||''}" onerror="this.style.display='none'" alt="">
      <div class="browse-info">
        <div class="browse-name">${esc(r.title)}</div>
        <div class="browse-desc">${esc(r.description||'')}</div>
        <div class="browse-meta">
          <span>&#11015; ${formatNum(r.downloads)}</span>
          <span>&#9733; ${formatNum(r.follows||0)}</span>
          ${(r.categories||[]).slice(0,3).map(c=>'<span>'+esc(c)+'</span>').join('')}
        </div>
      </div>
      <div class="browse-actions">
        <button class="btn-green" onclick="browseInstall('${r.slug}','${esc(r.title)}')">Installieren</button>
      </div>
    </div>
  `).join('');
}

window.browseInstall = async function(slug, title) {
  const instances = await window.api.getInstances();
  if (instances.length === 0) { toast('Erstelle zuerst eine Instanz!'); return; }
  if (instances.length === 1) { await installToInstance(slug, title, instances[0]); return; }
  // Multiple instances - show picker
  showInstancePicker(instances, async (inst) => {
    await installToInstance(slug, title, inst);
  });
};

function showInstancePicker(instances, callback) {
  let overlay = document.getElementById('instance-picker-overlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'instance-picker-overlay';
  overlay.className = 'modal';
  overlay.innerHTML = `<div class="modal-box"><div class="modal-header"><h3>Instanz waehlen</h3><button class="modal-close" id="picker-close">&times;</button></div><div class="modal-body" id="picker-list"></div></div>`;
  document.body.appendChild(overlay);
  document.getElementById('picker-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  const list = document.getElementById('picker-list');
  list.innerHTML = instances.map(i => `<button class="btn btn-primary btn-full" style="margin-bottom:6px" data-pick-id="${i.id}">${esc(i.name)} <span class="dim" style="color:rgba(255,255,255,.6)">(${i.version} ${i.loader})</span></button>`).join('');
  list.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => { overlay.remove(); const inst = instances.find(i => i.id === btn.dataset.pickId); if (inst) callback(inst); };
  });
}

async function installToInstance(slug, title, inst) {
  toast(title+' wird zu "'+inst.name+'" hinzugefuegt...');
  const r = await window.api.addToInstance(inst.id, slug, browseType);
  if (r.success) toast(esc(title)+' in "'+esc(inst.name)+'" installiert!');
  else toast('Fehler: '+r.error);
}

// ── Microsoft Account ──
async function updateMcAccount() {
  const acc = await window.api.getMcAccount();
  const btn = document.getElementById('btn-mc-login');
  if (acc && acc.name) {
    document.getElementById('mc-account-status').classList.add('hidden');
    document.getElementById('mc-account-name').textContent='✓ '+acc.name; document.getElementById('mc-account-name').classList.remove('hidden');
    btn.textContent='Abmelden'; btn.disabled=false; btn.onclick=async()=>{await window.api.mcLogout();updateMcAccount();};
  } else {
    document.getElementById('mc-account-status').classList.remove('hidden'); document.getElementById('mc-account-name').classList.add('hidden');
    btn.textContent='Microsoft Account verknuepfen'; btn.disabled=false;
    btn.onclick=async()=>{btn.textContent='Anmelden...';btn.disabled=true;const r=await window.api.mcLogin();if(r.success){toast('Verknuepft: '+r.name);updateMcAccount();}else{toast('Fehler: '+r.error);btn.textContent='Microsoft Account verknuepfen';btn.disabled=false;}};
  }
}

// ── Cosmetics ──
function renderCosmetics() {
  const g=document.getElementById('cosm-grid');
  g.innerHTML=cosmetics.filter(c=>c.category===currentCat).map(c=>{
    const own=ownedCosmetics.includes(c.id),eq=equippedCosmetics[c.category]===c.id,ico=ICONS[c.id]||'?';
    let cls='cosm-card',badge='';
    if(eq){cls+=' equipped';badge='<span class="badge badge-equipped">Equipped</span>';}
    else if(own){cls+=' owned';badge='<span class="badge badge-owned">Besitzt</span>';}
    else if(profile&&profile.isVIP)badge='<span class="badge badge-vip">VIP</span>';
    else badge='<span class="badge badge-buy">Kaufen</span>';
    return '<div class="'+cls+'" onclick="cosClick(\''+c.id+'\')"><div class="cosm-icon">'+ico+'</div><div class="cosm-name">'+c.name+'</div><div class="cosm-desc">'+c.description+'</div><div class="cosm-foot"><span class="cosm-price">🪙 '+c.price+'</span>'+badge+'</div></div>';
  }).join('');
}
window.cosClick=async function(id){if(!ownedCosmetics.includes(id)){const r=await window.api.buyCosmetic(id);if(r.success){ownedCosmetics.push(id);updateCoins(r.coins);toast('Gekauft!');}else{toast(r.error);return;}}const r=await window.api.equipCosmetic(id);if(r.success){equippedCosmetics=r.equipped;renderCosmetics();const c=cosmetics.find(x=>x.id===id);toast(equippedCosmetics[c.category]===id?c.name+' ausgeruestet!':c.name+' abgelegt.');}};

function toast(msg){const t=document.getElementById('toast');document.getElementById('toast-msg').textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3000);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function formatNum(n){if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'K';return n;}
