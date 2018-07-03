const ethAbi = require('ethereumjs-abi')
const ethUtil = require('ethereumjs-util')
const { TOKEN_TRANSFER_FUNCTION_SIGNATURE } = require('../send.constants')

function addHexPrefixToObjectValues (obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    return { ...newObj, [key]: ethUtil.addHexPrefix(obj[key]) }
  }, {})
}

function constructTxParams ({ selectedToken, to, amount, from, gas, gasPrice }) {
  const txParams = {
    from,
    value: '0',
    gas,
    gasPrice,
  }

  if (!selectedToken) {
    txParams.value = amount
    txParams.to = to
  }

  const hexPrefixedTxParams = addHexPrefixToObjectValues(txParams)

  return hexPrefixedTxParams
}

function constructUpdatedTx ({
  amount,
  editingTransactionId,
  from,
  gas,
  gasPrice,
  selectedToken,
  to,
  unapprovedTxs,
}) {
  const editingTx = {
    ...unapprovedTxs[editingTransactionId],
    txParams: addHexPrefixToObjectValues({ from, gas, gasPrice }),
  }

  if (selectedToken) {
    const data = TOKEN_TRANSFER_FUNCTION_SIGNATURE + Array.prototype.map.call(
      ethAbi.rawEncode(['address', 'uint256'], [to, ethUtil.addHexPrefix(amount)]),
      x => ('00' + x.toString(16)).slice(-2)
    ).join('')

    Object.assign(editingTx.txParams, addHexPrefixToObjectValues({
      value: '0',
      to: selectedToken.address,
      data,
    }))
  } else {
    const { data } = unapprovedTxs[editingTransactionId].txParams

    Object.assign(editingTx.txParams, addHexPrefixToObjectValues({
      value: amount,
      to,
      data,
    }))

    if (typeof editingTx.txParams.data === 'undefined') {
      delete editingTx.txParams.data
    }
  }

  return editingTx
}

function addressIsNew (toAccounts, newAddress) {
  return !toAccounts.find(({ address }) => newAddress === address)
}

module.exports = {
  addressIsNew,
  constructTxParams,
  constructUpdatedTx,
  addHexPrefixToObjectValues,
}
