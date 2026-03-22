const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
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
  // ── Neue Capes (10) ──
  { id: 'cape_warden', name: 'Waechter Cape', category: 'capes', price: 7000, description: 'Tiefendunkles Cape des Warden aus dem Deep Dark' },
  { id: 'cape_zeus', name: 'Zeus Cape', category: 'capes', price: 5500, description: 'Blitzdurchzogenes Cape des Goettervaters' },
  { id: 'cape_odin', name: 'Odin Cape', category: 'capes', price: 5500, description: 'Rabengeschmuecktes Cape des Allvaters' },
  { id: 'cape_vulkan', name: 'Vulkan Cape', category: 'capes', price: 4000, description: 'Gluehend rotes Cape mit Lavastroemen' },
  { id: 'cape_aurora', name: 'Nordlicht Cape', category: 'capes', price: 6000, description: 'Schimmerndes Cape in Aurora-Borealis-Farben' },
  { id: 'cape_kawaii', name: 'Kawaii Cape', category: 'capes', price: 1500, description: 'Suesses pastellfarbenes Cape mit Herzen' },
  { id: 'cape_pirat', name: 'Piraten Cape', category: 'capes', price: 2500, description: 'Zerfetztes Cape eines verwegenen Seeraubers' },
  { id: 'cape_mangrove', name: 'Mangroven Cape', category: 'capes', price: 2000, description: 'Naturgewachsenes Cape aus Mangrovenranken' },
  { id: 'cape_ostern', name: 'Oster Cape', category: 'capes', price: 1000, description: 'Fruehlingshaftes Cape mit Ostereiern' },
  { id: 'cape_halloween', name: 'Halloween Cape', category: 'capes', price: 2500, description: 'Gruseliges Cape mit Kuerbissen und Fledermaeuse' },
  // ── Neue Huete (10) ──
  { id: 'hat_warden', name: 'Waechter Helm', category: 'hats', price: 6000, description: 'Sculk-bewachsener Helm des Deep Dark Waechters' },
  { id: 'hat_anubis', name: 'Anubis Maske', category: 'hats', price: 5000, description: 'Goldene Schakalmaske des Totengottes' },
  { id: 'hat_chibi', name: 'Chibi Muetze', category: 'hats', price: 800, description: 'Niedliche Chibi-Art Muetze mit Ohren' },
  { id: 'hat_neon', name: 'Neon Visor', category: 'hats', price: 2000, description: 'Leuchtender Neon-Visor im Cyberpunk-Stil' },
  { id: 'hat_tornado', name: 'Tornado Hut', category: 'hats', price: 3500, description: 'Wirbelnder Hut mit Mini-Tornado darueber' },
  { id: 'hat_kirschbluete', name: 'Kirschblueten Kranz', category: 'hats', price: 1500, description: 'Zarter Kranz aus rosa Kirschblueten' },
  { id: 'hat_schmied', name: 'Schmiedehelm', category: 'hats', price: 2500, description: 'Russgeschwarzter Helm eines Meisterschmieds' },
  { id: 'hat_alchemist', name: 'Alchemisten Hut', category: 'hats', price: 2000, description: 'Spitzer Hut mit brodelnden Traenken' },
  { id: 'hat_weihnachten', name: 'Rentiergeweih', category: 'hats', price: 1200, description: 'Festliches Rentiergeweih fuer die Feiertage' },
  { id: 'hat_pixel', name: 'Pixel Krone', category: 'hats', price: 1800, description: 'Retro-pixelige Krone im 8-Bit-Stil' },
  // ── Neue Fluegel (10) ──
  { id: 'wings_warden', name: 'Sculk Fluegel', category: 'wings', price: 9000, description: 'Dunkle Fluegel aus Sculk des Deep Dark' },
  { id: 'wings_poseidon', name: 'Poseidon Fluegel', category: 'wings', price: 7000, description: 'Meeresblaue Fluegel des Meeresgottes' },
  { id: 'wings_neon', name: 'Neon Fluegel', category: 'wings', price: 5000, description: 'Grellbunte leuchtende Neon-Fluegel' },
  { id: 'wings_vulkan', name: 'Vulkan Fluegel', category: 'wings', price: 8000, description: 'Gluehende Lavafluegel aus dem Vulkankern' },
  { id: 'wings_kirschbluete', name: 'Kirschblueten Fluegel', category: 'wings', price: 4500, description: 'Zarte rosa Fluegel aus Kirschblueten' },
  { id: 'wings_retro', name: 'Pixel Fluegel', category: 'wings', price: 3500, description: 'Verpixelte Retro-Fluegel im 8-Bit-Stil' },
  { id: 'wings_mangrove', name: 'Mangroven Fluegel', category: 'wings', price: 4000, description: 'Naturgewachsene Fluegel aus Mangrovenholz' },
  { id: 'wings_odin', name: 'Raben Fluegel', category: 'wings', price: 8500, description: 'Pechschwarze Fluegel von Odins Raben' },
  { id: 'wings_tsunami', name: 'Tsunami Fluegel', category: 'wings', price: 7500, description: 'Wellenfluegel aus tosender Gischt' },
  { id: 'wings_hades', name: 'Hades Fluegel', category: 'wings', price: 9500, description: 'Fluegel aus Hoellenfeuer und Knochenasche' },
  // ── Neue Auren (10) ──
  { id: 'aura_warden', name: 'Sculk Aura', category: 'auras', price: 5500, description: 'Dunkle Sculk-Sensoren pulsieren um dich' },
  { id: 'aura_zeus', name: 'Zeus Aura', category: 'auras', price: 6000, description: 'Donnernde Blitze zucken um deinen Koerper' },
  { id: 'aura_neon', name: 'Neon Aura', category: 'auras', price: 3000, description: 'Grelle Neonlichter in wechselnden Farben' },
  { id: 'aura_vulkan', name: 'Vulkan Aura', category: 'auras', price: 4500, description: 'Gluehende Asche und Lavabrocken um dich' },
  { id: 'aura_aurora', name: 'Nordlicht Aura', category: 'auras', price: 5000, description: 'Tanzende Nordlichter umgeben dich' },
  { id: 'aura_mangrove', name: 'Mangroven Aura', category: 'auras', price: 2000, description: 'Gruene Ranken und Blaetter wirbeln um dich' },
  { id: 'aura_pixel', name: 'Pixel Aura', category: 'auras', price: 2500, description: 'Verpixelte 8-Bit-Partikel um dich herum' },
  { id: 'aura_hades', name: 'Hades Aura', category: 'auras', price: 7000, description: 'Schwarzes Hoellenfeuer lodert um dich' },
  { id: 'aura_ostern', name: 'Oster Aura', category: 'auras', price: 1200, description: 'Bunte Ostereier und Haeschen um dich herum' },
  { id: 'aura_weihnacht', name: 'Weihnachts Aura', category: 'auras', price: 1500, description: 'Schneeflocken und Geschenkboxen schweben umher' },
  // ── Neue Emotes (10) ──
  { id: 'emote_pirat', name: 'Piraten Tanz', category: 'emotes', price: 800, description: 'Wie ein Pirat ueber das Deck tanzen' },
  { id: 'emote_ritter', name: 'Rittergruss', category: 'emotes', price: 600, description: 'Ehrenhafter Schwertgruss eines Ritters' },
  { id: 'emote_vulkan', name: 'Eruption', category: 'emotes', price: 1500, description: 'Dramatisch wie ein Vulkan explodieren' },
  { id: 'emote_chibi', name: 'Chibi Pose', category: 'emotes', price: 500, description: 'Suesse Chibi-Pose mit grossen Augen' },
  { id: 'emote_meditation', name: 'Meditation', category: 'emotes', price: 700, description: 'Ruhig im Lotussitz schweben und meditieren' },
  { id: 'emote_drachenruf', name: 'Drachenruf', category: 'emotes', price: 1200, description: 'Zum Himmel schreien und einen Drachen rufen' },
  { id: 'emote_schmied', name: 'Haemmern', category: 'emotes', price: 600, description: 'Wie ein Schmied auf einen Amboss haemmern' },
  { id: 'emote_alchemist', name: 'Brauen', category: 'emotes', price: 800, description: 'Geheimnisvolle Traenke zusammenbrauen' },
  { id: 'emote_kawaii', name: 'Kawaii Wink', category: 'emotes', price: 400, description: 'Suesses Zwinkern mit Herzchen-Effekt' },
  { id: 'emote_erdbeben', name: 'Erdbeben Stomp', category: 'emotes', price: 1000, description: 'Auf den Boden stampfen und die Erde beben lassen' },
  // ── Neue Begleiter (10) ──
  { id: 'pet_warden', name: 'Baby Waechter', category: 'pets', price: 15000, description: 'Winziger Sculk-Waechter tapst neben dir her' },
  { id: 'pet_cerberus', name: 'Mini Cerberus', category: 'pets', price: 12000, description: 'Dreikoepfiger Hoellenhund als treuer Begleiter' },
  { id: 'pet_pixie', name: 'Pixel Fee', category: 'pets', price: 4000, description: 'Verpixelte kleine Fee im Retro-Stil' },
  { id: 'pet_mangrove_frosch', name: 'Mangrovenfrosch', category: 'pets', price: 3000, description: 'Gruener Frosch aus dem Mangrovensumpf' },
  { id: 'pet_polarfuchs', name: 'Polarfuchs', category: 'pets', price: 5000, description: 'Flauschiger weisser Fuchs aus dem ewigen Eis' },
  { id: 'pet_magma_schleim', name: 'Magma Wuerfel', category: 'pets', price: 3500, description: 'Kleiner Magmawuerfel der huepft und gluht' },
  { id: 'pet_kirschbluete_geist', name: 'Kirschgeist', category: 'pets', price: 6000, description: 'Sanfter Geist aus dem Kirschbluetenwald' },
  { id: 'pet_mini_golem', name: 'Mini Eisengolem', category: 'pets', price: 8000, description: 'Winziger Eisengolem der dich beschuetzt' },
  { id: 'pet_laterne', name: 'Irrlich', category: 'pets', price: 4500, description: 'Schwebendes Irrlicht das den Weg leuchtet' },
  { id: 'pet_schneefuchs', name: 'Schneefuchs', category: 'pets', price: 5500, description: 'Eisfuchs mit glitzerndem Fell aus Schneekristallen' },
  // ── Neue Spuren (10) ──
  { id: 'trail_sculk', name: 'Sculk Spur', category: 'trails', price: 4000, description: 'Dunkle Sculk-Venen breiten sich hinter dir aus' },
  { id: 'trail_vulkan', name: 'Lava Spur', category: 'trails', price: 3000, description: 'Gluehende Lava fliesst in deinen Fussstapfen' },
  { id: 'trail_neon', name: 'Neon Spur', category: 'trails', price: 2500, description: 'Leuchtende Neonstreifen auf dem Boden' },
  { id: 'trail_kirschbluete', name: 'Kirschblueten Spur', category: 'trails', price: 1800, description: 'Rosa Blueten rieseln auf deinen Pfad' },
  { id: 'trail_pixel', name: 'Pixel Spur', category: 'trails', price: 2000, description: 'Verpixelte Bloecke erscheinen hinter dir' },
  { id: 'trail_aurora', name: 'Nordlicht Spur', category: 'trails', price: 3500, description: 'Schimmerndes Nordlicht auf deinem Weg' },
  { id: 'trail_odin', name: 'Runen Spur', category: 'trails', price: 4000, description: 'Uralte nordische Runen leuchten hinter dir' },
  { id: 'trail_mangrove', name: 'Ranken Spur', category: 'trails', price: 1500, description: 'Gruene Ranken spriessen wo du gehst' },
  { id: 'trail_seelen', name: 'Seelen Spur', category: 'trails', price: 3500, description: 'Blaue Seelenflammen lodern in deinem Pfad' },
  { id: 'trail_weihnacht', name: 'Geschenke Spur', category: 'trails', price: 1500, description: 'Kleine Geschenkpaeckchen erscheinen hinter dir' },
  // ── Neue Partikel (10) ──
  { id: 'particle_warden', name: 'Sculk Puls', category: 'particles', price: 5500, description: 'Pulsierende Sculk-Wellen breiten sich aus' },
  { id: 'particle_zeus', name: 'Goetterblitz', category: 'particles', price: 6000, description: 'Kleine Blitze zucken um deinen Kopf' },
  { id: 'particle_anubis', name: 'Skarabaeus Schwarm', category: 'particles', price: 5000, description: 'Goldene Skarabaeen schwirren um dich' },
  { id: 'particle_vulkan', name: 'Vulkan Asche', category: 'particles', price: 3500, description: 'Heisse Asche und Glut regnen herab' },
  { id: 'particle_pixel', name: 'Pixel Staub', category: 'particles', price: 2000, description: 'Verpixelte 8-Bit-Wuerfel schweben umher' },
  { id: 'particle_aurora', name: 'Nordlicht Schimmer', category: 'particles', price: 4500, description: 'Schimmernde Nordlichtwellen um dich' },
  { id: 'particle_kawaii', name: 'Kawaii Herzen', category: 'particles', price: 1500, description: 'Suesse pastellfarbene Herzen und Sterne' },
  { id: 'particle_tsunami', name: 'Wassertropfen', category: 'particles', price: 3000, description: 'Salzige Meeresgischt spritzt um dich' },
  { id: 'particle_halloween', name: 'Geisterfunken', category: 'particles', price: 2500, description: 'Gruselige Geister und Kuerbislichter' },
  { id: 'particle_ostern', name: 'Oster Konfetti', category: 'particles', price: 1200, description: 'Buntes Konfetti und kleine Kueken tanzen' },
  // ── Neue Accessoires (20) ──
  { id: 'acc_warden_helm', name: 'Sculk Visier', category: 'accessories', price: 6000, description: 'Dunkles Visier mit pulsierenden Sculk-Adern' },
  { id: 'acc_zeus_kette', name: 'Blitz Amulett', category: 'accessories', price: 5000, description: 'Goldenes Amulett mit eingefangenem Blitz' },
  { id: 'acc_odin_auge', name: 'Odins Auge', category: 'accessories', price: 7000, description: 'Mystisches allsehendes Auge auf der Stirn' },
  { id: 'acc_piraten_augenklappe', name: 'Piraten Augenklappe', category: 'accessories', price: 800, description: 'Verwegene Augenklappe eines Piratenkapitaens' },
  { id: 'acc_neon_brille', name: 'Neon Brille', category: 'accessories', price: 2000, description: 'Leuchtende Brille in Neonfarben' },
  { id: 'acc_pixel_schwert', name: 'Pixel Schwert', category: 'accessories', price: 2500, description: 'Verpixeltes 8-Bit-Schwert auf dem Ruecken' },
  { id: 'acc_vulkan_guertel', name: 'Magma Guertel', category: 'accessories', price: 4000, description: 'Gluehender Guertel aus geschmolzenem Gestein' },
  { id: 'acc_kirschbluete_haarband', name: 'Kirschblueten Band', category: 'accessories', price: 1500, description: 'Zartes Haarband mit rosa Kirschblueten' },
  { id: 'acc_ritter_schulter', name: 'Ritter Schulterschutz', category: 'accessories', price: 3500, description: 'Glaenzende Ritterschultern mit Wappen' },
  { id: 'acc_alchemist_guertel', name: 'Traenkeguertel', category: 'accessories', price: 2500, description: 'Guertel voller bunter Alchemistenflaeschen' },
  { id: 'acc_jaeger_kocher', name: 'Jaeger Koecher', category: 'accessories', price: 2000, description: 'Lederkocher mit Pfeilen auf dem Ruecken' },
  { id: 'acc_schatten_umhang', name: 'Schatten Umhang', category: 'accessories', price: 5000, description: 'Unsichtbarer Umhang der Schattenburg' },
  { id: 'acc_sonnen_schild', name: 'Sonnen Schild', category: 'accessories', price: 5000, description: 'Goldener Rundschild der SonnensBurg am Ruecken' },
  { id: 'acc_licht_laterne', name: 'Helichkeits Laterne', category: 'accessories', price: 5000, description: 'Strahlende Laterne der HelichkeitsBurg' },
  { id: 'acc_mangrove_ranke', name: 'Mangroven Ranke', category: 'accessories', price: 1800, description: 'Lebende Ranke die sich um den Arm windet' },
  { id: 'acc_creeper_rucksack', name: 'Creeper Rucksack', category: 'accessories', price: 2000, description: 'Gruener Rucksack in Creeper-Gesicht-Form' },
  { id: 'acc_retro_kopfhoerer', name: 'Retro Kopfhoerer', category: 'accessories', price: 1500, description: 'Grosse Kopfhoerer im Retro-80er-Stil' },
  { id: 'acc_kawaii_schleife', name: 'Kawaii Schleife', category: 'accessories', price: 800, description: 'Suesse grosse rosa Haarschleife' },
  { id: 'acc_weihnacht_schal', name: 'Weihnachts Schal', category: 'accessories', price: 1200, description: 'Rot-weiss gestreifter Weihnachtsschal' },
  { id: 'acc_halloween_kuerbis', name: 'Kuerbis Laterne', category: 'accessories', price: 1500, description: 'Leuchtende Kuerbislaterne am Guertel' },
  // ══════════════════════════════════════════════════
  // ══ 5 NEUE KATEGORIEN ══
  // ══════════════════════════════════════════════════
  // ── Masken (25) ──
  { id: 'mask_fuchs', name: 'Fuchs Maske', category: 'masks', price: 2000, description: 'Orangerote Maske eines schlauen Fuchses' },
  { id: 'mask_wolf', name: 'Wolf Maske', category: 'masks', price: 2500, description: 'Graue Maske eines wilden Wolfes' },
  { id: 'mask_drache', name: 'Drachen Maske', category: 'masks', price: 6000, description: 'Schuppige Maske eines feuerspeienden Drachen' },
  { id: 'mask_oni', name: 'Oni Maske', category: 'masks', price: 5000, description: 'Rote japanische Daemonenmaske mit Hoernern' },
  { id: 'mask_phantom', name: 'Phantom Maske', category: 'masks', price: 4000, description: 'Geisterhafte transparente Maske des Phantoms' },
  { id: 'mask_creeper', name: 'Creeper Maske', category: 'masks', price: 1500, description: 'Gruene Maske mit dem Creeper-Gesicht' },
  { id: 'mask_warden', name: 'Waechter Maske', category: 'masks', price: 8000, description: 'Dunkle Sculk-Maske des Deep Dark Waechters' },
  { id: 'mask_enderman', name: 'Enderman Maske', category: 'masks', price: 3500, description: 'Schwarze Maske mit violett leuchtenden Augen' },
  { id: 'mask_anubis', name: 'Anubis Maske', category: 'masks', price: 7000, description: 'Goldene Schakalmaske des aegyptischen Totengottes' },
  { id: 'mask_kitsune', name: 'Kitsune Maske', category: 'masks', price: 5500, description: 'Weisse japanische Fuchsmaske mit roten Akzenten' },
  { id: 'mask_totenkopf', name: 'Totenkopf Maske', category: 'masks', price: 3000, description: 'Gruselige Schaedelmaske aus bleichem Knochen' },
  { id: 'mask_samurai', name: 'Samurai Maske', category: 'masks', price: 4500, description: 'Eiserne Menpo-Maske eines Samurai-Kriegers' },
  { id: 'mask_hades', name: 'Hades Maske', category: 'masks', price: 8000, description: 'Lodernde Maske des Herrschers der Unterwelt' },
  { id: 'mask_poseidon', name: 'Poseidon Maske', category: 'masks', price: 6500, description: 'Meeresblaue Maske des Meeresgottes mit Muscheln' },
  { id: 'mask_neon', name: 'Neon Maske', category: 'masks', price: 3000, description: 'Leuchtende Cyberpunk-Maske in Neonfarben' },
  { id: 'mask_pixel', name: 'Pixel Maske', category: 'masks', price: 2000, description: 'Verpixelte Retro-Maske im 8-Bit-Stil' },
  { id: 'mask_schatten', name: 'Schattenmaske', category: 'masks', price: 5000, description: 'Dunkle Maske der Schattenburg die Licht verschluckt' },
  { id: 'mask_licht', name: 'Lichtmaske', category: 'masks', price: 5000, description: 'Strahlende Maske der HelichkeitsBurg' },
  { id: 'mask_sonnen', name: 'Sonnenmaske', category: 'masks', price: 5000, description: 'Goldene Maske der SonnensBurg mit Strahlen' },
  { id: 'mask_halloween', name: 'Kuerbis Maske', category: 'masks', price: 2000, description: 'Ausgehoehlte Kuerbismaske mit gluehendem Grinsen' },
  { id: 'mask_venezianisch', name: 'Venezianische Maske', category: 'masks', price: 3500, description: 'Elegante goldverzierte venezianische Maske' },
  { id: 'mask_tiger', name: 'Tiger Maske', category: 'masks', price: 3000, description: 'Gestreifte Maske eines majesteatischen Tigers' },
  { id: 'mask_eule', name: 'Eulen Maske', category: 'masks', price: 2500, description: 'Gefiederte Maske einer weisen Eule' },
  { id: 'mask_wither', name: 'Wither Maske', category: 'masks', price: 7000, description: 'Dreigesichtige Maske des furchtbaren Withers' },
  { id: 'mask_chibi', name: 'Chibi Katzenmaske', category: 'masks', price: 1500, description: 'Suesse kawaii Katzenmaske im Chibi-Stil' },
  // ── Reittiere (25) ──
  { id: 'mount_pferd', name: 'Geisterpferd', category: 'mounts', price: 5000, description: 'Transparentes Geisterpferd mit leuchtenden Augen' },
  { id: 'mount_drache', name: 'Feuerdrache', category: 'mounts', price: 20000, description: 'Maechtiger Feuerdrache als Reittier' },
  { id: 'mount_einhorn', name: 'Einhorn', category: 'mounts', price: 15000, description: 'Magisches Einhorn mit Regenbogenschweif' },
  { id: 'mount_wither', name: 'Wither Reittier', category: 'mounts', price: 18000, description: 'Gezaehmter Mini-Wither zum Reiten' },
  { id: 'mount_phoenix', name: 'Phoenix', category: 'mounts', price: 17000, description: 'Brennender Phoenix der dich durch die Luefte traegt' },
  { id: 'mount_wolf', name: 'Riesenwolf', category: 'mounts', price: 8000, description: 'Riesiger Wolf als treues Reittier' },
  { id: 'mount_baer', name: 'Kampfbaer', category: 'mounts', price: 10000, description: 'Gepanzerter Kampfbaer mit Ruestzung' },
  { id: 'mount_spinne', name: 'Riesenspinne', category: 'mounts', price: 7000, description: 'Riesige Hoehlenspinne die Waende erklimmt' },
  { id: 'mount_strider', name: 'Lava Strider', category: 'mounts', price: 6000, description: 'Lava-Strider der ueber Lava gleitet' },
  { id: 'mount_schildkroete', name: 'Riesenschildkroete', category: 'mounts', price: 9000, description: 'Gemuetliche Riesenschildkroete fuer lange Reisen' },
  { id: 'mount_greif', name: 'Greif', category: 'mounts', price: 16000, description: 'Majesteatischer Greif mit Adlerkopf und Loewenkoerper' },
  { id: 'mount_cerberus', name: 'Cerberus', category: 'mounts', price: 19000, description: 'Dreikoepfiger Hoellenhund aus der Unterwelt' },
  { id: 'mount_pegasus', name: 'Pegasus', category: 'mounts', price: 14000, description: 'Geflugeltes weisses Pferd aus der Mythologie' },
  { id: 'mount_eisbaer', name: 'Eisbaer', category: 'mounts', price: 8000, description: 'Flauschiger Eisbaer der durch den Schnee trabt' },
  { id: 'mount_panther', name: 'Schattenpanther', category: 'mounts', price: 12000, description: 'Nachtschwarzer Panther der Schattenburg' },
  { id: 'mount_loewe', name: 'Goldener Loewe', category: 'mounts', price: 12000, description: 'Majestaetischer Loewe der SonnensBurg' },
  { id: 'mount_hirsch', name: 'Lichthirsch', category: 'mounts', price: 12000, description: 'Leuchtender Hirsch der HelichkeitsBurg' },
  { id: 'mount_neon_motorrad', name: 'Neon Motorrad', category: 'mounts', price: 10000, description: 'Leuchtendes Neon-Motorrad im Cyberpunk-Stil' },
  { id: 'mount_magma_wuerfel', name: 'Magma Golem', category: 'mounts', price: 13000, description: 'Riesiger Magmawuerfel als gluhendes Reittier' },
  { id: 'mount_skelett_pferd', name: 'Skelett Pferd', category: 'mounts', price: 7000, description: 'Geisterhaftes Knochenpferd aus dem Gewittersturm' },
  { id: 'mount_ravager', name: 'Verwuester', category: 'mounts', price: 15000, description: 'Gezaehmter Ravager als maechtiges Reittier' },
  { id: 'mount_frosch', name: 'Riesenfrosch', category: 'mounts', price: 6000, description: 'Riesiger Frosch der gewaltige Spruenge macht' },
  { id: 'mount_endermite', name: 'Ender Wurm', category: 'mounts', price: 8000, description: 'Riesige Endermite die durch Dimensionen reist' },
  { id: 'mount_hai', name: 'Geisterhai', category: 'mounts', price: 11000, description: 'Schwebender Geisterhai der durch die Luft gleitet' },
  { id: 'mount_weihnachts_schlitten', name: 'Rentierschlitten', category: 'mounts', price: 8000, description: 'Festlicher Schlitten mit Rentier fuer die Feiertage' },
  // ── Banner (20) ──
  { id: 'banner_schatten', name: 'Schattenburg Banner', category: 'banners', price: 3000, description: 'Dunkles wehrendes Banner der Schattenburg' },
  { id: 'banner_licht', name: 'HelichkeitsBurg Banner', category: 'banners', price: 3000, description: 'Strahlendes Banner der HelichkeitsBurg' },
  { id: 'banner_sonne', name: 'SonnensBurg Banner', category: 'banners', price: 3000, description: 'Goldenes Banner der SonnensBurg' },
  { id: 'banner_drache', name: 'Drachen Banner', category: 'banners', price: 5000, description: 'Rotes Banner mit goldenem Drachenwappen' },
  { id: 'banner_totenkopf', name: 'Piraten Banner', category: 'banners', price: 3500, description: 'Schwarzes Banner mit Totenkopf und Knochen' },
  { id: 'banner_phoenix', name: 'Phoenix Banner', category: 'banners', price: 6000, description: 'Orangerotes Banner mit flammendem Phoenix' },
  { id: 'banner_wolf', name: 'Wolfsrudel Banner', category: 'banners', price: 4000, description: 'Graues Banner mit heulendem Wolf' },
  { id: 'banner_ritter', name: 'Ritter Banner', category: 'banners', price: 4500, description: 'Heraldisches Banner mit Ritterwappen' },
  { id: 'banner_creeper', name: 'Creeper Banner', category: 'banners', price: 2500, description: 'Gruenes Banner mit dem Creeper-Gesicht' },
  { id: 'banner_ender', name: 'Ender Banner', category: 'banners', price: 5000, description: 'Violettes Banner mit Enderdrachen-Symbol' },
  { id: 'banner_neon', name: 'Neon Banner', category: 'banners', price: 3000, description: 'Leuchtendes Banner in wechselnden Neonfarben' },
  { id: 'banner_pixel', name: 'Pixel Banner', category: 'banners', price: 2000, description: 'Verpixeltes Retro-Banner im 8-Bit-Stil' },
  { id: 'banner_zeus', name: 'Olymp Banner', category: 'banners', price: 5500, description: 'Weissgoldenes Banner mit Blitz des Zeus' },
  { id: 'banner_odin', name: 'Walhalla Banner', category: 'banners', price: 5500, description: 'Nordisches Banner mit Odins Raben' },
  { id: 'banner_vulkan', name: 'Vulkan Banner', category: 'banners', price: 4000, description: 'Rotes Banner mit explodierendem Vulkan' },
  { id: 'banner_kirschbluete', name: 'Kirschblueten Banner', category: 'banners', price: 2500, description: 'Rosa Banner mit fallenden Kirschblueten' },
  { id: 'banner_weihnacht', name: 'Weihnachts Banner', category: 'banners', price: 2000, description: 'Festliches rotes Banner mit Weihnachtsstern' },
  { id: 'banner_halloween', name: 'Halloween Banner', category: 'banners', price: 2500, description: 'Gruseliges Banner mit Kuerbis und Spinnen' },
  { id: 'banner_jaeger', name: 'Jaeger Banner', category: 'banners', price: 3500, description: 'Gruenes Banner mit gekreuzten Pfeilen' },
  { id: 'banner_alchemist', name: 'Alchemisten Banner', category: 'banners', price: 3500, description: 'Mystisches Banner mit Traenken und Symbolen' },
  // ── Sounds (20) ──
  { id: 'sound_donner', name: 'Donnerschritt', category: 'sounds', price: 2000, description: 'Donnerndes Grollen bei jedem Schritt' },
  { id: 'sound_glocke', name: 'Glockenschlag', category: 'sounds', price: 1000, description: 'Sanftes Glockenlauten beim Laufen' },
  { id: 'sound_ketten', name: 'Kettenrasseln', category: 'sounds', price: 1500, description: 'Rasselnde Ketten bei jeder Bewegung' },
  { id: 'sound_feuer', name: 'Flammenknistern', category: 'sounds', price: 1800, description: 'Prasselndes Feuer beim Kaempfen' },
  { id: 'sound_eis', name: 'Eisknirschen', category: 'sounds', price: 1800, description: 'Knirschendes Eis unter deinen Fuessen' },
  { id: 'sound_noten', name: 'Melodieschritte', category: 'sounds', price: 1200, description: 'Jeder Schritt spielt eine Musiknote' },
  { id: 'sound_creeper', name: 'Creeper Zischen', category: 'sounds', price: 1500, description: 'Bedrohliches Zischen beim Zuschlagen' },
  { id: 'sound_enderman', name: 'Enderman Fluestern', category: 'sounds', price: 2500, description: 'Unheimliches Fluestern aus dem Ende' },
  { id: 'sound_amboss', name: 'Amboss Schlag', category: 'sounds', price: 2000, description: 'Metallisches Haemmern beim Kaempfen' },
  { id: 'sound_harfe', name: 'Harfenklang', category: 'sounds', price: 1000, description: 'Sanfte Harfentoene beim Laufen' },
  { id: 'sound_warden', name: 'Sculk Herzschlag', category: 'sounds', price: 3000, description: 'Pulsierender Herzschlag des Deep Dark' },
  { id: 'sound_drache', name: 'Drachenbruellen', category: 'sounds', price: 3500, description: 'Tosendes Drachenbruellen beim Kaempfen' },
  { id: 'sound_pixel', name: 'Retro Sounds', category: 'sounds', price: 1500, description: '8-Bit-Pieptoene und Retro-Soundeffekte' },
  { id: 'sound_wind', name: 'Sturmwind', category: 'sounds', price: 1200, description: 'Heulender Wind bei jeder Bewegung' },
  { id: 'sound_wasser', name: 'Wellenrauschen', category: 'sounds', price: 1000, description: 'Sanftes Meeresrauschen beim Laufen' },
  { id: 'sound_schatten', name: 'Schattenfluestern', category: 'sounds', price: 2500, description: 'Dunkles Fluestern der Schattenburg' },
  { id: 'sound_licht', name: 'Lichtglocken', category: 'sounds', price: 2500, description: 'Helle Glockentoene der HelichkeitsBurg' },
  { id: 'sound_sonne', name: 'Sonnenfanfare', category: 'sounds', price: 2500, description: 'Goldene Fanfare der SonnensBurg beim Treffer' },
  { id: 'sound_weihnacht', name: 'Gloekchenspiel', category: 'sounds', price: 800, description: 'Festliches Weihnachtsgloeckchenspiel' },
  { id: 'sound_halloween', name: 'Geisterheulen', category: 'sounds', price: 1500, description: 'Gruseliges Heulen und Kettenrasseln' },
  // ── Titel (20) ──
  { id: 'title_ritter', name: 'Ritter', category: 'titles', price: 2000, description: 'Ehrenvoller Titel eines tapferen Ritters' },
  { id: 'title_koenig', name: 'Koenig', category: 'titles', price: 10000, description: 'Majestaetischer Titel eines wahren Koenigs' },
  { id: 'title_meister', name: 'Meister', category: 'titles', price: 5000, description: 'Respektvoller Titel eines erfahrenen Meisters' },
  { id: 'title_legende', name: 'Legende', category: 'titles', price: 15000, description: 'Legendaerer Titel fuer die Groessten der Grossen' },
  { id: 'title_held', name: 'Held', category: 'titles', price: 3000, description: 'Tapferer Titel eines wahren Helden' },
  { id: 'title_schatten', name: 'Schattenklinge', category: 'titles', price: 5000, description: 'Mysterioeser Titel der Schattenburg-Elite' },
  { id: 'title_licht', name: 'Lichtbringer', category: 'titles', price: 5000, description: 'Strahlender Titel der HelichkeitsBurg-Waechter' },
  { id: 'title_sonne', name: 'Sonnenkrieger', category: 'titles', price: 5000, description: 'Goldener Titel der SonnensBurg-Kaempfer' },
  { id: 'title_jaeger', name: 'Jaeger', category: 'titles', price: 2500, description: 'Scharfsinniger Titel eines erfahrenen Jaegers' },
  { id: 'title_schmied', name: 'Schmied', category: 'titles', price: 2500, description: 'Ehrenwerter Titel eines Meisterschmieds' },
  { id: 'title_alchemist', name: 'Alchemist', category: 'titles', price: 3000, description: 'Geheimnisvoller Titel eines Traenkebrauers' },
  { id: 'title_pirat', name: 'Pirat', category: 'titles', price: 3000, description: 'Verwegener Titel eines Seeraubers' },
  { id: 'title_ninja', name: 'Ninja', category: 'titles', price: 4000, description: 'Lautloser Titel eines Schattenkriegers' },
  { id: 'title_samurai', name: 'Samurai', category: 'titles', price: 4000, description: 'Ehrenhafter Titel eines Samurai-Meisters' },
  { id: 'title_druide', name: 'Druide', category: 'titles', price: 3500, description: 'Naturverbundener Titel eines weisen Druiden' },
  { id: 'title_kaiser', name: 'Kaiser', category: 'titles', price: 20000, description: 'Hoechster Titel des Herrschers aller Koenigreiche' },
  { id: 'title_warden', name: 'Waechter', category: 'titles', price: 7000, description: 'Furchteinflossender Titel des Sculk-Waechters' },
  { id: 'title_phoenix', name: 'Wiedergeborener', category: 'titles', price: 8000, description: 'Unsterblicher Titel des Phoenix-Auserwaehlten' },
  { id: 'title_chibi', name: 'Chibi Meister', category: 'titles', price: 1000, description: 'Niedlicher Titel fuer wahre Chibi-Art Fans' },
  { id: 'title_anfaenger', name: 'Abenteurer', category: 'titles', price: 500, description: 'Erster Titel fuer jeden angehenden Abenteurer' },
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

  // IPC: open URL in browser
  ipcMain.handle('open-external', (ev, url) => {
    shell.openExternal(url);
    return true;
  });

  // Open instance folder (mods, resourcepacks, shaders)
  ipcMain.handle('open-instance-folder', (ev, instId, subdir) => {
    const dir = path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', instId, subdir || 'mods');
    fs.mkdirSync(dir, { recursive: true });
    shell.openPath(dir);
    return true;
  });

  // Scan instance folder for manually added files
  ipcMain.handle('scan-instance-mods', (ev, instId) => {
    const instances = store.get('instances', []);
    const inst = instances.find(i => i.id === instId);
    if (!inst) return [];

    const modsDir = path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', instId, 'mods');
    if (!fs.existsSync(modsDir)) return [];

    const filesOnDisk = fs.readdirSync(modsDir).filter(f => f.endsWith('.jar'));
    const tracked = (inst.mods || []).map(m => m.file);
    let changed = false;

    // Add untracked JARs to instance data
    for (const file of filesOnDisk) {
      if (!tracked.includes(file)) {
        if (!inst.mods) inst.mods = [];
        inst.mods.push({ name: file.replace('.jar', ''), file, title: file.replace('.jar', '').replace(/-/g, ' '), icon: '' });
        changed = true;
        console.log('[Instance] Found manually added mod:', file);
      }
    }

    if (changed) store.set('instances', instances);
    return inst.mods || [];
  });

  // ── Modrinth-Style Auto-Update ──
  ipcMain.handle('check-update', async () => {
    try {
      const currentVersion = app.getVersion();
      const https = require('https');
      const release = await new Promise((resolve, reject) => {
        https.get('https://api.github.com/repos/deanischarf-max/chibi-launcher/releases/latest', {
          headers: { 'User-Agent': 'ChibiLauncher', Accept: 'application/vnd.github+json' }
        }, res => {
          let d = ''; res.on('data', c => d += c);
          res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
        }).on('error', reject);
      });
      const latest = (release.tag_name || '').replace(/^v/, '');
      if (!latest) return { update: false, current: currentVersion, error: 'Kein Release gefunden' };
      const cur = currentVersion.split('.').map(Number);
      const lat = latest.split('.').map(Number);
      let isNewer = false;
      for (let i = 0; i < 3; i++) {
        if ((lat[i]||0) > (cur[i]||0)) { isNewer = true; break; }
        if ((lat[i]||0) < (cur[i]||0)) break;
      }
      const exe = (release.assets||[]).find(a => a.name.endsWith('.exe'));
      const appImage = (release.assets||[]).find(a => a.name.endsWith('.AppImage'));
      const asset = process.platform === 'win32' ? exe : appImage;
      return { update: isNewer, current: currentVersion, latest, url: asset ? asset.browser_download_url : null, page: release.html_url };
    } catch(e) {
      return { update: false, current: app.getVersion(), error: e.message };
    }
  });

  ipcMain.handle('download-update', async (ev, url) => {
    try {
      const tmpPath = path.join(app.getPath('temp'), 'ChibiLauncher-Update.exe');
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-dl-progress', 0);
      await new Promise((resolve, reject) => {
        const https = require('https');
        const doReq = (u) => {
          https.get(u, { headers: { 'User-Agent': 'ChibiLauncher' } }, res => {
            if (res.statusCode === 301 || res.statusCode === 302) { res.resume(); doReq(res.headers.location); return; }
            const total = parseInt(res.headers['content-length'] || '0');
            let downloaded = 0;
            const file = fs.createWriteStream(tmpPath);
            res.on('data', chunk => {
              downloaded += chunk.length;
              file.write(chunk);
              if (total > 0 && mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('update-dl-progress', Math.round((downloaded / total) * 100));
              }
            });
            res.on('end', () => { file.end(); resolve(); });
            res.on('error', reject);
          }).on('error', reject);
        };
        doReq(url);
      });
      // Launch installer and quit
      const { exec } = require('child_process');
      exec(`"${tmpPath}"`, { detached: true, stdio: 'ignore' });
      setTimeout(() => app.quit(), 1000);
      return { success: true };
    } catch(e) {
      return { success: false, error: e.message };
    }
  });
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

