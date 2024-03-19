const { createAnvil } = require("@viem/anvil");
const { parseEther } = require("viem")
const { createOptimismClients } = require("../anvil-clients");

const l1Options = {
  port: 8545,
  chainId: 1,
  silent: false,
};

const l2Options = {
  port: 8546,
  chainId: 10,
  silent: false,
};

class LocalNetwork {

  async start(l1Options, l2Options) {

    this.l1Server = createAnvil(l1Options);
    await this.l1Server.start();

    this.l2Server = createAnvil(l2Options);
    await this.l2Server.start();
    console.log("Server started");

    const accts = await this.getAccounts();
    console.log(accts);

    let balance = await this.getBalanceL2();
    console.log(balance);
    //await this.depositL2();
    //await this.quit();
  }

  getProvider() {
    const { publicClientL1, walletClientL1, publicClientL2, walletClientL2 } =
      createOptimismClients(this.l1Server, this.l2Server);
    return { publicClientL1, walletClientL1, publicClientL2, walletClientL2 };
  }

  async getAccounts() {
    const walletClient = this.getProvider()?.walletClientL1;
    const accounts = await walletClient.getAddresses();
    return accounts;
  }

  async getBalanceL2() {
   //const accounts = await this.getAccounts();
    const publicClient = this.getProvider().publicClientL2;

    const balanceInt = await this.getProvider().publicClientL2.getBalance({
      address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    });
    const balanceFormatted = Number(balanceInt) / 10 ** 18;

    return balanceFormatted;
  }

  async depositL2() {
    const publicClientL2 = this.getProvider().publicClientL2;
    const res = await publicClientL2.buildDepositTransaction({
      mint: parseEther('1'),
      to: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    })
    console.log(res)

  }
  async estimateL1Gas() {
    const publicClientL2 = this.getProvider().publicClientL2;
    const l1Gas = await publicClientL2.estimateL1Gas({
      account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: parseEther('1')
    })
    console.log(l1Gas)
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

const anv = new LocalNetwork();
anv.start(l1Options, l2Options);

module.exports = LocalNetwork;