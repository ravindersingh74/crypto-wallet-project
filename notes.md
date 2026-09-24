# Created Files & Architecture

# 1.Backend Infrastructure:



## server.js
: Main Express server serving page routes (/, /login, /register, /dashboard, /send, /receive, /history) and static assets.


## middleware/auth.js
: JWT token authentication middleware.


## services/dataStore.js
: Unified data service supporting MongoDB / Mongoose with an automatic zero-config in-memory fallback.


## utils/cryptoUtils.js
: Generators for crypto wallet addresses (0x...), 12-word seed phrases, and transaction hashes.

# 2. Database Models & API Routes:



## models/User.js  & models/Transaction.js
 
: User and transaction schemas.


## routes/auth.js
: User registration with bcrypt password hashing, login authentication, and user profile endpoints.


## routes/wallet.js
: Wallet balance lookup, crypto send transactions with fee calculations, testnet faucet dispenser, and full transaction history routes.

# 3. Frontend Application (Human-Made Aesthetic):



## public/css/style.css
: Clean, readable, non-overengineered CSS with responsive card grids, navigation header, status badges, and standard form controls.


## public/js/auth.js
: Client-side session management and page guards.


## public/js/wallet.js
: Live balance updates, send form handlers, faucet deposit claims, and transaction table population.


## public/js/qrcode.js
: Offline SVG QR code generator script for scan-to-pay functionality.

## Multi-Page HTML Layout:


### public/index.html
: Landing Page.


### public/login.html
: Login Page.


### public/register.html
: Registration & 12-word Seed Phrase Backup Page.


### public/dashboard.html
: Wallet Dashboard (Total USD balance, BTC, ETH, TST asset cards).


### public/send.html
: Send Crypto Page.


### public/receive.html
: Receive QR Code & Faucet Page.


### public/history.html
: Full Transaction Ledger Page.