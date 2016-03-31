const ProviderEngine = require('web3-provider-engine/index.js')
const DefaultFixture = require('web3-provider-engine/subproviders/default-fixture.js')
const NonceTrackerSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js')
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')
const EtherscanSubprovider = require('web3-provider-engine/subproviders/etherscan.js')


module.exports = ZeroClientProvider


function ZeroClientProvider(opts){
  opts = opts || {}

  var engine = new ProviderEngine()

  // static
  var staticSubprovider = new DefaultFixture()
  engine.addProvider(staticSubprovider)

  // nonce tracker
  engine.addProvider(new NonceTrackerSubprovider())

  // cache layer
  var cacheSubprovider = new CacheSubprovider()
  engine.addProvider(cacheSubprovider)

  // filters
  var filterSubprovider = new FilterSubprovider()
  engine.addProvider(filterSubprovider)

  // id mgmt
  var idmgmtSubprovider = new HookedWalletSubprovider({
    getAccounts: opts.getAccounts,
    approveTransaction: opts.approveTransaction,
    signTransaction: opts.signTransaction,
  })
  engine.addProvider(idmgmtSubprovider)

  // data source
  var dataProvider
  if (!opts.etherscan) {
    dataProvider = new RpcSubprovider({
      rpcUrl: opts.rpcUrl || 'https://testrpc.metamask.io/',
    })
  } else {
    dataProvider = new EtherscanSubprovider()
  }
  engine.addProvider(dataProvider)

  // // log new blocks
  // engine.on('block', function(block){
  //   console.log('================================')
  //   console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
  //   console.log('================================')
  // })

  // start polling
  engine.start()

  return engine

}
