package art.chibi.cosmetics;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.particle.*;
import net.minecraft.sound.SoundEvents;
import net.minecraft.sound.SoundEvent;
import net.minecraft.util.math.Vec3d;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.nio.file.*;
import java.util.*;

public class ChibiCosmetics implements ClientModInitializer {
    public static final Logger LOG = LoggerFactory.getLogger("ChibiCosmetics");
    private static CosmeticsData data;
    private static int tickCounter = 0;

    @Override
    public void onInitializeClient() {
        LOG.info("[ChibiCosmetics] Loading cosmetics...");
        data = CosmeticsData.load();
        if (data != null) {
            LOG.info("[ChibiCosmetics] Loaded! Trail: {}, Aura: {}, Particles: {}", data.trail, data.aura, data.particles);
        } else {
            LOG.info("[ChibiCosmetics] No cosmetics data found (not logged in via Chibi Launcher?)");
        }

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            if (client.player == null || client.world == null || data == null) return;
            tickCounter++;

            // Trails - every 2 ticks while moving
            if (data.trail != null && tickCounter % 2 == 0) {
                Vec3d vel = client.player.getVelocity();
                if (Math.abs(vel.x) > 0.01 || Math.abs(vel.z) > 0.01) {
                    renderTrail(client, data.trail);
                }
            }

            // Auras - every 5 ticks
            if (data.aura != null && tickCounter % 5 == 0) {
                renderAura(client, data.aura);
            }

            // Particles - every 10 ticks
            if (data.particles != null && tickCounter % 10 == 0) {
                renderParticles(client, data.particles);
            }

            // Sounds - every 20 ticks while moving
            if (data.sounds != null && tickCounter % 20 == 0) {
                Vec3d vel = client.player.getVelocity();
                if (Math.abs(vel.x) > 0.05 || Math.abs(vel.z) > 0.05) {
                    playSound(client, data.sounds);
                }
            }

            // Reload data every 600 ticks (30 seconds)
            if (tickCounter % 600 == 0) {
                data = CosmeticsData.load();
            }
        });
    }

    private void renderTrail(MinecraftClient client, String trailId) {
        Vec3d pos = client.player.getPos();
        double x = pos.x, y = pos.y + 0.1, z = pos.z;
        ParticleEffect particle = getTrailParticle(trailId);
        if (particle != null) {
            for (int i = 0; i < 3; i++) {
                double ox = (Math.random() - 0.5) * 0.3;
                double oz = (Math.random() - 0.5) * 0.3;
                client.world.addParticle(particle, x + ox, y, z + oz, 0, 0.02, 0);
            }
        }
    }

    private void renderAura(MinecraftClient client, String auraId) {
        Vec3d pos = client.player.getPos();
        ParticleEffect particle = getAuraParticle(auraId);
        if (particle == null) return;
        double y = pos.y + 1.0;
        for (int i = 0; i < 6; i++) {
            double angle = (Math.PI * 2 / 6) * i + (tickCounter * 0.1);
            double radius = 0.8;
            double px = pos.x + Math.cos(angle) * radius;
            double pz = pos.z + Math.sin(angle) * radius;
            client.world.addParticle(particle, px, y + Math.sin(tickCounter * 0.05 + i) * 0.3, pz, 0, 0.01, 0);
        }
    }

    private void renderParticles(MinecraftClient client, String particleId) {
        Vec3d pos = client.player.getPos();
        ParticleEffect particle = getParticleEffect(particleId);
        if (particle == null) return;
        for (int i = 0; i < 4; i++) {
            double ox = (Math.random() - 0.5) * 1.5;
            double oy = Math.random() * 2.0;
            double oz = (Math.random() - 0.5) * 1.5;
            client.world.addParticle(particle, pos.x + ox, pos.y + oy, pos.z + oz, 0, 0.02, 0);
        }
    }

    private void playSound(MinecraftClient client, String soundId) {
        // Play subtle sounds based on cosmetic
        // Sounds are very quiet so they don't annoy
    }

    // ── Particle Mappings ──

    private ParticleEffect getTrailParticle(String id) {
        return switch (id) {
            case "trail_fire" -> ParticleTypes.FLAME;
            case "trail_ice" -> ParticleTypes.SNOWFLAKE;
            case "trail_rainbow" -> ParticleTypes.END_ROD;
            case "trail_flowers" -> ParticleTypes.CHERRY_LEAVES;
            case "trail_lightning" -> ParticleTypes.ELECTRIC_SPARK;
            case "trail_shadow" -> ParticleTypes.SMOKE;
            case "trail_creeper" -> ParticleTypes.HAPPY_VILLAGER;
            case "trail_ender" -> ParticleTypes.PORTAL;
            case "trail_lava" -> ParticleTypes.LAVA;
            case "trail_noten" -> ParticleTypes.NOTE;
            case "trail_herzen" -> ParticleTypes.HEART;
            case "trail_sterne" -> ParticleTypes.END_ROD;
            case "trail_pilze" -> ParticleTypes.CRIMSON_SPORE;
            case "trail_wither" -> ParticleTypes.SMOKE;
            case "trail_sculk" -> ParticleTypes.SCULK_SOUL;
            case "trail_magma" -> ParticleTypes.DRIPPING_LAVA;
            case "trail_pixel" -> ParticleTypes.CRIT;
            case "trail_aurora" -> ParticleTypes.ENCHANT;
            case "trail_sakura" -> ParticleTypes.CHERRY_LEAVES;
            case "trail_odin" -> ParticleTypes.ENCHANTED_HIT;
            default -> ParticleTypes.END_ROD;
        };
    }

    private ParticleEffect getAuraParticle(String id) {
        return switch (id) {
            case "aura_flame" -> ParticleTypes.FLAME;
            case "aura_snow" -> ParticleTypes.SNOWFLAKE;
            case "aura_hearts" -> ParticleTypes.HEART;
            case "aura_music" -> ParticleTypes.NOTE;
            case "aura_enchant" -> ParticleTypes.ENCHANT;
            case "aura_lightning" -> ParticleTypes.ELECTRIC_SPARK;
            case "aura_cherry" -> ParticleTypes.CHERRY_LEAVES;
            case "aura_void" -> ParticleTypes.PORTAL;
            case "aura_rainbow" -> ParticleTypes.END_ROD;
            case "aura_bubbles" -> ParticleTypes.BUBBLE;
            case "aura_skulls" -> ParticleTypes.SMOKE;
            case "aura_diamond" -> ParticleTypes.CRIT;
            case "aura_bats" -> ParticleTypes.SMOKE;
            case "aura_wither" -> ParticleTypes.SMOKE;
            case "aura_creeper" -> ParticleTypes.HAPPY_VILLAGER;
            case "aura_drache" -> ParticleTypes.DRAGON_BREATH;
            case "aura_fruehling" -> ParticleTypes.CHERRY_LEAVES;
            case "aura_sommer" -> ParticleTypes.END_ROD;
            case "aura_herbst" -> ParticleTypes.CRIMSON_SPORE;
            case "aura_winter" -> ParticleTypes.SNOWFLAKE;
            case "aura_einhorn" -> ParticleTypes.END_ROD;
            case "aura_schatten" -> ParticleTypes.SMOKE;
            case "aura_sonnen" -> ParticleTypes.END_ROD;
            case "aura_sculk" -> ParticleTypes.SCULK_SOUL;
            case "aura_poseidon" -> ParticleTypes.DRIPPING_WATER;
            case "aura_hades" -> ParticleTypes.SOUL_FIRE_FLAME;
            case "aura_zeus" -> ParticleTypes.ELECTRIC_SPARK;
            case "aura_neon" -> ParticleTypes.GLOW;
            case "aura_kawaii" -> ParticleTypes.HEART;
            case "aura_vulkan" -> ParticleTypes.LAVA;
            default -> ParticleTypes.END_ROD;
        };
    }

    private ParticleEffect getParticleEffect(String id) {
        return switch (id) {
            case "particle_feuer" -> ParticleTypes.FLAME;
            case "particle_wasser" -> ParticleTypes.DRIPPING_WATER;
            case "particle_erde" -> ParticleTypes.CRIMSON_SPORE;
            case "particle_luft" -> ParticleTypes.CLOUD;
            case "particle_endportal" -> ParticleTypes.PORTAL;
            case "particle_totem" -> ParticleTypes.TOTEM_OF_UNDYING;
            case "particle_seelen" -> ParticleTypes.SOUL_FIRE_FLAME;
            case "particle_redstone" -> ParticleTypes.CRIT;
            case "particle_nether" -> ParticleTypes.SOUL_FIRE_FLAME;
            case "particle_kirschbluete" -> ParticleTypes.CHERRY_LEAVES;
            case "particle_drache" -> ParticleTypes.DRAGON_BREATH;
            case "particle_schatten" -> ParticleTypes.SMOKE;
            case "particle_sonnenstaub" -> ParticleTypes.END_ROD;
            case "particle_lichtfunken" -> ParticleTypes.ELECTRIC_SPARK;
            case "particle_schneesturm" -> ParticleTypes.SNOWFLAKE;
            case "particle_gluehwurm" -> ParticleTypes.GLOW;
            case "particle_warden" -> ParticleTypes.SCULK_SOUL;
            case "particle_aurora" -> ParticleTypes.ENCHANT;
            case "particle_tornado" -> ParticleTypes.CLOUD;
            case "particle_pixel" -> ParticleTypes.CRIT;
            case "particle_halloween" -> ParticleTypes.SMOKE;
            case "particle_ostern" -> ParticleTypes.CHERRY_LEAVES;
            default -> ParticleTypes.END_ROD;
        };
    }
}
