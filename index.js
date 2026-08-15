// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const pino = require('pino');
const handleMessage = require('./msg');
const { saveCreds, loadCreds } = require('./Id');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const BOT_NAME = process.env.BOT_NAME || 'Champion MD';

// ---------- EXPRESS WEB SERVER ----------
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // for main.html

// Serve main.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

// API endpoints for status, admin control, etc.
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', bot: BOT_NAME, uptime: process.uptime() });
});

app.get('/api/admins', (req, res) => {
  const admins = fs.readJsonSync('./admin.json');
  res.json(admins);
});

// Start web server
app.listen(PORT, () => {
  console.log(`🌐 Web dashboard running at http://localhost:${PORT}`);
});

// ---------- WHATSAPP BOT ----------
async function startBot() {
  const { state, saveCreds: save } = await useMultiFileAuthState('session');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: [BOT_NAME, 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', save);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ WhatsApp connected!');
    }
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ Logged out. Delete session and re-pair.');
        await fs.remove('./session');
      } else {
        console.log('🔄 Reconnecting...');
        setTimeout(() => startBot(), 5000);
      }
    }
  });

  // Message handler
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && msg.message) {
      await handleMessage(sock, msg);
    }
  });

  // Optional: send presence online
  sock.sendPresenceUpdate('available');
}

startBot().catch(console.error);
