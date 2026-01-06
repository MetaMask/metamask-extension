import { errorCodes } from '@metamask/rpc-errors';
import { detectSIWE } from '@metamask/controller-utils';
import { MOCK_ANY_NAMESPACE, Messenger } from '@metamask/messenger';

import MetaMetricsController from '../controllers/metametrics-controller';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
  MetaMetricsRequestedThrough,
} from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
import { ResultType } from '../../../shared/lib/trust-signals';
import {
  permitSignatureMsg,
  orderSignatureMsg,
} from '../../../test/data/confirmations/typed_sign';
import { getDefaultPreferencesControllerState } from '../controllers/preferences-controller';
import { createSegmentMock } from './segment';
import createRPCMethodTrackingMiddleware from './createRPCMethodTrackingMiddleware';
import * as snapKeyringMetrics from './snap-keyring/metrics';

jest.mock('./snap-keyring/metrics', () => {
  return {
    getSnapAndHardwareInfoForMetrics: jest.fn().mockResolvedValue({}),
  };
});
const MockSnapKeyringMetrics = jest.mocked(snapKeyringMetrics);

const MOCK_ID = '123';
const expectedUniqueIdentifier = `signature-${MOCK_ID}`;

const expectedMetametricsEventUndefinedProps = {
  actionId: undefined,
  currency: undefined,
  environmentType: undefined,
  page: undefined,
  revenue: undefined,
  sensitiveProperties: undefined,
  value: undefined,
};

const appStateController = {
  state: {
    signatureSecurityAlertResponses: {
      1: {
        result_type: BlockaidResultType.Malicious,
        reason: BlockaidReason.maliciousDomain,
      },
    },
  },
  getSignatureSecurityAlertResponse: (id) => {
    return appStateController.state.signatureSecurityAlertResponses[id];
  },
};

const messenger = new Messenger({ namespace: MOCK_ANY_NAMESPACE });

messenger.registerActionHandler('PreferencesController:getState', () => ({
  ...getDefaultPreferencesControllerState(),
  currentLocale: 'en_US',
}));

messenger.registerActionHandler(
  'NetworkController:getState',
  jest.fn().mockReturnValue({
    selectedNetworkClientId: 'selectedNetworkClientId',
  }),
);

messenger.registerActionHandler(
  'NetworkController:getNetworkClientById',
  jest.fn().mockReturnValue({
    configuration: {
      chainId: '0x1338',
    },
  }),
);

const controllerMessenger = new Messenger({
  namespace: 'MetaMetricsController',
  parent: messenger,
});

messenger.delegate({
  messenger: controllerMessenger,
  actions: [
    'PreferencesController:getState',
    'NetworkController:getState',
    'NetworkController:getNetworkClientById',
  ],
  events: [
    'PreferencesController:stateChange',
    'NetworkController:networkDidChange',
  ],
});

const metaMetricsController = new MetaMetricsController({
  state: {
    participateInMetaMetrics: null,
    metaMetricsId: '0xabc',
    fragments: {},
    events: {},
  },
  messenger: controllerMessenger,
  segment: createSegmentMock(2),
  version: '0.0.1',
  environment: 'test',
  extension: {
    runtime: {
      id: 'testid',
      setUninstallURL: () => undefined,
    },
  },
});

