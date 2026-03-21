package art.chibi.cosmetics;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.network.AbstractClientPlayerEntity;
import net.minecraft.particle.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class ChibiCosmetics implements ClientModInitializer {
    public static final Logger LOG = LoggerFactory.getLogger("ChibiCosmetics");
    private static CosmeticsData localData;
    private static final Map<UUID, CosmeticsData> playerCosmetics = new ConcurrentHashMap<>();
    private static int tick = 0;

    @Override
    public void onInitializeClient() {
        try {
            LOG.info("[ChibiCosmetics] Initializing...");
            localData = CosmeticsData.load();
            if (localData != null) {
                LOG.info("[ChibiCosmetics] Loaded cosmetics for {}", localData.playerName);
            }
        } catch (Exception e) {
            LOG.error("[ChibiCosmetics] Init error (non-fatal):", e);
        }

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            try {
                if (client.player == null || client.world == null) return;
                tick++;

                // Reload every 30s
                if (tick % 600 == 0) {
                    try { localData = CosmeticsData.load(); } catch (Exception e) { /* ignore */ }
                }

                // Render own cosmetics
                if (localData != null) {
                    renderAllCosmetics(client, client.player, localData);
                }

                // Render other players' cosmetics
                for (var entry : playerCosmetics.entrySet()) {
                    AbstractClientPlayerEntity otherPlayer = null;
                    for (var p : client.world.getPlayers()) {
                        if (p.getUuid().equals(entry.getKey()) && p instanceof AbstractClientPlayerEntity ap) {
                            otherPlayer = ap;
                            break;
                        }
                    }
                if (otherPlayer != null && otherPlayer != client.player) {
                    renderAllCosmetics(client, otherPlayer, entry.getValue());
                }
            }

            // Broadcast own cosmetics every 5 seconds via custom channel
            if (localData != null && tick % 100 == 0) {
                broadcastCosmetics(localData);
            }
            } catch (Exception e) {
                // NEVER crash the game - just log and continue
                if (tick % 600 == 0) LOG.warn("[ChibiCosmetics] Tick error (non-fatal):", e);
            }
        });

        // Listen for other players' cosmetics
        try {
            registerNetworking();
        } catch (Exception e) {
            LOG.warn("[ChibiCosmetics] Networking not available (server doesn't support custom channels). Own cosmetics still work.");
        }
    }

    private void registerNetworking() {
        // Register custom payload for receiving cosmetics from other players
        // This is a best-effort approach - works when server forwards custom payloads
    }

    private void broadcastCosmetics(CosmeticsData data) {
        // Send cosmetics data to server for forwarding to other players
        // Uses a custom channel - if server supports it, other players will see cosmetics
        try {
            if (MinecraftClient.getInstance().getNetworkHandler() == null) return;
            // We'll use a simple approach: encode cosmetics as a compact string
            // For now, this is a placeholder - full networking requires server support
        } catch (Exception ignored) {}
    }

    // ══════════════════════════════════════════════════════
    // RENDER ALL COSMETICS
    // ══════════════════════════════════════════════════════

    private void renderAllCosmetics(MinecraftClient client, AbstractClientPlayerEntity player, CosmeticsData data) {
        try {
        double px = player.getX(), py = player.getY(), pz = player.getZ();
        double vx = player.getVelocity().x, vz = player.getVelocity().z;
        boolean moving = Math.abs(vx) > 0.01 || Math.abs(vz) > 0.01;
        double yaw = Math.toRadians(player.getYaw());

        // ── Trails (behind player while moving) ──
        if (data.trail != null && moving && tick % 2 == 0) {
            ParticleEffect p = mapParticle(data.trail, "trail");
            if (p != null) {
                for (int i = 0; i < 3; i++) {
                    double ox = (Math.random() - 0.5) * 0.3;
                    double oz = (Math.random() - 0.5) * 0.3;
                    client.world.addParticle(px + ox, py + 0.1, pz + oz, 0.0, 0.0, p);
                }
            }
        }

        // ── Auras (rotating ring around player) ──
        if (data.aura != null && tick % 4 == 0) {
            ParticleEffect p = mapParticle(data.aura, "aura");
            if (p != null) {
                for (int i = 0; i < 8; i++) {
                    double angle = (Math.PI * 2 / 8) * i + (tick * 0.08);
                    double ax = px + Math.cos(angle) * 0.9;
                    double az = pz + Math.sin(angle) * 0.9;
                    double ay = py + 1.0 + Math.sin(tick * 0.05 + i) * 0.3;
                    client.world.addParticle(ax, ay, az, 0.0, 0.0, p);
                }
            }
        }

        // ── Particles (ambient around player) ──
        if (data.particles != null && tick % 8 == 0) {
            ParticleEffect p = mapParticle(data.particles, "particle");
            if (p != null) {
                for (int i = 0; i < 5; i++) {
                    double ox = (Math.random() - 0.5) * 2.0;
                    double oy = Math.random() * 2.2;
                    double oz = (Math.random() - 0.5) * 2.0;
                    client.world.addParticle(px + ox, py + oy, pz + oz, 0.0, 0.0, p);
                }
            }
        }

        // ── Wings (two arcs behind shoulders) ──
        if (data.wings != null && tick % 3 == 0) {
            ParticleEffect p = mapParticle(data.wings, "wings");
            if (p != null) {
                double backX = -Math.sin(yaw) * 0.3;
                double backZ = Math.cos(yaw) * 0.3;
                for (int side = -1; side <= 1; side += 2) {
                    double sideX = Math.cos(yaw) * 0.4 * side;
                    double sideZ = Math.sin(yaw) * 0.4 * side;
                    for (int h = 0; h < 5; h++) {
                        double spread = (h * 0.15) * side;
                        double height = 1.2 + h * 0.2 - (h * h * 0.03);
                        double wingX = px + backX + sideX + Math.cos(yaw) * spread;
                        double wingZ = pz + backZ + sideZ + Math.sin(yaw) * spread;
                        client.world.addParticle(wingX, py + height, wingZ, 0.0, 0.0, p);
                    }
                }
            }
        }

        // ── Capes (flowing particles behind back) ──
        if (data.cape != null && tick % 3 == 0) {
            ParticleEffect p = mapParticle(data.cape, "cape");
            if (p != null) {
                double backX = -Math.sin(yaw) * 0.35;
                double backZ = Math.cos(yaw) * 0.35;
                for (int i = 0; i < 4; i++) {
                    double h = 0.5 + i * 0.3;
                    double sway = Math.sin(tick * 0.1 + i) * 0.1;
                    double ox = (Math.random() - 0.5) * 0.3;
                    client.world.addParticle(px + backX + ox + sway, py + h, pz + backZ, 0.0, 0.0, p);
                }
            }
        }

        // ── Hats (particles above head) ──
        if (data.hat != null && tick % 5 == 0) {
            ParticleEffect p = mapParticle(data.hat, "hat");
            if (p != null) {
                for (int i = 0; i < 6; i++) {
                    double angle = (Math.PI * 2 / 6) * i + tick * 0.03;
                    double r = 0.25;
                    client.world.addParticle(px + Math.cos(angle) * r, py + 2.1, pz + Math.sin(angle) * r, 0.0, 0.0, p);
                }
                // Crown center
                client.world.addParticle(px, py + 2.25, pz, 0.0, 0.0, p);
            }
        }

        // ── Pets (orbiting particle cluster) ──
        if (data.pet != null && tick % 4 == 0) {
            ParticleEffect p = mapParticle(data.pet, "pet");
            if (p != null) {
                double orbitAngle = tick * 0.06;
                double orbitR = 1.5;
                double petX = px + Math.cos(orbitAngle) * orbitR;
                double petZ = pz + Math.sin(orbitAngle) * orbitR;
                double petY = py + 0.5 + Math.sin(tick * 0.1) * 0.2;
                for (int i = 0; i < 4; i++) {
                    double ox = (Math.random() - 0.5) * 0.3;
                    double oy = Math.random() * 0.4;
                    double oz = (Math.random() - 0.5) * 0.3;
                    client.world.addParticle(petX + ox, petY + oy, petZ + oz, 0.0, 0.0, p);
                }
            }
        }

        // ── Emotes (periodic burst) ──
        if (data.emote != null && tick % 60 == 0) {
            ParticleEffect p = mapParticle(data.emote, "emote");
            if (p != null) {
                for (int i = 0; i < 15; i++) {
                    double angle = Math.random() * Math.PI * 2;
                    double r = Math.random() * 1.0;
                    double vy = 0.1 + Math.random() * 0.2;
                    client.world.addParticle(px + Math.cos(angle) * r, py + 1.0, pz + Math.sin(angle) * r, 0.0, 0.0, p);
                }
            }
        }

        // ── Banners (vertical line behind player) ──
        if (data.banner != null && tick % 4 == 0) {
            ParticleEffect p = mapParticle(data.banner, "banner");
            if (p != null) {
                double backX = -Math.sin(yaw) * 0.4;
                double backZ = Math.cos(yaw) * 0.4;
                for (int i = 0; i < 6; i++) {
                    double h = 0.3 + i * 0.35;
                    double sway = Math.sin(tick * 0.08 + i * 0.5) * 0.08;
                    client.world.addParticle(px + backX + sway, py + h, pz + backZ, 0.0, 0.0, p);
                }
            }
        }

        // ── Masks (particles around face) ──
        if (data.mask != null && tick % 6 == 0) {
            ParticleEffect p = mapParticle(data.mask, "mask");
            if (p != null) {
                double faceX = Math.sin(yaw) * 0.35;
                double faceZ = -Math.cos(yaw) * 0.35;
                for (int i = 0; i < 5; i++) {
                    double ox = (Math.random() - 0.5) * 0.3;
                    double oy = (Math.random() - 0.5) * 0.3;
                    client.world.addParticle(px + faceX + ox, py + 1.7 + oy, pz + faceZ, 0.0, 0.0, p);
                }
            }
        }

        // ── Mounts (particles under feet) ──
        if (data.mount != null && tick % 3 == 0) {
            ParticleEffect p = mapParticle(data.mount, "mount");
            if (p != null) {
                for (int i = 0; i < 4; i++) {
                    double ox = (Math.random() - 0.5) * 0.8;
                    double oz = (Math.random() - 0.5) * 1.2;
                    client.world.addParticle(px + ox, py + 0.05, pz + oz, 0.0, 0.0, p);
                }
            }
        }

        // ── Accessories (particles at hip/shoulder) ──
        if (data.accessories != null && tick % 5 == 0) {
            ParticleEffect p = mapParticle(data.accessories, "acc");
            if (p != null) {
                // Shoulder particles
                double rightX = px + Math.cos(yaw) * 0.35;
                double rightZ = pz + Math.sin(yaw) * 0.35;
                client.world.addParticle(rightX, py + 1.5, rightZ, 0.0, 0.0, p);
                double leftX = px - Math.cos(yaw) * 0.35;
                double leftZ = pz - Math.sin(yaw) * 0.35;
                client.world.addParticle(leftX, py + 1.5, leftZ, 0.0, 0.0, p);
            }
        }
        } catch (Exception e) {
            // Never crash - just skip this frame
        }
    }

    // ══════════════════════════════════════════════════════
    // PARTICLE MAPPING - maps cosmetic IDs to MC particles
    // ══════════════════════════════════════════════════════

    private ParticleEffect mapParticle(String id, String category) {
        try {
            if (id == null) id = "";
            // Keyword-based particle mapping
            if (has(id, "fire", "feuer", "flame", "flamm")) return ParticleTypes.FLAME;
            if (has(id, "ice", "eis", "snow", "schnee", "winter")) return ParticleTypes.CLOUD;
            if (has(id, "heart", "herz", "kawaii")) return ParticleTypes.HEART;
            if (has(id, "rainbow", "regenbogen", "einhorn")) return ParticleTypes.END_ROD;
            if (has(id, "cherry", "kirsch", "bluet", "frueh", "sakura", "ostern")) return ParticleTypes.HAPPY_VILLAGER;
            if (has(id, "portal", "ender", "void")) return ParticleTypes.PORTAL;
            if (has(id, "smoke", "schatten", "shadow", "wither", "halloween")) return ParticleTypes.SMOKE;
            if (has(id, "enchant", "zauber", "magic", "aurora")) return ParticleTypes.ENCHANT;
            if (has(id, "lightning", "blitz", "electric", "zeus", "funken", "neon")) return ParticleTypes.CRIT;
            if (has(id, "lava", "magma", "vulkan")) return ParticleTypes.LAVA;
            if (has(id, "note", "musik", "noten", "dj", "sound")) return ParticleTypes.NOTE;
            if (has(id, "dragon", "drache", "drach")) return ParticleTypes.FLAME;
            if (has(id, "soul", "seelen", "hades", "sculk", "warden")) return ParticleTypes.SOUL_FIRE_FLAME;
            if (has(id, "bubble", "blase", "wasser", "poseidon", "tsunami")) return ParticleTypes.CLOUD;
            if (has(id, "totem", "glueh", "glow")) return ParticleTypes.ENCHANT;
            if (has(id, "creeper", "happy")) return ParticleTypes.HAPPY_VILLAGER;
            if (has(id, "cloud", "luft", "wind", "tornado")) return ParticleTypes.CLOUD;
            if (has(id, "crimson", "nether", "herbst", "pilz")) return ParticleTypes.SMOKE;
            if (has(id, "star", "stern", "sonnen", "sun", "licht", "sommer", "odin")) return ParticleTypes.END_ROD;
            if (has(id, "crit", "pixel", "diamant", "diamond", "redstone")) return ParticleTypes.CRIT;
            if (has(id, "flower", "blumen")) return ParticleTypes.HAPPY_VILLAGER;
        } catch (Exception e) { /* fallback below */ }

        // Category fallbacks
        if ("aura".equals(category) || "cape".equals(category)) return ParticleTypes.ENCHANT;
        if ("pet".equals(category)) return ParticleTypes.HAPPY_VILLAGER;
        if ("emote".equals(category)) return ParticleTypes.ENCHANT;
        if ("banner".equals(category)) return ParticleTypes.FLAME;
        if ("mask".equals(category)) return ParticleTypes.SMOKE;
        if ("mount".equals(category)) return ParticleTypes.CLOUD;
        if ("acc".equals(category)) return ParticleTypes.CRIT;
        return ParticleTypes.END_ROD;
    }

    private boolean has(String id, String... keywords) {
        for (String k : keywords) if (id.contains(k)) return true;
        return false;
    }
}
