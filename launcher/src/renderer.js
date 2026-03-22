let cosmetics=[],ownedCosmetics=[],equippedCosmetics={},currentCat='capes',profile=null;
let currentInstance=null, browseType='modpack';
const CAT_GRADIENTS={capes:'linear-gradient(135deg, #1a1a3e, #2d1b69)',hats:'linear-gradient(135deg, #1b3a1b, #2d6930)',wings:'linear-gradient(135deg, #1b2a3e, #2d4b69)',auras:'linear-gradient(135deg, #3e1a3e, #692d69)',emotes:'linear-gradient(135deg, #3e3a1a, #69602d)',pets:'linear-gradient(135deg, #1a3e2a, #2d694b)',trails:'linear-gradient(135deg, #3e1a1a, #692d2d)',particles:'linear-gradient(135deg, #1a2e3e, #2d5069)',accessories:'linear-gradient(135deg, #2e2e1a, #52522d)',masks:'linear-gradient(135deg, #1a1a1a, #3d3d3d)',mounts:'linear-gradient(135deg, #2e1a1a, #523030)',banners:'linear-gradient(135deg, #1a1a2e, #2d2d52)',sounds:'linear-gradient(135deg, #1a2e1a, #2d522d)',titles:'linear-gradient(135deg, #2e2e2e, #4a4a4a)'};
// Cosmetic color based on name keywords
function cosmColor(id) {
  if (!id) return '#e94560';
  if (id.includes('fire')||id.includes('feuer')||id.includes('flamm')||id.includes('lava')||id.includes('vulkan')) return '#ef4444';
  if (id.includes('ice')||id.includes('eis')||id.includes('snow')||id.includes('schnee')||id.includes('winter')) return '#38bdf8';
  if (id.includes('rainbow')||id.includes('regenbogen')) return '#a855f7';
  if (id.includes('shadow')||id.includes('schatten')||id.includes('void')||id.includes('wither')||id.includes('halloween')) return '#374151';
  if (id.includes('sun')||id.includes('sonn')||id.includes('gold')||id.includes('licht')||id.includes('sommer')) return '#fbbf24';
  if (id.includes('cherry')||id.includes('kirsch')||id.includes('sakura')||id.includes('herz')||id.includes('heart')||id.includes('kawaii')) return '#f472b6';
  if (id.includes('dragon')||id.includes('drach')) return '#7c3aed';
  if (id.includes('creeper')||id.includes('natur')||id.includes('blumen')||id.includes('frueh')) return '#22c55e';
  if (id.includes('ender')||id.includes('portal')) return '#8b5cf6';
  if (id.includes('neon')||id.includes('pixel')) return '#06b6d4';
  if (id.includes('redstone')) return '#dc2626';
  if (id.includes('diamond')||id.includes('diamant')||id.includes('kristall')) return '#22d3ee';
  if (id.includes('odin')||id.includes('zeus')||id.includes('blitz')) return '#fcd34d';
  if (id.includes('einhorn')) return '#e879f9';
  if (id.includes('anubis')||id.includes('hades')) return '#92400e';
  return '#e94560';
}

