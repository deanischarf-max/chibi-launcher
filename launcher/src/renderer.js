let cosmetics=[],ownedCosmetics=[],equippedCosmetics={},currentCat='capes',profile=null;
let currentInstance=null, browseType='modpack';
const ICONS={cape_shadow:'🖤',cape_light:'🤍',cape_sun:'☀️',cape_rainbow:'🌈',cape_fire:'🔥',cape_ice:'❄️',cape_void:'🕳️',cape_emerald:'💎',cape_redstone:'🔴',cape_ender:'🟣',cape_nether:'🟠',cape_cherry:'🌸',cape_galaxy:'🌌',cape_phantom:'👻',hat_crown:'👑',hat_wizard:'🧙',hat_top:'🎩',hat_santa:'🎅',hat_viking:'⚔️',hat_pirate:'🏴‍☠️',hat_samurai:'🗡️',hat_astronaut:'🧑‍🚀',hat_knight:'🛡️',hat_beret:'🎨',hat_mushroom:'🍄',hat_halo:'😇',hat_devil:'😈',wings_angel:'👼',wings_demon:'🦇',wings_dragon:'🐉',wings_butterfly:'🦋',wings_phoenix:'🔥',wings_bee:'🐝',wings_crystal:'💠',wings_bat:'🦇',wings_fairy:'🧚',wings_steampunk:'⚙️',aura_flame:'🔥',aura_snow:'🌨️',aura_hearts:'💕',aura_music:'🎵',aura_enchant:'✨',aura_lightning:'⚡',aura_cherry:'🌸',aura_void:'🌑',aura_rainbow:'🌈',aura_bubbles:'🫧',aura_skulls:'💀',aura_diamond:'💎',aura_bats:'🦇',emote_dab:'🙆',emote_wave:'👋',emote_salute:'🫡',emote_breakdance:'🕺',emote_floss:'💃',emote_headbang:'🤘',emote_clap:'👏',emote_facepalm:'🤦',pet_cat:'🐱',pet_dog:'🐶',pet_parrot:'🦜',pet_fox:'🦊',pet_axolotl:'🐙',pet_bee:'🐝',pet_dragon:'🐲',pet_ghost:'👻',trail_fire:'🔥',trail_ice:'❄️',trail_rainbow:'🌈',trail_flowers:'🌺',trail_lightning:'⚡',trail_shadow:'🌑',cape_creeper:'💚',cape_wither:'💀',cape_drachen:'🐲',cape_fruehling:'🌷',cape_sommer:'🌞',cape_herbst:'🍂',cape_winter:'🌨️',cape_einhorn:'🦄',cape_enderman:'🟪',cape_erde:'🪨',hat_creeper:'💚',hat_drache:'🐉',hat_blumenkranz:'💐',hat_schneekrone:'❄️',hat_sonnenkrone:'👑',hat_schattenkrone:'🖤',hat_lichtkrone:'💡',hat_wither:'☠️',hat_enderdrache:'🐲',hat_phoenix:'🔥',wings_ender:'🟣',wings_wither:'🦴',wings_eis:'❄️',wings_herbst:'🍁',wings_schatten:'🖤',wings_sonnen:'☀️',wings_einhorn:'🦄',wings_creeper:'💥',aura_wither:'☠️',aura_creeper:'💚',aura_drache:'🐉',aura_fruehling:'🌸',aura_sommer:'☀️',aura_herbst:'🍂',aura_winter:'❄️',aura_einhorn:'🦄',aura_schatten:'🖤',aura_sonnen:'🌟',emote_dance:'💃',emote_cry:'😢',emote_laugh:'😂',emote_bow:'🙇',emote_flex:'💪',emote_sleep:'😴',emote_ninja:'🥷',emote_chicken:'🐔',emote_rage:'😤',emote_dj:'🎧',emote_schwertkampf:'⚔️',emote_zaubern:'🪄',pet_creeper:'💚',pet_endermite:'🪲',pet_wolf:'🐺',pet_phoenix:'🔥',pet_einhorn:'🦄',pet_schneemann:'⛄',pet_fledermaus:'🦇',pet_schildkroete:'🐢',pet_wither_skelett:'💀',pet_allay:'💙',trail_creeper:'💚',trail_ender:'🟣',trail_lava:'🌋',trail_noten:'🎵',trail_herzen:'💕',trail_sterne:'⭐',trail_pilze:'🍄',trail_wither:'☠️',particle_feuer:'🔥',particle_wasser:'💧',particle_erde:'🪨',particle_luft:'💨',particle_endportal:'🌀',particle_totem:'✨',particle_seelen:'🔵',particle_redstone:'🔴',particle_nether:'🟠',particle_kirschbluete:'🌸',particle_drache:'🐉',particle_schatten:'🖤',particle_sonnenstaub:'🌟',particle_lichtfunken:'💡',particle_schneesturm:'🌨️',particle_gluehwurm:'✨',acc_brille:'🕶️',acc_monokel:'🧐',acc_schal_schatten:'🧣',acc_schal_licht:'🧣',acc_schal_sonne:'🧣',acc_schwert_ruecken:'🗡️',acc_fluegel_mini:'🪶',acc_umhang_feuer:'🔥',acc_kette_diamant:'💎',acc_ring_ender:'💍',acc_guertel_redstone:'🔴',acc_schulterdrache:'🐉',acc_rucksack:'🎒',acc_banner:'🏳️',acc_laterne:'🏮',acc_buch:'📖',cape_warden:'🌑',cape_zeus:'⚡',cape_odin:'🦅',cape_vulkan:'🌋',cape_aurora:'🌌',cape_kawaii:'💖',cape_pirat:'🏴‍☠️',cape_mangrove:'🌿',cape_ostern:'🐣',cape_halloween:'🎃',hat_warden:'🌑',hat_anubis:'🐺',hat_chibi:'🎀',hat_neon:'💡',hat_tornado:'🌪️',hat_kirschbluete:'🌸',hat_schmied:'🔨',hat_alchemist:'⚗️',hat_weihnachten:'🦌',hat_pixel:'👾',wings_warden:'🌑',wings_poseidon:'🌊',wings_neon:'💜',wings_vulkan:'🌋',wings_kirschbluete:'🌸',wings_retro:'👾',wings_mangrove:'🌿',wings_odin:'🦅',wings_tsunami:'🌊',wings_hades:'💀',aura_warden:'🌑',aura_zeus:'⚡',aura_neon:'💜',aura_vulkan:'🌋',aura_aurora:'🌌',aura_mangrove:'🌿',aura_pixel:'👾',aura_hades:'💀',aura_ostern:'🐣',aura_weihnacht:'🎄',emote_pirat:'🏴‍☠️',emote_ritter:'🛡️',emote_vulkan:'🌋',emote_chibi:'🥺',emote_meditation:'🧘',emote_drachenruf:'🐉',emote_schmied:'🔨',emote_alchemist:'⚗️',emote_kawaii:'😘',emote_erdbeben:'💥',pet_warden:'🌑',pet_cerberus:'🐕',pet_pixie:'🧚',pet_mangrove_frosch:'🐸',pet_polarfuchs:'🦊',pet_magma_schleim:'🟠',pet_kirschbluete_geist:'🌸',pet_mini_golem:'🤖',pet_laterne:'🏮',pet_schneefuchs:'🦊',trail_sculk:'🌑',trail_vulkan:'🌋',trail_neon:'💜',trail_kirschbluete:'🌸',trail_pixel:'👾',trail_aurora:'🌌',trail_odin:'🔮',trail_mangrove:'🌿',trail_seelen:'🔵',trail_weihnacht:'🎁',particle_warden:'🌑',particle_zeus:'⚡',particle_anubis:'🪲',particle_vulkan:'🌋',particle_pixel:'👾',particle_aurora:'🌌',particle_kawaii:'💖',particle_tsunami:'🌊',particle_halloween:'🎃',particle_ostern:'🐣',acc_warden_helm:'🌑',acc_zeus_kette:'⚡',acc_odin_auge:'👁️',acc_piraten_augenklappe:'🏴‍☠️',acc_neon_brille:'💜',acc_pixel_schwert:'👾',acc_vulkan_guertel:'🌋',acc_kirschbluete_haarband:'🌸',acc_ritter_schulter:'🛡️',acc_alchemist_guertel:'⚗️',acc_jaeger_kocher:'🏹',acc_schatten_umhang:'🖤',acc_sonnen_schild:'☀️',acc_licht_laterne:'💡',acc_mangrove_ranke:'🌿',acc_creeper_rucksack:'💚',acc_retro_kopfhoerer:'🎧',acc_kawaii_schleife:'🎀',acc_weihnacht_schal:'🧣',acc_halloween_kuerbis:'🎃',mask_fuchs:'🦊',mask_wolf:'🐺',mask_drache:'🐉',mask_oni:'👹',mask_phantom:'👻',mask_creeper:'💚',mask_warden:'🌑',mask_enderman:'🟣',mask_anubis:'🐺',mask_kitsune:'🦊',mask_totenkopf:'💀',mask_samurai:'🗡️',mask_hades:'🔥',mask_poseidon:'🌊',mask_neon:'💜',mask_pixel:'👾',mask_schatten:'🖤',mask_licht:'💡',mask_sonnen:'☀️',mask_halloween:'🎃',mask_venezianisch:'🎭',mask_tiger:'🐯',mask_eule:'🦉',mask_wither:'☠️',mask_chibi:'😺',mount_pferd:'🐴',mount_drache:'🐉',mount_einhorn:'🦄',mount_wither:'☠️',mount_phoenix:'🔥',mount_wolf:'🐺',mount_baer:'🐻',mount_spinne:'🕷️',mount_strider:'🦩',mount_schildkroete:'🐢',mount_greif:'🦅',mount_cerberus:'🐕',mount_pegasus:'🐎',mount_eisbaer:'🐻‍❄️',mount_panther:'🐆',mount_loewe:'🦁',mount_hirsch:'🦌',mount_neon_motorrad:'🏍️',mount_magma_wuerfel:'🟠',mount_skelett_pferd:'🦴',mount_ravager:'🦏',mount_frosch:'🐸',mount_endermite:'🪱',mount_hai:'🦈',mount_weihnachts_schlitten:'🛷',banner_schatten:'🖤',banner_licht:'💡',banner_sonne:'☀️',banner_drache:'🐉',banner_totenkopf:'☠️',banner_phoenix:'🔥',banner_wolf:'🐺',banner_ritter:'🛡️',banner_creeper:'💚',banner_ender:'🟣',banner_neon:'💜',banner_pixel:'👾',banner_zeus:'⚡',banner_odin:'🦅',banner_vulkan:'🌋',banner_kirschbluete:'🌸',banner_weihnacht:'🎄',banner_halloween:'🎃',banner_jaeger:'🏹',banner_alchemist:'⚗️',sound_donner:'🌩️',sound_glocke:'🔔',sound_ketten:'⛓️',sound_feuer:'🔥',sound_eis:'❄️',sound_noten:'🎵',sound_creeper:'💚',sound_enderman:'🟣',sound_amboss:'🔨',sound_harfe:'🎶',sound_warden:'💓',sound_drache:'🐉',sound_pixel:'👾',sound_wind:'💨',sound_wasser:'🌊',sound_schatten:'🖤',sound_licht:'🔔',sound_sonne:'📯',sound_weihnacht:'🔔',sound_halloween:'👻',title_ritter:'🛡️',title_koenig:'👑',title_meister:'⭐',title_legende:'🏆',title_held:'⚔️',title_schatten:'🖤',title_licht:'💡',title_sonne:'☀️',title_jaeger:'🏹',title_schmied:'🔨',title_alchemist:'⚗️',title_pirat:'🏴‍☠️',title_ninja:'🥷',title_samurai:'🗡️',title_druide:'🌿',title_kaiser:'👑',title_warden:'🌑',title_phoenix:'🔥',title_chibi:'🎀',title_anfaenger:'🗺️'};

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
  // ── MODRINTH-STYLE UPDATE CHECK ──
  const statusEl = document.getElementById('update-status');

  async function checkUpdate() {
    statusEl.innerHTML = '<span class="dim">Suche nach Updates...</span>';
    try {
      const r = await window.api.checkUpdate();
      document.getElementById('app-version').textContent = 'v' + r.current;
      if (r.error) {
        statusEl.innerHTML = '<span style="color:#ff6b6b;font-size:12px">Update-Check: ' + r.error + '</span>';
        return;
      }
      if (r.update && r.url) {
        statusEl.innerHTML = '<div style="background:rgba(27,217,106,.15);border:1px solid rgba(27,217,106,.3);border-radius:8px;padding:10px;text-align:center">' +
          '<div style="color:#1bd96a;font-weight:700;font-size:14px">Update v' + r.latest + ' verfuegbar!</div>' +
          '<div class="dim" style="margin:4px 0">Du hast v' + r.current + '</div>' +
          '<button class="btn btn-primary btn-sm" id="btn-do-update" style="margin-top:6px">Jetzt updaten</button>' +
          '<div id="dl-bar" style="display:none;margin-top:8px"><div style="height:4px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden"><div id="dl-fill" style="height:100%;background:#1bd96a;width:0%;transition:width .3s"></div></div><div class="dim" style="text-align:center;margin-top:2px" id="dl-pct">0%</div></div>' +
          '</div>';
        document.getElementById('btn-do-update').onclick = async () => {
          document.getElementById('btn-do-update').textContent = 'Wird heruntergeladen...';
          document.getElementById('btn-do-update').disabled = true;
          document.getElementById('dl-bar').style.display = 'block';
          window.api.onUpdateDlProgress((pct) => {
            document.getElementById('dl-fill').style.width = pct + '%';
            document.getElementById('dl-pct').textContent = pct + '%';
          });
          const result = await window.api.downloadUpdate(r.url);
          if (!result.success) {
            document.getElementById('btn-do-update').textContent = 'Fehler - Im Browser oeffnen';
            document.getElementById('btn-do-update').disabled = false;
            document.getElementById('btn-do-update').onclick = () => window.api.openExternal(r.page || r.url);
          }
        };
      } else if (r.update && !r.url) {
        statusEl.innerHTML = '<a href="#" onclick="window.api.openExternal(\'' + r.page + '\')" style="color:#1bd96a;font-size:12px">Update v' + r.latest + ' verfuegbar - hier klicken</a>';
      } else {
        statusEl.innerHTML = '<span style="color:#1bd96a;font-size:12px">&#10003; Aktuell (v' + r.current + ')</span>';
      }
    } catch(e) {
      statusEl.innerHTML = '<span style="color:#ff6b6b;font-size:12px">Fehler: ' + e.message + '</span>';
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

// ── Browse Tab ──
let browseQuery = '';
async function searchBrowse(query, offset) {
  browseQuery = query;
  const grid = document.getElementById('browse-grid');
  const off = offset || 0;
  if (off === 0) grid.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:10px;color:var(--dim)"><div class="spinner"></div>Laden...</div>';
  const data = await window.api.searchModrinth(browseType, query, null, off);
  const results = data.hits || data || [];
  const total = data.total || 0;
  if (results.length === 0 && off === 0) { grid.innerHTML = '<span class="dim">Keine Ergebnisse</span>'; return; }
  const cards = results.map(r => `
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
  if (off === 0) grid.innerHTML = cards; else { const btn = grid.querySelector('.load-more-btn'); if(btn) btn.remove(); grid.innerHTML += cards; }
  const loaded = off + results.length;
  if (loaded < total) {
    grid.innerHTML += `<button class="btn btn-primary btn-full load-more-btn" style="margin-top:10px" onclick="loadMoreBrowse(${loaded})">Mehr laden (${loaded}/${total})</button>`;
  }
}
window.loadMoreBrowse = function(offset) { searchBrowse(browseQuery, offset); };

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
