import { decimalToHex } from '../../helpers/utils/conversions.util'
import { calcTokenValue } from '../../helpers/utils/token-util.js'
import { getTokenData } from '../../helpers/utils/transactions.util'

export function getCustomTxParamsData (data, { customPermissionAmount, decimals }) {
  const tokenData = getTokenData(data)

  if (!tokenData) {
    throw new Error(`Invalid data`)
  } else if (tokenData.name !== 'approve') {
    throw new Error(`Invalid data; should be 'approve' method, but instead is '${tokenData.name}'`)
  }
  let spender = tokenData.params[0].value
  if (spender.startsWith('0x')) {
    spender = spender.substring(2)
  }
  const [signature, tokenValue] = data.split(spender)

  let customPermissionValue = decimalToHex(calcTokenValue(customPermissionAmount, decimals))
  if (customPermissionValue.length > tokenValue.length) {
    throw new Error('Custom value too large')
  }

  customPermissionValue = customPermissionValue.padStart(tokenValue.length, '0')
  const customTxParamsData = signature + spender + customPermissionValue
  return customTxParamsData
}
