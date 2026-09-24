require('../moduleResolver');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DataStore = require('../services/dataStore');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { generateWalletAddress, generateSeedPhrase, generateTxHash } = require('../utils/cryptoUtils');

// Register User & Create Wallet
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check existing user
    const existingUser = await DataStore.findUserByEmailOrUsername(email, username);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists.' });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate wallet credentials
    const walletAddress = generateWalletAddress();
    const seedPhrase = generateSeedPhrase();

    const newUser = await DataStore.createUser({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      walletAddress,
      seedPhrase,
      balances: {
        BTC: 0.5,
        ETH: 2.5,
        TST: 1000.0
      }
    });

    // Create initial Welcome Faucet transaction
    await DataStore.createTransaction({
      txHash: generateTxHash(),
      senderAddress: '0x0000000000000000000000000000000000000000',
      recipientAddress: walletAddress,
      asset: 'ETH',
      amount: 2.5,
      fee: 0,
      type: 'FAUCET',
      status: 'COMPLETED',
      memo: 'Initial Genesis Sandbox Funding'
    });

    // Create JWT Token
    const userId = newUser._id || newUser.id;
    const token = jwt.sign(
      { userId, walletAddress: newUser.walletAddress },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Wallet created successfully!',
      token,
      user: {
        id: userId,
        username: newUser.username,
        email: newUser.email,
        walletAddress: newUser.walletAddress,
        seedPhrase: newUser.seedPhrase,
        balances: newUser.balances
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const user = await DataStore.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const userId = user._id || user.id;
    const token = jwt.sign(
      { userId, walletAddress: user.walletAddress },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: userId,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        seedPhrase: user.seedPhrase,
        balances: user.balances
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get Current User Profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await DataStore.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userId = user._id || user.id;
    res.json({
      user: {
        id: userId,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        seedPhrase: user.seedPhrase,
        balances: user.balances,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

module.exports = router;
