require('../moduleResolver');
const express = require('express');
const router = express.Router();
const DataStore = require('../services/dataStore');
const { authMiddleware } = require('../middleware/auth');
const { generateTxHash } = require('../utils/cryptoUtils');

// Mock prices in USD for estimated total balance calculation
const MOCK_PRICES = {
  BTC: 65000.00,
  ETH: 3400.00,
  TST: 1.50
};

// GET Wallet Overview & Balances
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const user = await DataStore.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const balances = user.balances || { BTC: 0, ETH: 0, TST: 0 };
    const usdTotal = 
      ((balances.BTC || 0) * MOCK_PRICES.BTC) +
      ((balances.ETH || 0) * MOCK_PRICES.ETH) +
      ((balances.TST || 0) * MOCK_PRICES.TST);

    res.json({
      walletAddress: user.walletAddress,
      balances,
      prices: MOCK_PRICES,
      usdTotal: Number(usdTotal.toFixed(2))
    });
  } catch (err) {
    console.error('Balance error:', err);
    res.status(500).json({ error: 'Failed to fetch wallet balances.' });
  }
});

// POST Send Cryptocurrency
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { recipientAddress, asset, amount, memo } = req.body;

    if (!recipientAddress || !asset || !amount) {
      return res.status(400).json({ error: 'Recipient address, asset, and amount are required.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    if (!['BTC', 'ETH', 'TST'].includes(asset)) {
      return res.status(400).json({ error: 'Unsupported asset type.' });
    }

    const sender = await DataStore.findUserById(req.user.userId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender user not found.' });
    }

    if (sender.walletAddress.toLowerCase() === recipientAddress.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Cannot send cryptocurrency to your own address.' });
    }

    const fee = asset === 'TST' ? 0.5 : 0.0002;
    const totalRequired = numAmount + fee;

    const currentBalance = sender.balances[asset] || 0;
    if (currentBalance < totalRequired) {
      return res.status(400).json({
        error: `Insufficient ${asset} balance. Required: ${totalRequired} ${asset} (including ${fee} fee), Available: ${currentBalance} ${asset}`
      });
    }

    // Deduct from sender
    const updatedSenderBalances = {
      ...sender.balances,
      [asset]: Number((currentBalance - totalRequired).toFixed(6))
    };
    await DataStore.updateUserBalances(sender._id || sender.id, updatedSenderBalances);

    // Credit recipient if registered in system
    const recipient = await DataStore.findUserByWalletAddress(recipientAddress);
    if (recipient) {
      const recipientCurrent = recipient.balances[asset] || 0;
      const updatedRecipientBalances = {
        ...recipient.balances,
        [asset]: Number((recipientCurrent + numAmount).toFixed(6))
      };
      await DataStore.updateUserBalances(recipient._id || recipient.id, updatedRecipientBalances);
    }

    // Record Transaction
    const txHash = generateTxHash();
    const newTx = await DataStore.createTransaction({
      txHash,
      senderAddress: sender.walletAddress,
      recipientAddress: recipientAddress.trim(),
      asset,
      amount: numAmount,
      fee,
      type: 'SEND',
      status: 'COMPLETED',
      memo: memo || ''
    });

    res.json({
      message: `Successfully sent ${numAmount} ${asset}`,
      transaction: newTx,
      updatedBalances: updatedSenderBalances
    });

  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ error: 'Failed to process transaction.' });
  }
});

// POST Claim Faucet Test Funds
router.post('/faucet', authMiddleware, async (req, res) => {
  try {
    const { asset, amount } = req.body;
    const targetAsset = asset || 'ETH';
    const numAmount = parseFloat(amount) || 1.0;

    if (!['BTC', 'ETH', 'TST'].includes(targetAsset)) {
      return res.status(400).json({ error: 'Unsupported asset type.' });
    }

    const user = await DataStore.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const currentBal = user.balances[targetAsset] || 0;
    const updatedBalances = {
      ...user.balances,
      [targetAsset]: Number((currentBal + numAmount).toFixed(6))
    };

    await DataStore.updateUserBalances(user._id || user.id, updatedBalances);

    const txHash = generateTxHash();
    const faucetTx = await DataStore.createTransaction({
      txHash,
      senderAddress: '0xFAUCET_TESTNET_GENESIS_DISPENSER',
      recipientAddress: user.walletAddress,
      asset: targetAsset,
      amount: numAmount,
      fee: 0,
      type: 'FAUCET',
      status: 'COMPLETED',
      memo: 'Testnet Sandbox Faucet Deposit'
    });

    res.json({
      message: `Claimed ${numAmount} ${targetAsset} from faucet!`,
      transaction: faucetTx,
      updatedBalances
    });

  } catch (err) {
    console.error('Faucet error:', err);
    res.status(500).json({ error: 'Faucet request failed.' });
  }
});

// GET Transaction History
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const user = await DataStore.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const txs = await DataStore.getUserTransactions(user.walletAddress);
    res.json({ transactions: txs });
  } catch (err) {
    console.error('Transactions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction history.' });
  }
});

// GET Single Transaction Detail by TxHash
router.get('/transaction/:txHash', authMiddleware, async (req, res) => {
  try {
    const tx = await DataStore.getTransactionByHash(req.params.txHash);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    res.json({ transaction: tx });
  } catch (err) {
    console.error('Single Tx fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction details.' });
  }
});

module.exports = router;
