const fs = require('fs');
const path = require('path');

function loadClient() {
  const file = path.join(__dirname, 'client.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {
      slug: 'carstyle',
      brand: { name: 'Boutique' },
      colors: { primary: '#D90429', secondary: '#0a0a0a' },
      contact: { whatsapp: '', email: '' }
    };
  }
}

module.exports = loadClient();
