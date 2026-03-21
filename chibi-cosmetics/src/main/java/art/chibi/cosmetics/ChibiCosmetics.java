package art.chibi.cosmetics;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.network.AbstractClientPlayerEntity;
import net.minecraft.network.PacketByteBuf;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.packet.CustomPayload;
import net.minecraft.particle.*;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.Vec3d;
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
        LOG.info("[ChibiCosmetics] Initializing...");
        localData = CosmeticsData.load();
        if (localData != null) {
            LOG.info("[ChibiCosmetics] Loaded cosmetics for {}", localData.playerName);
        }

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            if (client.player == null || client.world == null) return;
            tick++;

            // Reload every 30s
            if (tick % 600 == 0) localData = CosmeticsData.load();

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
        Vec3d pos = player.getPos();
        Vec3d vel = player.getVelocity();
        boolean moving = Math.abs(vel.x) > 0.01 || Math.abs(vel.z) > 0.01;
        double yaw = Math.toRadians(player.getYaw());

        // ── Trails (behind player while moving) ──
        if (data.trail != null && moving && tick % 2 == 0) {
            ParticleEffect p = mapParticle(data.trail, "trail");
            if (p != null) {
                for (int i = 0; i < 3; i++) {
                    double ox = (Math.random() - 0.5) * 0.3;
                    double oz = (Math.random() - 0.5) * 0.3;
                    client.world.addParticle(p, pos.x + ox, pos.y + 0.1, pos.z + oz, 0, 0.02, 0);
                }
            }
        }

        // ── Auras (rotating ring around player) ──
        if (data.aura != null && tick % 4 == 0) {
            ParticleEffect p = mapParticle(data.aura, "aura");
            if (p != null) {
                for (int i = 0; i < 8; i++) {
                    double angle = (Math.PI * 2 / 8) * i + (tick * 0.08);
                    double px = pos.x + Math.cos(angle) * 0.9;
                    double pz = pos.z + Math.sin(angle) * 0.9;
                    double py = pos.y + 1.0 + Math.sin(tick * 0.05 + i) * 0.3;
                    client.world.addParticle(p, px, py, pz, 0, 0.01, 0);
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
                    client.world.addParticle(p, pos.x + ox, pos.y + oy, pos.z + oz, 0, 0.01, 0);
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
                        double wingX = pos.x + backX + sideX + Math.cos(yaw) * spread;
                        double wingZ = pos.z + backZ + sideZ + Math.sin(yaw) * spread;
                        client.world.addParticle(p, wingX, pos.y + height, wingZ, 0, 0, 0);
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
                    client.world.addParticle(p, pos.x + backX + ox + sway, pos.y + h, pos.z + backZ, 0, -0.01, 0);
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
                    client.world.addParticle(p, pos.x + Math.cos(angle) * r, pos.y + 2.1, pos.z + Math.sin(angle) * r, 0, 0.01, 0);
                }
                // Crown center
                client.world.addParticle(p, pos.x, pos.y + 2.25, pos.z, 0, 0, 0);
            }
        }

        // ── Pets (orbiting particle cluster) ──
        if (data.pet != null && tick % 4 == 0) {
            ParticleEffect p = mapParticle(data.pet, "pet");
            if (p != null) {
                double orbitAngle = tick * 0.06;
                double orbitR = 1.5;
                double petX = pos.x + Math.cos(orbitAngle) * orbitR;
                double petZ = pos.z + Math.sin(orbitAngle) * orbitR;
                double petY = pos.y + 0.5 + Math.sin(tick * 0.1) * 0.2;
                for (int i = 0; i < 4; i++) {
                    double ox = (Math.random() - 0.5) * 0.3;
                    double oy = Math.random() * 0.4;
                    double oz = (Math.random() - 0.5) * 0.3;
                    client.world.addParticle(p, petX + ox, petY + oy, petZ + oz, 0, 0.01, 0);
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
                    client.world.addParticle(p, pos.x + Math.cos(angle) * r, pos.y + 1.0, pos.z + Math.sin(angle) * r, 0, vy, 0);
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
                    client.world.addParticle(p, pos.x + backX + sway, pos.y + h, pos.z + backZ, 0, 0, 0);
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
                    client.world.addParticle(p, pos.x + faceX + ox, pos.y + 1.7 + oy, pos.z + faceZ, 0, 0, 0);
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
                    client.world.addParticle(p, pos.x + ox, pos.y + 0.05, pos.z + oz, 0, 0.03, 0);
                }
            }
        }

        // ── Accessories (particles at hip/shoulder) ──
        if (data.accessories != null && tick % 5 == 0) {
            ParticleEffect p = mapParticle(data.accessories, "acc");
            if (p != null) {
                // Shoulder particles
                double rightX = pos.x + Math.cos(yaw) * 0.35;
                double rightZ = pos.z + Math.sin(yaw) * 0.35;
                client.world.addParticle(p, rightX, pos.y + 1.5, rightZ, 0, 0.01, 0);
                double leftX = pos.x - Math.cos(yaw) * 0.35;
                double leftZ = pos.z - Math.sin(yaw) * 0.35;
                client.world.addParticle(p, leftX, pos.y + 1.5, leftZ, 0, 0.01, 0);
            }
        }
    }

    // ══════════════════════════════════════════════════════
    // PARTICLE MAPPING - maps cosmetic IDs to MC particles
    // ══════════════════════════════════════════════════════

    private ParticleEffect mapParticle(String id, String category) {
        // Specific mappings first
        ParticleEffect specific = switch (id) {
            // Fire themed
            case String s when s.contains("fire") || s.contains("feuer") || s.contains("flame") || s.contains("flamm") -> ParticleTypes.FLAME;
            case String s when s.contains("ice") || s.contains("eis") || s.contains("snow") || s.contains("schnee") || s.contains("winter") -> ParticleTypes.SNOWFLAKE;
            case String s when s.contains("heart") || s.contains("herz") || s.contains("kawaii") -> ParticleTypes.HEART;
            case String s when s.contains("rainbow") || s.contains("regenbogen") || s.contains("einhorn") || s.contains("end_rod") -> ParticleTypes.END_ROD;
            case String s when s.contains("cherry") || s.contains("kirsch") || s.contains("bluet") || s.contains("frueh") || s.contains("sakura") || s.contains("ostern") -> ParticleTypes.CHERRY_LEAVES;
            case String s when s.contains("portal") || s.contains("ender") || s.contains("void") -> ParticleTypes.PORTAL;
            case String s when s.contains("smoke") || s.contains("schatten") || s.contains("shadow") || s.contains("wither") || s.contains("halloween") -> ParticleTypes.SMOKE;
            case String s when s.contains("enchant") || s.contains("zauber") || s.contains("magic") || s.contains("aurora") -> ParticleTypes.ENCHANT;
            case String s when s.contains("lightning") || s.contains("blitz") || s.contains("electric") || s.contains("zeus") || s.contains("funken") || s.contains("neon") -> ParticleTypes.ELECTRIC_SPARK;
            case String s when s.contains("lava") || s.contains("magma") || s.contains("vulkan") -> ParticleTypes.LAVA;
            case String s when s.contains("note") || s.contains("musik") || s.contains("noten") || s.contains("dj") || s.contains("sound") -> ParticleTypes.NOTE;
            case String s when s.contains("dragon") || s.contains("drache") || s.contains("drach") -> ParticleTypes.DRAGON_BREATH;
            case String s when s.contains("soul") || s.contains("seelen") || s.contains("hades") -> ParticleTypes.SOUL_FIRE_FLAME;
            case String s when s.contains("sculk") || s.contains("warden") -> ParticleTypes.SCULK_SOUL;
            case String s when s.contains("bubble") || s.contains("blase") || s.contains("wasser") || s.contains("poseidon") || s.contains("tsunami") -> ParticleTypes.BUBBLE_POP;
            case String s when s.contains("redstone") -> ParticleTypes.CRIT;
            case String s when s.contains("totem") || s.contains("glueh") || s.contains("glow") -> ParticleTypes.TOTEM_OF_UNDYING;
            case String s when s.contains("creeper") || s.contains("happy") -> ParticleTypes.HAPPY_VILLAGER;
            case String s when s.contains("cloud") || s.contains("luft") || s.contains("wind") || s.contains("tornado") -> ParticleTypes.CLOUD;
            case String s when s.contains("crimson") || s.contains("nether") || s.contains("herbst") || s.contains("pilz") -> ParticleTypes.CRIMSON_SPORE;
            case String s when s.contains("star") || s.contains("stern") || s.contains("sonnen") || s.contains("sun") || s.contains("licht") || s.contains("sommer") || s.contains("odin") -> ParticleTypes.END_ROD;
            case String s when s.contains("crit") || s.contains("pixel") || s.contains("diamant") || s.contains("diamond") -> ParticleTypes.CRIT;
            case String s when s.contains("flower") || s.contains("blumen") -> ParticleTypes.CHERRY_LEAVES;
            // Fallbacks by category
            default -> null;
        };
        if (specific != null) return specific;

        // Category fallbacks
        return switch (category) {
            case "trail" -> ParticleTypes.END_ROD;
            case "aura" -> ParticleTypes.ENCHANT;
            case "particle" -> ParticleTypes.END_ROD;
            case "wings" -> ParticleTypes.END_ROD;
            case "cape" -> ParticleTypes.ENCHANT;
            case "hat" -> ParticleTypes.END_ROD;
            case "pet" -> ParticleTypes.HAPPY_VILLAGER;
            case "emote" -> ParticleTypes.TOTEM_OF_UNDYING;
            case "banner" -> ParticleTypes.FLAME;
            case "mask" -> ParticleTypes.SMOKE;
            case "mount" -> ParticleTypes.CLOUD;
            case "acc" -> ParticleTypes.CRIT;
            default -> ParticleTypes.END_ROD;
        };
    }
}
