import { decimalToHex } from '../../helpers/utils/conversions.util'
import { calcTokenValue } from '../../helpers/utils/token-util.js'

export function getCustomTxParamsData (data, { customPermissionAmount, tokenAmount, decimals }) {
  if (customPermissionAmount) {
    const tokenValue = decimalToHex(calcTokenValue(tokenAmount, decimals))

    const re = new RegExp('(^.+)' + tokenValue + '$')
    const matches = re.exec(data)

    if (!matches || !matches[1]) {
      return data
    }
    let dataWithoutCurrentAmount = matches[1]
    const customPermissionValue = decimalToHex(calcTokenValue(Number(customPermissionAmount), decimals))

    const differenceInLengths = customPermissionValue.length - tokenValue.length
    const zeroModifier = dataWithoutCurrentAmount.length - differenceInLengths
    if (differenceInLengths > 0) {
      dataWithoutCurrentAmount = dataWithoutCurrentAmount.slice(0, zeroModifier)
    } else if (differenceInLengths < 0) {
      dataWithoutCurrentAmount = dataWithoutCurrentAmount.padEnd(zeroModifier, 0)
    }

    const customTxParamsData = dataWithoutCurrentAmount + customPermissionValue
    return customTxParamsData
  }
}
