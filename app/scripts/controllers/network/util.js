const {
  POA,
  DAI,
  POA_SOKOL,
  MAINNET,
  ROPSTEN,
  RINKEBY,
  KOVAN,
  GOERLI_TESTNET,
  POA_CODE,
  DAI_CODE,
  POA_SOKOL_CODE,
  MAINNET_CODE,
  ROPSTEN_CODE,
  RINKEBY_CODE,
  KOVAN_CODE,
  GOERLI_TESTNET_CODE,
  POA_DISPLAY_NAME,
  DAI_DISPLAY_NAME,
  POA_SOKOL_DISPLAY_NAME,
  MAINNET_DISPLAY_NAME,
  ROPSTEN_DISPLAY_NAME,
  RINKEBY_DISPLAY_NAME,
  KOVAN_DISPLAY_NAME,
  GOERLI_TESTNET_DISPLAY_NAME,
  DROPDOWN_POA_DISPLAY_NAME,
  DROPDOWN_DAI_DISPLAY_NAME,
  DROPDOWN_POA_SOKOL_DISPLAY_NAME,
  DROPDOWN_MAINNET_DISPLAY_NAME,
  DROPDOWN_ROPSTEN_DISPLAY_NAME,
  DROPDOWN_RINKEBY_DISPLAY_NAME,
  DROPDOWN_KOVAN_DISPLAY_NAME,
  DROPDOWN_GOERLI_TESTNET_DISPLAY_NAME,
} = require('./enums')

const networks = {}

const POA_OBJ = {
  order: 1,
  providerName: POA,
  networkID: POA_CODE,
  displayName: POA_DISPLAY_NAME,
  displayNameDropdown: DROPDOWN_POA_DISPLAY_NAME,
}
networks[POA_CODE] = POA_OBJ
networks[POA] = POA_OBJ

const DAI_OBJ = {
  order: 2,
  providerName: DAI,
  networkID: DAI_CODE,
  displayName: DAI_DISPLAY_NAME,
  displayNameDropdown: DROPDOWN_DAI_DISPLAY_NAME,
}
networks[DAI_CODE] = DAI_OBJ
networks[DAI] = DAI_OBJ

const POA_SOKOL_OBJ = {
  order: 3,
  providerName: POA_SOKOL,
  networkID: POA_SOKOL_CODE,
  displayName: POA_SOKOL_DISPLAY_NAME,
  displayNameDropdown: DROPDOWN_POA_SOKOL_DISPLAY_NAME,
}
networks[POA_SOKOL_CODE] = POA_SOKOL_OBJ
networks[POA_SOKOL] = POA_SOKOL_OBJ

const MAINNET_OBJ = {
  order: 4,
  providerName: MAINNET,
  networkID: MAINNET_CODE,
  displayName: MAINNET_DISPLAY_NAME,
  displayNameDropdown: DROPDOWN_MAINNET_DISPLAY_NAME,
}
networks[MAINNET_CODE] = MAINNET_OBJ
networks[MAINNET] = MAINNET_OBJ

const ROPSTEN_OBJ = {
  order: 5,
  providerName: ROPSTEN,
  networkID: ROPSTEN_CODE,
  displayName: ROPSTEN_DISPLAY_NAME,
  displayNameDropdown: DROPDOWN_ROPSTEN_DISPLAY_NAME,
}
networks[ROPSTEN_CODE] = ROPSTEN_OBJ
networks[ROPSTEN] = ROPSTEN_OBJ

const KOVAN_OBJ = {
  order: 6,
  providerName: KOVAN,
  networkID: KOVAN_CODE,
  displayName: KOVAN_DISPLAY_NAME,
  displayNameDropdown: DROPDOWN_KOVAN_DISPLAY_NAME,
}
networks[KOVAN_CODE] = KOVAN_OBJ
networks[KOVAN] = KOVAN_OBJ

const RINKEBY_OBJ = {
  order: 7,
  providerName: RINKEBY,
  networkID: RINKEBY_CODE,
  displayName: RINKEBY_DISPLAY_NAME,
  displayNameDropdown: DROPDOWN_RINKEBY_DISPLAY_NAME,
}
networks[RINKEBY_CODE] = RINKEBY_OBJ
networks[RINKEBY] = RINKEBY_OBJ

const GOERLI_TESTNET_OBJ = {
  order: 7,
  providerName: GOERLI_TESTNET,
  networkID: GOERLI_TESTNET_CODE,
  displayName: GOERLI_TESTNET_DISPLAY_NAME,
  displayNameDropdown: DROPDOWN_GOERLI_TESTNET_DISPLAY_NAME,
}
networks[GOERLI_TESTNET_CODE] = GOERLI_TESTNET_OBJ
networks[GOERLI_TESTNET] = GOERLI_TESTNET_OBJ

const getNetworkDisplayName = key => networks[key].displayName

module.exports = {
  networks,
  getNetworkDisplayName,
}
