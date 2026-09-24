const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txHash: {
    type: String,
    required: true,
    unique: true
  },
  senderAddress: {
    type: String,
    required: true
  },
  recipientAddress: {
    type: String,
    required: true
  },
  asset: {
    type: String,
    enum: ['BTC', 'ETH', 'TST'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    required: true,
    default: 0.0001
  },
  type: {
    type: String,
    enum: ['SEND', 'RECEIVE', 'FAUCET'],
    required: true
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'PENDING', 'FAILED'],
    default: 'COMPLETED'
  },
  memo: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
