import { addHexPrefix } from 'cfx-util'
import { multiplyCurrencies } from './conversion-util'

export function storageToDrip (storageLimit = '0x0') {
  if (typeof storageLimit === 'string') {
    storageLimit = addHexPrefix(storageLimit)
  }

  // 1024B storage = 1CFX = 1e9 gdrip
  // 1024B storage = 1CFX = 1e18 gdrip
  return multiplyCurrencies(
    addHexPrefix(storageLimit),
    addHexPrefix((1e18 / 1024).toString(16)),
    {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 16,
    }
  )
}
