const { createAnvil } = require("@viem/anvil");
const { createAnvilClients } = require("./anvil-clients");

const defaultOptions = {
  blockTime: 2,
  chainId: 1337,
  mnemonic: 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
  port: 8545,
  hardfork: 'London',
  silent: false,
};


class LocalNetwork {

  async start(opts) {

    this.server = createAnvil(opts);
    await this.server.start();

    console.log("Server started");

  }

  getProvider() {
    const { walletClient, publicClient, testClient } = createAnvilClients(this.server);
    return { walletClient, publicClient, testClient };
  }

  async getAccounts() {
    const walletClient = this.getProvider()?.walletClient;
    const accounts = await walletClient.getAddresses();
    return accounts;
  }

  async getBalance() {
    const accounts = await this.getAccounts();
    const publicClient = this.getProvider().publicClient;

    if (!accounts || !accounts[0] || !publicClient) {
      console.log('No accounts found');
      return 0;
    }
    const balanceInt = await publicClient.getBalance({
      address: accounts[0]
    });
    const balanceFormatted = Number(balanceInt) / 10 ** 18;

    return balanceFormatted;
  }

  async quit() {
    if (!this.server) {
      throw new Error('Server not running yet');
    }
    try {
      console.log("Terminating the server");
      await this.server.stop();
    } catch (e) {
        console.log('Caught error while closing Anvil network:', e);
    }
  }
}

module.exports = LocalNetwork;