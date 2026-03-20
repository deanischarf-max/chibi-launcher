const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Simple JSON file store (no dependencies)
class SimpleStore {
  constructor() {
    this.path = path.join(app.getPath('userData'), 'chibi-data.json');
    this.data = {};
    try { this.data = JSON.parse(fs.readFileSync(this.path, 'utf8')); } catch(e) {}
  }
  get(key, def) { const keys = key.split('.'); let v = this.data; for (const k of keys) { if (v == null) return def; v = v[k]; } return v !== undefined ? v : def; }
  set(key, val) { const keys = key.split('.'); let obj = this.data; for (let i = 0; i < keys.length - 1; i++) { if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') obj[keys[i]] = {}; obj = obj[keys[i]]; } obj[keys[keys.length - 1]] = val; this._save(); }
  has(key) { return this.get(key) !== undefined; }
  delete(key) { const keys = key.split('.'); let obj = this.data; for (let i = 0; i < keys.length - 1; i++) { if (!obj[keys[i]]) return; obj = obj[keys[i]]; } delete obj[keys[keys.length - 1]]; this._save(); }
  _save() { try { fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2)); } catch(e) { console.error('Store save error:', e); } }
}

let store;

// Prevent crashes
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

const OWNER_USERS = ['FreezingDean'];
const VIP_USERS = ['FreezingDean', 'LoserLocator'];

