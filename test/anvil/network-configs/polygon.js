const LocalNetwork = require('../anvil-setup');
const options = {
  blockTime: 2,
  chainId: 137,
  port: 8545,
  forkUrl: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  forkBlockNumber: 54810322,
};

async function polygon_Setup(addressToSeed) {
  const anvil = new LocalNetwork();
  await anvil.start(options);
  const testClient = anvil.getProvider().testClient;

  try {
    await testClient.setBalance({
      address: addressToSeed,
      value: '0xA968163F0A57B400000'
    })

  } catch (e) {
    console.log(e)
  }

}

polygon_Setup(process.env.ADDRESS)