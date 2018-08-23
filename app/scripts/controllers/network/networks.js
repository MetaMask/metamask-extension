'use strict'
var networks = function() {}

const {
  CLASSIC,
  CLASSIC_CODE,
} = require('./enums')

networks.networkList = {
  [CLASSIC]: {
    'chainId': CLASSIC_CODE,
    'ticker': 'ETC',
    'blockExplorerTx': 'https://gastracker.io/tx/[[txHash]]',
    'blockExplorerAddr': 'https://gastracker.io/addr/[[address]]',
    'blockExplorerToken': 'https://gastracker.io/token/[[tokenAddress]]/[[address]]',
    'service': 'ETC Cooperative',
    'rpcUrl': 'https://ethereumclassic.network',
    'exchanges': ['ShapeShift'],
    'buyUrl': '',
  },
}

module.exports = networks
