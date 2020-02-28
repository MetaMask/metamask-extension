import { LEDGER, TREZOR } from './enum'
import { RSK_CODE, RSK_TESTNET_CODE, CLASSIC_CODE } from '../../../../app/scripts/controllers/network/enums'

function isLedger (device) {
	return device && device.toLowerCase().includes(LEDGER)
}

function isTrezor (device) {
  return device && device.toLowerCase().includes(TREZOR)
}

function getHdPaths (network) {
  const networkInteger = parseInt(network, 10)
  let hdPaths
  if (customHdPaths.hasOwnProperty(networkInteger)) {
    hdPaths = [
      {
        label: `Ledger Live`,
        value: customHdPaths[networkInteger]['ledgerLive'],
      },
      {
        label: `Legacy (MEW / MyCrypto)`,
        value: customHdPaths[networkInteger]['ledger'],
      },
    ]
  } else {
    hdPaths = [
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
  return hdPaths
}

const hdRSKMainnetTrezorPath = `m/44’/137’/0’/0`
const hdRSKMainnetLedgerPath = `m/44’/137’/0’/0`
const hdRSKMainnetLedgerLivePath = `m/44’/137’/0’/0`

const hdRSKTestnetTrezorPath = `m/44’/37310’/0’/0`
const hdRSKTestnetLedgerPath = `m/44’/37310’/0’/0`
const hdRSKTestnetLedgerLivePath = `m/44’/37310’/0’/0`

const hdETCTrezorPath = `m/44'/61'/0'/0`
const hdETCLedgerPath = `m/44'/61'/0'/0/0`
const hdETCLedgerLivePath = `m/44'/61'`

const customHdPaths = {}
customHdPaths[RSK_CODE] = {
  trezor: hdRSKMainnetTrezorPath,
  ledger: hdRSKMainnetLedgerPath,
  ledgeLive: hdRSKMainnetLedgerLivePath,
}

customHdPaths[RSK_TESTNET_CODE] = {
  trezor: hdRSKTestnetTrezorPath,
  ledger: hdRSKTestnetLedgerPath,
  ledgeLive: hdRSKTestnetLedgerLivePath,
}

customHdPaths[CLASSIC_CODE] = {
  trezor: hdETCTrezorPath,
  ledger: hdETCLedgerPath,
  ledgeLive: hdETCLedgerLivePath,
}

module.exports = {
	isLedger,
  isTrezor,
  getHdPaths,
  customHdPaths,
}
