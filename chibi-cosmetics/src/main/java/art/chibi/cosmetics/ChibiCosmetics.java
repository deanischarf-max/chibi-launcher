package art.chibi.cosmetics;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.particle.ParticleEffect;
import net.minecraft.particle.ParticleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChibiCosmetics implements ClientModInitializer {
    public static final Logger LOG = LoggerFactory.getLogger("ChibiCosmetics");
    private CosmeticsData data;
    private int tick = 0;

    @Override
    public void onInitializeClient() {
        try {
            data = CosmeticsData.load();
            LOG.info("[Cosmetics] Loaded: {}", data != null ? data.playerName : "none");
        } catch (Exception e) {
            LOG.warn("[Cosmetics] Load failed", e);
        }

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            try {
                if (client.player == null || client.world == null || data == null) return;
                tick++;
                if (tick % 600 == 0) { try { data = CosmeticsData.load(); } catch (Exception e) {} }

                double x = client.player.getX();
                double y = client.player.getY();
                double z = client.player.getZ();
                double vx = client.player.getVelocity().x;
                double vz = client.player.getVelocity().z;
                boolean moving = Math.abs(vx) > 0.01 || Math.abs(vz) > 0.01;
                double yaw = Math.toRadians(client.player.getYaw());

                // Trails
                if (data.trail != null && moving && tick % 2 == 0) {
                    ParticleEffect p = map(data.trail);
                    spawn(client, p, x + rnd(0.3), y + 0.1, z + rnd(0.3));
                    spawn(client, p, x + rnd(0.3), y + 0.1, z + rnd(0.3));
                }

                // Aura
                if (data.aura != null && tick % 4 == 0) {
                    ParticleEffect p = map(data.aura);
                    for (int i = 0; i < 6; i++) {
                        double a = (Math.PI * 2 / 6) * i + tick * 0.08;
                        spawn(client, p, x + Math.cos(a) * 0.9, y + 1.0 + Math.sin(tick * 0.05 + i) * 0.3, z + Math.sin(a) * 0.9);
                    }
                }

                // Particles
                if (data.particles != null && tick % 8 == 0) {
                    ParticleEffect p = map(data.particles);
                    for (int i = 0; i < 4; i++) spawn(client, p, x + rnd(1.5), y + Math.random() * 2, z + rnd(1.5));
                }

                // Wings
                if (data.wings != null && tick % 3 == 0) {
                    ParticleEffect p = map(data.wings);
                    double bx = -Math.sin(yaw) * 0.3, bz = Math.cos(yaw) * 0.3;
                    for (int s = -1; s <= 1; s += 2)
                        for (int h = 0; h < 4; h++)
                            spawn(client, p, x + bx + Math.cos(yaw) * 0.3 * s * (1 + h * 0.3), y + 1.2 + h * 0.2, z + bz + Math.sin(yaw) * 0.3 * s * (1 + h * 0.3));
                }

                // Cape
                if (data.cape != null && tick % 3 == 0) {
                    ParticleEffect p = map(data.cape);
                    double bx = -Math.sin(yaw) * 0.35, bz = Math.cos(yaw) * 0.35;
                    for (int i = 0; i < 3; i++) spawn(client, p, x + bx + rnd(0.15), y + 0.5 + i * 0.3, z + bz);
                }

                // Hat
                if (data.hat != null && tick % 5 == 0) {
                    ParticleEffect p = map(data.hat);
                    for (int i = 0; i < 5; i++) {
                        double a = (Math.PI * 2 / 5) * i + tick * 0.03;
                        spawn(client, p, x + Math.cos(a) * 0.25, y + 2.15, z + Math.sin(a) * 0.25);
                    }
                }

                // Pet
                if (data.pet != null && tick % 4 == 0) {
                    ParticleEffect p = map(data.pet);
                    double oa = tick * 0.06;
                    double petX = x + Math.cos(oa) * 1.5, petZ = z + Math.sin(oa) * 1.5;
                    for (int i = 0; i < 3; i++) spawn(client, p, petX + rnd(0.2), y + 0.5 + rnd(0.2), petZ + rnd(0.2));
                }

                // Emote burst
                if (data.emote != null && tick % 60 == 0) {
                    ParticleEffect p = map(data.emote);
                    for (int i = 0; i < 10; i++) {
                        double a = Math.random() * Math.PI * 2;
                        spawnV(client, p, x + Math.cos(a) * 0.5, y + 1.0, z + Math.sin(a) * 0.5, 0, 0.1 + Math.random() * 0.15, 0);
                    }
                }

                // Banner
                if (data.banner != null && tick % 4 == 0) {
                    ParticleEffect p = map(data.banner);
                    double bx = -Math.sin(yaw) * 0.4, bz = Math.cos(yaw) * 0.4;
                    for (int i = 0; i < 5; i++) spawn(client, p, x + bx, y + 0.3 + i * 0.35, z + bz);
                }

                // Mask
                if (data.mask != null && tick % 6 == 0) {
                    ParticleEffect p = map(data.mask);
                    double fx = Math.sin(yaw) * 0.35, fz = -Math.cos(yaw) * 0.35;
                    for (int i = 0; i < 4; i++) spawn(client, p, x + fx + rnd(0.2), y + 1.7 + rnd(0.2), z + fz);
                }

                // Mount
                if (data.mount != null && tick % 3 == 0) {
                    ParticleEffect p = map(data.mount);
                    for (int i = 0; i < 3; i++) spawn(client, p, x + rnd(0.6), y + 0.05, z + rnd(0.8));
                }

                // Accessories
                if (data.accessories != null && tick % 5 == 0) {
                    ParticleEffect p = map(data.accessories);
                    spawn(client, p, x + Math.cos(yaw) * 0.35, y + 1.5, z + Math.sin(yaw) * 0.35);
                    spawn(client, p, x - Math.cos(yaw) * 0.35, y + 1.5, z - Math.sin(yaw) * 0.35);
                }
            } catch (Exception e) {
                // Never crash the game
            }
        });
    }

    private void spawn(MinecraftClient c, ParticleEffect p, double x, double y, double z) {
        try {
            c.particleManager.addParticle(p, x, y, z, 0.0, 0.0, 0.0);
        } catch (Exception e) { /* ignore */ }
    }

    private void spawnV(MinecraftClient c, ParticleEffect p, double x, double y, double z, double vx, double vy, double vz) {
        try {
            c.particleManager.addParticle(p, x, y, z, vx, vy, vz);
        } catch (Exception e) { /* ignore */ }
    }

    private double rnd(double range) {
        return (Math.random() - 0.5) * range * 2;
    }

    private ParticleEffect map(String id) {
        try {
            if (id == null) return ParticleTypes.END_ROD;
            if (has(id, "fire", "feuer", "flame", "flamm", "vulkan", "lava", "magma")) return ParticleTypes.FLAME;
            if (has(id, "heart", "herz", "kawaii")) return ParticleTypes.HEART;
            if (has(id, "portal", "ender", "void")) return ParticleTypes.PORTAL;
            if (has(id, "smoke", "schatten", "shadow", "wither", "halloween")) return ParticleTypes.SMOKE;
            if (has(id, "enchant", "zauber", "magic", "aurora")) return ParticleTypes.ENCHANT;
            if (has(id, "note", "musik", "noten", "dj", "sound")) return ParticleTypes.NOTE;
            if (has(id, "soul", "seelen", "hades", "sculk", "warden")) return ParticleTypes.SOUL_FIRE_FLAME;
            if (has(id, "crit", "pixel", "diamant", "diamond", "blitz", "zeus", "neon", "redstone")) return ParticleTypes.CRIT;
            if (has(id, "creeper", "happy", "cherry", "kirsch", "sakura", "ostern", "flower", "blumen")) return ParticleTypes.HAPPY_VILLAGER;
            if (has(id, "cloud", "luft", "wind", "ice", "eis", "snow", "schnee", "winter", "wasser")) return ParticleTypes.CLOUD;
        } catch (Exception e) { /* fallback */ }
        return ParticleTypes.END_ROD;
    }

    private boolean has(String id, String... keys) {
        for (String k : keys) if (id.contains(k)) return true;
        return false;
    }
}
