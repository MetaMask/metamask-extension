import {
  MAINNET_CHAINID,
  ROPSTEN_CHAINID,
  RINKEBY_CHAINID,
  KOVAN_CHAINID,
  GOERLI_TESTNET_CHAINID,
  POA_CHAINID,
  DAI_CHAINID,
  POA_SOKOL_CHAINID,
  RSK_CHAINID,
  RSK_TESTNET_CHAINID,
  CLASSIC_CHAINID,
} from '../controllers/network/enums'

const standardNetworkId = {
  '1': MAINNET_CHAINID,
  '3': ROPSTEN_CHAINID,
  '4': RINKEBY_CHAINID,
  '42': KOVAN_CHAINID,
  '5': GOERLI_TESTNET_CHAINID,
  '99': POA_CHAINID,
  '100': DAI_CHAINID,
  '77': POA_SOKOL_CHAINID,
  '30': RSK_CHAINID,
  '31': RSK_TESTNET_CHAINID,
  '61': CLASSIC_CHAINID,
}

function selectChainId (metamaskState) {
  const { network, provider: { chainId } } = metamaskState
  return standardNetworkId[network] || `0x${parseInt(chainId, 10).toString(16)}`
}

export default selectChainId
