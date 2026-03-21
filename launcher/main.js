const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
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
  // ── Neue Capes ──
  { id: 'cape_creeper', name: 'Creeper Cape', category: 'capes', price: 1800, description: 'Gruenes Cape mit Creeper-Gesicht' },
  { id: 'cape_wither', name: 'Wither Cape', category: 'capes', price: 5000, description: 'Duesteren Cape des Withers' },
  { id: 'cape_drachen', name: 'Drachen Cape', category: 'capes', price: 6000, description: 'Schuppiges Cape eines uralten Drachen' },
  { id: 'cape_fruehling', name: 'Fruehlings Cape', category: 'capes', price: 1200, description: 'Bluehendes Cape voller Fruehlingsblueten' },
  { id: 'cape_sommer', name: 'Sommer Cape', category: 'capes', price: 1200, description: 'Sonnengelbes Cape fuer heisse Tage' },
  { id: 'cape_herbst', name: 'Herbst Cape', category: 'capes', price: 1200, description: 'Buntes Laubcape in Herbstfarben' },
  { id: 'cape_winter', name: 'Winter Cape', category: 'capes', price: 1200, description: 'Verschneites Cape mit Eiskristallen' },
  { id: 'cape_einhorn', name: 'Einhorn Cape', category: 'capes', price: 4500, description: 'Magisches schimmerndes Einhorn Cape' },
  { id: 'cape_enderman', name: 'Enderman Cape', category: 'capes', price: 3500, description: 'Teleportierendes violettes Enderman Cape' },
  { id: 'cape_erde', name: 'Erd Cape', category: 'capes', price: 2000, description: 'Massives Cape aus Stein und Erde' },
  // ── Neue Huete ──
  { id: 'hat_creeper', name: 'Creeper Kopf', category: 'hats', price: 800, description: 'Gruener Creeper-Kopf als Hut' },
  { id: 'hat_drache', name: 'Drachenhelm', category: 'hats', price: 5000, description: 'Gehoernter Helm eines Drachenreiters' },
  { id: 'hat_blumenkranz', name: 'Blumenkranz', category: 'hats', price: 600, description: 'Huebscher Kranz aus Fruehlingsblumen' },
  { id: 'hat_schneekrone', name: 'Schneekrone', category: 'hats', price: 2500, description: 'Eisige Krone aus ewigem Frost' },
  { id: 'hat_sonnenkrone', name: 'Sonnenkrone', category: 'hats', price: 3500, description: 'Strahlende Krone der SonnensBurg' },
  { id: 'hat_schattenkrone', name: 'Schattenkrone', category: 'hats', price: 3500, description: 'Dunkle Krone der Schattenburg' },
  { id: 'hat_lichtkrone', name: 'Lichtkrone', category: 'hats', price: 3500, description: 'Leuchtende Krone der HelichkeitsBurg' },
  { id: 'hat_wither', name: 'Witherkopf', category: 'hats', price: 7000, description: 'Furchteinflossender Kopf des Withers' },
  { id: 'hat_enderdrache', name: 'Enderdrachen Kopf', category: 'hats', price: 8000, description: 'Majestaetischer Kopf des Enderdrachen' },
  { id: 'hat_phoenix', name: 'Phoenixfeder Krone', category: 'hats', price: 6000, description: 'Brennende Federkrone des Phoenix' },
  // ── Neue Fluegel ──
  { id: 'wings_ender', name: 'Enderfluegel', category: 'wings', price: 5500, description: 'Violett schimmernde Fluegel aus dem Ende' },
  { id: 'wings_wither', name: 'Witherfluegel', category: 'wings', price: 8000, description: 'Knochenfluegel des gefuerchteten Withers' },
  { id: 'wings_eis', name: 'Eisfluegel', category: 'wings', price: 4000, description: 'Gefrorene Fluegel aus ewigem Eis' },
  { id: 'wings_herbst', name: 'Herbstfluegel', category: 'wings', price: 3000, description: 'Fluegel aus buntem Herbstlaub' },
  { id: 'wings_schatten', name: 'Schattenfluegel', category: 'wings', price: 6500, description: 'Dunkle Fluegel der Schattenburg' },
  { id: 'wings_sonnen', name: 'Sonnenfluegel', category: 'wings', price: 6500, description: 'Goldene strahlende Fluegel der SonnensBurg' },
  { id: 'wings_einhorn', name: 'Einhornfluegel', category: 'wings', price: 7500, description: 'Regenbogen Fluegel eines Einhorns' },
  { id: 'wings_creeper', name: 'Creeperfluegel', category: 'wings', price: 3500, description: 'Explosive gruene Creeper-Fluegel' },
  // ── Neue Auren ──
  { id: 'aura_wither', name: 'Wither Aura', category: 'auras', price: 5000, description: 'Schwarzer Nebel des Withers umgibt dich' },
  { id: 'aura_creeper', name: 'Creeper Aura', category: 'auras', price: 2000, description: 'Gruene Funken und Zischgerausche' },
  { id: 'aura_drache', name: 'Drachen Aura', category: 'auras', price: 6000, description: 'Drakonische Flammenwirbel um dich herum' },
  { id: 'aura_fruehling', name: 'Fruehlings Aura', category: 'auras', price: 1500, description: 'Blueten und Schmetterlinge tanzen umher' },
  { id: 'aura_sommer', name: 'Sommer Aura', category: 'auras', price: 1500, description: 'Warme Sonnenstrahlen und Glitzern' },
  { id: 'aura_herbst', name: 'Herbst Aura', category: 'auras', price: 1500, description: 'Wirbelnde bunte Blaetter um dich' },
  { id: 'aura_winter', name: 'Winter Aura', category: 'auras', price: 1500, description: 'Eisige Kristalle und Schneeflocken' },
  { id: 'aura_einhorn', name: 'Einhorn Aura', category: 'auras', price: 4500, description: 'Magischer Regenbogenstaub umgibt dich' },
  { id: 'aura_schatten', name: 'Schatten Aura', category: 'auras', price: 3500, description: 'Dunkle Schatten der Schattenburg' },
  { id: 'aura_sonnen', name: 'Sonnen Aura', category: 'auras', price: 3500, description: 'Goldenes Leuchten der SonnensBurg' },
  // ── Neue Emotes ──
  { id: 'emote_dance', name: 'Freudentanz', category: 'emotes', price: 500, description: 'Freudig im Kreis tanzen' },
  { id: 'emote_cry', name: 'Weinen', category: 'emotes', price: 300, description: 'Dramatisch in Traenen ausbrechen' },
  { id: 'emote_laugh', name: 'Lachen', category: 'emotes', price: 250, description: 'Herzhaft laut loslachen' },
  { id: 'emote_bow', name: 'Verbeugung', category: 'emotes', price: 400, description: 'Elegante Verbeugung vor dem Gegenueber' },
  { id: 'emote_flex', name: 'Muskeln zeigen', category: 'emotes', price: 600, description: 'Stolz die Muskeln anspannen' },
  { id: 'emote_sleep', name: 'Schlafen', category: 'emotes', price: 350, description: 'Muede einschlafen mit Zzz-Blasen' },
  { id: 'emote_ninja', name: 'Ninja Pose', category: 'emotes', price: 800, description: 'Coole Ninja-Kampfhaltung einnehmen' },
  { id: 'emote_chicken', name: 'Huehnertanz', category: 'emotes', price: 700, description: 'Wie ein Huhn gackern und flattern' },
  { id: 'emote_rage', name: 'Wutanfall', category: 'emotes', price: 500, description: 'Wuetend auf den Boden stampfen' },
  { id: 'emote_dj', name: 'DJ Move', category: 'emotes', price: 1000, description: 'An unsichtbaren Plattentellern scratchen' },
  { id: 'emote_schwertkampf', name: 'Schwertkampf', category: 'emotes', price: 900, description: 'Beeindruckende Schwertkunst vorfuehren' },
  { id: 'emote_zaubern', name: 'Zaubern', category: 'emotes', price: 1200, description: 'Magische Runen in die Luft zeichnen' },
  // ── Neue Begleiter ──
  { id: 'pet_creeper', name: 'Baby Creeper', category: 'pets', price: 3000, description: 'Kleiner zahmer Creeper der nicht explodiert' },
  { id: 'pet_endermite', name: 'Endermite', category: 'pets', price: 2500, description: 'Winzige violette Endermite als Freund' },
  { id: 'pet_wolf', name: 'Wolfswelpe', category: 'pets', price: 3500, description: 'Treuer kleiner Wolf mit Halsband' },
  { id: 'pet_phoenix', name: 'Baby Phoenix', category: 'pets', price: 12000, description: 'Flammendes Kueken das aus der Asche steigt' },
  { id: 'pet_einhorn', name: 'Mini Einhorn', category: 'pets', price: 8000, description: 'Winziges Einhorn mit Regenbogenschweif' },
  { id: 'pet_schneemann', name: 'Schneemaennchen', category: 'pets', price: 2000, description: 'Kleiner Schneemann der nie schmilzt' },
  { id: 'pet_fledermaus', name: 'Fledermaeuschen', category: 'pets', price: 1500, description: 'Nachtaktive kleine Fledermaus' },
  { id: 'pet_schildkroete', name: 'Schildkroete', category: 'pets', price: 2200, description: 'Gemuetliche kleine Schildkroete' },
  { id: 'pet_wither_skelett', name: 'Mini Witherskelett', category: 'pets', price: 7000, description: 'Kleines dunkles Witherskelett als Bodyguard' },
  { id: 'pet_allay', name: 'Allay', category: 'pets', price: 5000, description: 'Tanzender blauer Allay mit Musiknote' },
  // ── Neue Spuren ──
  { id: 'trail_creeper', name: 'Creeperspur', category: 'trails', price: 2000, description: 'Gruene Explosionspartikel hinter dir' },
  { id: 'trail_ender', name: 'Enderspur', category: 'trails', price: 3500, description: 'Violette Enderpartikel folgen dir' },
  { id: 'trail_lava', name: 'Lavaspur', category: 'trails', price: 2500, description: 'Gluehende Lava tropft hinter dir' },
  { id: 'trail_noten', name: 'Notenspur', category: 'trails', price: 1500, description: 'Bunte Musiknoten tanzen hinter dir' },
  { id: 'trail_herzen', name: 'Herzenspur', category: 'trails', price: 1200, description: 'Rote Herzen schweben hinter dir empor' },
  { id: 'trail_sterne', name: 'Sternenspur', category: 'trails', price: 2000, description: 'Funkelnde Sterne auf deinem Weg' },
  { id: 'trail_pilze', name: 'Pilzspur', category: 'trails', price: 1000, description: 'Kleine Pilze spriessen wo du gehst' },
  { id: 'trail_wither', name: 'Witherspur', category: 'trails', price: 4000, description: 'Schwarzer Rauch des Withers hinter dir' },
  // ── Partikel (Neue Kategorie) ──
  { id: 'particle_feuer', name: 'Feuerwirbel', category: 'particles', price: 1500, description: 'Wirbelnde Feuerflammen um dich herum' },
  { id: 'particle_wasser', name: 'Wasserspritzer', category: 'particles', price: 1500, description: 'Sprudelnde Wassertropfen um dich' },
  { id: 'particle_erde', name: 'Erdbrocken', category: 'particles', price: 1500, description: 'Kleine Steinchen schweben um dich' },
  { id: 'particle_luft', name: 'Windwirbel', category: 'particles', price: 1500, description: 'Unsichtbare Winde wirbeln um dich' },
  { id: 'particle_endportal', name: 'Endportal Strudel', category: 'particles', price: 5000, description: 'Mystischer Strudel wie ein Endportal' },
  { id: 'particle_totem', name: 'Totem Partikel', category: 'particles', price: 3000, description: 'Goldene Totem-der-Unsterblichkeit Funken' },
  { id: 'particle_seelen', name: 'Seelenfeuer', category: 'particles', price: 3500, description: 'Blaue Seelenflammen lodern um dich' },
  { id: 'particle_redstone', name: 'Redstone Staub', category: 'particles', price: 2000, description: 'Roter Redstone-Staub wirbelt umher' },
  { id: 'particle_nether', name: 'Nether Asche', category: 'particles', price: 2500, description: 'Gluehende Asche aus dem Nether' },
  { id: 'particle_kirschbluete', name: 'Kirschblueten Regen', category: 'particles', price: 1800, description: 'Rosa Blueten regnen sanft herab' },
  { id: 'particle_drache', name: 'Drachenatem', category: 'particles', price: 6000, description: 'Violetter Atem des Enderdrachen' },
  { id: 'particle_schatten', name: 'Schattenrauch', category: 'particles', price: 4000, description: 'Schwarzer Rauch der Schattenburg' },
  { id: 'particle_sonnenstaub', name: 'Sonnenstaub', category: 'particles', price: 4000, description: 'Goldener Staub der SonnensBurg' },
  { id: 'particle_lichtfunken', name: 'Lichtfunken', category: 'particles', price: 4000, description: 'Helle Funken der HelichkeitsBurg' },
  { id: 'particle_schneesturm', name: 'Schneesturm', category: 'particles', price: 2500, description: 'Wirbelnder Schneesturm um dich' },
  { id: 'particle_gluehwurm', name: 'Gluehwuermchen', category: 'particles', price: 2000, description: 'Leuchtende Gluehwuermchen schwirren umher' },
  // ── Accessoires (Neue Kategorie) ──
  { id: 'acc_brille', name: 'Sonnenbrille', category: 'accessories', price: 500, description: 'Coole dunkle Sonnenbrille' },
  { id: 'acc_monokel', name: 'Monokel', category: 'accessories', price: 800, description: 'Elegantes Monokel fuer Gentlemen' },
  { id: 'acc_schal_schatten', name: 'Schattenburger Schal', category: 'accessories', price: 1500, description: 'Dunkler Schal der Schattenburg' },
  { id: 'acc_schal_licht', name: 'Helichkeits Schal', category: 'accessories', price: 1500, description: 'Leuchtender Schal der HelichkeitsBurg' },
  { id: 'acc_schal_sonne', name: 'Sonnenburger Schal', category: 'accessories', price: 1500, description: 'Goldener Schal der SonnensBurg' },
  { id: 'acc_schwert_ruecken', name: 'Rueckenschwert', category: 'accessories', price: 3000, description: 'Dekoratives Schwert auf dem Ruecken' },
  { id: 'acc_fluegel_mini', name: 'Mini Fluegel', category: 'accessories', price: 2000, description: 'Winzige dekorative Fluegel am Ruecken' },
  { id: 'acc_umhang_feuer', name: 'Feuerumhang', category: 'accessories', price: 4000, description: 'Umhang aus lodernden Flammen' },
  { id: 'acc_kette_diamant', name: 'Diamantkette', category: 'accessories', price: 5000, description: 'Funkelnde Halskette aus Diamanten' },
  { id: 'acc_ring_ender', name: 'Enderring', category: 'accessories', price: 3500, description: 'Mystischer Ring mit Enderperle' },
  { id: 'acc_guertel_redstone', name: 'Redstoneguertel', category: 'accessories', price: 2500, description: 'Leuchtender Guertel aus Redstone' },
  { id: 'acc_schulterdrache', name: 'Schulterdrache', category: 'accessories', price: 8000, description: 'Kleiner Drache sitzt auf deiner Schulter' },
  { id: 'acc_rucksack', name: 'Abenteurer Rucksack', category: 'accessories', price: 1800, description: 'Praktischer Rucksack fuer Abenteurer' },
  { id: 'acc_banner', name: 'Rueckenbanner', category: 'accessories', price: 2200, description: 'Stolzes Banner auf dem Ruecken' },
  { id: 'acc_laterne', name: 'Schwebelaterne', category: 'accessories', price: 3000, description: 'Magische Laterne die neben dir schwebt' },
  { id: 'acc_buch', name: 'Zauberbuch', category: 'accessories', price: 4500, description: 'Schwebendes offenes Zauberbuch mit Runen' },
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

  // Auto-Update (allow unsigned updates for non-code-signed builds)
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  try { autoUpdater.forceDevUpdateConfig = false; } catch(e) {}
  autoUpdater.on('checking-for-update', () => console.log('[Update] Checking...'));
  autoUpdater.on('update-available', (info) => {
    console.log('[Update] Available:', info.version);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-status', 'Update v' + info.version + ' wird heruntergeladen...');
  });
  autoUpdater.on('update-not-available', () => console.log('[Update] Up to date'));
  autoUpdater.on('download-progress', (p) => console.log('[Update] Download:', Math.round(p.percent) + '%'));
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Update] Downloaded:', info.version);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-status', 'Update v' + info.version + ' bereit! Startet beim Schliessen.');
  });
  autoUpdater.on('error', (err) => {
    console.error('[Update] Error:', err.message || err);
    // Don't show error to user - silent fail is fine for updates
  });
  setTimeout(() => { try { autoUpdater.checkForUpdates(); } catch(e) { console.error('[Update] Check failed:', e); } }, 5000);
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

    const isOwner = OWNER_USERS.map(u=>u.toLowerCase()).includes(username.toLowerCase());
    const isVIP = VIP_USERS.map(u=>u.toLowerCase()).includes(username.toLowerCase());
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
    const isOwner = OWNER_USERS.map(u=>u.toLowerCase()).includes(name.toLowerCase());
    const isVIP = VIP_USERS.map(u=>u.toLowerCase()).includes(name.toLowerCase());
    store.set('currentUser', { name });
    if (isVIP || isOwner) { store.set(`owned_${name}`, COSMETICS_CATALOG.map(c => c.id)); }
    if (isOwner) store.set(`coins_${name}`, 999999);
    else if (!store.has(`coins_${name}`)) store.set(`coins_${name}`, isVIP ? 99999 : 0);
    if (!store.has(`equipped_${name}`)) store.set(`equipped_${name}`, {});
    return { success: true, profile: { name, isVIP, isOwner } };
  } catch(e) { return { success: false, error: 'Login fehlgeschlagen' }; }
});

