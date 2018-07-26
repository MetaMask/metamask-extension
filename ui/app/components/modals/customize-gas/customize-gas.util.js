import ethUtil from 'ethereumjs-util'
import { conversionUtil } from '../../../conversion-util'

export function getDecimalGasLimit (hexGasLimit) {
  return conversionUtil(hexGasLimit, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  })
}

export function getDecimalGasPrice (hexGasPrice) {
  return conversionUtil(hexGasPrice, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  })
}

export function getPrefixedHexGasLimit (gasLimit) {
  return ethUtil.addHexPrefix(conversionUtil(gasLimit, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  }))
}

export function getPrefixedHexGasPrice (gasPrice) {
  return ethUtil.addHexPrefix(conversionUtil(gasPrice, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  }))
}