const COSMETICS_CATALOG = [
  // Capes
  { id: 'cape_shadow', name: 'Schattenburg Cape', category: 'capes', price: 500, description: 'Dunkles Cape der Schattenburg' },
  { id: 'cape_light', name: 'Helichkeits Cape', category: 'capes', price: 500, description: 'Strahlendes Cape der HelichkeitsBurg' },
  { id: 'cape_sun', name: 'Sonnen Cape', category: 'capes', price: 500, description: 'Goldenes Cape der SonnensBurg' },
  { id: 'cape_rainbow', name: 'Regenbogen Cape', category: 'capes', price: 1000, description: 'Seltenes Regenbogen Cape' },
  { id: 'cape_fire', name: 'Feuer Cape', category: 'capes', price: 1500, description: 'Brennendes Feuer Cape' },
  { id: 'cape_ice', name: 'Eis Cape', category: 'capes', price: 1500, description: 'Gefrorenes Eis Cape' },
  { id: 'cape_void', name: 'Leere Cape', category: 'capes', price: 2500, description: 'Cape aus reiner Dunkelheit des Voids' },
  { id: 'cape_emerald', name: 'Smaragd Cape', category: 'capes', price: 2000, description: 'Glitzerndes Smaragd Cape der Haendler' },
  { id: 'cape_redstone', name: 'Redstone Cape', category: 'capes', price: 1800, description: 'Pulsierendes Redstone Cape' },
  { id: 'cape_ender', name: 'Ender Cape', category: 'capes', price: 3000, description: 'Mystisches Cape aus dem Ende' },
  { id: 'cape_nether', name: 'Nether Cape', category: 'capes', price: 2500, description: 'Gluehendes Cape aus dem Nether' },
  { id: 'cape_cherry', name: 'Kirschblueten Cape', category: 'capes', price: 1200, description: 'Zartrosa Cape mit Kirschblueten' },
  { id: 'cape_galaxy', name: 'Galaxie Cape', category: 'capes', price: 4000, description: 'Cape mit funkelnden Sternen und Nebeln' },
  { id: 'cape_phantom', name: 'Phantom Cape', category: 'capes', price: 3500, description: 'Geisterhaftes Cape das im Wind weht' },
  // Hats
  { id: 'hat_crown', name: 'Goldene Krone', category: 'hats', price: 2000, description: 'Eine goldene Krone fuer wahre Herrscher' },
  { id: 'hat_wizard', name: 'Zauberhut', category: 'hats', price: 800, description: 'Mystischer Zauberhut' },
  { id: 'hat_top', name: 'Zylinder', category: 'hats', price: 600, description: 'Eleganter Zylinder' },
  { id: 'hat_santa', name: 'Weihnachtsmuetze', category: 'hats', price: 300, description: 'Festliche Weihnachtsmuetze' },
  { id: 'hat_viking', name: 'Wikingerhelm', category: 'hats', price: 1200, description: 'Helm eines Wikingerkriegers' },
  { id: 'hat_pirate', name: 'Piratenhut', category: 'hats', price: 900, description: 'Verwegener Hut eines Seeraubers' },
  { id: 'hat_samurai', name: 'Samurai Helm', category: 'hats', price: 2500, description: 'Ehrwuerdiger Helm eines Samurai' },
  { id: 'hat_astronaut', name: 'Astronautenhelm', category: 'hats', price: 3000, description: 'Helm fuer intergalaktische Abenteuer' },
  { id: 'hat_knight', name: 'Ritterhelm', category: 'hats', price: 1800, description: 'Glanzender Helm eines tapferen Ritters' },
  { id: 'hat_beret', name: 'Kuenstler Baskenmtze', category: 'hats', price: 400, description: 'Stilvolle Baskenmuetze fuer Kreative' },
  { id: 'hat_mushroom', name: 'Pilzhut', category: 'hats', price: 700, description: 'Lustiger roter Fliegenpilz-Hut' },
  { id: 'hat_halo', name: 'Heiligenschein', category: 'hats', price: 5000, description: 'Strahlender goldener Heiligenschein' },
  { id: 'hat_devil', name: 'Teufelhoerner', category: 'hats', price: 4000, description: 'Gluehende Hoerner des Teufels' },
  // Wings
  { id: 'wings_angel', name: 'Engelsfluegel', category: 'wings', price: 3000, description: 'Strahlende weisse Fluegel' },
  { id: 'wings_demon', name: 'Daemonenfluegel', category: 'wings', price: 3000, description: 'Dunkle Daemonenfluegel' },
  { id: 'wings_dragon', name: 'Drachenfluegel', category: 'wings', price: 5000, description: 'Maechtige Drachenfluegel' },
  { id: 'wings_butterfly', name: 'Schmetterlingsfluegel', category: 'wings', price: 2000, description: 'Bunte Schmetterlingsfluegel' },
  { id: 'wings_phoenix', name: 'Phoenixfluegel', category: 'wings', price: 7000, description: 'Brennende Fluegel des Wiedergeborenen' },
  { id: 'wings_bee', name: 'Bienenfluegel', category: 'wings', price: 1500, description: 'Suesse summende Bienenfluegel' },
  { id: 'wings_crystal', name: 'Kristallfluegel', category: 'wings', price: 6000, description: 'Transparente Fluegel aus reinem Kristall' },
  { id: 'wings_bat', name: 'Fledermausfluegel', category: 'wings', price: 2500, description: 'Dunkle ledrige Fledermausfluegel' },
  { id: 'wings_fairy', name: 'Feenfluegel', category: 'wings', price: 3500, description: 'Funkelnde zarte Feenfluegel' },
  { id: 'wings_steampunk', name: 'Dampffluegel', category: 'wings', price: 4500, description: 'Mechanische Fluegel mit Zahnraedern' },
  // Auras
  { id: 'aura_flame', name: 'Flammen Aura', category: 'auras', price: 1000, description: 'Brennende Flammenpartikel' },
  { id: 'aura_snow', name: 'Schnee Aura', category: 'auras', price: 1000, description: 'Fallende Schneeflocken' },
  { id: 'aura_hearts', name: 'Herzen Aura', category: 'auras', price: 800, description: 'Schwebende Herzen' },
  { id: 'aura_music', name: 'Musik Aura', category: 'auras', price: 800, description: 'Tanzende Musiknoten' },
  { id: 'aura_enchant', name: 'Verzauberungs Aura', category: 'auras', price: 1500, description: 'Magische Verzauberungspartikel' },
  { id: 'aura_lightning', name: 'Blitz Aura', category: 'auras', price: 2500, description: 'Knisternde Blitze um den Spieler' },
  { id: 'aura_cherry', name: 'Kirschblueten Aura', category: 'auras', price: 1200, description: 'Sanft fallende Kirschblueten' },
  { id: 'aura_void', name: 'Void Aura', category: 'auras', price: 3000, description: 'Dunkle wirbelnde Void-Partikel' },
  { id: 'aura_rainbow', name: 'Regenbogen Aura', category: 'auras', price: 2000, description: 'Schimmernde Regenbogenfarben' },
  { id: 'aura_bubbles', name: 'Blasen Aura', category: 'auras', price: 600, description: 'Schwebende bunte Seifenblasen' },
  { id: 'aura_skulls', name: 'Totenkopf Aura', category: 'auras', price: 3500, description: 'Gruselige schwebende Totenschaedel' },
  { id: 'aura_diamond', name: 'Diamant Aura', category: 'auras', price: 4000, description: 'Funkelnde Diamantsplitter' },
  { id: 'aura_bats', name: 'Fledermaus Aura', category: 'auras', price: 1800, description: 'Kleine Fledermaeuse flattern umher' },
  // Emotes
  { id: 'emote_dab', name: 'Dab', category: 'emotes', price: 300, description: 'Der klassische Dab-Move' },
  { id: 'emote_wave', name: 'Winken', category: 'emotes', price: 200, description: 'Freundlich winken' },
  { id: 'emote_salute', name: 'Salutieren', category: 'emotes', price: 400, description: 'Militaerischer Gruss' },
  { id: 'emote_breakdance', name: 'Breakdance', category: 'emotes', price: 1500, description: 'Wilder Breakdance auf dem Boden' },
  { id: 'emote_floss', name: 'Floss Tanz', category: 'emotes', price: 800, description: 'Der beruehmte Floss-Tanz' },
  { id: 'emote_headbang', name: 'Headbang', category: 'emotes', price: 600, description: 'Wildes Kopfschuetteln zur Musik' },
  { id: 'emote_clap', name: 'Applaus', category: 'emotes', price: 250, description: 'Begeistertes Klatschen' },
  { id: 'emote_facepalm', name: 'Facepalm', category: 'emotes', price: 500, description: 'Hand vors Gesicht - peinlich!' },
  // Pets
  { id: 'pet_cat', name: 'Kaetzchen', category: 'pets', price: 2000, description: 'Niedliches kleines Kaetzchen' },
  { id: 'pet_dog', name: 'Huendchen', category: 'pets', price: 2000, description: 'Treuer kleiner Begleithund' },
  { id: 'pet_parrot', name: 'Papagei', category: 'pets', price: 1500, description: 'Bunter sprechender Papagei' },
  { id: 'pet_fox', name: 'Fuechslein', category: 'pets', price: 2500, description: 'Schlaues kleines Fuechslein' },
  { id: 'pet_axolotl', name: 'Axolotl', category: 'pets', price: 3000, description: 'Suesser rosa Axolotl schwebt neben dir' },
  { id: 'pet_bee', name: 'Bienchen', category: 'pets', price: 1800, description: 'Fleissiges summendes Bienchen' },
  { id: 'pet_dragon', name: 'Baby Drache', category: 'pets', price: 10000, description: 'Winziger Drache der Feuer spuckt' },
  { id: 'pet_ghost', name: 'Geistchen', category: 'pets', price: 4000, description: 'Freundlicher kleiner Geist' },
  // Trails
  { id: 'trail_fire', name: 'Feuerspur', category: 'trails', price: 1500, description: 'Brennende Flammen hinter dir' },
  { id: 'trail_ice', name: 'Eisspur', category: 'trails', price: 1500, description: 'Gefrorene Kristalle auf dem Boden' },
  { id: 'trail_rainbow', name: 'Regenbogenspur', category: 'trails', price: 2000, description: 'Bunter Regenbogen folgt deinen Schritten' },
  { id: 'trail_flowers', name: 'Blumenspur', category: 'trails', price: 1000, description: 'Blumen spriessen wo du gehst' },
  { id: 'trail_lightning', name: 'Blitzspur', category: 'trails', price: 2500, description: 'Elektrische Funken hinter dir' },
  { id: 'trail_shadow', name: 'Schattenspur', category: 'trails', price: 3000, description: 'Dunkle Schatten verfolgen dich' },
];

