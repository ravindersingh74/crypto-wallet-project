const path = require('path');
const fs = require('fs');



const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

// Page routes for multi-page app HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/send', (req, res) => res.sendFile(path.join(__dirname, 'public', 'send.html')));
app.get('/receive', (req, res) => res.sendFile(path.join(__dirname, 'public', 'receive.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'public', 'history.html')));

// Connect to MongoDB (with graceful fallback handling)
async function connectDatabase() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crypto_wallet_db';
  
  try {
    console.log(`Attempting connection to MongoDB (${mongoURI})...`);
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB database successfully!');
  } catch (err) {
    console.warn('Local MongoDB server not detected. Operating with robust in-memory DataStore mode!');
  }
}
if(require.main === module){

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Crypto Wallet Server running on http://localhost:${PORT}`);
  });
});

}
module.exports=app;
