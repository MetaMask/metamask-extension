import { hashMessage } from '@ethersproject/hash';
import { verifyMessage } from '@ethersproject/wallet';
import {
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from 'json-rpc-engine';
import { TRUSTED_BRIDGE_SIGNER } from '../../../../shared/constants/bridge';
import { FIRST_PARTY_CONTRACT_NAMES } from '../../../../shared/constants/first-party-contracts';

export function txVerificationMiddleware(
  req: JsonRpcRequest<JsonRpcParams>,
  _res: JsonRpcResponse<Json>,
  next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
) {
  // ignore if not sendTransaction and if the params not an array
  if (req.method !== 'eth_sendTransaction' || !Array.isArray(req.params)) {
    return next();
  }

  // 0 tx object is the first element
  const params = req.params[0];
  const paramsToVerify = {
    to: hashMessage(params.to.toLowerCase()),
    from: hashMessage(params.from.toLowerCase()),
    data: hashMessage(
      params.data.toLowerCase().substr(0, params.data.length - 130),
    ),
    value: hashMessage(params.value.toLowerCase()),
  };
  const h = hashMessage(JSON.stringify(paramsToVerify));
  const signature = `0x${params.data.substr(-130)}`;
  // signature is 130 chars in length at the end
  const addressToVerify = verifyMessage(h, signature);
  const canSubmit =
    params.to.toLowerCase() ===
    FIRST_PARTY_CONTRACT_NAMES['MetaMask Bridge'][params.chainId].toLowerCase()
      ? addressToVerify.toLowerCase() === TRUSTED_BRIDGE_SIGNER.toLowerCase()
      : true;

  if (!canSubmit) {
    end(new Error('Validation Error'));
  }

  // successful validation
  return next();
}
