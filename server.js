require("dotenv").config();

const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// TELEGRAM
// ===============================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS
  ? process.env.TELEGRAM_CHAT_IDS.split(",").map(id => id.trim()).filter(Boolean)
  : [];

if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
  console.error("❌ Telegram ENV variables are missing");
}

// гарантируем fetch (Node 18+)
const fetch = global.fetch;

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.json());

// ===============================
// DATABASE
// ===============================
const db = new sqlite3.Database(process.env.DB_PATH || "./database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    telegram TEXT,
    page TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ===============================
// API
// ===============================
app.post("/api/lead", async (req, res) => {
  const { name, email, telegram, page } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false });
  }

  db.run(
    `INSERT INTO leads (name, email, telegram, page)
     VALUES (?, ?, ?, ?)`,
    [name, email, telegram || null, page || null],
    async (err) => {
      if (err) {
        console.error("❌ DB error:", err);
        return res.status(500).json({ success: false });
      }

      const timestamp = new Date().toLocaleString();

      const message = `
📩 New lead from PhoneX

👤 Name: ${name}
📧 Email: ${email}
💬 Telegram: ${telegram || "—"}
🌐 Page: ${page || "—"}
🕒 Time: ${timestamp}
      `;

      for (const chatId of TELEGRAM_CHAT_IDS) {
        try {
          const tgRes = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
              }),
            }
          );

          const tgJson = await tgRes.json();
          if (!tgJson.ok) {
            console.error(`❌ Telegram API error (${chatId}):`, tgJson);
          }

        } catch (error) {
          console.error(`❌ Telegram ERROR (${chatId}):`, error);
        }
      }

      res.json({ success: true });
    }
  );
});

// ===============================
// STATIC
// ===============================
app.use(express.static("public"));

// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
