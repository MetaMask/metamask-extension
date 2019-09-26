const ethAbi = require('ethereumjs-abi')
const ethUtil = require('ethereumjs-util')
const { TOKEN_TRANSFER_FUNCTION_SIGNATURE } = require('../send.constants')

function addHexPrefixToObjectValues (obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    return { ...newObj, [key]: ethUtil.addHexPrefix(obj[key]) }
  }, {})
}

function constructTxParams ({ selectedToken, data, to, amount, from, gas, gasPrice }) {
  const txParams = {
    data,
    from,
    value: '0',
    gas,
    gasPrice,
  }

  if (!selectedToken) {
    txParams.value = amount
    txParams.to = to
  }

  return addHexPrefixToObjectValues(txParams)
}

function constructUpdatedTx ({
  amount,
  data,
  editingTransactionId,
  from,
  gas,
  gasPrice,
  selectedToken,
  to,
  unapprovedTxs,
}) {
  const unapprovedTx = unapprovedTxs[editingTransactionId]
  const txParamsData = unapprovedTx.txParams.data ? unapprovedTx.txParams.data : data

  const editingTx = {
    ...unapprovedTx,
    txParams: Object.assign(
      unapprovedTx.txParams,
      addHexPrefixToObjectValues({
        data: txParamsData,
        to,
        from,
        gas,
        gasPrice,
        value: amount,
      })
    ),
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
  }

  if (typeof editingTx.txParams.data === 'undefined') {
    delete editingTx.txParams.data
  }

  return editingTx
}

function addressIsNew (toAccounts, newAddress) {
  const newAddressNormalized = newAddress.toLowerCase()
  const foundMatching = toAccounts.some(({ address }) => address.toLowerCase() === newAddressNormalized)
  return !foundMatching
}

module.exports = {
  addressIsNew,
  constructTxParams,
  constructUpdatedTx,
  addHexPrefixToObjectValues,
}