// Build cosmetic preview with player skin + overlay
function buildPreview(c) {
  const skin = (profile && profile.name) ? profile.name : 'Steve';
  const skinUrl = 'https://mc-heads.net/body/' + skin + '/64';
  const col = cosmColor(c.id);
  const cat = c.category;

  // Category-specific overlay on the player skin
  const overlays = {
    capes: `<div style="position:absolute;right:6px;top:18px;width:18px;height:32px;background:${col};border-radius:1px 1px 3px 3px;opacity:.85;box-shadow:0 2px 6px ${col}55"></div>`,
    hats: `<div style="position:absolute;left:50%;top:2px;transform:translateX(-50%);width:22px;height:12px;background:${col};border-radius:3px 3px 1px 1px;box-shadow:0 -2px 6px ${col}55"></div><div style="position:absolute;left:50%;top:13px;transform:translateX(-50%);width:28px;height:4px;background:${col};border-radius:1px;opacity:.7"></div>`,
    wings: `<div style="position:absolute;right:2px;top:14px;width:14px;height:28px;background:${col};opacity:.7;border-radius:50% 0 0 50%;transform:skewY(-8deg);box-shadow:0 0 8px ${col}55"></div><div style="position:absolute;left:2px;top:14px;width:14px;height:28px;background:${col};opacity:.7;border-radius:0 50% 50% 0;transform:skewY(8deg);box-shadow:0 0 8px ${col}55"></div>`,
    auras: `<div style="position:absolute;inset:0;border:2px solid ${col};border-radius:50%;opacity:.5;animation:m3dPulse 2s infinite"></div><div style="position:absolute;inset:8px;border:1px solid ${col};border-radius:50%;opacity:.3"></div>`,
    emotes: `<div style="position:absolute;top:4px;right:2px;background:${col};color:#fff;font-size:8px;padding:2px 4px;border-radius:4px;font-weight:700">!</div>`,
    pets: `<div style="position:absolute;bottom:4px;right:2px;width:14px;height:12px;background:${col};border-radius:3px;box-shadow:0 0 6px ${col}55"><div style="width:4px;height:4px;background:#111;border-radius:50%;position:absolute;top:3px;left:2px"></div><div style="width:4px;height:4px;background:#111;border-radius:50%;position:absolute;top:3px;right:2px"></div></div>`,
    trails: `<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px"><div style="width:4px;height:4px;background:${col};border-radius:50%;opacity:.4"></div><div style="width:6px;height:6px;background:${col};border-radius:50%;opacity:.6"></div><div style="width:8px;height:8px;background:${col};border-radius:50%;opacity:.8"></div></div>`,
    particles: `<div style="position:absolute;top:8px;left:6px;width:5px;height:5px;background:${col};transform:rotate(45deg);opacity:.7"></div><div style="position:absolute;top:20px;right:4px;width:4px;height:4px;background:${col};transform:rotate(45deg);opacity:.5"></div><div style="position:absolute;bottom:12px;left:10px;width:3px;height:3px;background:${col};transform:rotate(45deg);opacity:.6"></div>`,
    accessories: `<div style="position:absolute;top:22px;left:50%;transform:translateX(-50%);width:20px;height:2px;background:${col};border-radius:1px"></div><div style="position:absolute;top:24px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:${col};border-radius:50%;box-shadow:0 0 4px ${col}"></div>`,
    masks: `<div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);width:20px;height:12px;background:${col};border-radius:4px;opacity:.8"><div style="position:absolute;width:5px;height:4px;background:#111;border-radius:50%;top:3px;left:2px"></div><div style="position:absolute;width:5px;height:4px;background:#111;border-radius:50%;top:3px;right:2px"></div></div>`,
    mounts: `<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:30px;height:16px;background:${col};border-radius:4px 4px 0 0;opacity:.7"><div style="width:10px;height:8px;background:${col};border-radius:2px;position:absolute;top:-6px;left:-2px"></div></div>`,
    banners: `<div style="position:absolute;top:10px;right:4px;width:2px;height:36px;background:#aaa"></div><div style="position:absolute;top:12px;right:6px;width:12px;height:20px;background:${col};border-radius:0 0 2px 2px;opacity:.85"></div>`,
    sounds: `<div style="position:absolute;top:6px;right:4px;font-size:14px;opacity:.8">♪</div><div style="position:absolute;bottom:10px;left:4px;font-size:10px;opacity:.6;color:${col}">♫</div>`,
    titles: `<div style="position:absolute;top:0px;left:50%;transform:translateX(-50%);background:${col};color:#fff;font-size:7px;padding:1px 6px;border-radius:3px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px ${col}55">${c.name.split(' ')[0]}</div>`,
  };

  return `<div class="cosm-preview"><img class="cosm-skin" src="${skinUrl}" alt=""><div class="cosm-overlay">${overlays[cat]||''}</div></div>`;
}

