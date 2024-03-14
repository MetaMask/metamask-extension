const { createAnvil, createProxy, createPool } = require("@viem/anvil");
const createAnvilClients = require("./anvil-clients");
const fs = require('fs');

const defaultOptions = {
  // All anvil options are supported & typed.
  chainId: 1,
  port: 8545,
  //mnemonic: 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
  //blockTime: 19432267,
  //hardfork: 'Muirglacier',
  silent: false,
  accounts: 3,
  forkUrl: "https://mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8",
  //init: fs.readFileSync("test/anvil/genesis.json")
};

// Modify DAI Contract Storage to Own 50 DAIs
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const DAI_SLOT = "0x4cfee51209d3b53ed23a2fbf62b4517c25b6c8d772f285193445efcf6610712c";
const DAI_VALUE = "0x000000000000000000000000000000000000000000000002B5E3AF16B1880000";

// Modify ENS Contract Storage to Own an ENS
const ENS = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";
const ENS_SLOT = "0x2eaa2c9551f6c5af9914f3936eb972729afde59fbc6876afeb6236102e88ea1a";
const ENS_VALUE = "0x00000000000000000000000023618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f";

// Modify CRYPTOKITTY Contract Storage to Own a CRYPTOKITTY
const CRYPTOKITTY = "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d";
const CRYPTOKITTY_SLOT = "0xd9fbdcbb8ce2d4417e6ad68850ec200e7d37b49be27a4bff9848b9f2d04aa79a";
const CRYPTOKITTY_VALUE = "0x00000000000000000000000023618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f";

class Anvil {

  async start(opts) {
    try {
      this.anvil = createAnvil(opts);
    } catch(e) {
      console.log(e)
    }
    await this.anvil.start()
    console.log("SERVER STARTED")


    const { walletClient, publicClient, testClient } = createAnvilClients(this.anvil);

    const block = await publicClient.getBlock();
    console.log(block)
    const addresses = await walletClient.getAddresses();
    console.log(addresses)

    const id = await publicClient.getChainId();
    console.log(id)

    let blockNumber = await publicClient.getBlockNumber() // Public Action
    console.log("BLOCK", blockNumber)
   // await testClient.mine({ blocks: 19432267 }) // Test Action

    blockNumber = await publicClient.getBlockNumber()



    await testClient.setBalance({
      address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
      value: '0xA968163F0A57B400000'
    })

    await testClient.setStorageAt({
      address: DAI,
      index: DAI_SLOT,
      value: DAI_VALUE
    })

    await testClient.setStorageAt({
      address: CRYPTOKITTY,
      index: CRYPTOKITTY_SLOT,
      value: CRYPTOKITTY_VALUE
    })


    await testClient.setStorageAt({
      address: ENS,
      index: ENS_SLOT,
      value: ENS_VALUE
    })

    console.log("STORAGE SET")
   //await this.anvil.stop();

  }

  async quit() {
    if (!this.anvil) {
      throw new Error('Server not running yet');
    }
    try {
      await this.anvil.stop();
    } catch (e) {
      // We can safely ignore the EBUSY error
      if (e.code !== 'EBUSY') {
        console.log('Caught error while Ganache closing:', e);
      }
    }
  }
}

const anv = new Anvil();
anv.start(defaultOptions);