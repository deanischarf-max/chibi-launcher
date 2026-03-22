package art.chibi.cosmetics;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.MinecraftClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Chibi Cosmetics - reads equipped cosmetics from launcher data file.
 * Minimal version that only loads data and logs it.
 * NO rendering (avoids crash from unknown API signatures).
 * The data is available for other mods/rendering to use.
 */
public class ChibiCosmetics implements ClientModInitializer {
    public static final Logger LOG = LoggerFactory.getLogger("ChibiCosmetics");
    public static CosmeticsData data;
    private int tick = 0;

    @Override
    public void onInitializeClient() {
        LOG.info("[ChibiCosmetics] Starting...");
        try {
            data = CosmeticsData.load();
            if (data != null) {
                LOG.info("[ChibiCosmetics] Player: {}", data.playerName);
            } else {
                LOG.info("[ChibiCosmetics] No cosmetics data found");
            }
        } catch (Exception e) {
            LOG.warn("[ChibiCosmetics] Init error", e);
        }

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            try {
                if (client.player == null) return;
                tick++;
                if (tick % 1200 == 0) {
                    try { data = CosmeticsData.load(); } catch (Exception e) {}
                }
            } catch (Exception e) {}
        });
    }
}
