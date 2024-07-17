import { errorCodes } from 'eth-rpc-errors';

import { MESSAGE_TYPE } from '../../../shared/constants/app';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
import createConfirmationValidationMiddleware from './createConfirmationValidationMiddleware';

const appStateController = {
  store: {
    getState: () => ({
      signatureSecurityAlertResponses: {
        1: {
          result_type: BlockaidResultType.Malicious,
          reason: BlockaidReason.maliciousDomain,
        },
      },
    }),
  },
  getSignatureSecurityAlertResponse: (id) => {
    return appStateController.store.getState().signatureSecurityAlertResponses[
      id
    ];
  },
};

const createHandler = () => createConfirmationValidationMiddleware();

function getNext(timeout = 500) {
  let deferred;
  const promise = new Promise((resolve) => {
    deferred = {
      resolve,
    };
  });
  const cb = () => deferred.resolve();
  let triggerNext;
  setTimeout(() => {
    deferred.resolve();
  }, timeout);
  return {
    executeMiddlewareStack: async () => {
      if (triggerNext) {
        triggerNext(() => cb());
      }
      return await deferred.resolve();
    },
    promise,
    next: (postReqHandler) => {
      triggerNext = postReqHandler;
    },
  };
}

const from = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const getMsgParams = (verifyingContract) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  primaryType: 'Permit',
  domain: {
    name: 'MyToken',
    version: '1',
    verifyingContract:
      verifyingContract ?? '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    chainId: '0x1',
  },
  message: {
    owner: from,
    spender: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    value: 3000,
    nonce: 0,
    deadline: 50000000000,
  },
});

describe('createConfirmationValidationMiddleware', () => {
  it('should not return error if request is permit with valid sender address', async () => {
    const req = {
      method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
      params: [from, JSON.stringify(getMsgParams())],
    };

    const res = {
      error: null,
    };

    const { executeMiddlewareStack, next } = getNext();
    const handler = createHandler();
    handler(req, res, next);
    await executeMiddlewareStack();
    expect(res.error).toBeNull();
  });

  it('should return error if request is permit with invalid sender address', async () => {
    const req = {
      method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
      params: [
        from,
        JSON.stringify(
          getMsgParams('917551056842671309452305380979543736893630245704'),
        ),
      ],
    };

    const res = {
      error: null,
    };

    const { executeMiddlewareStack, next } = getNext();
    const handler = createHandler();
    handler(req, res, next);
    await executeMiddlewareStack();
    expect(res.error.code).toBe(errorCodes.rpc.invalidRequest);
    expect(res.error.message).toBe('Invalid request.');
  });
});