const COINS_PER_MINUTE = 2;
let mainWindow;

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600,
    frame: false, backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  store = new SimpleStore();
  createWindow();
});
app.on('window-all-closed', () => app.quit());

// Window Controls
ipcMain.handle('window-minimize', () => { try { mainWindow.minimize(); } catch(e) {} });
ipcMain.handle('window-maximize', () => { try { if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); } catch(e) {} });
ipcMain.handle('window-close', () => { try { mainWindow.close(); } catch(e) {} });

// Register
ipcMain.handle('register', (ev, username, password) => {
  try {
    if (!username || username.length < 3) return { success: false, error: 'Benutzername muss mindestens 3 Zeichen haben' };
    if (!password || password.length < 4) return { success: false, error: 'Passwort muss mindestens 4 Zeichen haben' };
    if (username.length > 16) return { success: false, error: 'Benutzername darf maximal 16 Zeichen haben' };

    const accounts = store.get('accounts', {});
    if (accounts[username.toLowerCase()]) return { success: false, error: 'Benutzername ist bereits vergeben' };

    accounts[username.toLowerCase()] = { username, password: hashPassword(password), createdAt: Date.now() };
    store.set('accounts', accounts);

    const isOwner = OWNER_USERS.includes(username);
    const isVIP = VIP_USERS.includes(username);
    store.set('currentUser', { name: username });
    if (isVIP || isOwner) { store.set(`owned_${username}`, COSMETICS_CATALOG.map(c => c.id)); }
    if (isOwner) store.set(`coins_${username}`, 999999);
    else if (!store.has(`coins_${username}`)) store.set(`coins_${username}`, isVIP ? 99999 : 0);
    if (!store.has(`equipped_${username}`)) store.set(`equipped_${username}`, {});

    return { success: true, profile: { name: username, isVIP, isOwner } };
  } catch(e) { return { success: false, error: 'Registrierung fehlgeschlagen' }; }
});

// Login
ipcMain.handle('login', (ev, username, password) => {
  try {
    if (!username || !password) return { success: false, error: 'Benutzername und Passwort eingeben' };

    const accounts = store.get('accounts', {});
    const account = accounts[username.toLowerCase()];
    if (!account) return { success: false, error: 'Account nicht gefunden' };
    if (account.password !== hashPassword(password)) return { success: false, error: 'Falsches Passwort' };

    const name = account.username;
    const isVIP = VIP_USERS.includes(name);
    store.set('currentUser', { name });
    if (isVIP) { store.set(`owned_${name}`, COSMETICS_CATALOG.map(c => c.id)); }
    if (!store.has(`coins_${name}`)) store.set(`coins_${name}`, isVIP ? 99999 : 0);
    if (!store.has(`equipped_${name}`)) store.set(`equipped_${name}`, {});

    const isOwner = OWNER_USERS.includes(name);
    return { success: true, profile: { name, isVIP, isOwner } };
  } catch(e) { return { success: false, error: 'Login fehlgeschlagen' }; }
});

ipcMain.handle('get-profile', () => {
  try {
    const p = store.get('currentUser');
    if (!p) return null;
    return { name: p.name, isVIP: VIP_USERS.includes(p.name), isOwner: OWNER_USERS.includes(p.name) };
  } catch(e) { return null; }
});

ipcMain.handle('logout', () => { store.delete('currentUser'); return true; });

// ── Microsoft Auth for Minecraft ──
const MS_CLIENT_ID = '00000000402b5328';
const MS_REDIRECT = 'https://login.live.com/oauth20_desktop.srf';

