import { errorCodes } from 'eth-rpc-errors';
import { detectSIWE } from '@metamask/controller-utils';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
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

const createHandler = (opts) =>
  createRPCMethodTrackingMiddleware({
    trackEvent,
    getMetricsState,
    rateLimitTimeout: 1000,
    rateLimitSamplePercent: 0.1,
    globalRateLimitTimeout: 0,
    globalRateLimitMaxAmount: 0,
    appStateController,
    isConfirmationRedesignEnabled: () => false,
    ...opts,
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
      const handler = createHandler();
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
      const handler = createHandler();
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
      const handler = createHandler();
      await handler(req, res, next);
      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent.mock.calls[0][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
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
      const handler = createHandler();
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
        category: MetaMetricsEventCategory.InpageProvider,
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
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEvent).toHaveBeenCalledTimes(2);
      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
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
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEvent).toHaveBeenCalledTimes(2);
      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
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
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEvent).toHaveBeenCalledTimes(2);
      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
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
      const handler = createHandler();
      handler(req, res, next);
      expect(trackEvent).not.toHaveBeenCalled();
      executeMiddlewareStack();
    });

    describe('events rated limited by timeout', () => {
      it.each([
        ['wallet_requestPermissions', 2],
        ['eth_requestAccounts', 2],
      ])(
        `should only track '%s' events while the timeout rate limit is not active`,
        async (method, eventsTrackedPerRequest) => {
          const req = {
            method,
            origin: 'some.dapp',
          };

          const res = {
            error: null,
          };

          const handler = createHandler();

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

          const expectedNumberOfCalls = 2 * eventsTrackedPerRequest;
          expect(trackEvent).toHaveBeenCalledTimes(expectedNumberOfCalls);
          trackEvent.mock.calls.forEach((call) => {
            expect(call[0].properties.method).toBe(method);
          });
        },
      );
    });

    describe('events rated limited by random', () => {
      beforeEach(() => {
        jest
          .spyOn(Math, 'random')
          .mockReturnValueOnce(0) // not rate limited
          .mockReturnValueOnce(0.09) // not rate limited
          .mockReturnValueOnce(0.1) // rate limited
          .mockReturnValueOnce(0.11) // rate limited
          .mockReturnValueOnce(1); // rate limited
      });
      afterEach(() => {
        jest.spyOn(Math, 'random').mockRestore();
      });
      it.each([
        ['any_method_without_rate_limit_type_set', 1],
        ['eth_getBalance', 1],
      ])(
        `should only track a random percentage of '%s' events`,
        async (method, eventsTrackedPerRequest) => {
          const req = {
            method,
            origin: 'some.dapp',
          };

          const res = {
            error: null,
          };

          const handler = createHandler();

          let callCount = 0;
          while (callCount < 5) {
            callCount += 1;
            const { next, executeMiddlewareStack } = getNext();
            handler(req, res, next);
            await executeMiddlewareStack();
          }

          const expectedNumberOfCalls = 2 * eventsTrackedPerRequest;
          expect(trackEvent).toHaveBeenCalledTimes(expectedNumberOfCalls);
          trackEvent.mock.calls.forEach((call) => {
            expect(call[0].properties.method).toBe(method);
          });
        },
      );
    });

    describe('events rated globally rate limited', () => {
      it('should only track events if the global rate limit has not been hit', async () => {
        const req = {
          method: 'some_method_rate_limited_by_sample',
          origin: 'some.dapp',
        };

        const res = {
          error: null,
        };

        const handler = createHandler({
          rateLimitSamplePercent: 1, // track every event for this spec
          globalRateLimitTimeout: 1000,
          globalRateLimitMaxAmount: 3,
        });

        let callCount = 0;
        while (callCount < 4) {
          callCount += 1;
          const { next, executeMiddlewareStack } = getNext();
          handler(req, res, next);
          await executeMiddlewareStack();
          if (callCount !== 4) {
            await waitForSeconds(0.6);
          }
        }

        expect(trackEvent).toHaveBeenCalledTimes(3);
        trackEvent.mock.calls.forEach((call) => {
          expect(call[0].properties.method).toBe(
            'some_method_rate_limited_by_sample',
          );
        });
      });
    });

    it('should track Confirmation Redesign through ui_customizations prop if enabled', async () => {
      const req = {
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };
      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler({
        isConfirmationRedesignEnabled: () => true,
      });

      await handler(req, res, next);
      await executeMiddlewareStack();

      expect(trackEvent).toHaveBeenCalledTimes(2);

      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
          ui_customizations: [
            MetaMetricsEventUiCustomization.RedesignedConfirmation,
          ],
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it('should not track Confirmation Redesign through ui_customizations prop if not enabled', async () => {
      const req = {
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };
      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();

      await handler(req, res, next);
      await executeMiddlewareStack();

      expect(trackEvent).toHaveBeenCalledTimes(2);

      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
        },
        referrer: { url: 'some.dapp' },
      });
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
      const handler = createHandler();

      detectSIWE.mockImplementation(() => {
        return { isSIWEMessage: true };
      });

      await handler(req, res, next);
      await executeMiddlewareStack();

      expect(trackEvent).toHaveBeenCalledTimes(2);

      expect(trackEvent.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
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
        const handler = createHandler();

        await handler(req, res, next);
        await executeMiddlewareStack();

        expect(trackEvent).toHaveBeenCalledTimes(2);

        expect(trackEvent.mock.calls[1][0]).toMatchObject({
          category: MetaMetricsEventCategory.InpageProvider,
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
        const handler = createHandler();

        await handler(req, res, next);

        expect(trackEvent).toHaveBeenCalledTimes(1);
        expect(trackEvent.mock.calls[0][0]).toMatchObject({
          category: MetaMetricsEventCategory.InpageProvider,
          event: MetaMetricsEventName.SignatureRequested,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN,
          },
          referrer: { url: 'some.dapp' },
        });
      });
    });
  });
});
