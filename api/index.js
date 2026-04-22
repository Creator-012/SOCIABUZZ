// ============================================================
// Sociabuzz → Roblox Bridge (Optimized)
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

async function parseBody(req) {
    return new Promise((resolve) => {
        let raw = "";
        req.on("data", chunk => raw += chunk);
        req.on("end", () => {
            try { 
                resolve(JSON.parse(raw)); 
            } catch (e) { 
                resolve({}); 
            }
        });
    });
}

module.exports = async function handler(req, res) {
    const url = req.url.split("?")[0];

    // CORS Headers agar bisa dicek dari browser/external
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    try {
        if (req.method === "GET" && (url === "/" || url === "")) {
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("SERVER AKTIF");
        }

        if (req.method === "GET" && url === "/api/donations/latest") {
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(latestDonation));
        }

        if (req.method === "POST" && url === "/api/webhook/sociabuzz") {
            const d = await parseBody(req);
            
            // Mencari nama donatur dari berbagai kemungkinan field JSON
            const rawName = d.donator_name || d.supporter_name || d.user_name || d.name || "";
            const finalName = rawName.trim();

            if (isBlocked(finalName)) {
                res.writeHead(200, { "Content-Type": "text/plain" });
                return res.end("OK_SKIPPED");
            }

            // Update memori server
            latestDonation = {
                id: d.order_id || d.transaction_id || Date.now().toString(),
                donator: finalName,
                amount: parseInt(d.amount_raw || d.amount || 0),
                message: d.message || d.note || "",
                timestamp: Math.floor(Date.now() / 1000)
            };

            console.log(`[SOCIABUZZ] Donasi Baru: ${finalName} - Rp${latestDonation.amount}`);
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("OK");
        }
    } catch (err) {
        console.error("Internal Error:", err);
        res.writeHead(500);
        res.end("Internal Server Error");
    }

    res.writeHead(404);
    res.end("NOT FOUND");
};
