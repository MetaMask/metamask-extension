const util = require('./util')

function tokenInfoGetter () {
  const tokens = {}

  return async (address) => {
    if (tokens[address]) {
      return tokens[address]
    }

    tokens[address] = await getSymbolAndDecimals(address)

    return tokens[address]
  }
}

async function getSymbolAndDecimals (tokenAddress, existingTokens = []) {
  const existingToken = existingTokens.find(({ address }) => tokenAddress === address)
  if (existingToken) {
    return {
      symbol: existingToken.symbol,
      decimals: existingToken.decimals,
    }
  }
  
  let result = []
  try {
    const token = util.getContractAtAddress(tokenAddress)

    result = await Promise.all([
      token.symbol(),
      token.decimals(),
    ])
  } catch (err) {
    console.log(`symbol() and decimal() calls for token at address ${tokenAddress} resulted in error:`, err)
  }

  const [ symbol = [], decimals = [] ] = result

  return {
    symbol: symbol[0],
    decimals: decimals[0],
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
  getSymbolAndDecimals,
}