ipcMain.handle('mc-login', async () => {
  try {
    const authUrl = `https://login.live.com/oauth20_authorize.srf?client_id=${MS_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(MS_REDIRECT)}&scope=XboxLive.signin%20offline_access&prompt=select_account`;

    const code = await new Promise((resolve, reject) => {
      const authWin = new BrowserWindow({ width: 520, height: 700, parent: mainWindow, modal: true, show: false, autoHideMenuBar: true, webPreferences: { contextIsolation: true, nodeIntegration: false } });

      let resolved = false;
      const handleUrl = (url) => {
        if (resolved) return;
        if (!url.startsWith(MS_REDIRECT)) return;
        resolved = true;
        const u = new URL(url);
        const c = u.searchParams.get('code');
        const e = u.searchParams.get('error');
        try { authWin.destroy(); } catch(x) {}
        if (e) reject(new Error(e));
        else if (c) resolve(c);
        else reject(new Error('Kein Code erhalten'));
      };

      // Intercept ALL navigation to catch the redirect
      authWin.webContents.on('will-navigate', (ev, url) => handleUrl(url));
      authWin.webContents.on('did-navigate', (ev, url) => handleUrl(url));
      authWin.webContents.on('will-redirect', (ev, url) => handleUrl(url));
      authWin.webContents.on('did-redirect-navigation', (ev, url) => handleUrl(url));

      // Also use webRequest filter as backup
      authWin.webContents.session.webRequest.onBeforeRequest({ urls: ['https://login.live.com/oauth20_desktop.srf*'] }, (details, cb) => {
        handleUrl(details.url);
        cb({ cancel: false });
      });

      authWin.loadURL(authUrl);
      authWin.once('ready-to-show', () => authWin.show());
      authWin.on('closed', () => { if (!resolved) { resolved = true; reject(new Error('Fenster geschlossen')); } });
    });

    // Exchange code for tokens
    const msToken = await httpPost('login.live.com', '/oauth20_token.srf',
      `client_id=${MS_CLIENT_ID}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(MS_REDIRECT)}`,
      'application/x-www-form-urlencoded');

    const xblToken = await httpPostJson('user.auth.xboxlive.com', '/user/authenticate', {
      Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: 'd=' + msToken.access_token },
      RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT'
    });

    const xstsToken = await httpPostJson('xsts.auth.xboxlive.com', '/xsts/authorize', {
      Properties: { SandboxId: 'RETAIL', UserTokens: [xblToken.Token] },
      RelyingParty: 'rp://api.minecraftservices.com/', TokenType: 'JWT'
    });

    const uhs = xstsToken.DisplayClaims.xui[0].uhs;
    const mcToken = await httpPostJson('api.minecraftservices.com', '/authentication/login_with_xbox', {
      identityToken: 'XBL3.0 x=' + uhs + ';' + xstsToken.Token
    });

    const mcProfile = await httpGet('api.minecraftservices.com', '/minecraft/profile', mcToken.access_token);

    const mcAccount = { name: mcProfile.name, uuid: mcProfile.id, accessToken: mcToken.access_token };
    store.set('mcAccount', mcAccount);
    return { success: true, name: mcProfile.name };
  } catch(e) {
    console.error('MC Login error:', e);
    return { success: false, error: e.message || 'Login fehlgeschlagen' };
  }
});

ipcMain.handle('get-mc-account', () => {
  const acc = store.get('mcAccount');
  return acc ? { name: acc.name } : null;
});

ipcMain.handle('mc-logout', () => { store.delete('mcAccount'); return true; });

function httpPost(host, urlPath, body, contentType) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.request({ host, path: urlPath, method: 'POST', headers: { 'Content-Type': contentType, 'Content-Length': Buffer.byteLength(body) } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error('Server-Antwort ungueltig')); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function httpPostJson(host, urlPath, body) {
  const j = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.request({ host, path: urlPath, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(j), Accept: 'application/json' } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error('Server-Antwort ungueltig')); } });
    });
    req.on('error', reject); req.write(j); req.end();
  });
}

function httpGet(host, urlPath, token) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    https.get({ host, path: urlPath, headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error('Server-Antwort ungueltig')); } });
    }).on('error', reject);
  });
}

// Find Java - check EVERYWHERE including Minecraft's own bundled Java
function findJava() {
  const { execSync } = require('child_process');
  const home = process.env.APPDATA || '';
  const local = process.env.LOCALAPPDATA || '';

  const paths = [
    // Our own bundled Java
    path.join(app.getPath('appData'), '.chibi-minecraft', 'java', 'bin', 'javaw.exe'),
    path.join(app.getPath('appData'), '.chibi-minecraft', 'java', 'bin', 'java.exe'),
    // Minecraft launcher's bundled Java (official launcher)
    path.join(home, '.minecraft', 'runtime', 'java-runtime-delta', 'windows-x64', 'java-runtime-delta', 'bin', 'javaw.exe'),
    path.join(home, '.minecraft', 'runtime', 'java-runtime-gamma', 'windows-x64', 'java-runtime-gamma', 'bin', 'javaw.exe'),
    path.join(home, '.minecraft', 'runtime', 'java-runtime-beta', 'windows-x64', 'java-runtime-beta', 'bin', 'javaw.exe'),
    path.join(home, '.minecraft', 'runtime', 'java-runtime-alpha', 'windows-x64', 'java-runtime-alpha', 'bin', 'javaw.exe'),
    // MS Store Minecraft launcher Java
    ...(() => {
      try {
        const pkgDir = path.join(local, 'Packages');
        if (fs.existsSync(pkgDir)) {
          const msDirs = fs.readdirSync(pkgDir).filter(d => d.startsWith('Microsoft.4297127D64EC6'));
          for (const d of msDirs) {
            const runtimeDir = path.join(pkgDir, d, 'LocalCache', 'Local', 'runtime');
            if (fs.existsSync(runtimeDir)) {
              const runtimes = fs.readdirSync(runtimeDir);
              for (const rt of runtimes) {
                const jp = path.join(runtimeDir, rt, 'windows-x64', rt, 'bin', 'javaw.exe');
                if (fs.existsSync(jp)) return [jp];
              }
            }
          }
        }
      } catch(e) {}
      return [];
    })(),
    // Standard Java installations
    path.join(process.env.JAVA_HOME || '', 'bin', 'javaw.exe'),
    'C:\\Program Files\\Java\\jdk-21\\bin\\javaw.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21\\bin\\javaw.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jre-21\\bin\\javaw.exe',
    'C:\\Program Files\\Microsoft\\jdk-21\\bin\\javaw.exe',
    'C:\\Program Files\\Zulu\\zulu-21\\bin\\javaw.exe',
    'C:\\Program Files\\Java\\jre-21\\bin\\javaw.exe',
    'C:\\Program Files\\Java\\jdk-17\\bin\\javaw.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-17\\bin\\javaw.exe',
  ];

  for (const p of paths) {
    try { if (p && fs.existsSync(p)) return p; } catch(e) {}
  }

  // Last resort: check PATH
  try {
    const result = execSync('where javaw', { stdio: 'pipe', timeout: 5000 }).toString().trim().split('\n')[0].trim();
    if (result && fs.existsSync(result)) return result;
  } catch(e) {}
  try {
    const result = execSync('where java', { stdio: 'pipe', timeout: 5000 }).toString().trim().split('\n')[0].trim();
    if (result && fs.existsSync(result)) return result;
  } catch(e) {}

  return null;
}

