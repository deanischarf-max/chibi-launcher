const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  login: (u, p) => ipcRenderer.invoke('login', u, p),
  register: (u, p) => ipcRenderer.invoke('register', u, p),
  getProfile: () => ipcRenderer.invoke('get-profile'),
  logout: () => ipcRenderer.invoke('logout'),
  launchGame: () => ipcRenderer.invoke('launch-game'),
  getCosmetics: () => ipcRenderer.invoke('get-cosmetics'),
  getOwnedCosmetics: () => ipcRenderer.invoke('get-owned-cosmetics'),
  getEquippedCosmetics: () => ipcRenderer.invoke('get-equipped-cosmetics'),
  getCoins: () => ipcRenderer.invoke('get-coins'),
  buyCosmetic: (id) => ipcRenderer.invoke('buy-cosmetic', id),
  equipCosmetic: (id) => ipcRenderer.invoke('equip-cosmetic', id),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  onCoinsUpdated: (cb) => ipcRenderer.on('coins-updated', (_, d) => cb(d)),
});
