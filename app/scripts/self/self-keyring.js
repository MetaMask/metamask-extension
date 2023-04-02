import SelfConnect from './SelfConnect';

class SelfKeyring extends EventEmitter {
  addAccounts(n = 1) {
    return new Promise((resolve, reject) => {
      this.unlock()
        .then(async (_) => {
          const from = this.unlockedAccount;
          const to = from + n;
          this.accounts = [];

          for (let i = from; i < to; i++) {
            const address = SelfConnect.getAccounts(i).address;

            this.accounts.push(address);
            this.accountIndexes[ethUtil.toChecksumAddress(address)] = i;
            this.page = 0;
          }
          resolve(this.accounts); //resolve the new accounts
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  signTransaction(address, tx) {
    return new Promise(async (resolve, reject) => {
      try {
        const signedTx = await SelfConnect.signTxCloud(tx);
        const txData = tx.toJSON();
        txData.v = ethUtil.addHexPrefix(signedTx.v);
        txData.r = ethUtil.addHexPrefix(signedTx.r);
        txData.s = ethUtil.addHexPrefix(signedTx.s);

        const common = tx.common;
        const freeze = Object.isFrozen(tx);
        const feeMarketTransaction = FeeMarketEIP1559Transaction.fromTxData(
          txData,
          { common, freeze },
        );
        resolve(feeMarketTransaction);
      } catch (err) {
        reject(new Error(err));
      }
    });
  }
}
