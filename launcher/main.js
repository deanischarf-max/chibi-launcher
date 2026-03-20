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
  { id: 'cape_shadow', name: 'Schattenburg Cape', category: 'capes', price: 500, description: 'Dunkles Cape der Schattenburg' },
  { id: 'cape_light', name: 'Helichkeits Cape', category: 'capes', price: 500, description: 'Strahlendes Cape der HelichkeitsBurg' },
  { id: 'cape_sun', name: 'Sonnen Cape', category: 'capes', price: 500, description: 'Goldenes Cape der SonnensBurg' },
  { id: 'cape_rainbow', name: 'Regenbogen Cape', category: 'capes', price: 1000, description: 'Seltenes Regenbogen Cape' },
  { id: 'cape_fire', name: 'Feuer Cape', category: 'capes', price: 1500, description: 'Brennendes Feuer Cape' },
  { id: 'cape_ice', name: 'Eis Cape', category: 'capes', price: 1500, description: 'Gefrorenes Eis Cape' },
  { id: 'hat_crown', name: 'Goldene Krone', category: 'hats', price: 2000, description: 'Eine goldene Krone fuer wahre Herrscher' },
  { id: 'hat_wizard', name: 'Zauberhut', category: 'hats', price: 800, description: 'Mystischer Zauberhut' },
  { id: 'hat_top', name: 'Zylinder', category: 'hats', price: 600, description: 'Eleganter Zylinder' },
  { id: 'hat_santa', name: 'Weihnachtsmuetze', category: 'hats', price: 300, description: 'Festliche Weihnachtsmuetze' },
  { id: 'hat_viking', name: 'Wikingerhelm', category: 'hats', price: 1200, description: 'Helm eines Wikingerkriegers' },
  { id: 'wings_angel', name: 'Engelsfluegel', category: 'wings', price: 3000, description: 'Strahlende weisse Fluegel' },
  { id: 'wings_demon', name: 'Daemonenfluegel', category: 'wings', price: 3000, description: 'Dunkle Daemonenfluegel' },
  { id: 'wings_dragon', name: 'Drachenfluegel', category: 'wings', price: 5000, description: 'Maechtige Drachenfluegel' },
  { id: 'wings_butterfly', name: 'Schmetterlingsfluegel', category: 'wings', price: 2000, description: 'Bunte Schmetterlingsfluegel' },
  { id: 'aura_flame', name: 'Flammen Aura', category: 'auras', price: 1000, description: 'Brennende Flammenpartikel' },
  { id: 'aura_snow', name: 'Schnee Aura', category: 'auras', price: 1000, description: 'Fallende Schneeflocken' },
  { id: 'aura_hearts', name: 'Herzen Aura', category: 'auras', price: 800, description: 'Schwebende Herzen' },
  { id: 'aura_music', name: 'Musik Aura', category: 'auras', price: 800, description: 'Tanzende Musiknoten' },
  { id: 'aura_enchant', name: 'Verzauberungs Aura', category: 'auras', price: 1500, description: 'Magische Verzauberungspartikel' },
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

// Launch Game
ipcMain.handle('launch-game', async () => {
  const p = store.get('currentUser');
  if (!p) return { success: false, error: 'Nicht eingeloggt' };
  try {
    const { Client } = require('minecraft-launcher-core');
    const launcher = new Client();
    const opts = {
      authorization: { access_token: '0', client_token: '0', uuid: '0', name: p.name, user_properties: '{}' },
      root: path.join(app.getPath('appData'), '.chibi-minecraft'),
      version: { number: '1.21.1', type: 'release' },
      memory: { max: store.get('settings.ram', '4') + 'G', min: '2G' },
      javaArgs: [
        '-XX:+UseG1GC',
        '-XX:+ParallelRefProcEnabled',
        '-XX:G1HeapRegionSize=8M',
        '-XX:MaxGCPauseMillis=50',
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:+DisableExplicitGC',
        '-XX:+AlwaysPreTouch',
        '-XX:G1NewSizePercent=30',
        '-XX:G1MaxNewSizePercent=40',
        '-XX:G1ReservePercent=20',
        '-Dfml.ignorePatchDiscrepancies=true',
        '-Dfml.ignoreInvalidMinecraftCertificates=true',
      ],
      server: { host: 'chibi.art', port: '25565' },
    };
    store.set(`session_start_${p.name}`, Date.now());
    launcher.launch(opts);
    launcher.on('error', (e) => console.error('[MC Error]', e));
    launcher.on('close', () => {
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
    return { success: true };
  } catch(e) { return { success: false, error: e.message || 'Start fehlgeschlagen' }; }
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

// Settings
ipcMain.handle('get-settings', () => store.get('settings', { ram: '4' }));
ipcMain.handle('save-settings', (ev, s) => { store.set('settings', s); return true; });