// ── Cosmetics Mods Auto-Install (Modrinth) ──
const COSMETICS_MODS = [
  { slug: 'cosmetica', title: 'Cosmetica', name: 'cosmetica' },
  { slug: 'ears', title: 'Ears', name: 'ears' },
  { slug: 'capes', title: 'Capes', name: 'capes' },
  { slug: 'skinlayers3d', title: '3D Skin Layers', name: 'skinlayers3d' },
];

async function ensureCosmeticsMod(instId) {
  try {
    const instances = store.get('instances', []);
    const inst = instances.find(i => i.id === instId);
    if (!inst) return;
    const mcVersion = inst.version;
    if (!mcVersion) return;
    const modsDir = path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', instId, 'mods');
    fs.mkdirSync(modsDir, { recursive: true });
    if (!inst.mods) inst.mods = [];
    let changed = false;

    // ChibiCosmetics client mod deaktiviert - Cosmetics laufen jetzt server-seitig
    // Alte JAR entfernen falls vorhanden
    const oldJar = path.join(modsDir, 'ChibiCosmetics-1.0.0.jar');
    if (fs.existsSync(oldJar)) { try { fs.unlinkSync(oldJar); } catch(e) {} }
    inst.mods = inst.mods.filter(m => m.name !== 'chibi-cosmetics');

    for (const cosmMod of COSMETICS_MODS) {
      // Skip if already installed
      if (inst.mods.some(m => m.name === cosmMod.name && m.system)) continue;

      try {
        console.log(`[Cosmetics] Fetching ${cosmMod.title} for MC ${mcVersion}...`);
        const versions = await modrinthGet(`/project/${cosmMod.slug}/version?game_versions=["${mcVersion}"]&loaders=["fabric"]`);
        if (!versions || !versions.length) {
          console.warn(`[Cosmetics] No compatible version of ${cosmMod.title} for MC ${mcVersion}`);
          continue;
        }
        const ver = versions[0];
        const primaryFile = ver.files.find(f => f.primary) || ver.files[0];
        if (!primaryFile) continue;

        const fileName = primaryFile.filename;
        const modPath = path.join(modsDir, fileName);
        if (!fs.existsSync(modPath)) {
          console.log(`[Cosmetics] Downloading ${cosmMod.title}: ${fileName}...`);
          await downloadFile(primaryFile.url, modPath);
          console.log(`[Cosmetics] Installed: ${modPath}`);
        }

        inst.mods.push({ name: cosmMod.name, file: fileName, title: cosmMod.title, icon: '', system: true });
        changed = true;
      } catch(e) {
        console.warn(`[Cosmetics] Failed to install ${cosmMod.title}:`, e.message);
      }
    }

    if (changed) {
      store.set('instances', instances);
    }
  } catch(e) {
    console.warn('[Cosmetics] Auto-install failed:', e.message);
  }
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

    // Fetch project info for title and icon
    let projectTitle = slug;
    let projectIcon = '';
    try {
      const projectInfo = await modrinthGet(`/project/${slug}`);
      if (projectInfo) {
        projectTitle = projectInfo.title || slug;
        projectIcon = projectInfo.icon_url || '';
      }
    } catch(e) { console.warn('[Modrinth] Could not fetch project info for', slug); }

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
      inst[list].push({ name: slug, file: file.filename, title: projectTitle, icon: projectIcon });
    }

    // Auto-install required dependencies (e.g. Iris needs Sodium)
    if (type === 'mod' && latest.dependencies) {
      const modsDir = path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', instId, 'mods');
      fs.mkdirSync(modsDir, { recursive: true });
      for (const dep of latest.dependencies) {
        if (dep.dependency_type !== 'required' || !dep.project_id) continue;
        try {
          const depProj = await modrinthGet(`/project/${dep.project_id}`);
          const depSlug = depProj.slug || dep.project_id;
          const depTitle = depProj.title || depSlug;
          const depIcon = depProj.icon_url || '';
          // Check if already installed
          const alreadyHas = (inst.mods || []).some(m =>
            m.name === depSlug || m.name === dep.project_id ||
            (m.file && m.file.toLowerCase().includes(depSlug.toLowerCase()))
          );
          if (alreadyHas) continue;
          console.log('[Instance] Auto-installing dependency:', depTitle);
          let depVersions = await modrinthGet(`/project/${dep.project_id}/version?game_versions=["${inst.version}"]&loaders=["fabric"]`);
          if (!depVersions || depVersions.length === 0) depVersions = await modrinthGet(`/project/${dep.project_id}/version?loaders=["fabric"]`);
          if (!depVersions || depVersions.length === 0) depVersions = await modrinthGet(`/project/${dep.project_id}/version`);
          if (depVersions && depVersions.length > 0) {
            const depFile = (depVersions[0].files.find(f => f.primary)) || depVersions[0].files[0];
            if (depFile && !inst.mods.some(m => m.file === depFile.filename)) {
              await downloadFile(depFile.url, path.join(modsDir, depFile.filename));
              inst.mods.push({ name: depSlug, file: depFile.filename, title: depTitle, icon: depIcon });
              console.log('[Instance] Installed:', depTitle, depFile.filename);
            }
          }
        } catch(e) { console.warn('[Instance] Dep failed:', dep.project_id, e.message); }
      }
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
              inst.mods.push({ name: 'fabric-api', file: apiFile.filename, title: 'Fabric API', icon: '' });
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
  // Block deletion of system mods
  if (type === 'mod') {
    const mod = (inst.mods || []).find(m => m.file === filename);
    if (mod && mod.system) return { success: false, error: 'System-Mod kann nicht entfernt werden' };
  }
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
  try {
    // Find Java
    const customJava = store.get('settings.javaPath', '');
    let javaPath = (customJava && fs.existsSync(customJava)) ? customJava : findJava();
    if (!javaPath) {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', { type: 'Java wird heruntergeladen...', task: 0, total: 100 });
      try { javaPath = await downloadJava(); } catch(e) {
        return { success: false, error: 'Java nicht gefunden! Bitte installiere Java 21.' };
      }
    }

    const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft');
    const { Client, Authenticator } = require('minecraft-launcher-core');
    const launcher = new Client();

    // Auto-install Cosmetics Mod (unsichtbar)
    if (instId) { await ensureCosmeticsMod(instId); }

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
    const auth = mcAccount && mcAccount.accessToken ? {
      access_token: mcAccount.accessToken, client_token: mcAccount.uuid,
      uuid: mcAccount.uuid, name: mcAccount.name, user_properties: '{}'
    } : Authenticator.getAuth(p.name);

    // Check if Fabric needed
    let useFabric = false;
    if (instId) {
      const instances = store.get('instances', []);
      const currentInst = instances.find(i => i.id === instId);
      if (currentInst) {
        const hasMods = (currentInst.mods || []).filter(m => !m.system).length > 0;
        if (currentInst.loader === 'fabric' || hasMods) {
          useFabric = true;
          if (currentInst.loader === 'vanilla' && hasMods) { currentInst.loader = 'fabric'; store.set('instances', instances); }
        }
      }
    }

    // Install Fabric if needed
    let versionConfig = { number: mcVersion, type: 'release' };
    if (useFabric) {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', { type: 'Fabric wird installiert...', task: 0, total: 100 });
      const fabricVersionId = await installFabricLoader(mcRoot, mcVersion, javaPath);
      if (fabricVersionId) {
        versionConfig = { number: mcVersion, type: 'release', custom: fabricVersionId };
        console.log('[Launch] Using Fabric:', fabricVersionId);
      }
    }

    // Launch with MCLC (handles natives, classpath, assets, everything)
    const opts = {
      authorization: auth,
      root: mcRoot,
      javaPath: javaPath,
      version: versionConfig,
      memory: { max: store.get('settings.ram', '4') + 'G', min: '2G' },
      javaArgs: ['-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled', '-XX:+UnlockExperimentalVMOptions', '-XX:+DisableExplicitGC', '-XX:+AlwaysPreTouch'],
      server: { host: 'chibi.art', port: '25565' },
      overrides: { gameDirectory: mcRoot },
    };

    let lastLines = [];
    launcher.on('debug', (e) => { console.log('[MC]', e); lastLines.push(String(e)); if(lastLines.length>80) lastLines.shift(); });
    launcher.on('data', (e) => { console.log('[MC]', e); lastLines.push(String(e)); if(lastLines.length>80) lastLines.shift(); });
    launcher.on('error', (e) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-error', String(e)); });
    launcher.on('progress', (e) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-progress', e); });
    launcher.on('close', (code) => {
      if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('launch-error', 'Minecraft beendet (Code ' + code + ')\n\n' + lastLines.slice(-20).join('\n'));
      awardCoins(p.name);
    });

    store.set(`session_start_${p.name}`, Date.now());
    launcher.launch(opts);
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
  // Save to .chibi-minecraft so the Fabric mod can read it
  saveCosmeticsForMod(p.name, eq);
  // Sync to cloud so other players can see your cosmetics
  syncCosmeticsToCloud(p.name, eq);
  return { success: true, equipped: eq };
});

// ── Save cosmetics to .chibi-minecraft for Fabric mod ──
function saveCosmeticsForMod(playerName, equipped) {
  try {
    const mcRoot = path.join(app.getPath('appData'), '.chibi-minecraft');
    fs.mkdirSync(mcRoot, { recursive: true });
    const filePath = path.join(mcRoot, 'chibi-cosmetics.json');
    // Remove if it's accidentally a directory
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) { fs.rmSync(filePath, { recursive: true }); }
    } catch(e) {}
    const data = { player: playerName, equipped: equipped, timestamp: Date.now() };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('[Cosmetics] Saved to', filePath, JSON.stringify(equipped));
  } catch(e) { console.warn('[Cosmetics] Save failed:', e.message); }
}

