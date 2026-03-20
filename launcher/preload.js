const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  login: (u, p) => ipcRenderer.invoke('login', u, p),
  register: (u, p) => ipcRenderer.invoke('register', u, p),
  getProfile: () => ipcRenderer.invoke('get-profile'),
  logout: () => ipcRenderer.invoke('logout'),
  mcLogin: () => ipcRenderer.invoke('mc-login'),
  getMcAccount: () => ipcRenderer.invoke('get-mc-account'),
  mcLogout: () => ipcRenderer.invoke('mc-logout'),
  // Instances
  createInstance: (name, version, loader) => ipcRenderer.invoke('create-instance', name, version, loader),
  getInstances: () => ipcRenderer.invoke('get-instances'),
  deleteInstance: (id) => ipcRenderer.invoke('delete-instance', id),
  launchInstance: (id) => ipcRenderer.invoke('launch-instance', id),
  addToInstance: (id, slug, type) => ipcRenderer.invoke('add-to-instance', id, slug, type),
  removeFromInstance: (id, file, type) => ipcRenderer.invoke('remove-from-instance', id, file, type),
  // Modrinth
  searchModrinth: (type, query) => ipcRenderer.invoke('search-modrinth', type, query),
  getCosmetics: () => ipcRenderer.invoke('get-cosmetics'),
  getOwnedCosmetics: () => ipcRenderer.invoke('get-owned-cosmetics'),
  getEquippedCosmetics: () => ipcRenderer.invoke('get-equipped-cosmetics'),
  getCoins: () => ipcRenderer.invoke('get-coins'),
  buyCosmetic: (id) => ipcRenderer.invoke('buy-cosmetic', id),
  equipCosmetic: (id) => ipcRenderer.invoke('equip-cosmetic', id),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  onCoinsUpdated: (cb) => ipcRenderer.on('coins-updated', (_, d) => cb(d)),
  onLaunchError: (cb) => ipcRenderer.on('launch-error', (_, d) => cb(d)),
  onLaunchProgress: (cb) => ipcRenderer.on('launch-progress', (_, d) => cb(d)),
});
