const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true
  },
  seedPhrase: {
    type: String,
    required: true
  },
  balances: {
    BTC: { type: Number, default: 0.5 },
    ETH: { type: Number, default: 2.5 },
    TST: { type: Number, default: 1000.0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
