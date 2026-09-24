const crypto = require('crypto');

const WORD_LIST = [
  'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
  'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
  'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
  'yankee', 'zulu', 'anchor', 'beacon', 'crypto', 'digital', 'ether', 'forge',
  'glacier', 'haven', 'island', 'jungle', 'kingdom', 'lunar', 'matrix', 'nexus'
];

function generateWalletAddress() {
  const bytes = crypto.randomBytes(20);
  return '0x' + bytes.toString('hex');
}

function generateSeedPhrase() {
  const words = [];
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
    words.push(WORD_LIST[randomIndex]);
  }
  return words.join(' ');
}

function generateTxHash() {
  const bytes = crypto.randomBytes(32);
  return '0x' + bytes.toString('hex');
}

module.exports = {
  generateWalletAddress,
  generateSeedPhrase,
  generateTxHash
};
