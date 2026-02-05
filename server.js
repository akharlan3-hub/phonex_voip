require("dotenv").config();

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;


// ===============================
// НАСТРОЙКИ TELEGRAM
// ===============================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;



// ===============================
// MIDDLEWARE
// ===============================
app.use(express.json());
app.use(express.static("public"));

// ===============================
// DATABASE
// ===============================
const db = new sqlite3.Database("./database.db");

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
    return res.status(400).json({ error: "Invalid data" });
  }

  db.run(
    `INSERT INTO leads (name, email, telegram, page)
     VALUES (?, ?, ?, ?)`,
    [name, email, telegram, page],
    async function (err) {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "DB error" });
      }

      const message = `
📩 Новая заявка с сайта PhoneX

👤 Имя: ${name}
📧 Email: ${email}
💬 Telegram: ${telegram || "—"}
🌐 Страница: ${page}
🕒 Время: ${new Date().toLocaleString()}
      `;

      // 🔔 TELEGRAM → личка + группа
      for (const chatId of CHAT_IDS) {
        try {
          const tgRes = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: message
              })
            }
          );

          const tgText = await tgRes.text();
          console.log(`Telegram response (${chatId}):`, tgText);

        } catch (error) {
          console.error(`Telegram ERROR (${chatId}):`, error);
        }
      }

      res.json({ success: true });
    }
  );
});

// ===============================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
