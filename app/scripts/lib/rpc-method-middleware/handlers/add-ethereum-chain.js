import { ethErrors } from 'eth-json-rpc-errors'
import validUrl from 'valid-url'
// import { NETWORK_TO_NAME_MAP as DEFAULT_NETWORK_MAP } from '../../../controllers/network/enums'
import { omit } from 'lodash'
import { isPrefixedFormattedHexString } from '../../util'
import { MESSAGE_TYPE } from '../../../../../shared/constants/app'

const addEthereumChain = {
  methodNames: [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN],
  implementation: addEthereumChainHandler,
}
export default addEthereumChain

async function addEthereumChainHandler(
  req,
  res,
  _next,
  end,
  { addCustomRpc, customRpcExistsWith, requestUserApproval },
) {
  if (!req.params?.[0] || typeof req.params[0] !== 'object') {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected single, object parameter. Received:\n${req.params}`,
      }),
    )
  }

  const { origin } = req

  const {
    chainId,
    chainName = null,
    blockExplorerUrls = null,
    nativeCurrency = null,
    rpcUrls,
  } = req.params[0]

  const otherKeys = Object.keys(
    omit(req.params[0], [
      'chainId',
      'chainName',
      'blockExplorerUrls',
      'iconUrl',
      'rpcUrls',
      'nativeCurrency',
    ]),
  )

  if (otherKeys.length > 0) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys}`,
      }),
    )
  }

  const firstValidRPCUrl = Array.isArray(rpcUrls)
    ? rpcUrls.find((rpcUrl) => validUrl.isHttpsUri(rpcUrl))
    : null

  const firstValidBlockExplorerUrl =
    blockExplorerUrls !== null && Array.isArray(blockExplorerUrls)
      ? blockExplorerUrls.find((blockExplorerUrl) =>
          validUrl.isHttpsUri(blockExplorerUrl),
        )
      : null

  if (!firstValidRPCUrl) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
      }),
    )
  }

  const _chainId = typeof chainId === 'string' && chainId.toLowerCase()
  if (!isPrefixedFormattedHexString(_chainId)) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
      }),
    )
  }

  // TODO: Check specified chain ID against endpoint chain ID, as in custom network form.

  // TODO: Disallow adding default networks
  // if (DEFAULT_NETWORK_MAP[_chainId]) {
  //   return end(ethErrors.rpc.invalidParams({
  //     message: `May not specify default MetaMask chain.`,
  //   }))
  // }

  if (typeof chainName !== 'string' || !chainName) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected non-empty string 'chainName'. Received:\n${chainName}`,
      }),
    )
  }
  const _chainName =
    chainName.length > 100 ? chainName.substring(0, 100) : chainName

  if (nativeCurrency !== null && typeof nativeCurrency !== 'object') {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected null or object 'nativeCurrency'. Received:\n${nativeCurrency}`,
      }),
    )
  }

  if (
    nativeCurrency !== null &&
    (!nativeCurrency.decimals || nativeCurrency.decimals !== 18)
  ) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${nativeCurrency.decimals}`,
      }),
    )
  }

  if (
    nativeCurrency !== null &&
    (!nativeCurrency.symbol || typeof nativeCurrency.symbol !== 'string')
  ) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected a string 'nativeCurrency.symbol'. Received: ${nativeCurrency.symbol}`,
      }),
    )
  }

  const ticker = nativeCurrency?.symbol || 'ETH'

  // TODO: how long should the ticker be?
  if (typeof ticker !== 'string' || ticker.length < 2 || ticker.length > 12) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected 3-12 character string 'nativeCurrency.symbol'. Received:\n${ticker}`,
      }),
    )
  }

  if (blockExplorerUrls !== null && !firstValidBlockExplorerUrl) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected null or array with at least one valid string HTTPS URL 'blockExplorerUrl'. Received: ${blockExplorerUrls}`,
      }),
    )
  }

  if (customRpcExistsWith({ rpcUrl: firstValidRPCUrl, chainId: _chainId })) {
    return end(
      ethErrors.rpc.internal({
        message: `Ethereum chain with the given RPC URL and chain ID already exists.`,
        data: { rpcUrl: firstValidRPCUrl, chainId },
      }),
    )
  }

  try {
    await addCustomRpc(
      await requestUserApproval({
        origin,
        type: MESSAGE_TYPE.ADD_ETHEREUM_CHAIN,
        requestData: {
          chainId: _chainId,
          blockExplorerUrl: firstValidBlockExplorerUrl,
          chainName: _chainName,
          rpcUrl: firstValidRPCUrl,
          ticker,
        },
      }),
    )
    res.result = null
  } catch (error) {
    return end(error)
  }
  return end()
}
