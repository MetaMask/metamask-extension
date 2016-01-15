const ProviderEngine = require('web3-provider-engine')
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const StaticSubprovider = require('web3-provider-engine/subproviders/static.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const VmSubprovider = require('web3-provider-engine/subproviders/vm.js')
const LightWalletSubprovider = require('web3-provider-engine/subproviders/lightwallet.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')

module.exports = metamaskProvider

function metamaskProvider(opts){

  var engine = new ProviderEngine()

  // cache layer
  engine.addProvider(new CacheSubprovider())

  // static results
  engine.addProvider(new StaticSubprovider({
    web3_clientVersion: 'MetaMask-ProviderEngine/v0.0.0/javascript',
    net_listening: true,
    eth_hashrate: '0x0',
    eth_mining: false,
    eth_syncing: true,
  })

  // filters
  engine.addProvider(new FilterSubprovider())

  // vm
  engine.addProvider(new VmSubprovider())

  // id mgmt
  engine.addProvider(new LightWalletSubprovider())

  // data source
  engine.addProvider(new RpcSubprovider({
    rpcUrl: 'https://testrpc.metamask.io/',
  }))

  // log new blocks
  engine.on('block', function(block){
    // lazy hack - move caching and current block to engine
    engine.currentBlock = block
    console.log('================================')
    console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
    console.log('================================')
  })

  // start polling for blocks
  engine.start()

  return engine

}