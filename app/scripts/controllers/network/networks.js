'use strict'
var networks = function() {}

const {
  CLASSIC,
  CLASSIC_CODE,
  EOSCLASSIC,
  EOSCLASSIC_CODE,
} = require('./enums')

networks.networkList = {
  [CLASSIC]: {
    'chainId': CLASSIC_CODE,
    'ticker': 'ETC',
    'blockExplorerTx': 'https://gastracker.io/tx/[[txHash]]',
    'blockExplorerAddr': 'https://gastracker.io/addr/[[address]]',
    'blockExplorerToken': 'https://gastracker.io/token/[[tokenAddress]]/[[address]]',
    'service': 'Ethereum Commonwealth',
    'rpcUrl': 'https://etc-geth.0xinfra.com',
  },
  [EOSCLASSIC]: {
    'chainId': EOSCLASSIC_CODE,
    'ticker': 'EOSC',
    'blockExplorerTx': 'https://explorer.eos-classic.io/tx/[[txHash]]',
    'blockExplorerAddr': 'https://explorer.eos-classic.io/addr/[[address]]',
    'blockExplorerToken': 'https://explorer.eos-classic.io/token/[[tokenAddress]]/[[address]]',
    'service': 'eos-classic.io',
    'rpcUrl': 'https://node.eos-classic.io',
  },
}

module.exports = networks
