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

// Launch Game
ipcMain.handle('launch-game', async (ev, version) => {
  const p = store.get('currentUser');
  if (!p) return { success: false, error: 'Nicht eingeloggt' };
  const mcVersion = version || '1.21.1';
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
    const opts = {
      authorization: Authenticator.getAuth(p.name),
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
    const facets = JSON.stringify([['project_type:' + type]]);
    const q = encodeURIComponent(query || '');
    const data = await modrinthGet(`/search?query=${q}&facets=${encodeURIComponent(facets)}&limit=20`);
    return data.hits || [];
  } catch(e) { console.error('Modrinth search error:', e); return []; }
});

ipcMain.handle('install-modrinth', async (ev, slug, type) => {
  try {
    const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft');
    // Get project versions
    const versions = await modrinthGet(`/project/${slug}/version`);
    if (!versions || versions.length === 0) return { success: false, error: 'Keine Version gefunden' };

    const latest = versions[0];
    const file = latest.files && latest.files[0];
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
    const mod = url.startsWith('https') ? require('https') : require('http');
    const doReq = (u) => {
      mod.get(u, { headers: { 'User-Agent': 'ChibiLauncher/1.0' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) { doReq(res.headers.location); return; }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      }).on('error', reject);
    };
    doReq(url);
  });
}

// ── Settings ──
ipcMain.handle('get-settings', () => store.get('settings', { ram: '4', javaPath: '' }));
ipcMain.handle('save-settings', (ev, s) => { store.set('settings', s); return true; });
