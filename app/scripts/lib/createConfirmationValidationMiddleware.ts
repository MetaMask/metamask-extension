import { errorCodes } from 'eth-rpc-errors';
import { isValidAddress } from 'ethereumjs-util';
import { isValidHexAddress, JsonRpcRequest } from '@metamask/utils';
import { JsonRpcMiddleware } from 'json-rpc-engine';

import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { parseTypedDataMessage } from '../../../shared/modules/transaction.utils';

import { EIP712_PRIMARY_TYPE_PERMIT } from '../../../shared/constants/transaction';

/**
 * Returns a middleware that validated incoming confirmations
 */

export default function createConfirmationValidationMiddleware(): JsonRpcMiddleware<
  Request,
  void
> {
  return async function confirmationValidationMiddleware(
    req: JsonRpcRequest,
    res,
    next,
  ) {
    const { method, params } = req;

    let data;
    if (isValidAddress(params?.[1])) {
      data = params?.[0];
    } else {
      data = params?.[1];
    }

    if (method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4) {
      const {
        domain: { verifyingContract },
        primaryType,
      } = parseTypedDataMessage(data);
      if (
        primaryType === EIP712_PRIMARY_TYPE_PERMIT &&
        !isValidHexAddress(verifyingContract)
      ) {
        res.error = {
          code: errorCodes.rpc.invalidRequest,
          message: 'Invalid request.',
        };
      }
    }

    next(async (callback) => {
      return callback();
    });
  };
}
