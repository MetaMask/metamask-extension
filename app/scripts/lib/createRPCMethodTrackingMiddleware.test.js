import { errorCodes } from 'eth-rpc-errors';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import {
  EVENT_NAMES,
  METAMETRIC_KEY_OPT,
} from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';
import { detectSIWE } from '../../../shared/modules/siwe';
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

const handler = createRPCMethodTrackingMiddleware({
  trackEvent,
  getMetricsState,
  rateLimitSeconds: 1,
  securityProviderRequest,
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

jest.mock('../../../shared/modules/siwe', () => ({
  detectSIWE: jest.fn().mockImplementation(() => {
    return { isSIWEMessage: false };
  }),
}));

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

    it(`should immediately track a ${EVENT_NAMES.SIGNATURE_REQUESTED} event`, async () => {
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
        event: EVENT_NAMES.SIGNATURE_REQUESTED,
        properties: {
          signature_type: MESSAGE_TYPE.ETH_SIGN,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track a ${EVENT_NAMES.SIGNATURE_APPROVED} event if the user approves`, async () => {
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
        event: EVENT_NAMES.SIGNATURE_APPROVED,
        properties: {
          signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track a ${EVENT_NAMES.SIGNATURE_REJECTED} event if the user approves`, async () => {
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
        event: EVENT_NAMES.SIGNATURE_REJECTED,
        properties: {
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track a ${EVENT_NAMES.PERMISSIONS_APPROVED} event if the user approves`, async () => {
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
        event: EVENT_NAMES.PERMISSIONS_APPROVED,
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
        event: EVENT_NAMES.SIGNATURE_APPROVED,
        properties: {
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
          ui_customizations: [METAMETRIC_KEY_OPT.ui_customizations.SIWE],
        },
        referrer: { url: 'some.dapp' },
      });
    });

    describe(`when '${MESSAGE_TYPE.ETH_SIGN}' is disabled in advanced settings`, () => {
      it(`should track ${EVENT_NAMES.SIGNATURE_FAILED} and include error property`, async () => {
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
          event: EVENT_NAMES.SIGNATURE_FAILED,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN,
            error: mockError,
          },
          referrer: { url: 'some.dapp' },
        });
      });
    });

    describe('when request is flagged as safe by security provider', () => {
      it(`should immediately track a ${EVENT_NAMES.SIGNATURE_REQUESTED} event`, async () => {
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
          event: EVENT_NAMES.SIGNATURE_REQUESTED,
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

      it(`should immediately track a ${EVENT_NAMES.SIGNATURE_REQUESTED} event which is flagged as malicious`, async () => {
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
          event: EVENT_NAMES.SIGNATURE_REQUESTED,
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

      it(`should immediately track a ${EVENT_NAMES.SIGNATURE_REQUESTED} event which is flagged as safety unknown`, async () => {
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
          event: EVENT_NAMES.SIGNATURE_REQUESTED,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN,
            ui_customizations: ['flagged_as_safety_unknown'],
          },
          referrer: { url: 'some.dapp' },
        });
      });
    });
  });
});
