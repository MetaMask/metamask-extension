const abi = require('human-standard-token-abi')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')

const tokenInfoGetter = function () {
  if (typeof global.ethereumProvider === 'undefined') return

  const eth = new Eth(global.ethereumProvider)
  const contract = new EthContract(eth)
  const TokenContract = contract(abi)

  const tokens = {}

  return async (address) => {
    if (tokens[address]) {
      return tokens[address]
    }

    const contract = TokenContract.at(address)

    const result = await Promise.all([
      contract.symbol(),
      contract.decimals(),
    ])

    const [ symbol = [], decimals = [] ] = result

    tokens[address] = { symbol: symbol[0], decimals: decimals[0] }

    return tokens[address]
  }
}

function calcTokenAmount (value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0))
  const amount = Number(value / multiplier)

  return amount
}


module.exports = {
  tokenInfoGetter,
  calcTokenAmount,
}
