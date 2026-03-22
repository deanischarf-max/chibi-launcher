package art.chibi.cosmetics;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.particle.ParticleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChibiCosmetics implements ClientModInitializer {
    public static final Logger LOG = LoggerFactory.getLogger("ChibiCosmetics");
    public static CosmeticsData data;
    private int tick = 0;
    private boolean renderingWorks = true;

    @Override
    public void onInitializeClient() {
        LOG.info("[ChibiCosmetics] Starting...");
        try {
            data = CosmeticsData.load();
            if (data != null) LOG.info("[ChibiCosmetics] Player: {}", data.playerName);
        } catch (Exception e) {
            LOG.warn("[ChibiCosmetics] Init error", e);
        }

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            try {
                if (client.player == null || data == null) return;
                tick++;
                if (tick % 1200 == 0) {
                    try { data = CosmeticsData.load(); } catch (Exception e) {}
                }

                // Only try rendering if it hasn't crashed before
                if (!renderingWorks) return;

                try {
                    double x = client.player.getX();
                    double y = client.player.getY();
                    double z = client.player.getZ();

                    // Trail - particles behind player while moving
                    if (data.trail != null && tick % 3 == 0) {
                        double vx = client.player.getVelocity().x;
                        double vz = client.player.getVelocity().z;
                        if (Math.abs(vx) > 0.01 || Math.abs(vz) > 0.01) {
                            client.particleManager.addParticle(
                                ParticleTypes.END_ROD,
                                x + (Math.random() - 0.5) * 0.4,
                                y + 0.1,
                                z + (Math.random() - 0.5) * 0.4,
                                0.0, 0.02, 0.0
                            );
                        }
                    }

                    // Aura - ring around player
                    if (data.aura != null && tick % 5 == 0) {
                        double angle = (tick * 0.1) % (Math.PI * 2);
                        client.particleManager.addParticle(
                            ParticleTypes.ENCHANT,
                            x + Math.cos(angle) * 0.8,
                            y + 1.0,
                            z + Math.sin(angle) * 0.8,
                            0.0, 0.01, 0.0
                        );
                    }

                    // Hat - particles above head
                    if (data.hat != null && tick % 10 == 0) {
                        client.particleManager.addParticle(
                            ParticleTypes.END_ROD,
                            x, y + 2.2, z,
                            0.0, 0.0, 0.0
                        );
                    }

                    // Wings - particles behind shoulders
                    if (data.wings != null && tick % 4 == 0) {
                        double yaw = Math.toRadians(client.player.getYaw());
                        double bx = -Math.sin(yaw) * 0.3;
                        double bz = Math.cos(yaw) * 0.3;
                        client.particleManager.addParticle(
                            ParticleTypes.END_ROD,
                            x + bx + Math.cos(yaw) * 0.4,
                            y + 1.3,
                            z + bz + Math.sin(yaw) * 0.4,
                            0.0, 0.0, 0.0
                        );
                        client.particleManager.addParticle(
                            ParticleTypes.END_ROD,
                            x + bx - Math.cos(yaw) * 0.4,
                            y + 1.3,
                            z + bz - Math.sin(yaw) * 0.4,
                            0.0, 0.0, 0.0
                        );
                    }

                    // Cape - particles behind back
                    if (data.cape != null && tick % 4 == 0) {
                        double yaw = Math.toRadians(client.player.getYaw());
                        client.particleManager.addParticle(
                            ParticleTypes.ENCHANT,
                            x - Math.sin(yaw) * 0.35,
                            y + 0.8 + Math.random() * 0.5,
                            z + Math.cos(yaw) * 0.35,
                            0.0, -0.01, 0.0
                        );
                    }

                    // Pet - orbiting particles
                    if (data.pet != null && tick % 5 == 0) {
                        double angle = tick * 0.06;
                        client.particleManager.addParticle(
                            ParticleTypes.HAPPY_VILLAGER,
                            x + Math.cos(angle) * 1.5,
                            y + 0.5,
                            z + Math.sin(angle) * 1.5,
                            0.0, 0.01, 0.0
                        );
                    }

                } catch (Exception e) {
                    // If rendering crashes, disable it and log
                    renderingWorks = false;
                    LOG.error("[ChibiCosmetics] Rendering disabled due to error:", e);
                }
            } catch (Exception e) {}
        });
    }
}