// ── Cloud Cosmetics Sync ──
// Uses a simple JSON file on GitHub Pages for sharing cosmetics between players
const COSMETICS_API = 'https://chibi-cosmetics-api.deno.dev';

function syncCosmeticsToCloud(playerName, equipped) {
  try {
    const https = require('https');
    const data = JSON.stringify({ player: playerName, equipped, timestamp: Date.now() });
    const req = https.request(COSMETICS_API + '/set', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, () => {});
    req.on('error', () => {});
    req.write(data);
    req.end();
    console.log('[Cosmetics] Synced to cloud:', playerName);
  } catch(e) { console.warn('[Cosmetics] Sync failed:', e.message); }
}

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

// ── CurseForge API ──
const CF_API_KEY = '$2a$10$bL4bIL5pUWqfcO7KQtnMReakwtfHbNKh6v1uTpKlg4tMOAUqGYgHO';
const CF_API = 'https://api.curseforge.com/v1';
const CF_GAME_ID = 432; // Minecraft
const CF_CLASS = { mod: 6, resourcepack: 12, modpack: 4471, shader: 6552 };

function cfGet(urlPath) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const url = new URL(CF_API + urlPath);
    https.get({
      hostname: url.hostname, path: url.pathname + url.search,
      headers: { 'x-api-key': CF_API_KEY, 'Accept': 'application/json', 'User-Agent': 'ChibiLauncher/1.7' }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

ipcMain.handle('search-curseforge', async (ev, type, query, gameVersion, offset) => {
  try {
    const classId = CF_CLASS[type] || CF_CLASS.mod;
    const off = offset || 0;
    let url = `/mods/search?gameId=${CF_GAME_ID}&classId=${classId}&sortField=2&sortOrder=desc&pageSize=50&index=${off}`;
    if (query) url += '&searchFilter=' + encodeURIComponent(query);
    if (gameVersion) url += '&gameVersion=' + encodeURIComponent(gameVersion);
    console.log('[CurseForge] Search:', url);
    const data = await cfGet(url);
    const results = (data.data || []).map(m => ({
      slug: String(m.id),
      title: m.name,
      description: m.summary || '',
      downloads: m.downloadCount || 0,
      follows: m.thumbsUpCount || 0,
      icon_url: m.logo ? m.logo.thumbnailUrl : '',
      author: (m.authors && m.authors[0]) ? m.authors[0].name : '',
      categories: (m.categories || []).map(c => c.name),
      source: 'curseforge',
      cfId: m.id,
    }));
    return { hits: results, total: data.pagination ? data.pagination.totalCount : results.length, offset: off };
  } catch(e) { console.error('CurseForge search error:', e); return { hits: [], total: 0, offset: 0 }; }
});

ipcMain.handle('add-curseforge-to-instance', async (ev, instId, cfId, type) => {
  try {
    const instances = store.get('instances', []);
    const inst = instances.find(i => i.id === instId);
    if (!inst) return { success: false, error: 'Instanz nicht gefunden' };

    // Get mod files
    const data = await cfGet(`/mods/${cfId}/files?gameVersion=${inst.version}&modLoaderType=4&pageSize=1`);
    let files = data.data || [];
    if (files.length === 0) {
      // Try without version filter
      const allFiles = await cfGet(`/mods/${cfId}/files?pageSize=1`);
      files = allFiles.data || [];
    }
    if (files.length === 0) return { success: false, error: 'Keine Datei gefunden' };

    const file = files[0];
    const downloadUrl = file.downloadUrl;
    if (!downloadUrl) return { success: false, error: 'Download nicht verfuegbar (Autor hat externe Downloads deaktiviert)' };

    // Get mod info for title/icon
    const modInfo = await cfGet(`/mods/${cfId}`);
    const mod = modInfo.data || {};
    const title = mod.name || String(cfId);
    const icon = mod.logo ? mod.logo.thumbnailUrl : '';

    // Download
    const subdir = type === 'resourcepack' ? 'resourcepacks' : type === 'shader' ? 'shaderpacks' : 'mods';
    const instDir = path.join(app.getPath('appData'), '.chibi-minecraft', 'instances', instId, subdir);
    fs.mkdirSync(instDir, { recursive: true });
    console.log('[CurseForge] Downloading', file.fileName, 'from', downloadUrl);
    await downloadFile(downloadUrl, path.join(instDir, file.fileName));

    // Track
    const list = type === 'resourcepack' ? 'resourcepacks' : type === 'shader' ? 'shaders' : 'mods';
    if (!inst[list]) inst[list] = [];
    if (!inst[list].find(m => m.file === file.fileName)) {
      inst[list].push({ name: String(cfId), file: file.fileName, title, icon });
    }
    // Auto-upgrade to Fabric
    if (type === 'mod' && inst.loader === 'vanilla') { inst.loader = 'fabric'; }
    store.set('instances', instances);
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
