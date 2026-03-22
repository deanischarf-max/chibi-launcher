package art.chibi.cosmetics;

import com.google.gson.*;
import java.io.*;
import java.nio.file.*;

/**
 * Reads equipped cosmetics from the Chibi Launcher's data file.
 * The launcher stores data in %APPDATA%/chibi-launcher/chibi-data.json (Electron userData).
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
            // Find the Chibi Launcher data file
            // Electron stores userData in different locations per OS:
            // Windows: %APPDATA%/chibi-launcher/
            // Linux: ~/.config/chibi-launcher/
            // macOS: ~/Library/Application Support/chibi-launcher/
            Path dataFile = findDataFile();
            if (dataFile == null || !Files.exists(dataFile)) {
                ChibiCosmetics.LOG.warn("[ChibiCosmetics] chibi-data.json NOT FOUND in any location!");
                return null;
            }
            ChibiCosmetics.LOG.info("[ChibiCosmetics] Found data file: {}", dataFile);

            String content = Files.readString(dataFile);
            JsonObject root = JsonParser.parseString(content).getAsJsonObject();

            // Get current user
            JsonObject currentUser = root.has("currentUser") ? root.getAsJsonObject("currentUser") : null;
            if (currentUser == null || !currentUser.has("name")) {
                ChibiCosmetics.LOG.warn("[ChibiCosmetics] No currentUser in data file");
                return null;
            }

            String name = currentUser.get("name").getAsString();

            // Get equipped cosmetics for this user
            String equippedKey = "equipped_" + name;
            ChibiCosmetics.LOG.info("[ChibiCosmetics] User: {}, looking for key: {}", name, equippedKey);
            if (!root.has(equippedKey)) {
                ChibiCosmetics.LOG.info("[ChibiCosmetics] No equipped cosmetics for {} (key not found)", name);
                return null;
            }

            JsonObject equipped = root.getAsJsonObject(equippedKey);
            ChibiCosmetics.LOG.info("[ChibiCosmetics] Equipped: {}", equipped);
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
            ChibiCosmetics.LOG.error("[ChibiCosmetics] Failed to load cosmetics", e);
            return null;
        }
    }

    private static String getStr(JsonObject obj, String key) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsString() : null;
    }

    private static Path findDataFile() {
        String os = System.getProperty("os.name").toLowerCase();
        String home = System.getProperty("user.home");
        Path path;

        // Try ALL possible Electron userData paths
        // Electron uses either "name" or "productName" from package.json
        String[] appNames = {"chibi-launcher", "Chibi Launcher", "chibi_launcher", "ChibiLauncher"};

        if (os.contains("win")) {
            String appData = System.getenv("APPDATA");
            if (appData != null) {
                for (String name : appNames) {
                    path = Path.of(appData, name, "chibi-data.json");
                    ChibiCosmetics.LOG.info("[ChibiCosmetics] Checking: {}", path);
                    if (Files.exists(path)) return path;
                }
            }
        } else if (os.contains("mac")) {
            for (String name : appNames) {
                path = Path.of(home, "Library", "Application Support", name, "chibi-data.json");
                if (Files.exists(path)) return path;
            }
        } else {
            for (String name : appNames) {
                path = Path.of(home, ".config", name, "chibi-data.json");
                if (Files.exists(path)) return path;
            }
        }

        // Fallback: try common paths
        for (String name : appNames) {
            for (String p : new String[]{
                (System.getenv("APPDATA") != null ? System.getenv("APPDATA") : "") + "/" + name + "/chibi-data.json",
                home + "/.config/" + name + "/chibi-data.json",
                home + "/Library/Application Support/" + name + "/chibi-data.json",
            }) {
                try {
                    path = Path.of(p);
                    if (Files.exists(path)) return path;
                } catch (Exception ignored) {}
            }
        }

        return null;
    }
}
