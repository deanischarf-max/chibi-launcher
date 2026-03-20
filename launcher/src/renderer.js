let cosmetics=[],ownedCosmetics=[],equippedCosmetics={},currentCat='capes',profile=null,currentModSource='modrinth';
const ICONS={cape_shadow:'🖤',cape_light:'🤍',cape_sun:'☀️',cape_rainbow:'🌈',cape_fire:'🔥',cape_ice:'❄️',hat_crown:'👑',hat_wizard:'🧙',hat_top:'🎩',hat_santa:'🎅',hat_viking:'⚔️',wings_angel:'😇',wings_demon:'😈',wings_dragon:'🐉',wings_butterfly:'🦋',aura_flame:'🔥',aura_snow:'🌨️',aura_hearts:'💕',aura_music:'🎵',aura_enchant:'✨'};

// Chibi Mods catalog
const CHIBI_MODS = [
  { slug: 'chibi-cheats', title: 'Chibi Cheats', description: 'Cheat-Client mit ESP, Killaura, Fly, Speed und 200+ Modulen', downloads: 150, icon_url: '', author: 'chibi.art', url: '/ChibiCheats-1.0.0.jar' },
  { slug: 'fps-opt', title: 'FPS Opt', description: 'Massive FPS-Optimierung - Partikel, Entities, Rendering konfigurierbar', downloads: 80, icon_url: '', author: 'chibi.art', url: '/fps-opt-1.0.0.jar' },
  { slug: 'stack-opt', title: 'Stack Opt', description: 'Smart Stack Fill - Shift+Rechtsklick fuellt nur bestehende Stacks auf', downloads: 60, icon_url: '', author: 'chibi.art', url: '/stack-opt-1.0.0.jar' },
];

