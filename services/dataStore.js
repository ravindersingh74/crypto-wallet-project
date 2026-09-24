require('../moduleResolver');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// In-Memory Storage Cache fallback if Mongoose is offline
const memoryStore = {
  users: [],
  transactions: []
};

function checkMongoose() {
  return mongoose.connection.readyState === 1;
}

const DataStore = {
  async findUserByEmailOrUsername(email, username) {
    if (checkMongoose()) {
      return await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }]
      });
    }
    return memoryStore.users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() || u.username === username
    );
  },

  async findUserByEmail(email) {
    if (checkMongoose()) {
      return await User.findOne({ email: email.toLowerCase() });
    }
    return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  async findUserById(id) {
    if (checkMongoose()) {
      return await User.findById(id);
    }
    return memoryStore.users.find(u => u.id === id || u._id === id);
  },

  async findUserByWalletAddress(address) {
    if (checkMongoose()) {
      return await User.findOne({ 
        walletAddress: { $regex: new RegExp(`^${address.trim()}$`, 'i') } 
      });
    }
    return memoryStore.users.find(u => u.walletAddress.toLowerCase() === address.trim().toLowerCase());
  },

  async createUser(userData) {
    if (checkMongoose()) {
      const user = new User(userData);
      await user.save();
      return user;
    }
    const user = {
      _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ...userData,
      createdAt: new Date()
    };
    memoryStore.users.push(user);
    return user;
  },

  async updateUserBalances(userId, newBalances) {
    if (checkMongoose()) {
      const user = await User.findById(userId);
      if (user) {
        user.balances = newBalances;
        await user.save();
        return user;
      }
    }
    const user = memoryStore.users.find(u => u.id === userId || u._id === userId);
    if (user) {
      user.balances = newBalances;
    }
    return user;
  },

  async createTransaction(txData) {
    if (checkMongoose()) {
      const tx = new Transaction(txData);
      await tx.save();
      return tx;
    }
    const tx = {
      _id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ...txData,
      timestamp: new Date()
    };
    memoryStore.transactions.push(tx);
    return tx;
  },

  async getUserTransactions(walletAddress) {
    if (checkMongoose()) {
      return await Transaction.find({
        $or: [
          { senderAddress: walletAddress },
          { recipientAddress: { $regex: new RegExp(`^${walletAddress}$`, 'i') } }
        ]
      }).sort({ timestamp: -1 });
    }
    const addr = walletAddress.toLowerCase();
    return memoryStore.transactions
      .filter(t => t.senderAddress.toLowerCase() === addr || t.recipientAddress.toLowerCase() === addr)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async getTransactionByHash(txHash) {
    if (checkMongoose()) {
      return await Transaction.findOne({ txHash });
    }
    return memoryStore.transactions.find(t => t.txHash === txHash);
  }
};

module.exports = DataStore;