// Old build3D kept as fallback
function build3D(category, color1, color2) {
  const c1 = color1 || '#e94560', c2 = color2 || '#533483';
  const shapes = {
    capes: `<div class="m3d-scene"><div class="m3d-rotate"><div class="m3d-face m3d-front" style="background:linear-gradient(${c1},${c2});width:36px;height:50px;border-radius:2px 2px 6px 6px"></div><div class="m3d-face m3d-back" style="background:linear-gradient(${c2},${c1});width:36px;height:50px;border-radius:2px 2px 6px 6px"></div><div class="m3d-face m3d-side" style="background:${c1};width:4px;height:50px"></div></div></div>`,
    hats: `<div class="m3d-scene"><div class="m3d-rotate"><div style="width:30px;height:22px;background:${c1};border-radius:2px;margin:0 auto"></div><div style="width:44px;height:6px;background:${c2};border-radius:2px;margin:0 auto"></div></div></div>`,
    wings: `<div class="m3d-scene"><div class="m3d-rotate" style="display:flex;gap:4px"><div style="width:22px;height:40px;background:linear-gradient(135deg,${c1},transparent);border-radius:50% 0 0 50%;transform:skewY(-10deg)"></div><div style="width:4px;height:32px;background:${c2};border-radius:2px;margin-top:4px"></div><div style="width:22px;height:40px;background:linear-gradient(225deg,${c1},transparent);border-radius:0 50% 50% 0;transform:skewY(10deg)"></div></div></div>`,
    auras: `<div class="m3d-scene"><div class="m3d-rotate m3d-pulse"><div style="width:44px;height:44px;border:3px solid ${c1};border-radius:50%;position:relative"><div style="position:absolute;inset:8px;border:2px solid ${c2};border-radius:50%"></div><div style="position:absolute;inset:16px;background:${c1};border-radius:50%"></div></div></div></div>`,
    emotes: `<div class="m3d-scene"><div class="m3d-rotate m3d-bounce"><div style="font-size:36px;line-height:1">😄</div></div></div>`,
    pets: `<div class="m3d-scene"><div class="m3d-rotate"><div style="width:20px;height:18px;background:${c1};border-radius:4px;margin:0 auto;position:relative"><div style="position:absolute;width:6px;height:6px;background:${c2};border-radius:2px;top:-4px;left:1px"></div><div style="position:absolute;width:6px;height:6px;background:${c2};border-radius:2px;top:-4px;right:1px"></div><div style="position:absolute;width:3px;height:3px;background:#111;border-radius:50%;top:5px;left:4px"></div><div style="position:absolute;width:3px;height:3px;background:#111;border-radius:50%;top:5px;right:4px"></div></div><div style="width:16px;height:22px;background:${c1};border-radius:3px;margin:2px auto 0"></div><div style="display:flex;justify-content:center;gap:4px;margin-top:1px"><div style="width:5px;height:8px;background:${c2};border-radius:0 0 2px 2px"></div><div style="width:5px;height:8px;background:${c2};border-radius:0 0 2px 2px"></div></div></div></div>`,
    trails: `<div class="m3d-scene"><div class="m3d-rotate" style="display:flex;flex-direction:column;align-items:center;gap:3px"><div style="width:8px;height:8px;background:${c1};border-radius:50%;opacity:.3"></div><div style="width:12px;height:12px;background:${c1};border-radius:50%;opacity:.5"></div><div style="width:16px;height:16px;background:${c1};border-radius:50%;opacity:.75"></div><div style="width:20px;height:20px;background:${c2};border-radius:50%"></div></div></div>`,
    particles: `<div class="m3d-scene"><div class="m3d-rotate m3d-pulse"><div style="position:relative;width:50px;height:50px"><div style="position:absolute;top:5px;left:20px;width:10px;height:10px;background:${c1};transform:rotate(45deg)"></div><div style="position:absolute;top:20px;left:5px;width:7px;height:7px;background:${c2};transform:rotate(45deg);opacity:.7"></div><div style="position:absolute;top:30px;left:35px;width:8px;height:8px;background:${c1};transform:rotate(45deg);opacity:.8"></div><div style="position:absolute;top:15px;left:35px;width:5px;height:5px;background:${c2};transform:rotate(45deg);opacity:.5"></div></div></div></div>`,
    accessories: `<div class="m3d-scene"><div class="m3d-rotate"><div style="width:40px;height:3px;background:${c2};border-radius:2px;margin:10px auto 0"></div><div style="width:14px;height:14px;background:${c1};border-radius:50%;border:2px solid ${c2};margin:4px auto 0"></div></div></div>`,
    masks: `<div class="m3d-scene"><div class="m3d-rotate"><div style="width:38px;height:28px;background:${c1};border-radius:8px;position:relative"><div style="position:absolute;width:10px;height:8px;background:#111;border-radius:50%;top:8px;left:5px"></div><div style="position:absolute;width:10px;height:8px;background:#111;border-radius:50%;top:8px;right:5px"></div></div></div></div>`,
    mounts: `<div class="m3d-scene"><div class="m3d-rotate"><div style="position:relative"><div style="width:14px;height:14px;background:${c1};border-radius:3px;margin-left:26px"></div><div style="width:10px;height:6px;background:${c2};border-radius:2px;margin-left:30px;margin-top:-2px"></div><div style="width:32px;height:18px;background:${c1};border-radius:4px;margin-top:0"></div><div style="display:flex;gap:16px;margin-top:1px"><div style="width:6px;height:10px;background:${c2};border-radius:0 0 2px 2px"></div><div style="width:6px;height:10px;background:${c2};border-radius:0 0 2px 2px"></div></div></div></div></div>`,
    banners: `<div class="m3d-scene"><div class="m3d-rotate"><div style="display:flex"><div style="width:3px;height:50px;background:#aaa;border-radius:1px"></div><div style="width:28px;height:38px;background:linear-gradient(${c1},${c2});border-radius:0 2px 4px 0;margin-top:4px"></div></div></div></div>`,
    sounds: `<div class="m3d-scene"><div class="m3d-rotate m3d-pulse"><div style="position:relative;width:40px;height:40px"><div style="position:absolute;left:4px;top:10px;width:12px;height:16px;background:${c1};border-radius:2px"></div><div style="position:absolute;left:16px;top:5px;border-left:16px solid ${c1};border-top:8px solid transparent;border-bottom:8px solid transparent;height:20px"></div><div style="position:absolute;right:2px;top:8px;width:3px;height:20px;border:2px solid ${c2};border-left:0;border-radius:0 8px 8px 0;opacity:.7"></div></div></div></div>`,
    titles: `<div class="m3d-scene"><div class="m3d-rotate"><div style="position:relative"><div style="display:flex;justify-content:center"><div style="width:6px;height:14px;background:${c1}"></div><div style="width:10px;height:8px;background:${c2};margin-top:6px"></div><div style="width:8px;height:18px;background:${c1};margin-top:-4px"></div><div style="width:10px;height:8px;background:${c2};margin-top:6px"></div><div style="width:6px;height:14px;background:${c1}"></div></div><div style="width:40px;height:5px;background:${c2};border-radius:1px;margin-top:1px"></div></div></div></div>`,
  };
  return shapes[category] || shapes.capes;
}
const CAT_COLORS={capes:['#7c3aed','#4f46e5'],hats:['#059669','#10b981'],wings:['#0ea5e9','#3b82f6'],auras:['#d946ef','#a855f7'],emotes:['#f59e0b','#eab308'],pets:['#10b981','#34d399'],trails:['#ef4444','#f97316'],particles:['#06b6d4','#22d3ee'],accessories:['#f59e0b','#d97706'],masks:['#6b7280','#9ca3af'],mounts:['#b91c1c','#dc2626'],banners:['#4338ca','#6366f1'],sounds:['#16a34a','#22c55e'],titles:['#fbbf24','#f59e0b']};

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

  // Open folder buttons
  document.getElementById('btn-open-mods-folder').onclick = () => { if (currentInstance) window.api.openInstanceFolder(currentInstance.id, 'mods'); };
  document.getElementById('btn-refresh-mods').onclick = async () => {
    if (!currentInstance) return;
    await window.api.scanInstanceMods(currentInstance.id);
    currentInstance = (await window.api.getInstances()).find(i => i.id === currentInstance.id);
    renderInstanceContent();
    toast('Mod-Liste aktualisiert!');
  };

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
  window.api.onLaunchError(e => {
    document.getElementById('btn-play').classList.remove('hidden');
    document.getElementById('play-status').classList.add('hidden');
    const el = document.getElementById('error-log');
    el.innerHTML = '<div class="crash-header"><span>Minecraft ist abgestuerzt</span><button class="btn btn-sm btn-primary" id="btn-copy-crash">Crash kopieren</button></div><pre class="crash-text">' + esc(String(e)) + '</pre>';
    el.classList.remove('hidden');
    document.getElementById('btn-copy-crash').onclick = () => {
      navigator.clipboard.writeText(String(e)).then(() => {
        document.getElementById('btn-copy-crash').textContent = 'Kopiert!';
        setTimeout(() => { document.getElementById('btn-copy-crash').textContent = 'Crash kopieren'; }, 2000);
      });
    };
  });
  window.api.onLaunchProgress(p => { if(p.type) document.getElementById('play-status').innerHTML='<div class="spinner"></div><span>'+p.type+' ('+Math.round((p.task/p.total)*100)+'%)</span>'; });
  // ── MODRINTH-STYLE UPDATE CHECK ──
  const statusEl = document.getElementById('update-status');

  async function checkUpdate() {
    statusEl.innerHTML = '<span class="dim">Suche nach Updates...</span>';
    try {
      const r = await window.api.checkUpdate();
      document.getElementById('app-version').textContent = 'v' + r.current;
      if (r.error) {
        statusEl.innerHTML = '<span style="color:#ff6b6b;font-size:12px">' + r.error + '</span>';
        return;
      }
      if (r.update && r.url) {
        // AUTO-UPDATE: Sofort downloaden ohne User-Interaktion
        statusEl.innerHTML = '<div style="background:rgba(27,217,106,.15);border:1px solid rgba(27,217,106,.3);border-radius:8px;padding:12px;text-align:center">' +
          '<div style="color:#1bd96a;font-weight:700;font-size:14px">Update v' + r.latest + ' wird installiert...</div>' +
          '<div class="dim" style="margin:4px 0">Bitte warten</div>' +
          '<div style="margin-top:8px"><div style="height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden"><div id="dl-fill" style="height:100%;background:#1bd96a;width:0%;transition:width .3s"></div></div><div class="dim" style="text-align:center;margin-top:4px" id="dl-pct">Download startet...</div></div>' +
          '</div>';
        window.api.onUpdateDlProgress((pct) => {
          try {
            document.getElementById('dl-fill').style.width = pct + '%';
            document.getElementById('dl-pct').textContent = pct + '% heruntergeladen';
          } catch(e) {}
        });
        const result = await window.api.downloadUpdate(r.url);
        if (!result.success) {
          statusEl.innerHTML = '<div style="text-align:center"><div style="color:#ff6b6b;font-size:13px;margin-bottom:8px">Update fehlgeschlagen</div>' +
            '<button class="btn btn-primary btn-sm" onclick="window.api.openExternal(\'' + (r.page || r.url) + '\')">Manuell herunterladen</button></div>';
        }
      } else {
        statusEl.innerHTML = '<span style="color:#1bd96a;font-size:12px">&#10003; Aktuell</span>';
      }
    } catch(e) {
      statusEl.innerHTML = '<span style="color:#ff6b6b;font-size:12px">' + e.message + '</span>';
    }
  }
  checkUpdate();

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
  initSkinViewer();
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
      <div class="inst-mods">${(i.mods||[]).filter(m=>!m.system).length} Mods &bull; ${(i.resourcepacks||[]).length} Packs &bull; ${(i.shaders||[]).length} Shaders</div>
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
  document.getElementById('inst-detail-modcount').textContent = (currentInstance.mods||[]).filter(m=>!m.system).length + ' Mods';
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
  // Mods (hide system mods)
  const mods = (currentInstance.mods || []).filter(m => !m.system);
  document.getElementById('inst-mod-list').innerHTML = mods.length === 0 ? '<span class="dim">Keine Mods</span>' :
    mods.map(m => `<div class="mod-card">
      <img class="mod-icon" src="${m.icon||''}" onerror="this.style.display='none'" alt="">
      <div class="mod-info">
        <div class="mod-name">${esc(m.title||m.name)}</div>
        <div class="mod-file dim">${esc(m.file)}</div>
      </div>
      <button class="inst-delete" onclick="removeFromInstance('${currentInstance.id}','${esc(m.file)}','mod')">&times;</button>
    </div>`).join('');
  // Resource Packs
  const rps = currentInstance.resourcepacks || [];
  document.getElementById('inst-rp-list').innerHTML = rps.length === 0 ? '<span class="dim">Keine Resource Packs</span>' :
    rps.map(m => `<div class="mod-card">
      <img class="mod-icon" src="${m.icon||''}" onerror="this.style.display='none'" alt="">
      <div class="mod-info">
        <div class="mod-name">${esc(m.title||m.name)}</div>
        <div class="mod-file dim">${esc(m.file)}</div>
      </div>
      <button class="inst-delete" onclick="removeFromInstance('${currentInstance.id}','${esc(m.file)}','resourcepack')">&times;</button>
    </div>`).join('');
  // Shaders
  const shaders = currentInstance.shaders || [];
  document.getElementById('inst-shader-list').innerHTML = shaders.length === 0 ? '<span class="dim">Keine Shaders</span>' :
    shaders.map(m => `<div class="mod-card">
      <img class="mod-icon" src="${m.icon||''}" onerror="this.style.display='none'" alt="">
      <div class="mod-info">
        <div class="mod-name">${esc(m.title||m.name)}</div>
        <div class="mod-file dim">${esc(m.file)}</div>
      </div>
      <button class="inst-delete" onclick="removeFromInstance('${currentInstance.id}','${esc(m.file)}','shader')">&times;</button>
    </div>`).join('');
  document.getElementById('inst-detail-modcount').textContent = mods.length + ' Mods';
}

