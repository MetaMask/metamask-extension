import { errorCodes } from 'eth-rpc-errors';
import { detectSIWE } from '@metamask/controller-utils';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import {
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
} from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
import createRPCMethodTrackingMiddleware from './createRPCMethodTrackingMiddleware';

const trackEvent = jest.fn();
const metricsState = { participateInMetaMetrics: null };
const getMetricsState = () => metricsState;

let flagAsDangerous = 0;

const securityProviderRequest = () => {
  return {
    flagAsDangerous,
  };
};

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

const handler = createRPCMethodTrackingMiddleware({
  trackEvent,
  getMetricsState,
  rateLimitSeconds: 1,
  securityProviderRequest,
  appStateController,
});

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

const waitForSeconds = async (seconds) =>
  await new Promise((resolve) => setTimeout(resolve, SECOND * seconds));

jest.mock('@metamask/controller-utils', () => {
  const actual = jest.requireActual('@metamask/controller-utils');

  return {
    ...actual,
    detectSIWE: jest.fn().mockImplementation(() => {
      return { isSIWEMessage: false };
    }),
  };
});

describe('createRPCMethodTrackingMiddleware', () => {
  afterEach(() => {
    jest.resetAllMocks();
    metricsState.participateInMetaMetrics = null;
  });

  describe('before participateInMetaMetrics is set', () => {
    it('should not track an event for a signature request', async () => {
      const req = {
        method: MESSAGE_TYPE.ETH_SIGN,
        origin: 'some.dapp',
      };

      const res = {
        error: null,
      };
      const { executeMiddlewareStack, next } = getNext();
      handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEvent).not.toHaveBeenCalled();
    });
  });

  describe('participateInMetaMetrics is set to false', () => {
    beforeEach(() => {
      metricsState.participateInMetaMetrics = false;
    });

    it('should not track an event for a signature request', async () => {
      const req = {
        method: MESSAGE_TYPE.ETH_SIGN,
        origin: 'some.dapp',
      };

      const res = {
        error: null,
      };
      const { executeMiddlewareStack, next } = getNext();
      handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEvent).not.toHaveBeenCalled();
    });
  });

  describe('participateInMetaMetrics is set to true', () => {
    beforeEach(() => {
      metricsState.participateInMetaMetrics = true;
    });

    it(`should immediately track a ${MetaMetricsEventName.SignatureRequested} event`, async () => {
      const req = {
        method: MESSAGE_TYPE.ETH_SIGN,
        origin: 'some.dapp',
        securityAlertResponse: {
          result_type: BlockaidResultType.Malicious,
          reason: BlockaidReason.maliciousDomain,
          securityAlertId: 1,
        },
      };

      const res = {
        error: null,
      };
      const { next } = getNext();
      await handler(req, res, next);
      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent.mock.calls[0][0]).toMatchObject({
        category: 'inpage_provider',
        event: MetaMetricsEventName.SignatureRequested,
        properties: {
          signature_type: MESSAGE_TYPE.ETH_SIGN,
          security_alert_response: BlockaidResultType.Malicious,
          security_alert_reason: BlockaidReason.maliciousDomain,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track an event with correct blockaid parameters when providerRequestsCount is provided`, async () => {
      const req = {
        method: MESSAGE_TYPE.ETH_SIGN,
        origin: 'some.dapp',
        securityAlertResponse: {
          result_type: BlockaidResultType.Malicious,
          reason: BlockaidReason.maliciousDomain,
          providerRequestsCount: {
            eth_call: 5,
            eth_getCode: 3,
          },
          securityAlertId: 1,
        },
      };

      const res = {
        error: null,
      };
      const { next } = getNext();
      await handler(req, res, next);
      expect(trackEvent).toHaveBeenCalledTimes(1);
      /**
       * TODO:
       * toMatchObject matches even if the matched object does not contain some of the properties of the expected object
       * I'm not sure why toMatchObject is used but we should probably check the other tests in this file for correctness in
       * another PR.
       *
       */
      expect(trackEvent.mock.calls[0][0]).toStrictEqual({
        category: 'inpage_provider',
        event: MetaMetricsEventName.SignatureRequested,
        properties: {
          signature_type: MESSAGE_TYPE.ETH_SIGN,
          security_alert_response: BlockaidResultType.Malicious,
          security_alert_reason: BlockaidReason.maliciousDomain,
          ppom_eth_call_count: 5,
          ppom_eth_getCode_count: 3,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track a ${MetaMetricsEventName.SignatureApproved} event if the user approves`, async () => {
      const req = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        origin: 'some.dapp',
      };

      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEvent).toHaveBeenCalledTimes(2);
      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: 'inpage_provider',
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track a ${MetaMetricsEventName.SignatureRejected} event if the user approves`, async () => {
      const req = {
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };

      const res = {
        error: { code: errorCodes.provider.userRejectedRequest },
      };
      const { next, executeMiddlewareStack } = getNext();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEvent).toHaveBeenCalledTimes(2);
      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: 'inpage_provider',
        event: MetaMetricsEventName.SignatureRejected,
        properties: {
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track a ${MetaMetricsEventName.PermissionsApproved} event if the user approves`, async () => {
      const req = {
        method: MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS,
        origin: 'some.dapp',
      };

      const res = {};
      const { next, executeMiddlewareStack } = getNext();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEvent).toHaveBeenCalledTimes(2);
      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: 'inpage_provider',
        event: MetaMetricsEventName.PermissionsApproved,
        properties: { method: MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should never track blocked methods such as ${MESSAGE_TYPE.GET_PROVIDER_STATE}`, () => {
      const req = {
        method: MESSAGE_TYPE.GET_PROVIDER_STATE,
        origin: 'www.notadapp.com',
      };

      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      handler(req, res, next);
      expect(trackEvent).not.toHaveBeenCalled();
      executeMiddlewareStack();
    });

    it(`should only track events when not rate limited`, async () => {
      const req = {
        method: 'eth_chainId',
        origin: 'some.dapp',
      };

      const res = {
        error: null,
      };

      let callCount = 0;

      while (callCount < 3) {
        callCount += 1;
        const { next, executeMiddlewareStack } = getNext();
        handler(req, res, next);
        await executeMiddlewareStack();
        if (callCount !== 3) {
          await waitForSeconds(0.6);
        }
      }

      expect(trackEvent).toHaveBeenCalledTimes(2);
      expect(trackEvent.mock.calls[0][0].properties.method).toBe('eth_chainId');
      expect(trackEvent.mock.calls[1][0].properties.method).toBe('eth_chainId');
    });

    it('should track Sign-in With Ethereum (SIWE) message if detected', async () => {
      const req = {
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };
      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();

      detectSIWE.mockImplementation(() => {
        return { isSIWEMessage: true };
      });

      await handler(req, res, next);
      await executeMiddlewareStack();

      expect(trackEvent).toHaveBeenCalledTimes(2);

      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: 'inpage_provider',
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
          ui_customizations: [MetaMetricsEventUiCustomization.Siwe],
        },
        referrer: { url: 'some.dapp' },
      });
    });

    describe(`when '${MESSAGE_TYPE.ETH_SIGN}' is disabled in advanced settings`, () => {
      it(`should track ${MetaMetricsEventName.SignatureFailed} and include error property`, async () => {
        const mockError = { code: errorCodes.rpc.methodNotFound };
        const req = {
          method: MESSAGE_TYPE.ETH_SIGN,
          origin: 'some.dapp',
        };
        const res = {
          error: mockError,
        };
        const { next, executeMiddlewareStack } = getNext();

        await handler(req, res, next);
        await executeMiddlewareStack();

        expect(trackEvent).toHaveBeenCalledTimes(2);

        expect(trackEvent.mock.calls[1][0]).toMatchObject({
          category: 'inpage_provider',
          event: MetaMetricsEventName.SignatureFailed,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN,
            error: mockError,
          },
          referrer: { url: 'some.dapp' },
        });
      });
    });

    describe('when request is flagged as safe by security provider', () => {
      it(`should immediately track a ${MetaMetricsEventName.SignatureRequested} event`, async () => {
        const req = {
          method: MESSAGE_TYPE.ETH_SIGN,
          origin: 'some.dapp',
        };
        const res = {
          error: null,
        };
        const { next } = getNext();

        await handler(req, res, next);

        expect(trackEvent).toHaveBeenCalledTimes(1);
        expect(trackEvent.mock.calls[0][0]).toMatchObject({
          category: 'inpage_provider',
          event: MetaMetricsEventName.SignatureRequested,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN,
          },
          referrer: { url: 'some.dapp' },
        });
      });
    });

    describe('when request is flagged as malicious by security provider', () => {
      beforeEach(() => {
        flagAsDangerous = 1;
      });

      it(`should immediately track a ${MetaMetricsEventName.SignatureRequested} event which is flagged as malicious`, async () => {
        const req = {
          method: MESSAGE_TYPE.ETH_SIGN,
          origin: 'some.dapp',
        };
        const res = {
          error: null,
        };
        const { next } = getNext();

        await handler(req, res, next);

        expect(trackEvent).toHaveBeenCalledTimes(1);
        expect(trackEvent.mock.calls[0][0]).toMatchObject({
          category: 'inpage_provider',
          event: MetaMetricsEventName.SignatureRequested,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN,
            ui_customizations: ['flagged_as_malicious'],
          },
          referrer: { url: 'some.dapp' },
        });
      });
    });

    describe('when request flagged as safety unknown by security provider', () => {
      beforeEach(() => {
        flagAsDangerous = 2;
      });

      it(`should immediately track a ${MetaMetricsEventName.SignatureRequested} event which is flagged as safety unknown`, async () => {
        const req = {
          method: MESSAGE_TYPE.ETH_SIGN,
          origin: 'some.dapp',
        };
        const res = {
          error: null,
        };
        const { next } = getNext();

        await handler(req, res, next);

        expect(trackEvent).toHaveBeenCalledTimes(1);
        expect(trackEvent.mock.calls[0][0]).toMatchObject({
          category: 'inpage_provider',
          event: MetaMetricsEventName.SignatureRequested,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN,
            ui_customizations: ['flagged_as_safety_unknown'],
          },
          referrer: { url: 'some.dapp' },
        });
      });
    });

    describe('when signature requests are received', () => {
      let securityProviderReq, fnHandler;
      beforeEach(() => {
        securityProviderReq = jest.fn().mockReturnValue(() =>
          Promise.resolve({
            flagAsDangerous: 0,
          }),
        );

        fnHandler = createRPCMethodTrackingMiddleware({
          trackEvent,
          getMetricsState,
          rateLimitSeconds: 1,
          securityProviderRequest: securityProviderReq,
        });
      });
      it(`should pass correct data for personal sign`, async () => {
        const req = {
          method: 'personal_sign',
          params: [
            '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
            '0x8eeee1781fd885ff5ddef7789486676961873d12',
            'Example password',
          ],
          jsonrpc: '2.0',
          id: 1142196570,
          origin: 'https://metamask.github.io',
          tabId: 1048582817,
        };
        const res = { id: 1142196570, jsonrpc: '2.0' };
        const { next } = getNext();

        await fnHandler(req, res, next);

        expect(securityProviderReq).toHaveBeenCalledTimes(1);
        const call = securityProviderReq.mock.calls[0][0];
        expect(call.msgParams.data).toStrictEqual(req.params[0]);
      });
      it(`should pass correct data for typed sign`, async () => {
        const req = {
          method: 'eth_signTypedData_v4',
          params: [
            '0x8eeee1781fd885ff5ddef7789486676961873d12',
            '{"domain":{"chainId":"5","name":"Ether Mail","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","version":"1"},"message":{"contents":"Hello, Bob!","from":{"name":"Cow","wallets":["0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF"]},"to":[{"name":"Bob","wallets":["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB","0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57","0xB0B0b0b0b0b0B000000000000000000000000000"]}]},"primaryType":"Mail","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Group":[{"name":"name","type":"string"},{"name":"members","type":"Person[]"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person[]"},{"name":"contents","type":"string"}],"Person":[{"name":"name","type":"string"},{"name":"wallets","type":"address[]"}]}}',
          ],
          jsonrpc: '2.0',
          id: 1142196571,
          origin: 'https://metamask.github.io',
          tabId: 1048582817,
        };
        const res = { id: 1142196571, jsonrpc: '2.0' };
        const { next } = getNext();

        await fnHandler(req, res, next);

        expect(securityProviderReq).toHaveBeenCalledTimes(1);
        const call = securityProviderReq.mock.calls[0][0];
        expect(call.msgParams.data).toStrictEqual(req.params[1]);
      });
    });
  });
});
