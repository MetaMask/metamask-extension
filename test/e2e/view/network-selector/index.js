import { clickByText } from '../../lib/helpers'
const {
  mainnet,
  ropsten,
  kovan,
  rinkeby,
  goerli,
  localhost,
  customRPC,
} = require('../../../../app/_locales/en/messages.json')

module.exports = {
  clickMainnet,
  clickRopsten,
  clickKovan,
  clickRinkeby,
  clickGoerli,
  clickLocalhost,
  clickCustomRpc,
}

async function clickMainnet (page) {
  await clickByText(page, mainnet.message)
}

async function clickRopsten (page) {
  await clickByText(page, ropsten.message)

}

async function clickKovan (page) {
  await clickByText(page, kovan.message)

}

async function clickRinkeby (page) {
  await clickByText(page, rinkeby.message)

}

async function clickGoerli (page) {
  await clickByText(page, goerli.message)
}

async function clickLocalhost (page) {
  await clickByText(page, localhost.message)
}


async function clickCustomRpc (page) {
  await clickByText(page, customRPC.message)
}
