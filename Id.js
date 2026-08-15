const fs = require('fs-extra');
const path = require('path');

const SESSION_FILE = './session.json';

module.exports = {
  saveCreds: async (creds) => {
    await fs.writeJson(SESSION_FILE, creds, { spaces: 2 });
  },
  loadCreds: async () => {
    if (await fs.pathExists(SESSION_FILE)) {
      return await fs.readJson(SESSION_FILE);
    }
    return null;
  },
  deleteSession: async () => {
    if (await fs.pathExists(SESSION_FILE)) {
      await fs.remove(SESSION_FILE);
    }
  }
};