ipcMain.handle('get-profile', () => {
  try {
    const p = store.get('currentUser');
    if (!p) return null;
    return { name: p.name, isVIP: VIP_USERS.map(u=>u.toLowerCase()).includes(p.name.toLowerCase()), isOwner: OWNER_USERS.map(u=>u.toLowerCase()).includes(p.name.toLowerCase()) };
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

// Find Java - cross-platform detection
function findJava() {
  const { execSync } = require('child_process');
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const javaExe = isWin ? 'javaw.exe' : 'java';
  const javaExeFallback = isWin ? 'java.exe' : 'java';
  const home = process.env.APPDATA || process.env.HOME || '';
  const local = process.env.LOCALAPPDATA || '';

  const paths = [
    // Our own bundled Java
    path.join(app.getPath('appData'), '.chibi-minecraft', 'java', 'bin', javaExe),
    path.join(app.getPath('appData'), '.chibi-minecraft', 'java', 'bin', javaExeFallback),
  ];

  if (isWin) {
    // Minecraft launcher's bundled Java (official launcher)
    for (const rt of ['java-runtime-delta', 'java-runtime-gamma', 'java-runtime-beta', 'java-runtime-alpha']) {
      paths.push(path.join(home, '.minecraft', 'runtime', rt, 'windows-x64', rt, 'bin', 'javaw.exe'));
    }
    // MS Store Minecraft launcher Java
    try {
      const pkgDir = path.join(local, 'Packages');
      if (fs.existsSync(pkgDir)) {
        const msDirs = fs.readdirSync(pkgDir).filter(d => d.startsWith('Microsoft.4297127D64EC6'));
        for (const d of msDirs) {
          const runtimeDir = path.join(pkgDir, d, 'LocalCache', 'Local', 'runtime');
          if (fs.existsSync(runtimeDir)) {
            for (const rt of fs.readdirSync(runtimeDir)) {
              paths.push(path.join(runtimeDir, rt, 'windows-x64', rt, 'bin', 'javaw.exe'));
            }
          }
        }
      }
    } catch(e) {}
    // Standard Windows Java installations
    paths.push(
      path.join(process.env.JAVA_HOME || '', 'bin', 'javaw.exe'),
      'C:\\Program Files\\Java\\jdk-21\\bin\\javaw.exe',
      'C:\\Program Files\\Eclipse Adoptium\\jdk-21\\bin\\javaw.exe',
      'C:\\Program Files\\Eclipse Adoptium\\jre-21\\bin\\javaw.exe',
      'C:\\Program Files\\Microsoft\\jdk-21\\bin\\javaw.exe',
      'C:\\Program Files\\Zulu\\zulu-21\\bin\\javaw.exe',
      'C:\\Program Files\\Java\\jre-21\\bin\\javaw.exe',
      'C:\\Program Files\\Java\\jdk-17\\bin\\javaw.exe',
      'C:\\Program Files\\Eclipse Adoptium\\jdk-17\\bin\\javaw.exe',
    );
  } else {
    // Linux & macOS
    paths.push(path.join(process.env.JAVA_HOME || '', 'bin', 'java'));
    if (isMac) {
      paths.push(
        '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home/bin/java',
        '/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home/bin/java',
        '/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin/java',
        '/usr/local/opt/openjdk@21/bin/java',
        '/opt/homebrew/opt/openjdk@21/bin/java',
      );
    } else {
      // Linux
      paths.push(
        '/usr/lib/jvm/java-21-openjdk-amd64/bin/java',
        '/usr/lib/jvm/java-21-openjdk/bin/java',
        '/usr/lib/jvm/temurin-21-jdk-amd64/bin/java',
        '/usr/lib/jvm/java-21/bin/java',
        '/usr/lib/jvm/java-17-openjdk-amd64/bin/java',
        '/usr/lib/jvm/java-17-openjdk/bin/java',
        '/usr/bin/java',
      );
      // Minecraft launcher Java on Linux
      const mcDir = path.join(home, '.minecraft', 'runtime');
      try {
        if (fs.existsSync(mcDir)) {
          for (const rt of fs.readdirSync(mcDir)) {
            paths.push(path.join(mcDir, rt, 'linux', rt, 'bin', 'java'));
          }
        }
      } catch(e) {}
    }
  }

  for (const p of paths) {
    try { if (p && fs.existsSync(p)) return p; } catch(e) {}
  }

  // Last resort: check PATH
  const whichCmd = isWin ? 'where' : 'which';
  if (isWin) {
    try { const r = execSync('where javaw', { stdio: 'pipe', timeout: 5000 }).toString().trim().split('\n')[0].trim(); if (r && fs.existsSync(r)) return r; } catch(e) {}
  }
  try { const r = execSync(`${whichCmd} java`, { stdio: 'pipe', timeout: 5000 }).toString().trim().split('\n')[0].trim(); if (r && fs.existsSync(r)) return r; } catch(e) {}

  return null;
}

// Download Java automatically (cross-platform)
async function downloadJava() {
  const https = require('https');
  const { execSync } = require('child_process');
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const javaDir = path.join(app.getPath('appData'), '.chibi-minecraft', 'java');
  const javaExe = isWin ? 'javaw.exe' : 'java';
  const javaBinPath = path.join(javaDir, 'bin', javaExe);

  if (fs.existsSync(javaBinPath)) return javaBinPath;

  // Detect OS and arch for Adoptium API
  const osName = isWin ? 'windows' : isMac ? 'mac' : 'linux';
  const archName = process.arch === 'arm64' ? 'aarch64' : 'x64';
  const url = `https://api.adoptium.net/v3/binary/latest/21/ga/${osName}/${archName}/jre/hotspot/normal/eclipse`;
  const archiveExt = isWin ? '.zip' : '.tar.gz';

  return new Promise((resolve, reject) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launch-progress', { type: 'Java wird heruntergeladen...', task: 0, total: 100 });
    }

    const archivePath = path.join(app.getPath('temp'), 'java21' + archiveExt);
    const file = fs.createWriteStream(archivePath);

    const doRequest = (requestUrl) => {
      https.get(requestUrl, { headers: { 'User-Agent': 'ChibiLauncher/1.1' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          res.resume();
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
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('launch-progress', { type: 'Java wird entpackt...', task: 90, total: 100 });
          }
          try {
            fs.mkdirSync(javaDir, { recursive: true });
            if (isWin) {
              try { execSync(`tar -xf "${archivePath}" -C "${javaDir}"`, { timeout: 120000, stdio: 'pipe' }); }
              catch(tarErr) {
                try { execSync(`powershell -NoProfile -Command "Expand-Archive -Force -Path '${archivePath}' -DestinationPath '${javaDir}'"`, { timeout: 120000, stdio: 'pipe' }); }
                catch(psErr) { reject(new Error('Entpacken fehlgeschlagen. Bitte installiere Java 21 manuell: https://adoptium.net')); return; }
              }
            } else {
              execSync(`tar -xzf "${archivePath}" -C "${javaDir}"`, { timeout: 120000, stdio: 'pipe' });
            }
            // Move extracted subfolder contents up
            const dirs = fs.readdirSync(javaDir).filter(d => {
              try { return fs.statSync(path.join(javaDir, d)).isDirectory() && d.startsWith('jdk'); } catch(e) { return false; }
            });
            if (dirs.length > 0) {
              const extractedDir = path.join(javaDir, dirs[0]);
              // On macOS, JDK is inside Contents/Home
              const homeDir = isMac && fs.existsSync(path.join(extractedDir, 'Contents', 'Home'))
                ? path.join(extractedDir, 'Contents', 'Home') : extractedDir;
              for (const item of fs.readdirSync(homeDir)) {
                const src = path.join(homeDir, item);
                const dst = path.join(javaDir, item);
                try { fs.renameSync(src, dst); } catch(e) {
                  execSync(`cp -r "${src}" "${dst}"`, { stdio: 'pipe' });
                }
              }
              try { fs.rmSync(extractedDir, { recursive: true }); } catch(e) {}
            }
            try { fs.unlinkSync(archivePath); } catch(e) {}
            // Make java executable on Unix
            if (!isWin) {
              try { execSync(`chmod +x "${path.join(javaDir, 'bin', 'java')}"`, { stdio: 'pipe' }); } catch(e) {}
            }
            // Find java executable
            const candidates = [javaBinPath, path.join(javaDir, 'bin', isWin ? 'java.exe' : 'java')];
            for (const c of candidates) { if (fs.existsSync(c)) { resolve(c); return; } }
            let contents = ''; try { contents = fs.readdirSync(javaDir).join(', '); } catch(e) {}
            reject(new Error('Java bin nicht gefunden. Ordnerinhalt: ' + contents));
          } catch(e) { reject(new Error('Java entpacken fehlgeschlagen: ' + e.message)); }
        });
        res.on('error', reject);
      }).on('error', reject);
    };
    doRequest(url);
  });
}