// Download Java automatically
async function downloadJava() {
  const https = require('https');
  const javaDir = path.join(app.getPath('appData'), '.chibi-minecraft', 'java');
  const javawPath = path.join(javaDir, 'bin', 'javaw.exe');

  if (fs.existsSync(javawPath)) return javawPath;

  // Download Adoptium JRE 21 for Windows
  const url = 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse';

  return new Promise((resolve, reject) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launch-progress', { type: 'Java wird heruntergeladen...', task: 0, total: 100 });
    }

    const zipPath = path.join(app.getPath('temp'), 'java21.zip');
    const file = fs.createWriteStream(zipPath);

    const doRequest = (requestUrl) => {
      https.get(requestUrl, { headers: { 'User-Agent': 'ChibiLauncher/1.0' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          doRequest(res.headers.location);
          return;
        }
        const total = parseInt(res.headers['content-length'] || '0');
        let downloaded = 0;
        res.on('data', (chunk) => {
          downloaded += chunk.length;
          file.write(chunk);
          if (total > 0 && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('launch-progress', { type: 'Java Download', task: downloaded, total });
          }
        });
        res.on('end', () => {
          file.end();
          // Extract ZIP
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('launch-progress', { type: 'Java wird entpackt...', task: 90, total: 100 });
          }
          try {
            const { execSync } = require('child_process');
            fs.mkdirSync(javaDir, { recursive: true });
            // Try tar first (Windows 10+), fallback to PowerShell
            try {
              execSync(`tar -xf "${zipPath}" -C "${javaDir}"`, { timeout: 120000, stdio: 'pipe' });
            } catch(tarErr) {
              try {
                execSync(`powershell -NoProfile -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${javaDir}'"`, { timeout: 120000, stdio: 'pipe' });
              } catch(psErr) {
                reject(new Error('Entpacken fehlgeschlagen. Bitte installiere Java 21 manuell: https://adoptium.net'));
                return;
              }
            }
            // Find extracted subfolder and move contents up
            const dirs = fs.readdirSync(javaDir).filter(d => {
              try { return fs.statSync(path.join(javaDir, d)).isDirectory() && d.startsWith('jdk'); } catch(e) { return false; }
            });
            if (dirs.length > 0) {
              const extractedDir = path.join(javaDir, dirs[0]);
              const items = fs.readdirSync(extractedDir);
              for (const item of items) {
                const src = path.join(extractedDir, item);
                const dst = path.join(javaDir, item);
                try { fs.renameSync(src, dst); } catch(e) {
                  // If rename fails (cross-device), copy
                  execSync(process.platform === 'win32' ? `xcopy /E /I /Y "${src}" "${dst}"` : `cp -r "${src}" "${dst}"`, { stdio: 'pipe' });
                }
              }
              try { fs.rmSync(extractedDir, { recursive: true }); } catch(e) {}
            }
            try { fs.unlinkSync(zipPath); } catch(e) {}
            // Find java executable
            if (fs.existsSync(javawPath)) resolve(javawPath);
            else {
              const javaExe = path.join(javaDir, 'bin', 'java.exe');
              if (fs.existsSync(javaExe)) resolve(javaExe);
              else {
                // List what we got for debugging
                let contents = '';
                try { contents = fs.readdirSync(javaDir).join(', '); } catch(e) {}
                reject(new Error('Java bin nicht gefunden. Ordnerinhalt: ' + contents));
              }
            }
          } catch(e) {
            reject(new Error('Java entpacken fehlgeschlagen: ' + e.message));
          }
        });
        res.on('error', reject);
      }).on('error', reject);
    };
    doRequest(url);
  });
}

