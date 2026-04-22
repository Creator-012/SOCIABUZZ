const express = require('express');
const app = express();
app.use(express.json());

let latestDonation = { id: "START", donator: "System", amount: 0, message: "Ready", timestamp: 0 };

app.get('/', (req, res) => res.send("SERVER AKTIF"));
app.get('/api/donations/latest', (req, res) => res.json(latestDonation));
app.post('/api/webhook/sociabuzz', (req, res) => {
    const d = req.body;

    // Log raw payload untuk debug (lihat di Vercel logs)
    console.log("[SOCIABUZZ RAW]", JSON.stringify(d));

    // Coba semua kemungkinan field nama dari Sociabuzz
    const donatorName =
        d.donator_name ||
        d.supporter_name ||
        d.user_name ||
        d.username ||
        d.name ||
        d.from ||
        d.sender ||
        "";

    const finalName = donatorName.trim();

    // Kalau nama kosong atau anonymous, skip — jangan masuk leaderboard
    if (!finalName || finalName.toLowerCase() === "anonymous") {
        console.warn("[SOCIABUZZ] Nama donatur tidak ditemukan, payload:", JSON.stringify(d));
        return res.status(200).send("OK_SKIPPED_NO_NAME");
    }

    latestDonation = {
        id:        d.order_id || d.invoice_id || d.transaction_id || Date.now().toString(),
        donator:   finalName,
        amount:    parseInt(d.amount_raw || d.amount || 0),
        message:   d.message || d.note || "",
        timestamp: Math.floor(Date.now() / 1000)
    };

    console.log("[SOCIABUZZ] Donasi diterima:", finalName, "| Rp", latestDonation.amount);
    res.status(200).send("OK");
});

module.exports = app;
