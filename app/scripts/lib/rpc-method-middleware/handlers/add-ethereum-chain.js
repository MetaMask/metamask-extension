import { ethErrors, errorCodes } from 'eth-rpc-errors';
import validUrl from 'valid-url';
import { omit } from 'lodash';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { jsonRpcRequest } from '../../../../../shared/modules/rpc.utils';
import { CHAIN_ID_TO_NETWORK_ID_MAP } from '../../../../../shared/constants/network';

const addEthereumChain = {
  methodNames: [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN],
  implementation: addEthereumChainHandler,
};
export default addEthereumChain;

async function addEthereumChainHandler(
  req,
  res,
  _next,
  end,
  {
    addCustomRpc,
    getCurrentChainId,
    findCustomRpcBy,
    updateRpcTarget,
    requestUserApproval,
    sendMetrics,
  },
) {
  if (!req.params?.[0] || typeof req.params[0] !== 'object') {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected single, object parameter. Received:\n${JSON.stringify(
          req.params,
        )}`,
      }),
    );
  }

  const { origin } = req;

  const {
    chainId,
    chainName = null,
    blockExplorerUrls = null,
    nativeCurrency = null,
    rpcUrls,
  } = req.params[0];

  const otherKeys = Object.keys(
    omit(req.params[0], [
      'chainId',
      'chainName',
      'blockExplorerUrls',
      'iconUrls',
      'rpcUrls',
      'nativeCurrency',
    ]),
  );

  if (otherKeys.length > 0) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys}`,
      }),
    );
  }

  const firstValidRPCUrl = Array.isArray(rpcUrls)
    ? rpcUrls.find((rpcUrl) => validUrl.isHttpsUri(rpcUrl))
    : null;

  const firstValidBlockExplorerUrl =
    blockExplorerUrls !== null && Array.isArray(blockExplorerUrls)
      ? blockExplorerUrls.find((blockExplorerUrl) =>
          validUrl.isHttpsUri(blockExplorerUrl),
        )
      : null;

  if (!firstValidRPCUrl) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
      }),
    );
  }

  if (blockExplorerUrls !== null && !firstValidBlockExplorerUrl) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected null or array with at least one valid string HTTPS URL 'blockExplorerUrl'. Received: ${blockExplorerUrls}`,
      }),
    );
  }

  const _chainId = typeof chainId === 'string' && chainId.toLowerCase();

  if (!isPrefixedFormattedHexString(_chainId)) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
      }),
    );
  }

  if (!isSafeChainId(parseInt(_chainId, 16))) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`,
      }),
    );
  }

  if (CHAIN_ID_TO_NETWORK_ID_MAP[_chainId]) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `May not specify default MetaMask chain.`,
      }),
    );
  }

  const existingNetwork = findCustomRpcBy({ chainId: _chainId });

  if (existingNetwork) {
    // If the network already exists, the request is considered successful
    res.result = null;

    const currentChainId = getCurrentChainId();
    if (currentChainId === _chainId) {
      return end();
    }

    // Ask the user to switch the network
    try {
      await updateRpcTarget(
        await requestUserApproval({
          origin,
          type: MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN,
          requestData: {
            rpcUrl: existingNetwork.rpcUrl,
            chainId: existingNetwork.chainId,
            nickname: existingNetwork.nickname,
            ticker: existingNetwork.ticker,
          },
        }),
      );
      res.result = null;
    } catch (error) {
      // For the purposes of this method, it does not matter if the user
      // declines to switch the selected network. However, other errors indicate
      // that something is wrong.
      if (error.code !== errorCodes.provider.userRejectedRequest) {
        return end(error);
      }
    }
    return end();
  }

  let endpointChainId;

  try {
    endpointChainId = await jsonRpcRequest(firstValidRPCUrl, 'eth_chainId');
  } catch (err) {
    return end(
      ethErrors.rpc.internal({
        message: `Request for method 'eth_chainId on ${firstValidRPCUrl} failed`,
        data: { networkErr: err },
      }),
    );
  }

  if (_chainId !== endpointChainId) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Chain ID returned by RPC URL ${firstValidRPCUrl} does not match ${_chainId}`,
        data: { chainId: endpointChainId },
      }),
    );
  }

  if (typeof chainName !== 'string' || !chainName) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected non-empty string 'chainName'. Received:\n${chainName}`,
      }),
    );
  }
  const _chainName =
    chainName.length > 100 ? chainName.substring(0, 100) : chainName;

  if (nativeCurrency !== null) {
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
      return end(
        ethErrors.rpc.invalidParams({
          message: `Expected null or object 'nativeCurrency'. Received:\n${nativeCurrency}`,
        }),
      );
    }
    if (nativeCurrency.decimals !== 18) {
      return end(
        ethErrors.rpc.invalidParams({
          message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${nativeCurrency.decimals}`,
        }),
      );
    }

    if (!nativeCurrency.symbol || typeof nativeCurrency.symbol !== 'string') {
      return end(
        ethErrors.rpc.invalidParams({
          message: `Expected a string 'nativeCurrency.symbol'. Received: ${nativeCurrency.symbol}`,
        }),
      );
    }
  }
  const ticker = nativeCurrency?.symbol || 'ETH';

  if (typeof ticker !== 'string' || ticker.length < 2 || ticker.length > 6) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected 2-6 character string 'nativeCurrency.symbol'. Received:\n${ticker}`,
      }),
    );
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
    );

    sendMetrics({
      event: 'Custom Network Added',
      category: 'Network',
      referrer: {
        url: origin,
      },
      sensitiveProperties: {
        chain_id: _chainId,
        rpc_url: firstValidRPCUrl,
        network_name: _chainName,
        // Including network to override the default network
        // property included in all events. For RPC type networks
        // the MetaMetrics controller uses the rpcUrl for the network
        // property.
        network: firstValidRPCUrl,
        symbol: ticker,
        block_explorer_url: firstValidBlockExplorerUrl,
        source: 'dapp',
      },
    });

    // Once the network has been added, the requested is considered successful
    res.result = null;
  } catch (error) {
    return end(error);
  }

  // Ask the user to switch the network
  try {
    await updateRpcTarget(
      await requestUserApproval({
        origin,
        type: MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN,
        requestData: {
          rpcUrl: firstValidRPCUrl,
          chainId: _chainId,
          nickname: _chainName,
          ticker,
        },
      }),
    );
  } catch (error) {
    // For the purposes of this method, it does not matter if the user
    // declines to switch the selected network. However, other errors indicate
    // that something is wrong.
    if (error.code !== errorCodes.provider.userRejectedRequest) {
      return end(error);
    }
  }
  return end();
}
