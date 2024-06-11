import { hashMessage } from '@ethersproject/hash';
import { verifyMessage } from '@ethersproject/wallet';
import type { NetworkController } from '@metamask/network-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import { Json, JsonRpcParams, hasProperty, isObject } from '@metamask/utils';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from 'json-rpc-engine';
import {
  SIG_LEN,
  TRUSTED_SIGNERS,
} from '../../../../shared/constants/verification';
import { FIRST_PARTY_CONTRACT_NAMES } from '../../../../shared/constants/first-party-contracts';
import { Hex } from '@metamask/utils';

export type TxParams = {
  chainId?: `0x${string}`;
  data: string;
  from: string;
  to: string;
  value: string;
};

/**
 * Creates a middleware function that verifies bridge transactions from the
 * Portfolio.
 *
 * @param networkController - The network controller instance.
 * @returns The middleware function.
 */
export function createTxVerificationMiddleware(
  networkController: NetworkController,
) {
  return function txVerificationMiddleware(
    req: JsonRpcRequest<JsonRpcParams>,
    _res: JsonRpcResponse<Json>,
    next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
  ) {
    if (
      req.method !== 'eth_sendTransaction' ||
      !Array.isArray(req.params) ||
      !isValidParams(req.params)
    ) {
      return next();
    }

    // the tx object is the first element
    const params = req.params[0];

    console.log(params)
    console.log(params.chainId.toLowerCase() as Hex)

    const chainId =
      typeof params.chainId === 'string'
        ? params.chainId.toLowerCase() as Hex
        : networkController.state.providerConfig.chainId;

    // skip verification if bridge is not deployed on the specified chain.
    // skip verification to address is not the bridge contract
    const bridgeContractAddress =
      FIRST_PARTY_CONTRACT_NAMES['MetaMask Bridge'][chainId]?.toLowerCase();
    if (
      !bridgeContractAddress ||
      params.to.toLowerCase() !== bridgeContractAddress
    ) {
      return next();
    }

    // signature is 130 chars in length at the end
    const signature = `0x${params.data.slice(-SIG_LEN)}`;
    const addressToVerify = verifyMessage(hashedParams(params), signature);

    if (!TRUSTED_SIGNERS.map((s) => s.toLowerCase()).includes(addressToVerify.toLowerCase())) {
      return end(
        rpcErrors.invalidParams('Invalid bridge transaction signature.'),
      );
    }
    return next();
  };
}

function hashedParams(params: TxParams): string {
  const paramsToVerify = {
    to: hashMessage(params.to.toLowerCase()),
    from: hashMessage(params.from.toLowerCase()),
    data: hashMessage(
      params.data.toLowerCase().slice(0, params.data.length - SIG_LEN),
    ),
    value: hashMessage(params.value.toLowerCase()),
  };
  return hashMessage(JSON.stringify(paramsToVerify));
}

/**
 * Checks if the params of a JSON-RPC request are valid `eth_sendTransaction`
 * params.
 *
 * @param params - The params to validate.
 * @returns Whether the params are valid.
 */
function isValidParams(params: Json[]): params is [TxParams] {
  return (
    isObject(params[0]) &&
    typeof params[0].data === 'string' &&
    typeof params[0].from === 'string' &&
    typeof params[0].to === 'string' &&
    typeof params[0].value === 'string' &&
    (!hasProperty(params[0], 'chainId') ||
      (typeof params[0].chainId === 'string' &&
        params[0].chainId.startsWith('0x')))
  );
}
