// ============================================================
// Sociabuzz → Roblox Bridge
// Pure Node.js — tanpa Express, kompatibel Vercel Serverless
// ============================================================

let latestDonation = {
    id: "START",
    donator: "System",
    amount: 0,
    message: "Ready",
    timestamp: 0
};

const BLOCKED_NAMES = ["anonymous", "anon", "system", "unknown", ""];

function isBlocked(name) {
    if (!name) return true;
    return BLOCKED_NAMES.includes(name.trim().toLowerCase());
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let raw = "";
        req.on("data", chunk => raw += chunk);
        req.on("end", () => {
            try { resolve(JSON.parse(raw)); }
            catch (e) { resolve({}); }
        });
        req.on("error", reject);
    });
}

module.exports = async function handler(req, res) {
    const url = req.url.split("?")[0];

    // ── GET / ────────────────────────────────────────────────
    if (req.method === "GET" && (url === "/" || url === "")) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end("SERVER AKTIF");
    }

    // ── GET /api/donations/latest ────────────────────────────
    if (req.method === "GET" && url === "/api/donations/latest") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(latestDonation));
    }

    // ── POST /api/webhook/sociabuzz ──────────────────────────
    if (req.method === "POST" && url === "/api/webhook/sociabuzz") {
        const d = await parseBody(req);

        console.log("[SOCIABUZZ RAW]", JSON.stringify(d));

        // Ambil nama dari semua kemungkinan field Sociabuzz
        const rawName =
            d.donator_name ||
            d.supporter_name ||
            d.user_name ||
            d.username ||
            d.name ||
            d.from ||
            d.sender ||
            "";

        const finalName = rawName.trim();

        // Block nama kosong / anonymous
        if (isBlocked(finalName)) {
            console.warn("[SOCIABUZZ] Nama diblok atau kosong:", JSON.stringify(d));
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("OK_SKIPPED_NO_NAME");
        }

        latestDonation = {
            id:        d.order_id || d.invoice_id || d.transaction_id || Date.now().toString(),
            donator:   finalName,
            amount:    parseInt(d.amount_raw || d.amount || 0),
            message:   d.message || d.note || "",
            timestamp: Math.floor(Date.now() / 1000)
        };

        console.log("[SOCIABUZZ] OK:", finalName, "| Rp", latestDonation.amount);
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end("OK");
    }

    // ── 404 fallback ─────────────────────────────────────────
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("NOT FOUND");
};
