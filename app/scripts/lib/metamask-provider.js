const ProviderEngine = require('web3-provider-engine')
const NonceTrackerSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js')
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const VmSubprovider = require('web3-provider-engine/subproviders/vm.js')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')

module.exports = metamaskProvider

function metamaskProvider(opts){

  var engine = new ProviderEngine()

  // nonce tracker
  engine.addProvider(new NonceTrackerSubprovider())

  // cache layer
  engine.addProvider(new CacheSubprovider())

  // static results
  engine.addProvider(new FixtureSubprovider({
    web3_clientVersion: 'MetaMask-ProviderEngine/v0.0.0/javascript',
    net_listening: true,
    eth_hashrate: '0x0',
    eth_mining: false,
    eth_syncing: true,
  }))

  // filters
  engine.addProvider(new FilterSubprovider())

  // vm
  engine.addProvider(new VmSubprovider())

  // id mgmt
  engine.addProvider(new HookedWalletSubprovider({
    getAccounts: opts.getAccounts,
    approveTx: opts.approveTx,
    signTransaction: opts.signTransaction,
  }))

  // data source
  engine.addProvider(new RpcSubprovider({
    rpcUrl: opts.rpcUrl,
  }))

  // log new blocks
  engine.on('block', function(block){
    // console.log('================================')
    console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
    // console.log('================================')
  })

  // start polling for blocks
  engine.start()

  return engine

}