import ethAbi from 'ethereumjs-abi'
import ethUtil from 'ethereumjs-util'
import { TOKEN_TRANSFER_FUNCTION_SIGNATURE } from '../send.constants'

export function addHexPrefixToObjectValues (obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    return { ...newObj, [key]: ethUtil.addHexPrefix(obj[key]) }
  }, {})
}

export function constructTxParams ({ sendToken, data, to, amount, from, gas, gasPrice }) {
  const txParams = {
    data,
    from,
    value: '0',
    gas,
    gasPrice,
    //feeCurrency: '0x62492A644A588FD904270BeD06ad52B9abfEA1aE', //b-cusd
    //feeCurrency: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',//a-cusd
    feeCurrency:'',//native currency
    //feeCurrency: '0xdDc9bE57f553fe75752D61606B94CBD7e0264eF8',//b-cgld
    //feeCurrency: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',//a-cgld
    gatewayFeeRecipient: '0x0000000000000000000000000000000000000000',
    gatewayFee: '0',
  }

  if (!sendToken) {
    txParams.value = amount
    txParams.to = to
  }

  return addHexPrefixToObjectValues(txParams)
}

export function constructUpdatedTx ({
  amount,
  data,
  editingTransactionId,
  from,
  gas,
  gasPrice,
  sendToken,
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

    //feeCurrency: '0x62492A644A588FD904270BeD06ad52B9abfEA1aE', //b-cusd
    //feeCurrency: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',//a-cusd
    //feeCurrency: '0xdDc9bE57f553fe75752D61606B94CBD7e0264eF8',//b-cgld
    //feeCurrency: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',//a-cgld
    feeCurrency:'',//native currency
    //gatewayFeeRecipient: '0xdDc9bE57f553fe75752D61606B94CBD7e0264eF8',
    gatewayFeeRecipient: '0x0000000000000000000000000000000000000000',
    gatewayFee: '0',
      }),
    ),
  }

  if (sendToken) {
    const data = TOKEN_TRANSFER_FUNCTION_SIGNATURE + Array.prototype.map.call(
      ethAbi.rawEncode(['address', 'uint256'], [to, ethUtil.addHexPrefix(amount)]),
      (x) => ('00' + x.toString(16)).slice(-2),
    ).join('')

    Object.assign(editingTx.txParams, addHexPrefixToObjectValues({
      value: '0',
      to: sendToken.address,
      data,
    }))
  }

  if (typeof editingTx.txParams.data === 'undefined') {
    delete editingTx.txParams.data
  }

  return editingTx
}

export function addressIsNew (toAccounts, newAddress) {
  const newAddressNormalized = newAddress.toLowerCase()
  const foundMatching = toAccounts.some(({ address }) => address.toLowerCase() === newAddressNormalized)
  return !foundMatching
}
