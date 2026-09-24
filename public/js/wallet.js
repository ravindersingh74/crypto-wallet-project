// Wallet Dashboard & Transaction Functions
const Wallet = {
  async fetchWithAuth(url, options = {}) {
    const token = Auth.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        Auth.logout();
      }
      throw new Error(data.error || 'Request failed');
    }

    return data;
  },

  truncateAddress(addr) {
    if (!addr) return '';
    if (addr.length <= 14) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  },

  copyAddress(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btnElement.textContent;
      btnElement.textContent = 'Copied!';
      setTimeout(() => {
        btnElement.textContent = original;
      }, 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  },

  // Load Dashboard Overview
  async initDashboard() {
    Auth.requireAuth();

    try {
      const data = await this.fetchWithAuth('/api/wallet/balance');
      const { walletAddress, balances, prices, usdTotal } = data;

      // Update total USD balance
      const totalUsdElem = document.getElementById('total-usd');
      if (totalUsdElem) totalUsdElem.textContent = `$${usdTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // Update Wallet Address
      const addrElem = document.getElementById('user-wallet-address');
      if (addrElem) addrElem.textContent = walletAddress;

      // Update individual balances
      const btcBal = document.getElementById('btc-balance');
      if (btcBal) btcBal.textContent = `${balances.BTC || 0} BTC`;
      const btcVal = document.getElementById('btc-val');
      if (btcVal) btcVal.textContent = `$${((balances.BTC || 0) * prices.BTC).toFixed(2)}`;

      const ethBal = document.getElementById('eth-balance');
      if (ethBal) ethBal.textContent = `${balances.ETH || 0} ETH`;
      const ethVal = document.getElementById('eth-val');
      if (ethVal) ethVal.textContent = `$${((balances.ETH || 0) * prices.ETH).toFixed(2)}`;

      const tstBal = document.getElementById('tst-balance');
      if (tstBal) tstBal.textContent = `${balances.TST || 0} TST`;
      const tstVal = document.getElementById('tst-val');
      if (tstVal) tstVal.textContent = `$${((balances.TST || 0) * prices.TST).toFixed(2)}`;

      // Load Recent Transactions
      this.loadRecentTransactions(walletAddress);

    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  },

  async loadRecentTransactions(userAddress) {
    const tableBody = document.getElementById('recent-tx-table-body');
    if (!tableBody) return;

    try {
      const { transactions } = await this.fetchWithAuth('/api/wallet/transactions');

      if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No transactions found yet.</td></tr>`;
        return;
      }

      // Display top 5 recent
      const recent = transactions.slice(0, 5);
      tableBody.innerHTML = recent.map(tx => {
        const isSend = tx.type === 'SEND' && tx.senderAddress.toLowerCase() === userAddress.toLowerCase();
        const typeBadge = isSend 
          ? `<span class="badge badge-send">SENT</span>` 
          : tx.type === 'FAUCET' 
            ? `<span class="badge badge-faucet">FAUCET</span>`
            : `<span class="badge badge-receive">RECEIVED</span>`;

        const otherAddr = isSend ? tx.recipientAddress : tx.senderAddress;

        return `
          <tr>
            <td><code title="${tx.txHash}">${this.truncateAddress(tx.txHash)}</code></td>
            <td>${typeBadge}</td>
            <td><strong>${tx.amount} ${tx.asset}</strong></td>
            <td><code>${this.truncateAddress(otherAddr)}</code></td>
            <td><span class="badge badge-completed">${tx.status}</span></td>
            <td>${this.formatDate(tx.timestamp)}</td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--danger-color);">Error loading transactions</td></tr>`;
    }
  },

  // Init Send Page
  initSendPage() {
    Auth.requireAuth();

    const sendForm = document.getElementById('send-crypto-form');
    if (!sendForm) return;

    sendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('send-alert');
      alertBox.style.display = 'none';

      const recipientAddress = document.getElementById('recipientAddress').value.trim();
      const asset = document.getElementById('assetSelect').value;
      const amount = document.getElementById('amountInput').value.trim();
      const memo = document.getElementById('memoInput').value.trim();

      const btn = sendForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Processing Transaction...';

      try {
        const result = await this.fetchWithAuth('/api/wallet/send', {
          method: 'POST',
          body: JSON.stringify({ recipientAddress, asset, amount, memo })
        });

        alertBox.className = 'alert alert-success';
        alertBox.innerHTML = `
          <strong>Transaction Sent!</strong><br>
          ${result.message}<br>
          <small>Tx Hash: <code>${result.transaction.txHash}</code></small>
        `;
        alertBox.style.display = 'block';

        sendForm.reset();
      } catch (err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = err.message;
        alertBox.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Cryptocurrency';
      }
    });
  },

  // Init Receive Page
  async initReceivePage() {
    Auth.requireAuth();

    try {
      const data = await this.fetchWithAuth('/api/wallet/balance');
      const userAddress = data.walletAddress;

      const addrDisplay = document.getElementById('receive-wallet-address');
      if (addrDisplay) addrDisplay.textContent = userAddress;

      // Generate SVG QR Code
      if (window.generateQRCodeSVG) {
        window.generateQRCodeSVG(userAddress, 'qrcode-container', 180);
      }

      // Faucet button handler
      const faucetBtn = document.getElementById('faucet-btn');
      if (faucetBtn) {
        faucetBtn.addEventListener('click', async () => {
          const faucetAlert = document.getElementById('faucet-alert');
          faucetAlert.style.display = 'none';

          const asset = document.getElementById('faucet-asset').value;
          faucetBtn.disabled = true;
          faucetBtn.textContent = 'Claiming...';

          try {
            const res = await this.fetchWithAuth('/api/wallet/faucet', {
              method: 'POST',
              body: JSON.stringify({ asset, amount: asset === 'TST' ? 500 : 1.0 })
            });

            faucetAlert.className = 'alert alert-success';
            faucetAlert.textContent = res.message;
            faucetAlert.style.display = 'block';
          } catch (err) {
            faucetAlert.className = 'alert alert-danger';
            faucetAlert.textContent = err.message;
            faucetAlert.style.display = 'block';
          } finally {
            faucetBtn.disabled = false;
            faucetBtn.textContent = 'Claim Testnet Funds';
          }
        });
      }

    } catch (err) {
      console.error('Failed to load receive page:', err);
    }
  },

  // Init Transaction History Page
  async initHistoryPage() {
    Auth.requireAuth();

    const tableBody = document.getElementById('full-history-table-body');
    if (!tableBody) return;

    try {
      const user = Auth.getUser();
      const { transactions } = await this.fetchWithAuth('/api/wallet/transactions');

      if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No transaction history found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = transactions.map(tx => {
        const isSend = tx.type === 'SEND' && user && tx.senderAddress.toLowerCase() === user.walletAddress.toLowerCase();
        const typeBadge = isSend 
          ? `<span class="badge badge-send">SENT</span>` 
          : tx.type === 'FAUCET' 
            ? `<span class="badge badge-faucet">FAUCET</span>`
            : `<span class="badge badge-receive">RECEIVED</span>`;

        return `
          <tr>
            <td><code title="${tx.txHash}">${this.truncateAddress(tx.txHash)}</code></td>
            <td>${typeBadge}</td>
            <td><strong>${tx.amount} ${tx.asset}</strong></td>
            <td><code>${this.truncateAddress(tx.senderAddress)}</code></td>
            <td><code>${this.truncateAddress(tx.recipientAddress)}</code></td>
            <td>${tx.fee} ${tx.asset}</td>
            <td>${this.formatDate(tx.timestamp)}</td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger-color);">Error loading transaction history</td></tr>`;
    }
  }
};
