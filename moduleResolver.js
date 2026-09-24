const fs = require('fs');
const externalPath = 'C:\\Users\\ACER\\crypto_wallet_app\\node_modules';
if (fs.existsSync(externalPath)) {
  if (!module.paths.includes(externalPath)) {
    module.paths.unshift(externalPath);
    if (require('module').Module && require('module').Module._initPaths) {
      require('module').Module._initPaths();
    }
  }
}
