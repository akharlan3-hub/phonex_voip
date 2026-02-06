require("dotenv").config();

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// TELEGRAM
// ===============================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS
  ? process.env.TELEGRAM_CHAT_IDS.split(",").map(id => id.trim())
  : [];

if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
  console.error("❌ Telegram ENV variables are missing");
}

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
    return res.status(400).json({ success: false });
  }

  db.run(
    `INSERT INTO leads (name, email, telegram, page)
     VALUES (?, ?, ?, ?)`,
    [name, email, telegram, page],
    async (err) => {
      if (err) {
        console.error("❌ DB error:", err);
        return res.status(500).json({ success: false });
      }

      const message = `
📩 New lead from PhoneX

👤 Name: ${name}
📧 Email: ${email}
💬 Telegram: ${telegram || "—"}
🌐 Page: ${page}
🕒 Time: ${new Date().toLocaleString()}
      `;

      // 🔔 TELEGRAM → личка + группа
      for (const chatId of TELEGRAM_CHAT_IDS) {
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
          console.log(`✅ Telegram (${chatId}):`, tgText);

        } catch (error) {
          console.error(`❌ Telegram ERROR (${chatId}):`, error);
        }
      }

      res.json({ success: true });
    }
  );
});

// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS
  ? process.env.TELEGRAM_CHAT_IDS.split(",").map(id => id.trim())
  : [];

app.post("/api/contact", async (req, res) => {
  const { name, email, telegram } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const text = `
📩 Новая заявка
Имя: ${name}
Email: ${email}
Telegram: ${telegram || "-"}
`;

  try {
    for (const chatId of TELEGRAM_CHAT_IDS) {
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
          }),
        }
      );
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Telegram error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
