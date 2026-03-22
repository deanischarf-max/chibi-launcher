package art.chibi.cosmetics;

import com.google.gson.*;
import java.io.*;
import java.nio.file.*;

/**
 * Reads cosmetics from %APPDATA%/.chibi-minecraft/chibi-cosmetics.json
 * This file is written by the Chibi Launcher when a cosmetic is equipped.
 */
public class CosmeticsData {
    public String trail;
    public String aura;
    public String particles;
    public String cape;
    public String hat;
    public String wings;
    public String emote;
    public String pet;
    public String sounds;
    public String title;
    public String mask;
    public String mount;
    public String banner;
    public String accessories;
    public String playerName;

    public static CosmeticsData load() {
        try {
            Path dataFile = findDataFile();
            if (dataFile == null) {
                ChibiCosmetics.LOG.warn("[ChibiCosmetics] chibi-cosmetics.json not found!");
                return null;
            }
            ChibiCosmetics.LOG.info("[ChibiCosmetics] Loading: {}", dataFile);

            String content = Files.readString(dataFile);
            JsonObject root = JsonParser.parseString(content).getAsJsonObject();

            String name = root.has("player") ? root.get("player").getAsString() : null;
            if (name == null) {
                ChibiCosmetics.LOG.warn("[ChibiCosmetics] No player name in file");
                return null;
            }

            JsonObject equipped = root.has("equipped") ? root.getAsJsonObject("equipped") : null;
            if (equipped == null) {
                ChibiCosmetics.LOG.info("[ChibiCosmetics] No equipped cosmetics");
                return null;
            }

            ChibiCosmetics.LOG.info("[ChibiCosmetics] Player: {} | Equipped: {}", name, equipped);

            CosmeticsData data = new CosmeticsData();
            data.playerName = name;
            data.trail = getStr(equipped, "trails");
            data.aura = getStr(equipped, "auras");
            data.particles = getStr(equipped, "particles");
            data.cape = getStr(equipped, "capes");
            data.hat = getStr(equipped, "hats");
            data.wings = getStr(equipped, "wings");
            data.emote = getStr(equipped, "emotes");
            data.pet = getStr(equipped, "pets");
            data.sounds = getStr(equipped, "sounds");
            data.title = getStr(equipped, "titles");
            data.mask = getStr(equipped, "masks");
            data.mount = getStr(equipped, "mounts");
            data.banner = getStr(equipped, "banners");
            data.accessories = getStr(equipped, "accessories");
            return data;
        } catch (Exception e) {
            ChibiCosmetics.LOG.error("[ChibiCosmetics] Load failed", e);
            return null;
        }
    }

    private static String getStr(JsonObject obj, String key) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsString() : null;
    }

    private static Path findDataFile() {
        // The launcher saves to %APPDATA%/.chibi-minecraft/chibi-cosmetics.json
        // which is the same folder as the MC game directory
        String os = System.getProperty("os.name").toLowerCase();
        String home = System.getProperty("user.home");
        Path path;

        if (os.contains("win")) {
            String appData = System.getenv("APPDATA");
            if (appData != null) {
                path = Path.of(appData, ".chibi-minecraft", "chibi-cosmetics.json");
                ChibiCosmetics.LOG.info("[ChibiCosmetics] Checking: {}", path);
                if (Files.exists(path)) return path;
            }
        }

        // Also check game directory (MC working dir)
        path = Path.of("chibi-cosmetics.json");
        if (Files.exists(path)) return path;

        // Linux/Mac
        path = Path.of(home, ".chibi-minecraft", "chibi-cosmetics.json");
        if (Files.exists(path)) return path;

        // Fallback paths
        String[] tries = {
            System.getenv("APPDATA") + "/.chibi-minecraft/chibi-cosmetics.json",
            home + "/.config/.chibi-minecraft/chibi-cosmetics.json",
            home + "/Library/Application Support/.chibi-minecraft/chibi-cosmetics.json",
            home + "/.chibi-minecraft/chibi-cosmetics.json",
        };
        for (String p : tries) {
            try {
                path = Path.of(p);
                if (Files.exists(path)) return path;
            } catch (Exception ignored) {}
        }

        return null;
    }
}