document.addEventListener('DOMContentLoaded', async () => {
  // Titlebar
  document.getElementById('btn-min').onclick = () => window.api.minimize();
  document.getElementById('btn-max').onclick = () => window.api.maximize();
  document.getElementById('btn-close').onclick = () => window.api.close();

  // Particles
  const pc = document.getElementById('particles');
  for (let i = 0; i < 30; i++) { const p = document.createElement('div'); p.className = 'particle'; p.style.left = Math.random() * 100 + '%'; p.style.animationDelay = Math.random() * 6 + 's'; p.style.animationDuration = (4 + Math.random() * 4) + 's'; const s = (2 + Math.random() * 4) + 'px'; p.style.width = p.style.height = s; pc.appendChild(p); }

  // Nav
  document.querySelectorAll('.nav-btn').forEach(b => b.onclick = () => { document.querySelectorAll('.nav-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); document.getElementById('tab-' + b.dataset.tab).classList.add('active'); });
  document.querySelectorAll('.cat-btn').forEach(b => b.onclick = () => { document.querySelectorAll('.cat-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); currentCat = b.dataset.cat; renderCosmetics(); });

  // Source tabs (Modrinth / Chibi)
  document.querySelectorAll('.src-btn').forEach(b => b.onclick = () => {
    document.querySelectorAll('.src-btn').forEach(x => x.classList.remove('active')); b.classList.add('active');
    currentModSource = b.dataset.src;
    if (currentModSource === 'chibi') renderChibiMods();
    else document.getElementById('mod-grid').innerHTML = '<span class="dim">Suche nach Mods...</span>';
  });

  // Auth
  document.getElementById('show-reg').onclick = e => { e.preventDefault(); document.getElementById('form-login').classList.add('hidden'); document.getElementById('form-register').classList.remove('hidden'); };
  document.getElementById('show-login').onclick = e => { e.preventDefault(); document.getElementById('form-register').classList.add('hidden'); document.getElementById('form-login').classList.remove('hidden'); };

  const doLogin = async () => {
    const u = document.getElementById('login-user').value.trim(), p = document.getElementById('login-pass').value;
    if (!u || !p) return showErr('login-error', 'Benutzername und Passwort eingeben');
    const r = await window.api.login(u, p);
    if (r.success) { profile = r.profile; showMain(); } else showErr('login-error', r.error);
  };
  document.getElementById('btn-login').onclick = doLogin;
  document.getElementById('login-pass').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
  document.getElementById('login-user').onkeydown = e => { if (e.key === 'Enter') document.getElementById('login-pass').focus(); };

  const doReg = async () => {
    const u = document.getElementById('reg-user').value.trim(), p = document.getElementById('reg-pass').value, p2 = document.getElementById('reg-pass2').value;
    if (!u || !p || !p2) return showErr('reg-error', 'Alle Felder ausfuellen');
    if (p !== p2) return showErr('reg-error', 'Passwoerter stimmen nicht ueberein');
    const r = await window.api.register(u, p);
    if (r.success) { profile = r.profile; showMain(); } else showErr('reg-error', r.error);
  };
  document.getElementById('btn-register').onclick = doReg;
  document.getElementById('reg-pass2').onkeydown = e => { if (e.key === 'Enter') doReg(); };

  document.getElementById('btn-logout').onclick = async () => { await window.api.logout(); profile = null; document.getElementById('screen-main').classList.add('hidden'); document.getElementById('screen-login').classList.remove('hidden'); };

  // Play
  document.getElementById('btn-play').onclick = async () => {
    document.getElementById('btn-play').classList.add('hidden');
    document.getElementById('play-status').classList.remove('hidden');
    document.getElementById('error-log').classList.add('hidden');
    const version = document.getElementById('mc-version').value;
    const r = await window.api.launchGame(version);
    if (!r.success) { toast('Fehler: ' + r.error); document.getElementById('btn-play').classList.remove('hidden'); document.getElementById('play-status').classList.add('hidden'); }
  };

  // Events
  window.api.onCoinsUpdated(d => { updateCoins(d.coins); if (d.earned > 0) toast('+' + d.earned + ' Coins! (' + d.minutes + ' Min.)'); document.getElementById('btn-play').classList.remove('hidden'); document.getElementById('play-status').classList.add('hidden'); });
  window.api.onLaunchError(e => { document.getElementById('btn-play').classList.remove('hidden'); document.getElementById('play-status').classList.add('hidden'); document.getElementById('error-log').textContent = e; document.getElementById('error-log').classList.remove('hidden'); toast('Minecraft ist abgestuerzt'); });
  window.api.onLaunchProgress(p => { if (p.type) { document.getElementById('play-status').innerHTML = '<div class="spinner"></div><span>' + p.type + ' (' + Math.round((p.task / p.total) * 100) + '%)</span>'; } });

  // Search buttons
  document.getElementById('mod-search-btn').onclick = () => searchModrinth('mod', document.getElementById('mod-search').value, 'mod-grid');
  document.getElementById('mod-search').onkeydown = e => { if (e.key === 'Enter') document.getElementById('mod-search-btn').click(); };
  document.getElementById('rp-search-btn').onclick = () => searchModrinth('resourcepack', document.getElementById('rp-search').value, 'rp-grid');
  document.getElementById('rp-search').onkeydown = e => { if (e.key === 'Enter') document.getElementById('rp-search-btn').click(); };
  document.getElementById('shader-search-btn').onclick = () => searchModrinth('shader', document.getElementById('shader-search').value, 'shader-grid');
  document.getElementById('shader-search').onkeydown = e => { if (e.key === 'Enter') document.getElementById('shader-search-btn').click(); };

  // Settings
  document.getElementById('btn-save').onclick = async () => { await window.api.saveSettings({ ram: document.getElementById('set-ram').value, javaPath: document.getElementById('set-java').value }); toast('Gespeichert!'); };
  const s = await window.api.getSettings(); if (s.ram) document.getElementById('set-ram').value = s.ram; if (s.javaPath) document.getElementById('set-java').value = s.javaPath;

  // Auto-login
  profile = await window.api.getProfile();
  if (profile) showMain();

  // Load popular mods on start
  searchModrinth('mod', '', 'mod-grid');
  searchModrinth('resourcepack', '', 'rp-grid');
  searchModrinth('shader', '', 'shader-grid');
});

function showErr(id, msg) { const e = document.getElementById(id); e.textContent = msg; e.classList.remove('hidden'); setTimeout(() => e.classList.add('hidden'), 4000); }

async function showMain() {
  document.getElementById('screen-login').classList.add('hidden'); document.getElementById('screen-main').classList.remove('hidden');
  document.getElementById('pname').textContent = profile.name;
  document.getElementById('avatar').src = 'https://mc-heads.net/avatar/' + profile.name + '/36';
  if (profile.isOwner) { document.getElementById('owner').classList.remove('hidden'); document.getElementById('vip').classList.add('hidden'); }
  else if (profile.isVIP) { document.getElementById('vip').classList.remove('hidden'); document.getElementById('owner').classList.add('hidden'); }
  else { document.getElementById('vip').classList.add('hidden'); document.getElementById('owner').classList.add('hidden'); }
  cosmetics = await window.api.getCosmetics(); ownedCosmetics = await window.api.getOwnedCosmetics(); equippedCosmetics = await window.api.getEquippedCosmetics();
  updateCoins(await window.api.getCoins()); renderCosmetics();
  updateInstalledMods();
}

function updateCoins(n) { document.getElementById('coins').textContent = n.toLocaleString('de-DE'); document.getElementById('shop-coins').textContent = n.toLocaleString('de-DE'); }

// ── Modrinth API ──
async function searchModrinth(type, query, gridId) {
  if (currentModSource === 'chibi' && type === 'mod') { renderChibiMods(); return; }
  const grid = document.getElementById(gridId);
  grid.innerHTML = '<div class="play-status"><div class="spinner"></div><span>Laden...</span></div>';
  try {
    const results = await window.api.searchModrinth(type, query);
    if (!results || results.length === 0) { grid.innerHTML = '<span class="dim">Keine Ergebnisse gefunden</span>'; return; }
    grid.innerHTML = results.map(r => `
      <div class="browse-card">
        <img class="browse-icon" src="${r.icon_url || ''}" onerror="this.style.display='none'" alt="">
        <div class="browse-info">
          <div class="browse-name">${esc(r.title)}</div>
          <div class="browse-desc">${esc(r.description || '')}</div>
          <div class="browse-meta">
            <span>&#11015; ${formatNum(r.downloads)}</span>
            <span>&#9733; ${formatNum(r.follows || 0)}</span>
            <span>${r.author || ''}</span>
          </div>
        </div>
        <div class="browse-actions">
          <button class="btn-green" onclick="installModrinth('${r.slug}','${esc(r.title)}','${type}')">Installieren</button>
        </div>
      </div>
    `).join('');
  } catch (e) { grid.innerHTML = '<span class="dim">Fehler: ' + e + '</span>'; }
}

function renderChibiMods() {
  const grid = document.getElementById('mod-grid');
  grid.innerHTML = CHIBI_MODS.map(r => `
    <div class="browse-card">
      <div class="browse-icon" style="display:flex;align-items:center;justify-content:center;font-size:22px;background:linear-gradient(135deg,var(--accent),#533483);color:#fff;font-weight:800">C</div>
      <div class="browse-info">
        <div class="browse-name">${r.title}</div>
        <div class="browse-desc">${r.description}</div>
        <div class="browse-meta"><span>&#11015; ${r.downloads}</span><span>${r.author}</span></div>
      </div>
      <div class="browse-actions">
        <button class="btn-green" onclick="installChibiMod('${r.slug}','${r.title}')">Installieren</button>
      </div>
    </div>
  `).join('');
}

window.installModrinth = async function (slug, title, type) {
  toast(title + ' wird installiert...');
  const r = await window.api.installModrinth(slug, type);
  if (r.success) { toast(title + ' installiert!'); updateInstalledMods(); }
  else toast('Fehler: ' + r.error);
};

window.installChibiMod = async function (slug, title) {
  toast(title + ' wird installiert...');
  const mod = CHIBI_MODS.find(m => m.slug === slug);
  if (mod) {
    const r = await window.api.installChibiMod(slug, title, 'https://packs.chibi.art' + mod.url);
    if (r.success) { toast(title + ' installiert!'); updateInstalledMods(); }
    else toast('Fehler: ' + r.error);
  }
};

async function updateInstalledMods() {
  const mods = await window.api.getInstalledMods();
  document.getElementById('mod-count').textContent = mods.length;
  const list = document.getElementById('installed-list');
  if (mods.length === 0) { list.innerHTML = '<span class="dim">Keine Mods installiert</span>'; return; }
  list.innerHTML = mods.map(m => `<span class="installed-tag">${esc(m.name)} <span class="remove" onclick="removeMod('${esc(m.file)}')">&times;</span></span>`).join('');
}

window.removeMod = async function (file) {
  const r = await window.api.removeMod(file);
  if (r.success) { toast('Mod entfernt'); updateInstalledMods(); }
};

// ── Cosmetics ──
function renderCosmetics() {
  const g = document.getElementById('cosm-grid');
  g.innerHTML = cosmetics.filter(c => c.category === currentCat).map(c => {
    const own = ownedCosmetics.includes(c.id), eq = equippedCosmetics[c.category] === c.id, ico = ICONS[c.id] || '?';
    let cls = 'cosm-card', badge = '';
    if (eq) { cls += ' equipped'; badge = '<span class="badge badge-equipped">Equipped</span>'; }
    else if (own) { cls += ' owned'; badge = '<span class="badge badge-owned">Besitzt</span>'; }
    else if (profile && profile.isVIP) badge = '<span class="badge badge-vip">VIP</span>';
    else badge = '<span class="badge badge-buy">Kaufen</span>';
    return '<div class="' + cls + '" onclick="cosClick(\'' + c.id + '\')"><div class="cosm-icon">' + ico + '</div><div class="cosm-name">' + c.name + '</div><div class="cosm-desc">' + c.description + '</div><div class="cosm-foot"><span class="cosm-price">🪙 ' + c.price + '</span>' + badge + '</div></div>';
  }).join('');
}

window.cosClick = async function (id) {
  if (!ownedCosmetics.includes(id)) { const r = await window.api.buyCosmetic(id); if (r.success) { ownedCosmetics.push(id); updateCoins(r.coins); toast('Gekauft!'); } else { toast(r.error); return; } }
  const r = await window.api.equipCosmetic(id); if (r.success) { equippedCosmetics = r.equipped; renderCosmetics(); const c = cosmetics.find(x => x.id === id); toast(equippedCosmetics[c.category] === id ? c.name + ' ausgeruestet!' : c.name + ' abgelegt.'); }
};

function toast(msg) { const t = document.getElementById('toast'); document.getElementById('toast-msg').textContent = msg; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 3000); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function formatNum(n) { if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'; if (n >= 1000) return (n / 1000).toFixed(1) + 'K'; return n; }
