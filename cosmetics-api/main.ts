// Simple Cosmetics API for Chibi Launcher
// Deploy to Deno Deploy: https://dash.deno.com
// Or run locally: deno run --allow-net main.ts

const cosmetics = new Map<string, any>();

Deno.serve({ port: 8080 }, async (req: Request) => {
  const url = new URL(req.url);

  // CORS
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers });

  // POST /set - Save player cosmetics
  if (url.pathname === "/set" && req.method === "POST") {
    try {
      const body = await req.json();
      if (body.player && body.equipped) {
        cosmetics.set(body.player.toLowerCase(), {
          player: body.player,
          equipped: body.equipped,
          timestamp: Date.now(),
        });
        return new Response(JSON.stringify({ ok: true }), { headers });
      }
    } catch(e) {}
    return new Response(JSON.stringify({ error: "invalid" }), { status: 400, headers });
  }

  // GET /get/:name - Get player cosmetics
  if (url.pathname.startsWith("/get/")) {
    const name = url.pathname.split("/get/")[1]?.toLowerCase();
    const data = cosmetics.get(name || "");
    return new Response(JSON.stringify(data || null), { headers });
  }

  // GET /all - Get all players' cosmetics (for mod)
  if (url.pathname === "/all") {
    const all: any = {};
    for (const [k, v] of cosmetics) all[k] = v;
    return new Response(JSON.stringify(all), { headers });
  }

  // GET / - Status
  return new Response(JSON.stringify({
    status: "Chibi Cosmetics API",
    players: cosmetics.size,
  }), { headers });
});
