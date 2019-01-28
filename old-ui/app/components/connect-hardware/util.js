import { LEDGER } from './enum'

function isLedger (device) {
	return device && device.toLowerCase().includes(LEDGER)
}

function isTrezor (device) {
  return device && device.toLowerCase().includes('trezor')
}

function getHdPaths () {
  return [
    {
      label: `Ledger Live`,
      value: `m/44'/60'/0'/0/0`,
    },
    {
      label: `Legacy (MEW / MyCrypto)`,
      value: `m/44'/60'/0'`,
    },
  ]
}

module.exports = {
	isLedger,
  isTrezor,
	getHdPaths,
}