// ── Fabric Loader Installation (via official Fabric Installer JAR) ──
function fabricGet(urlPath) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    https.get('https://meta.fabricmc.net/v2' + urlPath, { headers: { 'User-Agent': 'ChibiLauncher/1.1' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

// Find java (not javaw) executable for running the Fabric installer
function findJavaExe(javaPath) {
  if (!javaPath) return null;
  // If we have javaw.exe, find java.exe next to it
  if (javaPath.endsWith('javaw.exe')) {
    const javaExe = javaPath.replace('javaw.exe', 'java.exe');
    if (fs.existsSync(javaExe)) return javaExe;
  }
  // On Linux/Mac, java is java
  return javaPath;
}

async function installFabricLoader(mcRoot, gameVersion, javaPath) {
  const { execSync } = require('child_process');

  try {
    // Check if Fabric is already installed for this game version
    const versionsDir = path.join(mcRoot, 'versions');
    if (fs.existsSync(versionsDir)) {
      const existing = fs.readdirSync(versionsDir).filter(d =>
        d.startsWith('fabric-loader-') && d.endsWith('-' + gameVersion)
      );
      if (existing.length > 0) {
        const versionJson = path.join(versionsDir, existing[0], existing[0] + '.json');
        if (fs.existsSync(versionJson)) {
          console.log('[Fabric] Already installed:', existing[0]);
          return existing[0];
        }
      }
    }

    // Get latest Fabric installer version
    const installers = await fabricGet('/versions/installer');
    if (!installers || installers.length === 0) {
      console.error('[Fabric] No installer versions found');
      return null;
    }
    const installerVersion = installers[0].version;
    console.log('[Fabric] Using installer version:', installerVersion);

    // Download the Fabric installer JAR
    const installerPath = path.join(mcRoot, 'fabric-installer.jar');
    const installerUrl = `https://maven.fabricmc.net/net/fabricmc/fabric-installer/${installerVersion}/fabric-installer-${installerVersion}.jar`;

    if (!fs.existsSync(installerPath)) {
      console.log('[Fabric] Downloading installer from:', installerUrl);
      await downloadFile(installerUrl, installerPath);
    }

    // Find java executable (not javaw) for running the installer
    const javaExe = findJavaExe(javaPath);
    if (!javaExe) {
      console.error('[Fabric] No java executable found');
      return null;
    }

    // Run the official Fabric installer
    // -noprofile: don't create launcher profile
    // -mcversion: target MC version
    // -dir: install directory
    const cmd = `"${javaExe}" -jar "${installerPath}" client -dir "${mcRoot}" -mcversion ${gameVersion} -noprofile`;
    console.log('[Fabric] Running installer:', cmd);

    try {
      const output = execSync(cmd, { timeout: 120000, stdio: 'pipe', encoding: 'utf8' });
      console.log('[Fabric] Installer output:', output);
    } catch(installErr) {
      console.error('[Fabric] Installer failed:', installErr.stderr || installErr.message);
      // Fallback: try without -noprofile
      try {
        execSync(`"${javaExe}" -jar "${installerPath}" client -dir "${mcRoot}" -mcversion ${gameVersion}`, { timeout: 120000, stdio: 'pipe' });
      } catch(e2) {
        console.error('[Fabric] Installer fallback also failed:', e2.message);
        return null;
      }
    }

    // Find the installed Fabric version
    if (fs.existsSync(versionsDir)) {
      const installed = fs.readdirSync(versionsDir)
        .filter(d => d.startsWith('fabric-loader-') && d.endsWith('-' + gameVersion))
        .sort().reverse();
      if (installed.length > 0) {
        console.log('[Fabric] Successfully installed:', installed[0]);
        return installed[0];
      }
    }

    console.error('[Fabric] Installation completed but version not found');
    return null;
  } catch(e) {
    console.error('[Fabric] Install error:', e);
    return null;
  }
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
    console.log('[Modrinth] Getting versions for', slug, 'game version', inst.version);
    let versions;
    try { versions = await modrinthGet(`/project/${slug}/version?game_versions=["${inst.version}"]`); } catch(e) { console.error('Version fetch error:', e); versions = null; }
    if (!versions || versions.length === 0) {
      console.log('[Modrinth] No version for', inst.version, '- trying all versions');
      try { versions = await modrinthGet(`/project/${slug}/version`); } catch(e) { return { success: false, error: 'API Fehler: ' + e.message }; }
    }
    if (!versions || versions.length === 0) return { success: false, error: 'Keine Version fuer ' + slug + ' gefunden' };

    const latest = versions[0];
    const file = (latest.files && latest.files.find(f => f.primary)) || (latest.files && latest.files[0]);
    if (!file) return { success: false, error: 'Keine Datei fuer ' + slug };
    console.log('[Modrinth] Downloading', file.filename, 'from', file.url);

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
    // Auto-upgrade to Fabric when adding mods to a vanilla instance
    if (type === 'mod' && inst.loader === 'vanilla') {
      inst.loader = 'fabric';
      console.log('[Instance] Auto-upgraded to Fabric (mod added)');

      // Auto-install Fabric API if not already present (most mods need it)
      const hasFabricApi = (inst.mods || []).some(m =>
        m.name === 'fabric-api' || m.file.toLowerCase().includes('fabric-api')
      );
      if (!hasFabricApi) {
        try {
          console.log('[Instance] Auto-installing Fabric API...');
          let apiVersions = await modrinthGet(`/project/fabric-api/version?game_versions=["${inst.version}"]&loaders=["fabric"]`);
          if (!apiVersions || apiVersions.length === 0) apiVersions = await modrinthGet(`/project/fabric-api/version?loaders=["fabric"]`);
          if (apiVersions && apiVersions.length > 0) {
            const apiFile = (apiVersions[0].files.find(f => f.primary)) || apiVersions[0].files[0];
            if (apiFile) {
              const apiDest = path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', instId, 'mods', apiFile.filename);
              await downloadFile(apiFile.url, apiDest);
              inst.mods.push({ name: 'fabric-api', file: apiFile.filename });
              console.log('[Instance] Fabric API installed:', apiFile.filename);
            }
          }
        } catch(e) { console.warn('[Instance] Fabric API auto-install failed:', e.message); }
      }
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

async function doLaunchGame(p, mcVersion, instId) {
  const { spawn } = require('child_process');
  try {
    // Find Java
    const customJava = store.get('settings.javaPath', '');
    let javaPath = (customJava && fs.existsSync(customJava)) ? customJava : findJava();
    if (!javaPath) {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', { type: 'Java wird heruntergeladen...', task: 0, total: 100 });
      try { javaPath = await downloadJava(); } catch(e) {
        const osHint = process.platform === 'win32' ? 'os=windows' : process.platform === 'darwin' ? 'os=mac' : 'os=linux';
        return { success: false, error: `Java nicht gefunden!\nhttps://adoptium.net/de/temurin/releases/?${osHint}&arch=x64&package=jre&version=21` };
      }
    }

    const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft');

    // Copy instance mods/resourcepacks/shaders into MC game directory
    if (instId) {
      const instDir = path.join(mcRoot, 'instances', instId);
      for (const sub of ['mods', 'resourcepacks', 'shaderpacks']) {
        const gameDir = path.join(mcRoot, sub);
        fs.mkdirSync(gameDir, { recursive: true });
        try { for (const f of fs.readdirSync(gameDir)) { try { fs.unlinkSync(path.join(gameDir, f)); } catch(e) {} } } catch(e) {}
        const srcDir = path.join(instDir, sub);
        if (fs.existsSync(srcDir)) {
          for (const f of fs.readdirSync(srcDir)) {
            try { fs.copyFileSync(path.join(srcDir, f), path.join(gameDir, f)); } catch(e) {}
          }
        }
      }
    }

    // Auth
    const mcAccount = store.get('mcAccount');
    let authName, authUuid, authToken;
    if (mcAccount && mcAccount.accessToken) {
      authName = mcAccount.name; authUuid = mcAccount.uuid; authToken = mcAccount.accessToken;
    } else {
      authName = p.name; authUuid = '00000000-0000-0000-0000-000000000000'; authToken = '0';
    }

    // Check if Fabric needed
    let useFabric = false;
    if (instId) {
      const instances = store.get('instances', []);
      const currentInst = instances.find(i => i.id === instId);
      if (currentInst) {
        const hasMods = (currentInst.mods || []).length > 0;
        if (currentInst.loader === 'fabric' || hasMods) {
          useFabric = true;
          if (currentInst.loader === 'vanilla' && hasMods) { currentInst.loader = 'fabric'; store.set('instances', instances); }
        }
      }
    }

    // Step 1: Download vanilla MC via MCLC (assets, libraries, client JAR)
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', { type: 'Minecraft wird heruntergeladen...', task: 0, total: 100 });

    const { Client, Authenticator } = require('minecraft-launcher-core');
    const mclcAuth = mcAccount && mcAccount.accessToken ? {
      access_token: mcAccount.accessToken, client_token: mcAccount.uuid,
      uuid: mcAccount.uuid, name: mcAccount.name, user_properties: '{}'
    } : Authenticator.getAuth(p.name);

    // Use MCLC for vanilla download + vanilla launch
    if (!useFabric) {
      const mclc = new Client();
      let lastLines = [];
      mclc.on('debug', (e) => { console.log('[MC]', e); lastLines.push(String(e)); if(lastLines.length>80) lastLines.shift(); });
      mclc.on('data', (e) => { console.log('[MC]', e); lastLines.push(String(e)); if(lastLines.length>80) lastLines.shift(); });
      mclc.on('error', (e) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-error', String(e)); });
      mclc.on('progress', (e) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', e); });
      mclc.on('close', (code) => {
        if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-error', 'Minecraft beendet (Code ' + code + ')\n\n' + lastLines.slice(-20).join('\n'));
        awardCoins(p.name);
      });
      store.set(`session_start_${p.name}`, Date.now());
      mclc.launch({
        authorization: mclcAuth, root: mcRoot, javaPath,
        version: { number: mcVersion, type: 'release' },
        memory: { max: store.get('settings.ram', '4') + 'G', min: '2G' },
        javaArgs: ['-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled', '-XX:+UnlockExperimentalVMOptions', '-XX:+DisableExplicitGC', '-XX:+AlwaysPreTouch'],
        server: { host: 'chibi.art', port: '25565' },
        overrides: { gameDirectory: mcRoot },
      });
      return { success: true };
    }

    // Step 2 (Fabric): First download vanilla via MCLC, wait for completion
    await new Promise((resolve) => {
      const dl = new Client();
      let vanillaReady = false;
      dl.on('progress', (e) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', e); });
      dl.on('debug', (e) => console.log('[DL]', e));
      dl.on('data', () => { if (!vanillaReady) { vanillaReady = true; } });
      dl.on('close', () => resolve());
      dl.on('error', () => resolve());
      dl.launch({
        authorization: mclcAuth, root: mcRoot, javaPath,
        version: { number: mcVersion, type: 'release' },
        memory: { max: '1G', min: '512M' },
        overrides: { gameDirectory: mcRoot },
      });
    });

    // Verify vanilla files exist
    const vanillaJsonPath = path.join(mcRoot, 'versions', mcVersion, mcVersion + '.json');
    const clientJar = path.join(mcRoot, 'versions', mcVersion, mcVersion + '.jar');
    if (!fs.existsSync(vanillaJsonPath) || !fs.existsSync(clientJar)) {
      return { success: false, error: 'Vanilla Minecraft konnte nicht heruntergeladen werden. Version ' + mcVersion + ' existiert moeglicherweise nicht.' };
    }

    // Step 3: Install Fabric
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', { type: 'Fabric wird installiert...', task: 50, total: 100 });
    const fabricVersionId = await installFabricLoader(mcRoot, mcVersion, javaPath);
    if (!fabricVersionId) {
      return { success: false, error: 'Fabric Loader konnte nicht installiert werden.' };
    }

    // Step 4: Build classpath manually from Fabric + Vanilla version JSONs
    const fabricJsonPath = path.join(mcRoot, 'versions', fabricVersionId, fabricVersionId + '.json');
    if (!fs.existsSync(fabricJsonPath)) {
      return { success: false, error: 'Fabric Version JSON nicht gefunden.' };
    }

    const fabricJson = JSON.parse(fs.readFileSync(fabricJsonPath, 'utf8'));
    const vanillaJson = JSON.parse(fs.readFileSync(vanillaJsonPath, 'utf8'));

    const sep = process.platform === 'win32' ? ';' : ':';
    const libDir = path.join(mcRoot, 'libraries');
    const classpathParts = [];

    // Helper: convert Maven coordinate to file path
    function mavenToPath(name) {
      const parts = name.split(':');
      if (parts.length < 3) return null;
      const [group, artifact, version] = parts;
      return path.join(libDir, group.replace(/\./g, '/'), artifact, version, `${artifact}-${version}.jar`);
    }

    // Add Fabric libraries
    for (const lib of (fabricJson.libraries || [])) {
      if (!lib.name) continue;
      const jarPath = mavenToPath(lib.name);
      if (!jarPath) continue;
      if (fs.existsSync(jarPath)) { classpathParts.push(jarPath); continue; }
      // Download missing Fabric library
      if (lib.url) {
        const parts = lib.name.split(':');
        const [group, artifact, version] = parts;
        const groupPath = group.replace(/\./g, '/');
        const jarName = `${artifact}-${version}.jar`;
        const libUrl = `${lib.url}${groupPath}/${artifact}/${version}/${jarName}`;
        fs.mkdirSync(path.dirname(jarPath), { recursive: true });
        try { await downloadFile(libUrl, jarPath); classpathParts.push(jarPath); console.log('[Fabric] Downloaded:', jarName); }
        catch(e) { console.warn('[Fabric] Missing:', jarName); }
      }
    }

    // Add vanilla libraries
    for (const lib of (vanillaJson.libraries || [])) {
      if (!lib.name) continue;
      if (lib.rules) {
        const osName = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
        const dominated = lib.rules.some(r => r.action === 'allow' && r.os && r.os.name !== osName);
        if (dominated) continue;
      }
      // Use artifact download path if available
      if (lib.downloads && lib.downloads.artifact && lib.downloads.artifact.path) {
        const jarPath = path.join(libDir, lib.downloads.artifact.path);
        if (fs.existsSync(jarPath)) classpathParts.push(jarPath);
      } else {
        const jarPath = mavenToPath(lib.name);
        if (jarPath && fs.existsSync(jarPath)) classpathParts.push(jarPath);
      }
    }

    // Add vanilla client JAR
    classpathParts.push(clientJar);

    const classpath = classpathParts.join(sep);
    const mainClass = fabricJson.mainClass || 'net.fabricmc.loader.impl.launch.knot.KnotClient';
    const assetIndex = vanillaJson.assetIndex ? vanillaJson.assetIndex.id : mcVersion;
    const nativesDir = path.join(mcRoot, 'versions', mcVersion, 'natives');

    // Extract natives if needed
    if (!fs.existsSync(nativesDir)) fs.mkdirSync(nativesDir, { recursive: true });

    const ramMax = store.get('settings.ram', '4') + 'G';
    const javaExe = findJavaExe(javaPath) || javaPath;

    const args = [
      `-Xmx${ramMax}`, '-Xms2G',
      '-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled',
      '-XX:+UnlockExperimentalVMOptions', '-XX:+DisableExplicitGC', '-XX:+AlwaysPreTouch',
      `-Djava.library.path=${nativesDir}`,
      '-Dminecraft.launcher.brand=chibi-launcher',
      '-Dminecraft.launcher.version=1.1.0',
      '-cp', classpath,
      mainClass,
      '--username', authName,
      '--version', fabricVersionId,
      '--gameDir', mcRoot,
      '--assetsDir', path.join(mcRoot, 'assets'),
      '--assetIndex', assetIndex,
      '--uuid', authUuid.replace(/-/g, ''),
      '--accessToken', authToken,
      '--userType', 'msa',
      '--versionType', 'release',
      '--server', 'chibi.art',
      '--port', '25565',
    ];

    console.log('[Launch] Java:', javaExe);
    console.log('[Launch] MainClass:', mainClass);
    console.log('[Launch] Classpath entries:', classpathParts.length);
    console.log('[Launch] Game dir:', mcRoot);

    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', { type: 'Minecraft + Fabric startet...', task: 95, total: 100 });

    const mcProcess = spawn(javaExe, args, { cwd: mcRoot, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let lastLines = [];
    mcProcess.stdout.on('data', (d) => { const l = d.toString(); console.log('[MC]', l.trim()); lastLines.push(l); if(lastLines.length>80) lastLines.shift(); });
    mcProcess.stderr.on('data', (d) => { const l = d.toString(); console.log('[MC ERR]', l.trim()); lastLines.push(l); if(lastLines.length>80) lastLines.shift(); });
    mcProcess.on('error', (e) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-error', 'Start fehlgeschlagen: ' + e.message); });
    mcProcess.on('close', (code) => {
      if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('launch-error', 'Minecraft beendet (Code ' + code + ')\nMainClass: ' + mainClass + '\n\n' + lastLines.slice(-25).join('\n'));
      }
      awardCoins(p.name);
    });

    store.set(`session_start_${p.name}`, Date.now());
    mcProcess.unref();
    return { success: true };
  } catch(e) {
    console.error('[Launch] Error:', e);
    return { success: false, error: e.message || 'Start fehlgeschlagen' };
  }
}

function awardCoins(playerName) {
  const start = store.get(`session_start_${playerName}`);
  if (start) {
    const mins = Math.floor((Date.now() - start) / 60000);
    const earned = mins * COINS_PER_MINUTE;
    const cur = store.get(`coins_${playerName}`, 0);
    store.set(`coins_${playerName}`, cur + earned);
    store.delete(`session_start_${playerName}`);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('coins-updated', { coins: cur + earned, earned, minutes: mins });
  }
}

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

ipcMain.handle('search-modrinth', async (ev, type, query, gameVersion, offset) => {
  try {
    const facets = [['project_type:' + type]];
    if (gameVersion) facets.push(['versions:' + gameVersion]);
    const q = encodeURIComponent(query || '');
    const facetsStr = encodeURIComponent(JSON.stringify(facets));
    const off = offset || 0;
    const url = `/search?query=${q}&facets=${facetsStr}&limit=100&offset=${off}&index=relevance`;
    console.log('[Modrinth] Search:', url);
    const data = await modrinthGet(url);
    console.log('[Modrinth] Results:', data.total_hits || 0);
    return {
      hits: (data.hits || []).map(h => ({
        slug: h.slug,
        title: h.title,
        description: h.description,
        downloads: h.downloads,
        follows: h.follows,
        icon_url: h.icon_url || '',
        author: h.author || '',
        categories: h.categories || [],
      })),
      total: data.total_hits || 0,
      offset: off,
    };
  } catch(e) { console.error('Modrinth search error:', e); return { hits: [], total: 0, offset: 0 }; }
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
