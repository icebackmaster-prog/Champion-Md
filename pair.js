const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { saveCreds } = require('./Id');

async function startPairing() {
  const { state, saveCreds: save } = await useMultiFileAuthState('session');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ['Champion MD', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', save);
  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    if (qr) {
      console.log('Scan this QR with WhatsApp:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      console.log('✅ Bot connected!');
      process.exit(0);
    }
  });
}

startPairing();