window.removeFromInstance = async function(instId, file, type) {
  await window.api.removeFromInstance(instId, file, type);
  currentInstance = (await window.api.getInstances()).find(i => i.id === instId);
  renderInstanceContent();
  toast('Entfernt');
};

// ── Search for instance content (filtered by instance MC version) ──
async function searchForInstance(type, query, gridId, offset) {
  const grid = document.getElementById(gridId);
  const off = offset || 0;
  if (off === 0) grid.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:10px;color:var(--dim)"><div class="spinner"></div>Suche...</div>';
  const gameVersion = currentInstance ? currentInstance.version : null;
  const data = await window.api.searchModrinth(type, query, gameVersion, off);
  const results = data.hits || data || [];
  const total = data.total || 0;
  if (results.length === 0 && off === 0) { grid.innerHTML = '<span class="dim">Keine Ergebnisse</span>'; return; }
  const cards = results.map(r => `
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
  if (off === 0) grid.innerHTML = cards; else { const btn = grid.querySelector('.load-more-btn'); if(btn) btn.remove(); grid.innerHTML += cards; }
  const loaded = off + results.length;
  if (loaded < total) {
    grid.innerHTML += `<button class="btn btn-primary btn-full load-more-btn" style="margin-top:10px" onclick="loadMoreInstance('${type}','${esc(query||'')}','${gridId}',${loaded})">Mehr laden (${loaded}/${total})</button>`;
  }
}
window.loadMoreInstance = function(type, query, gridId, offset) { searchForInstance(type, query, gridId, offset); };

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

// ── Browse Tab (Modrinth + CurseForge) ──
let browseQuery = '';
let browsePlatform = 'modrinth';

window.switchPlatform = function(p) {
  browsePlatform = p;
  document.getElementById('btn-platform-modrinth').classList.toggle('active', p === 'modrinth');
  document.getElementById('btn-platform-curseforge').classList.toggle('active', p === 'curseforge');
  document.getElementById('browse-search').placeholder = p === 'modrinth' ? 'Suchen auf Modrinth...' : 'Suchen auf CurseForge...';
  searchBrowse('');
};

async function searchBrowse(query, offset) {
  browseQuery = query;
  const grid = document.getElementById('browse-grid');
  const off = offset || 0;
  if (off === 0) grid.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:10px;color:var(--dim)"><div class="spinner"></div>Suche auf ' + (browsePlatform === 'modrinth' ? 'Modrinth' : 'CurseForge') + '...</div>';

  let data;
  if (browsePlatform === 'curseforge') {
    data = await window.api.searchCurseForge(browseType, query, null, off);
  } else {
    data = await window.api.searchModrinth(browseType, query, null, off);
  }

  const results = data.hits || data || [];
  const total = data.total || 0;
  if (results.length === 0 && off === 0) { grid.innerHTML = '<span class="dim">Keine Ergebnisse</span>'; return; }
  const cards = results.map(r => `
    <div class="browse-card">
      <img class="browse-icon" src="${r.icon_url||''}" onerror="this.style.display='none'" alt="">
      <div class="browse-info">
        <div class="browse-name">${esc(r.title)} ${r.source==='curseforge'?'<span style="color:var(--accent);font-size:10px">CF</span>':''}</div>
        <div class="browse-desc">${esc(r.description||'')}</div>
        <div class="browse-meta">
          <span>&#11015; ${formatNum(r.downloads)}</span>
          <span>&#9733; ${formatNum(r.follows||0)}</span>
          ${(r.categories||[]).slice(0,3).map(c=>'<span>'+esc(c)+'</span>').join('')}
        </div>
      </div>
      <div class="browse-actions">
        <button class="btn-green" onclick="browseInstall('${r.slug}','${esc(r.title)}','${r.source||'modrinth'}','${r.cfId||''}')">Installieren</button>
      </div>
    </div>
  `).join('');
  if (off === 0) grid.innerHTML = cards; else { const btn = grid.querySelector('.load-more-btn'); if(btn) btn.remove(); grid.innerHTML += cards; }
  const loaded = off + results.length;
  if (loaded < total) {
    grid.innerHTML += `<button class="btn btn-primary btn-full load-more-btn" style="margin-top:10px" onclick="loadMoreBrowse(${loaded})">Mehr laden (${loaded}/${total})</button>`;
  }
}
window.loadMoreBrowse = function(offset) { searchBrowse(browseQuery, offset); };

window.browseInstall = async function(slug, title, source, cfId) {
  const instances = await window.api.getInstances();
  if (instances.length === 0) { toast('Erstelle zuerst eine Instanz!'); return; }
  if (instances.length === 1) { await installToInstance(slug, title, instances[0], source, cfId); return; }
  showInstancePicker(instances, async (inst) => {
    await installToInstance(slug, title, inst, source, cfId);
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

async function installToInstance(slug, title, inst, source, cfId) {
  toast(title+' wird zu "'+inst.name+'" hinzugefuegt...');
  let r;
  if (source === 'curseforge' && cfId) {
    r = await window.api.addCurseForge(inst.id, cfId, browseType);
  } else {
    r = await window.api.addToInstance(inst.id, slug, browseType);
  }
  if (r.success) toast(title+' in "'+inst.name+'" installiert!');
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
    const own=ownedCosmetics.includes(c.id),eq=equippedCosmetics[c.category]===c.id;
    const grad=CAT_GRADIENTS[c.category]||CAT_GRADIENTS.capes;
    const preview = buildPreview(c);
    let cls='cosm-card',badge='';
    if(eq){cls+=' equipped';badge='<span class="badge badge-equipped">Equipped</span>';}
    else if(own){cls+=' owned';badge='<span class="badge badge-owned">Besitzt</span>';}
    else if(profile&&profile.isVIP)badge='<span class="badge badge-vip">VIP</span>';
    else badge='<span class="badge badge-buy">Kaufen</span>';
    return '<div class="'+cls+'" onclick="cosClick(\''+c.id+'\')"><div class="cosm-icon" style="background:'+grad+'">'+preview+'</div><div class="cosm-name">'+c.name+'</div><div class="cosm-desc">'+c.description+'</div><div class="cosm-foot"><span class="cosm-price">&#x1FA99; '+c.price+'</span>'+badge+'</div></div>';
  }).join('');
}
window.cosClick=async function(id){
  if(!ownedCosmetics.includes(id)){const r=await window.api.buyCosmetic(id);if(r.success){ownedCosmetics.push(id);updateCoins(r.coins);toast('Gekauft!');}else{toast(r.error);return;}}
  const r=await window.api.equipCosmetic(id);
  if(r.success){
    equippedCosmetics=r.equipped;renderCosmetics();
    const c=cosmetics.find(x=>x.id===id);
    const equipped = equippedCosmetics[c.category]===id;
    toast(equipped?c.name+' ausgeruestet!':c.name+' abgelegt.');
    updateSkinViewer(equipped ? c : null);
  }
};

// ── 3D Skin Viewer ──
let skinViewer = null;
function initSkinViewer() {
  try {
    if (!window.skinview3d) { console.warn('skinview3d not loaded'); return; }
    const canvas = document.getElementById('skin-viewer');
    if (!canvas) return;
    const name = (profile && profile.name) || 'Steve';
    skinViewer = new skinview3d.SkinViewer({
      canvas: canvas,
      width: 220,
      height: 320,
      skin: 'https://mc-heads.net/skin/' + name,
    });
    skinViewer.autoRotate = true;
    skinViewer.autoRotateSpeed = 0.5;
    skinViewer.zoom = 0.9;
    skinViewer.fov = 40;
    // Enable mouse control (drag to rotate)
    const ctrl = skinview3d.createOrbitControls(skinViewer);
    ctrl.enableRotate = true;
    ctrl.enableZoom = false;
    ctrl.enablePan = false;
    // Idle animation
    skinViewer.animation = new skinview3d.IdleAnimation();
    console.log('[SkinViewer] Initialized for', name);
  } catch(e) {
    console.error('[SkinViewer] Init failed:', e);
  }
}

function updateSkinViewer(cosmetic) {
  if (!skinViewer || !cosmetic) return;
  try {
    document.getElementById('cosm-viewer-name').textContent = cosmetic.name;
    document.getElementById('cosm-viewer-desc').textContent = cosmetic.description;
    document.getElementById('cosm-equipped-label').textContent = cosmetic.category + ' - ' + cosmetic.name;
    // For capes, load a cape texture
    if (cosmetic.category === 'capes') {
      const col = cosmColor(cosmetic.id);
      // Create a colored cape texture via canvas
      const capeCanvas = document.createElement('canvas');
      capeCanvas.width = 64; capeCanvas.height = 32;
      const ctx = capeCanvas.getContext('2d');
      ctx.fillStyle = col;
      ctx.fillRect(1, 1, 10, 16);
      // Add some pattern
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(3, 3, 6, 2);
      ctx.fillRect(4, 7, 4, 2);
      skinViewer.loadCape(capeCanvas.toDataURL());
    } else {
      skinViewer.loadCape(null);
    }
    // Animation based on category
    if (cosmetic.category === 'emotes') {
      skinViewer.animation = new skinview3d.WalkingAnimation();
    } else if (cosmetic.category === 'trails' || cosmetic.category === 'mounts') {
      skinViewer.animation = new skinview3d.RunningAnimation();
    } else {
      skinViewer.animation = new skinview3d.IdleAnimation();
    }
  } catch(e) { console.warn('[SkinViewer] Update failed:', e); }
}

window.openFolder = function(sub) { if (currentInstance) window.api.openInstanceFolder(currentInstance.id, sub); };

function toast(msg){const t=document.getElementById('toast');document.getElementById('toast-msg').textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3000);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function formatNum(n){if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'K';return n;}