// ── Instanzen ──
ipcMain.handle('create-instance', (ev, name, version, loader) => {
  try {
    const instances = store.get('instances', []);
    const id = 'inst_' + Date.now();
    const inst = { id, name, version, loader, mods: [], resourcepacks: [], shaders: [], createdAt: Date.now() };
    instances.push(inst);
    store.set('instances', instances);
    // Create instance directories
    const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', id);
    fs.mkdirSync(path.join(mcRoot, 'mods'), { recursive: true });
    fs.mkdirSync(path.join(mcRoot, 'resourcepacks'), { recursive: true });
    fs.mkdirSync(path.join(mcRoot, 'shaderpacks'), { recursive: true });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('get-instances', () => store.get('instances', []));

ipcMain.handle('delete-instance', (ev, id) => {
  const instances = store.get('instances', []).filter(i => i.id !== id);
  store.set('instances', instances);
  // Delete files
  const dir = path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', id);
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch(e) {}
  return { success: true };
});

ipcMain.handle('add-to-instance', async (ev, instId, slug, type) => {
  try {
    const instances = store.get('instances', []);
    const inst = instances.find(i => i.id === instId);
    if (!inst) return { success: false, error: 'Instanz nicht gefunden' };

    // Get file from Modrinth
    let versions;
    try { versions = await modrinthGet(`/project/${slug}/version?game_versions=["${inst.version}"]`); } catch(e) { versions = null; }
    if (!versions || versions.length === 0) versions = await modrinthGet(`/project/${slug}/version`);
    if (!versions || versions.length === 0) return { success: false, error: 'Keine Version gefunden' };

    const latest = versions[0];
    const file = (latest.files.find(f => f.primary)) || latest.files[0];
    if (!file) return { success: false, error: 'Keine Datei' };

    // Download to instance dir
    let subdir;
    if (type === 'mod') subdir = 'mods';
    else if (type === 'resourcepack') subdir = 'resourcepacks';
    else if (type === 'shader') subdir = 'shaderpacks';
    else subdir = 'mods';

    const instDir = path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', instId, subdir);
    fs.mkdirSync(instDir, { recursive: true });
    await downloadFile(file.url, path.join(instDir, file.filename));

    // Track in instance
    const list = type === 'resourcepack' ? 'resourcepacks' : type === 'shader' ? 'shaders' : 'mods';
    if (!inst[list]) inst[list] = [];
    if (!inst[list].find(m => m.file === file.filename)) {
      inst[list].push({ name: slug, file: file.filename });
    }
    store.set('instances', instances);
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('remove-from-instance', (ev, instId, filename, type) => {
  const instances = store.get('instances', []);
  const inst = instances.find(i => i.id === instId);
  if (!inst) return { success: false, error: 'Nicht gefunden' };
  const list = type === 'resourcepack' ? 'resourcepacks' : type === 'shader' ? 'shaders' : 'mods';
  const subdir = type === 'resourcepack' ? 'resourcepacks' : type === 'shader' ? 'shaderpacks' : 'mods';
  inst[list] = (inst[list] || []).filter(m => m.file !== filename);
  store.set('instances', instances);
  try { fs.unlinkSync(path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', instId, subdir, filename)); } catch(e) {}
  return { success: true };
});

// Launch Instance
ipcMain.handle('launch-instance', async (ev, instId) => {
  const instances = store.get('instances', []);
  const inst = instances.find(i => i.id === instId);
  if (!inst) return { success: false, error: 'Instanz nicht gefunden' };
  const p = store.get('currentUser');
  if (!p) return { success: false, error: 'Nicht eingeloggt' };
  const version = inst.version;
  // This calls the same launch logic
  return await doLaunchGame(p, version, instId);
});

// Keep old handler for compatibility
async function doLaunchGame(p, mcVersion, instId) {
  try {
    // Find Java
    const customJava = store.get('settings.javaPath', '');
    let javaPath = (customJava && fs.existsSync(customJava)) ? customJava : findJava();

    if (!javaPath) {
      // Try to download Java 21
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('launch-progress', { type: 'Java 21 wird heruntergeladen...', task: 0, total: 100 });
      }
      try {
        javaPath = await downloadJava();
      } catch(e) {
        return { success: false, error: 'Java nicht gefunden!\n\nBitte installiere Java 21:\nhttps://adoptium.net/de/temurin/releases/?os=windows&arch=x64&package=jre&version=21\n\nOder installiere den offiziellen Minecraft Launcher (der bringt Java mit).\n\nDanach Launcher neu starten.' };
      }
    }

    const { Client, Authenticator } = require('minecraft-launcher-core');
    const launcher = new Client();
    const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft');

    // If launching from instance, set up overrides for mods/resourcepacks/shaders
    const overrides = {};
    if (instId) {
      const instDir = path.join(mcRoot, 'instances', instId);
      overrides.gameDirectory = instDir;
      // Copy version files will be in shared root, but game dir is per-instance
    }

    // Use Microsoft account if linked, otherwise offline
    const mcAccount = store.get('mcAccount');
    let auth;
    if (mcAccount && mcAccount.accessToken) {
      auth = {
        access_token: mcAccount.accessToken,
        client_token: mcAccount.uuid,
        uuid: mcAccount.uuid,
        name: mcAccount.name,
        user_properties: '{}',
      };
    } else {
      auth = Authenticator.getAuth(p.name);
    }

    const opts = {
      authorization: auth,
      root: mcRoot,
      javaPath: javaPath,
      version: { number: mcVersion, type: 'release' },
      memory: { max: store.get('settings.ram', '4') + 'G', min: '2G' },
      javaArgs: [
        '-XX:+UseG1GC',
        '-XX:+ParallelRefProcEnabled',
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:+DisableExplicitGC',
        '-XX:+AlwaysPreTouch',
      ],
      server: { host: 'chibi.art', port: '25565' },
      overrides,
    };

    let lastLines = [];

    // Register events BEFORE launch
    launcher.on('debug', (e) => { console.log('[MC]', e); lastLines.push(String(e)); if(lastLines.length>80) lastLines.shift(); });
    launcher.on('data', (e) => { console.log('[MC Data]', e); lastLines.push(String(e)); if(lastLines.length>80) lastLines.shift(); });
    launcher.on('error', (e) => {
      console.error('[MC Error]', e);
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-error', String(e));
    });
    launcher.on('progress', (e) => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', e);
    });
    launcher.on('close', (code) => {
      if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
        const errorLog = lastLines.slice(-20).join('\n');
        mainWindow.webContents.send('launch-error', 'Minecraft beendet (Code ' + code + ')\nJava: ' + javaPath + '\n\n' + errorLog);
      }
      const start = store.get(`session_start_${p.name}`);
      if (start) {
        const mins = Math.floor((Date.now() - start) / 60000);
        const earned = mins * COINS_PER_MINUTE;
        const cur = store.get(`coins_${p.name}`, 0);
        store.set(`coins_${p.name}`, cur + earned);
        store.delete(`session_start_${p.name}`);
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('coins-updated', { coins: cur + earned, earned, minutes: mins });
      }
    });

    // NOW launch
    store.set(`session_start_${p.name}`, Date.now());
    launcher.launch(opts);

    return { success: true };
  } catch(e) { return { success: false, error: e.message || 'Start fehlgeschlagen' }; }
}

ipcMain.handle('launch-game', async (ev, version) => {
  const p = store.get('currentUser');
  if (!p) return { success: false, error: 'Nicht eingeloggt' };
  return await doLaunchGame(p, version || '1.21.1', null);
});

// Cosmetics
ipcMain.handle('get-cosmetics', () => COSMETICS_CATALOG);
ipcMain.handle('get-owned-cosmetics', () => { const p = store.get('currentUser'); return p ? store.get(`owned_${p.name}`, []) : []; });
ipcMain.handle('get-equipped-cosmetics', () => { const p = store.get('currentUser'); return p ? store.get(`equipped_${p.name}`, {}) : {}; });
ipcMain.handle('get-coins', () => { const p = store.get('currentUser'); return p ? store.get(`coins_${p.name}`, 0) : 0; });

ipcMain.handle('buy-cosmetic', (ev, id) => {
  const p = store.get('currentUser'); if (!p) return { success: false, error: 'Nicht eingeloggt' };
  const isVIP = VIP_USERS.includes(p.name);
  const c = COSMETICS_CATALOG.find(x => x.id === id); if (!c) return { success: false, error: 'Nicht gefunden' };
  const owned = store.get(`owned_${p.name}`, []); if (owned.includes(id)) return { success: false, error: 'Bereits im Besitz' };
  if (!isVIP) { const coins = store.get(`coins_${p.name}`, 0); if (coins < c.price) return { success: false, error: 'Nicht genug Coins!' }; store.set(`coins_${p.name}`, coins - c.price); }
  owned.push(id); store.set(`owned_${p.name}`, owned);
  return { success: true, coins: store.get(`coins_${p.name}`, 0) };
});

ipcMain.handle('equip-cosmetic', (ev, id) => {
  const p = store.get('currentUser'); if (!p) return { success: false, error: 'Nicht eingeloggt' };
  const owned = store.get(`owned_${p.name}`, []); const c = COSMETICS_CATALOG.find(x => x.id === id);
  if (!c || !owned.includes(id)) return { success: false, error: 'Nicht im Besitz' };
  const eq = store.get(`equipped_${p.name}`, {});
  if (eq[c.category] === id) delete eq[c.category]; else eq[c.category] = id;
  store.set(`equipped_${p.name}`, eq);
  return { success: true, equipped: eq };
});

// ── Modrinth API ──
function modrinthGet(urlPath) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    https.get('https://api.modrinth.com/v2' + urlPath, { headers: { 'User-Agent': 'ChibiLauncher/1.0' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

ipcMain.handle('search-modrinth', async (ev, type, query) => {
  try {
    const facets = [['project_type:' + type]];
    const q = encodeURIComponent(query || '');
    const facetsStr = encodeURIComponent(JSON.stringify(facets));
    const url = `/search?query=${q}&facets=${facetsStr}&limit=25&index=relevance`;
    console.log('[Modrinth] Search:', url);
    const data = await modrinthGet(url);
    console.log('[Modrinth] Results:', data.total_hits || 0);
    return (data.hits || []).map(h => ({
      slug: h.slug,
      title: h.title,
      description: h.description,
      downloads: h.downloads,
      follows: h.follows,
      icon_url: h.icon_url || '',
      author: h.author || '',
      categories: h.categories || [],
    }));
  } catch(e) { console.error('Modrinth search error:', e); return []; }
});

ipcMain.handle('install-modrinth', async (ev, slug, type) => {
  try {
    const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft');
    const gameVersion = store.get('settings.gameVersion', '1.21.1');

    // Get project versions filtered by game version
    let versions;
    try {
      versions = await modrinthGet(`/project/${slug}/version?game_versions=["${gameVersion}"]`);
    } catch(e) {
      versions = null;
    }
    // Fallback: if no version matched the filter, get all versions
    if (!versions || versions.length === 0) {
      versions = await modrinthGet(`/project/${slug}/version`);
    }
    if (!versions || versions.length === 0) return { success: false, error: 'Keine Version gefunden' };

    // Pick the latest version, preferring primary files
    const latest = versions[0];
    const file = (latest.files && latest.files.find(f => f.primary)) || (latest.files && latest.files[0]);
    if (!file) return { success: false, error: 'Keine Datei gefunden' };

    // Determine install dir
    let dir;
    if (type === 'mod') dir = path.join(mcRoot, 'mods');
    else if (type === 'resourcepack') dir = path.join(mcRoot, 'resourcepacks');
    else if (type === 'shader') dir = path.join(mcRoot, 'shaderpacks');
    else dir = path.join(mcRoot, 'mods');

    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, file.filename);

    // Download
    await downloadFile(file.url, filePath);

    // Track installed
    const installed = store.get('installed_mods', []);
    if (!installed.find(m => m.file === file.filename)) {
      installed.push({ name: slug, file: file.filename, type, dir });
      store.set('installed_mods', installed);
    }
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('install-chibi-mod', async (ev, slug, name, url) => {
  try {
    const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft');
    const dir = path.join(mcRoot, 'mods');
    fs.mkdirSync(dir, { recursive: true });
    const filename = url.split('/').pop();
    const filePath = path.join(dir, filename);
    await downloadFile(url, filePath);
    const installed = store.get('installed_mods', []);
    if (!installed.find(m => m.file === filename)) {
      installed.push({ name, file: filename, type: 'mod', dir });
      store.set('installed_mods', installed);
    }
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('install-modpack', async (ev, slug) => {
  try {
    const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft');
    // Get modpack info
    const versions = await modrinthGet(`/project/${slug}/version`);
    if (!versions || versions.length === 0) return { success: false, error: 'Keine Version gefunden' };
    const latest = versions[0];

    // Get dependencies (mods in the modpack)
    const deps = latest.dependencies || [];
    let installed = 0;

    // Install each dependency
    for (const dep of deps) {
      if (dep.project_id && dep.dependency_type === 'required') {
        try {
          const depVersions = await modrinthGet(`/project/${dep.project_id}/version`);
          if (depVersions && depVersions.length > 0) {
            const depFile = (depVersions[0].files.find(f => f.primary)) || depVersions[0].files[0];
            if (depFile) {
              const dir = path.join(mcRoot, 'mods');
              fs.mkdirSync(dir, { recursive: true });
              await downloadFile(depFile.url, path.join(dir, depFile.filename));
              const mods = store.get('installed_mods', []);
              if (!mods.find(m => m.file === depFile.filename)) {
                mods.push({ name: dep.project_id, file: depFile.filename, type: 'mod', dir });
                store.set('installed_mods', mods);
              }
              installed++;
            }
          }
        } catch(e) { console.error('Dep install error:', e); }
      }
    }

    // Also download the modpack mrpack file if available
    const packFile = (latest.files.find(f => f.primary)) || latest.files[0];
    if (packFile) {
      const packDir = path.join(mcRoot, 'modpacks');
      fs.mkdirSync(packDir, { recursive: true });
      await downloadFile(packFile.url, path.join(packDir, packFile.filename));
    }

    return { success: true, count: installed };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('get-installed-mods', () => store.get('installed_mods', []));

ipcMain.handle('remove-mod', (ev, filename) => {
  try {
    const installed = store.get('installed_mods', []);
    const mod = installed.find(m => m.file === filename);
    if (mod) {
      const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft');
      let dir;
      if (mod.type === 'resourcepack') dir = path.join(mcRoot, 'resourcepacks');
      else if (mod.type === 'shader') dir = path.join(mcRoot, 'shaderpacks');
      else dir = path.join(mcRoot, 'mods');
      try { fs.unlinkSync(path.join(dir, filename)); } catch(e) {}
      store.set('installed_mods', installed.filter(m => m.file !== filename));
    }
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const doReq = (u, redirectCount) => {
      if (redirectCount > 10) { reject(new Error('Zu viele Weiterleitungen')); return; }
      // Pick http or https module based on the CURRENT url (handles cross-protocol redirects)
      const mod = u.startsWith('https') ? require('https') : require('http');
      mod.get(u, { headers: { 'User-Agent': 'ChibiLauncher/1.0' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
          let location = res.headers.location;
          if (!location) { reject(new Error('Weiterleitung ohne Ziel')); return; }
          // Handle relative redirects
          if (location.startsWith('/')) {
            const parsed = new URL(u);
            location = parsed.protocol + '//' + parsed.host + location;
          }
          // Consume the response to free the socket
          res.resume();
          doReq(location, redirectCount + 1);
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          reject(new Error('Download fehlgeschlagen: HTTP ' + res.statusCode));
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', (err) => { try { fs.unlinkSync(dest); } catch(e) {} reject(err); });
        res.on('error', (err) => { try { fs.unlinkSync(dest); } catch(e) {} reject(err); });
      }).on('error', reject);
    };
    doReq(url, 0);
  });
}

// ── Settings ──
ipcMain.handle('get-settings', () => store.get('settings', { ram: '4', javaPath: '' }));
ipcMain.handle('save-settings', (ev, s) => { store.set('settings', s); return true; });