const createHandler = (opts) =>
  createRPCMethodTrackingMiddleware({
    rateLimitTimeout: 1000,
    rateLimitSamplePercent: 0.1,
    globalRateLimitTimeout: 0,
    globalRateLimitMaxAmount: 0,
    appStateController,
    metaMetricsController,
    getHDEntropyIndex: jest.fn(),
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
  let trackEventSpy;

  beforeEach(() => {
    trackEventSpy = jest
      .spyOn(MetaMetricsController.prototype, 'trackEvent')
      .mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.resetAllMocks();
    metaMetricsController.setParticipateInMetaMetrics(null);
  });

  describe('before participateInMetaMetrics is set', () => {
    it('should not track an event for a signature request', async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };

      const res = {
        error: null,
      };
      const { executeMiddlewareStack, next } = getNext();
      const handler = createHandler();
      handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEventSpy).not.toHaveBeenCalled();
    });
  });

  describe('participateInMetaMetrics is set to false', () => {
    beforeEach(() => {
      metaMetricsController.setParticipateInMetaMetrics(false);
    });

    it('should not track an event for a signature request', async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };

      const res = {
        error: null,
      };
      const { executeMiddlewareStack, next } = getNext();
      const handler = createHandler();
      handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEventSpy).not.toHaveBeenCalled();
    });
  });

  describe('participateInMetaMetrics is set to true', () => {
    beforeEach(() => {
      metaMetricsController.setParticipateInMetaMetrics(true);
    });

    it(`should immediately track a ${MetaMetricsEventName.SignatureRequested} event`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
        securityAlertResponse: {
          result_type: BlockaidResultType.Malicious,
          reason: BlockaidReason.maliciousDomain,
          securityAlertId: 1,
          description: 'some_description',
        },
      };

      const res = {
        error: null,
      };
      const { next } = getNext();
      const handler = createHandler();
      await handler(req, res, next);

      expect(trackEventSpy).toHaveBeenCalledTimes(1);
      expect(trackEventSpy.mock.calls[0][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureRequested,
        properties: {
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
          security_alert_response: BlockaidResultType.Malicious,
          security_alert_reason: BlockaidReason.maliciousDomain,
          security_alert_description: 'some_description',
          address_alert_response: ResultType.Loading,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should attempt to resolve snaps and hardware info for the ${MetaMetricsEventName.SignatureRequested} event`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
        securityAlertResponse: {
          result_type: BlockaidResultType.Malicious,
          reason: BlockaidReason.maliciousDomain,
          securityAlertId: 1,
          description: 'some_description',
        },
      };

      const res = {
        error: null,
      };
      const { next } = getNext();
      const handler = createHandler();
      await handler(req, res, next);

      expect(
        MockSnapKeyringMetrics.getSnapAndHardwareInfoForMetrics,
      ).toHaveBeenCalledTimes(1);
    });

    it(`should track a ${MetaMetricsEventName.SignatureRequested} event for personal sign`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
        params: [
          { data: 'some-data' },
          '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
        ],
        securityAlertResponse: {
          result_type: BlockaidResultType.Malicious,
          reason: BlockaidReason.maliciousDomain,
          securityAlertId: 1,
          description: 'some_description',
        },
      };

      const res = {
        error: null,
      };
      const { next } = getNext();
      const handler = createHandler();
      await handler(req, res, next);

      expect(trackEventSpy).toHaveBeenCalledTimes(1);
      expect(trackEventSpy.mock.calls[0][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureRequested,
        properties: {
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
          security_alert_response: BlockaidResultType.Malicious,
          security_alert_reason: BlockaidReason.maliciousDomain,
          security_alert_description: 'some_description',
          address_alert_response: ResultType.Loading,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track an event with correct blockaid parameters when providerRequestsCount is provided`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
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
      expect(trackEventSpy).toHaveBeenCalledTimes(1);
      expect(trackEventSpy.mock.calls[0][0]).toStrictEqual({
        ...expectedMetametricsEventUndefinedProps,
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureRequested,
        properties: {
          hd_entropy_index: undefined,
          signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
          security_alert_response: BlockaidResultType.Malicious,
          security_alert_reason: BlockaidReason.maliciousDomain,
          address_alert_response: ResultType.Loading,
          ppom_eth_call_count: 5,
          ppom_eth_getCode_count: 3,
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
        },
        referrer: { url: 'some.dapp' },
        uniqueIdentifier: expectedUniqueIdentifier,
      });
    });

    it(`should track a ${MetaMetricsEventName.SignatureApproved} if the user approves`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        origin: 'some.dapp',
        params: [undefined, permitSignatureMsg.msgParams.data],
      };

      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEventSpy).toHaveBeenCalledTimes(2);
      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
        },
        sensitiveProperties: {
          eip712_verifyingContract:
            '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
          eip712_domain_version: '1',
          eip712_domain_name: 'MyToken',
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track a ${MetaMetricsEventName.Rejected} with sensitive properties for internal errors`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        origin: 'some.dapp',
        params: [undefined, permitSignatureMsg.msgParams.data],
      };

      const res = {
        error: {
          code: errorCodes.rpc.internal,
          message: 'Request rejected by user or snap.',
        },
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEventSpy).toHaveBeenCalledTimes(2);
      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureRejected,
        properties: {
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
          signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        },
        sensitiveProperties: {
          eip712_verifyingContract:
            '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
          eip712_domain_version: '1',
          eip712_domain_name: 'MyToken',
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track a ${MetaMetricsEventName.SignatureRejected} event if the user rejects`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };

      const res = {
        error: {
          code: errorCodes.provider.userRejectedRequest,
          data: { location: 'some_location' },
        },
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEventSpy).toHaveBeenCalledTimes(2);
      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureRejected,
        properties: {
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
          location: 'some_location',
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track a ${MetaMetricsEventName.PermissionsApproved} event if the user approves`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS,
        origin: 'some.dapp',
      };

      const res = {};
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEventSpy).toHaveBeenCalledTimes(2);
      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.PermissionsApproved,
        properties: {
          method: MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS,
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should attempt to resolve snaps and hardware info for the ${MetaMetricsEventName.SignatureRejected} event`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };

      const res = {
        error: {
          code: errorCodes.provider.userRejectedRequest,
          data: { location: 'some_location' },
        },
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();

      // Called once for the initial request and once for the rejected request
      expect(
        MockSnapKeyringMetrics.getSnapAndHardwareInfoForMetrics,
      ).toHaveBeenCalledTimes(2);
    });

    it(`should attempt to resolve snaps and hardware info for the ${MetaMetricsEventName.SignatureApproved} event`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };

      const res = {};
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();

      // Called once for the initial request and once for the approved request
      expect(
        MockSnapKeyringMetrics.getSnapAndHardwareInfoForMetrics,
      ).toHaveBeenCalledTimes(2);
    });

    it(`should never track blocked methods such as ${MESSAGE_TYPE.GET_PROVIDER_STATE}`, () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.GET_PROVIDER_STATE,
        origin: 'www.notadapp.com',
      };

      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();
      handler(req, res, next);
      expect(trackEventSpy).not.toHaveBeenCalled();
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
            id: MOCK_ID,
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
          expect(trackEventSpy).toHaveBeenCalledTimes(expectedNumberOfCalls);
          trackEventSpy.mock.calls.forEach((call) => {
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
            id: MOCK_ID,
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
          expect(trackEventSpy).toHaveBeenCalledTimes(expectedNumberOfCalls);
          trackEventSpy.mock.calls.forEach((call) => {
            expect(call[0].properties.method).toBe(method);
          });
        },
      );
    });

    describe('events rated globally rate limited', () => {
      it('should only track events if the global rate limit has not been hit', async () => {
        const req = {
          id: MOCK_ID,
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

        expect(trackEventSpy).toHaveBeenCalledTimes(3);
        trackEventSpy.mock.calls.forEach((call) => {
          expect(call[0].properties.method).toBe(
            'some_method_rate_limited_by_sample',
          );
        });
      });
    });

    it('should not track Confirmation Redesign through ui_customizations prop if not enabled', async () => {
      const req = {
        id: MOCK_ID,
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

      expect(trackEventSpy).toHaveBeenCalledTimes(2);

      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
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
        id: MOCK_ID,
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

      expect(trackEventSpy).toHaveBeenCalledTimes(2);

      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
          ui_customizations: [MetaMetricsEventUiCustomization.Siwe],
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it('should track when message is not SIWE if detected', async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.PERSONAL_SIGN,
        origin: 'some.dapp',
      };
      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();

      detectSIWE.mockImplementation(() => {
        return { isSIWEMessage: false };
      });

      await handler(req, res, next);
      await executeMiddlewareStack();

      expect(trackEventSpy).toHaveBeenCalledTimes(2);

      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          signature_type: MESSAGE_TYPE.PERSONAL_SIGN,
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it('should track typed-sign permit message if detected', async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        origin: 'some.dapp',
        params: [undefined, permitSignatureMsg.msgParams.data],
      };
      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();

      await handler(req, res, next);
      await executeMiddlewareStack();

      expect(trackEventSpy).toHaveBeenCalledTimes(2);

      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
          ui_customizations: [MetaMetricsEventUiCustomization.Permit],
          eip712_primary_type: 'Permit',
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it('should track typed-sign message if detected', async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3,
        origin: 'some.dapp',
      };
      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();

      await handler(req, res, next);
      await executeMiddlewareStack();

      expect(trackEventSpy).toHaveBeenCalledTimes(2);

      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3,
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should track typed-sign order message if detected`, async () => {
      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        origin: 'some.dapp',
        params: [undefined, orderSignatureMsg.msgParams.data],
      };

      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();
      expect(trackEventSpy).toHaveBeenCalledTimes(2);
      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
          signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
          ui_customizations: [MetaMetricsEventUiCustomization.Order],
        },
        referrer: { url: 'some.dapp' },
      });
    });

    it(`should not track permit message if primary type is unknown`, async () => {
      const params = JSON.parse(orderSignatureMsg.msgParams.data);
      params.primaryType = 'Unknown';

      const req = {
        id: MOCK_ID,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        origin: 'some.dapp',
        params: [undefined, JSON.stringify(params)],
      };

      const res = {
        error: null,
      };
      const { next, executeMiddlewareStack } = getNext();
      const handler = createHandler();
      await handler(req, res, next);
      await executeMiddlewareStack();

      expect(trackEventSpy).toHaveBeenCalledTimes(2);
      expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
        category: MetaMetricsEventCategory.InpageProvider,
        event: MetaMetricsEventName.SignatureApproved,
        properties: {
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
          signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
          eip712_primary_type: 'Unknown',
        },
        referrer: { url: 'some.dapp' },
      });
    });

    describe('when request is flagged as safe by security provider', () => {
      it(`should immediately track a ${MetaMetricsEventName.SignatureRequested} event`, async () => {
        const req = {
          id: MOCK_ID,
          method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
          origin: 'some.dapp',
          params: [undefined, permitSignatureMsg.msgParams.data],
        };
        const res = {
          error: null,
        };
        const { next } = getNext();
        const handler = createHandler();

        await handler(req, res, next);

        expect(trackEventSpy).toHaveBeenCalledTimes(1);
        expect(trackEventSpy.mock.calls[0][0]).toMatchObject({
          category: MetaMetricsEventCategory.InpageProvider,
          event: MetaMetricsEventName.SignatureRequested,
          properties: {
            api_source: MetaMetricsRequestedThrough.EthereumProvider,
            signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
            address_alert_response: ResultType.Loading,
          },
          sensitiveProperties: {
            eip712_verifyingContract:
              '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
            eip712_domain_version: '1',
            eip712_domain_name: 'MyToken',
          },
          referrer: { url: 'some.dapp' },
        });
      });
    });

    it.each([
      ['no params', 'method_without_transform', {}, undefined],
      [
        'no params',
        'eth_call',
        [
          {
            accessList: [],
            blobVersionedHashes: [],
            blobs: [],
            to: null,
          },
          null,
        ],
        undefined,
      ],
      ['no params', 'eth_sandRawTransaction', ['0xdeadbeef'], undefined],
      [
        'no params',
        'eth_sendTransaction',
        {
          to: '0x1',
          from: '0x2',
          gas: '0x3',
          gasPrice: '0x4',
          value: '0x5',
          data: '0xdeadbeef',
          maxPriorityFeePerGas: '0x6',
          maxFeePerGas: '0x7',
        },
        undefined,
      ],
      [
        'only the type param',
        'wallet_watchAsset',
        {
          type: 'ERC20',
          options: {
            address: '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
            symbol: 'FOO',
            decimals: 18,
            image: 'https://foo.io/token-image.svg',
          },
        },
        { type: 'ERC20' },
      ],
      [
        'only the chain ID',
        'wallet_addEthereumChain',
        [
          {
            chainId: '0x64',
            chainName: 'Gnosis',
            rpcUrls: ['https://rpc.gnosischain.com'],
            iconUrls: [
              'https://xdaichain.com/fake/example/url/xdai.svg',
              'https://xdaichain.com/fake/example/url/xdai.png',
            ],
            nativeCurrency: {
              name: 'XDAI',
              symbol: 'XDAI',
              decimals: 18,
            },
            blockExplorerUrls: ['https://blockscout.com/poa/xdai/'],
          },
        ],
        { chainId: '0x64' },
      ],
      [
        'only the chain ID',
        'wallet_switchEthereumChain',
        [{ chainId: '0x123' }],
        { chainId: '0x123' },
      ],
    ])(
      `should include %s in the '%s' tracked events params property`,
      async (_, method, params, expected) => {
        const req = {
          id: MOCK_ID,
          method,
          origin: 'some.dapp',
          params,
        };

        const res = {
          error: null,
        };

        const { next } = getNext();
        const handler = createHandler({ rateLimitSamplePercent: 1 });

        await handler(req, res, next);

        expect(trackEventSpy).toHaveBeenCalledTimes(1);
        expect(trackEventSpy.mock.calls[0][0].properties.params).toStrictEqual(
          expected,
        );
      },
    );

    it.each([
      [
        MetaMetricsEventName.Wallet5792Called,
        MESSAGE_TYPE.WALLET_SEND_CALLS,
        [
          {
            calls: [
              {
                from: '0x1',
                to: '0x2',
              },
              {
                from: '0x2',
                to: '0x3',
              },
            ],
          },
        ],
        {
          batch_transaction_count: 2,
          method: MESSAGE_TYPE.WALLET_SEND_CALLS,
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
        },
      ],
      [
        MetaMetricsEventName.Wallet5792Called,
        MESSAGE_TYPE.WALLET_GET_CALLS_STATUS,
        ['0x123'],
        {
          method: MESSAGE_TYPE.WALLET_GET_CALLS_STATUS,
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
        },
      ],
      [
        MetaMetricsEventName.Wallet5792Called,
        MESSAGE_TYPE.WALLET_GET_CAPABILITIES,
        ['0x123'],
        {
          method: MESSAGE_TYPE.WALLET_GET_CAPABILITIES,
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
        },
      ],
    ])(
      `should generate %s event from %s method`,
      async (event, method, params, properties) => {
        const req = {
          id: MOCK_ID,
          method,
          origin: 'some.dapp',
          params,
        };

        const res = {
          error: null,
        };

        const { next } = getNext();
        const handler = createHandler();

        await handler(req, res, next);

        expect(trackEventSpy).toHaveBeenCalledTimes(1);
        expect(trackEventSpy.mock.calls[0][0].event).toBe(event);
        expect(trackEventSpy.mock.calls[0][0].properties).toStrictEqual(
          properties,
        );
      },
    );
    describe('Multichain API requests', () => {
      beforeEach(() => {
        metaMetricsController.setParticipateInMetaMetrics(true);
      });

      it('should track `wallet_createSession` events with multichain category and properties', async () => {
        const req = {
          id: MOCK_ID,
          method: MESSAGE_TYPE.WALLET_CREATE_SESSION,
          origin: 'multichain.dapp',
          params: {
            requiredScopes: {
              'eip155:1': { eth_accounts: {} },
              'eip155:137': { eth_accounts: {} },
            },
            optionalScopes: {
              'eip155:56': { eth_accounts: {} },
            },
          },
        };

        const res = {
          result: {
            sessionScopes: {
              'eip155:1': {},
              'eip155:137': {},
            },
          },
        };
        const { next, executeMiddlewareStack } = getNext();
        const handler = createHandler();
        await handler(req, res, next);
        expect(trackEventSpy).toHaveBeenCalledTimes(1);

        expect(trackEventSpy.mock.calls[0][0]).toMatchObject({
          category: MetaMetricsEventCategory.MultichainApi,
          event: MetaMetricsEventName.PermissionsRequested,
          properties: {
            method: MESSAGE_TYPE.WALLET_CREATE_SESSION,
            api_source: MetaMetricsRequestedThrough.MultichainApi,
            chain_id_list: expect.arrayContaining([
              'eip155:1',
              'eip155:137',
              'eip155:56',
            ]),
          },
          referrer: { url: 'multichain.dapp' },
        });
        await executeMiddlewareStack();
        expect(trackEventSpy).toHaveBeenCalledTimes(2);

        expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
          category: MetaMetricsEventCategory.MultichainApi,
          event: MetaMetricsEventName.PermissionsApproved,
          properties: {
            method: MESSAGE_TYPE.WALLET_CREATE_SESSION,
            api_source: MetaMetricsRequestedThrough.MultichainApi,
            chain_id_list: expect.arrayContaining(['eip155:1', 'eip155:137']),
          },
          referrer: { url: 'multichain.dapp' },
        });
      });

      it('should track wallet_invokeMethod events with multichain_api category, api_source, and chain_id_caip properties', async () => {
        const req = {
          id: MOCK_ID,
          method: MESSAGE_TYPE.WALLET_INVOKE_METHOD,
          origin: 'multichain.dapp',
          params: {
            request: {
              method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
              params: [],
            },
            scope: 'eip155:10',
          },
        };

        const res = {};
        const { next, executeMiddlewareStack } = getNext();
        const handler = createHandler();
        await handler(req, res, next);
        await executeMiddlewareStack();

        expect(trackEventSpy).toHaveBeenCalledTimes(2);
        expect(trackEventSpy.mock.calls[0][0]).toMatchObject({
          category: MetaMetricsEventCategory.MultichainApi,
          event: MetaMetricsEventName.SignatureRequested,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
            api_source: MetaMetricsRequestedThrough.MultichainApi,
            chain_id_caip: 'eip155:10',
            address_alert_response: ResultType.Loading,
          },
          referrer: { url: 'multichain.dapp' },
        });

        expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
          category: MetaMetricsEventCategory.MultichainApi,
          event: MetaMetricsEventName.SignatureApproved,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
            api_source: MetaMetricsRequestedThrough.MultichainApi,
            chain_id_caip: 'eip155:10',
          },
          referrer: { url: 'multichain.dapp' },
        });
      });

      it('should track wallet_invokeMethod rejections with multichain_api category, api_source, and chain_id_caip properties', async () => {
        const req = {
          id: MOCK_ID,
          method: MESSAGE_TYPE.WALLET_INVOKE_METHOD,
          origin: 'multichain.dapp',
          params: {
            request: {
              method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
              params: [],
            },
            scope: 'eip155:137',
          },
        };

        const res = {
          error: {
            code: errorCodes.provider.userRejectedRequest,
          },
        };

        const { next, executeMiddlewareStack } = getNext();
        const handler = createHandler();
        await handler(req, res, next);
        await executeMiddlewareStack();

        expect(trackEventSpy).toHaveBeenCalledTimes(2);
        expect(trackEventSpy.mock.calls[0][0]).toMatchObject({
          category: MetaMetricsEventCategory.MultichainApi,
          event: MetaMetricsEventName.SignatureRequested,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
            api_source: MetaMetricsRequestedThrough.MultichainApi,
            chain_id_caip: 'eip155:137',
            address_alert_response: ResultType.Loading,
          },
          referrer: { url: 'multichain.dapp' },
        });

        expect(trackEventSpy.mock.calls[1][0]).toMatchObject({
          category: MetaMetricsEventCategory.MultichainApi,
          event: MetaMetricsEventName.SignatureRejected,
          properties: {
            signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
            api_source: MetaMetricsRequestedThrough.MultichainApi,
            chain_id_caip: 'eip155:137',
          },
          referrer: { url: 'multichain.dapp' },
        });
      });
    });
  });
});
