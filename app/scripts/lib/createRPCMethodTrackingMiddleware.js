import { detectSIWE } from '@metamask/controller-utils';
import { errorCodes } from 'eth-rpc-errors';
import { isValidAddress } from 'ethereumjs-util';
import { TransactionStatus } from '@metamask/transaction-controller';
import { MESSAGE_TYPE, ORIGIN_METAMASK } from '../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
} from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';

///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
///: END:ONLY_INCLUDE_IF

import { getSnapAndHardwareInfoForMetrics } from './snap-keyring/metrics';

/**
 * These types determine how the method tracking middleware handles incoming
 * requests based on the method name. There are three options right now but
 * the types could be expanded to cover other options in the future.
 */
const RATE_LIMIT_TYPES = {
  RATE_LIMITED: 'rate_limited',
  BLOCKED: 'blocked',
  NON_RATE_LIMITED: 'non_rate_limited',
};

/**
 * This object maps a method name to a RATE_LIMIT_TYPE. If not in this map the
 * default is 'RATE_LIMITED'
 */
const RATE_LIMIT_MAP = {
  [MESSAGE_TYPE.ETH_SIGN]: RATE_LIMIT_TYPES.NON_RATE_LIMITED,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA]: RATE_LIMIT_TYPES.NON_RATE_LIMITED,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3]: RATE_LIMIT_TYPES.NON_RATE_LIMITED,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4]: RATE_LIMIT_TYPES.NON_RATE_LIMITED,
  [MESSAGE_TYPE.PERSONAL_SIGN]: RATE_LIMIT_TYPES.NON_RATE_LIMITED,
  [MESSAGE_TYPE.ETH_DECRYPT]: RATE_LIMIT_TYPES.NON_RATE_LIMITED,
  [MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY]:
    RATE_LIMIT_TYPES.NON_RATE_LIMITED,
  [MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS]: RATE_LIMIT_TYPES.RATE_LIMITED,
  [MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS]: RATE_LIMIT_TYPES.RATE_LIMITED,
  [MESSAGE_TYPE.SEND_METADATA]: RATE_LIMIT_TYPES.BLOCKED,
  [MESSAGE_TYPE.GET_PROVIDER_STATE]: RATE_LIMIT_TYPES.BLOCKED,
};

/**
 * For events with user interaction (approve / reject | cancel) this map will
 * return an object with APPROVED, REJECTED, REQUESTED, and FAILED keys that map to the
 * appropriate event names.
 */
const EVENT_NAME_MAP = {
  [MESSAGE_TYPE.ETH_SIGN]: {
    APPROVED: MetaMetricsEventName.SignatureApproved,
    FAILED: MetaMetricsEventName.SignatureFailed,
    REJECTED: MetaMetricsEventName.SignatureRejected,
    REQUESTED: MetaMetricsEventName.SignatureRequested,
  },
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA]: {
    APPROVED: MetaMetricsEventName.SignatureApproved,
    REJECTED: MetaMetricsEventName.SignatureRejected,
    REQUESTED: MetaMetricsEventName.SignatureRequested,
  },
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3]: {
    APPROVED: MetaMetricsEventName.SignatureApproved,
    REJECTED: MetaMetricsEventName.SignatureRejected,
    REQUESTED: MetaMetricsEventName.SignatureRequested,
  },
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4]: {
    APPROVED: MetaMetricsEventName.SignatureApproved,
    REJECTED: MetaMetricsEventName.SignatureRejected,
    REQUESTED: MetaMetricsEventName.SignatureRequested,
  },
  [MESSAGE_TYPE.PERSONAL_SIGN]: {
    APPROVED: MetaMetricsEventName.SignatureApproved,
    REJECTED: MetaMetricsEventName.SignatureRejected,
    REQUESTED: MetaMetricsEventName.SignatureRequested,
  },
  [MESSAGE_TYPE.ETH_DECRYPT]: {
    APPROVED: MetaMetricsEventName.DecryptionApproved,
    REJECTED: MetaMetricsEventName.DecryptionRejected,
    REQUESTED: MetaMetricsEventName.DecryptionRequested,
  },
  [MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY]: {
    APPROVED: MetaMetricsEventName.EncryptionPublicKeyApproved,
    REJECTED: MetaMetricsEventName.EncryptionPublicKeyRejected,
    REQUESTED: MetaMetricsEventName.EncryptionPublicKeyRequested,
  },
  [MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS]: {
    APPROVED: MetaMetricsEventName.PermissionsApproved,
    REJECTED: MetaMetricsEventName.PermissionsRejected,
    REQUESTED: MetaMetricsEventName.PermissionsRequested,
  },
  [MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS]: {
    APPROVED: MetaMetricsEventName.PermissionsApproved,
    REJECTED: MetaMetricsEventName.PermissionsRejected,
    REQUESTED: MetaMetricsEventName.PermissionsRequested,
  },
};

const rateLimitTimeouts = {};

/**
 * Returns a middleware that tracks inpage_provider usage using sampling for
 * each type of event except those that require user interaction, such as
 * signature requests
 *
 * @param {object} opts - options for the rpc method tracking middleware
 * @param {Function} opts.trackEvent - trackEvent method from
 *  MetaMetricsController
 * @param {Function} opts.getMetricsState - get the state of
 *  MetaMetricsController
 * @param {number} [opts.rateLimitSeconds] - number of seconds to wait before
 *  allowing another set of events to be tracked.
 * @param opts.securityProviderRequest
 * @param {Function} opts.getAccountType
 * @param {Function} opts.getDeviceModel
 * @param {RestrictedControllerMessenger} opts.snapAndHardwareMessenger
 * @returns {Function}
 */
export default function createRPCMethodTrackingMiddleware({
  trackEvent,
  getMetricsState,
  rateLimitSeconds = 60 * 5,
  securityProviderRequest,
  getAccountType,
  getDeviceModel,
  snapAndHardwareMessenger,
}) {
  return async function rpcMethodTrackingMiddleware(
    /** @type {any} */ req,
    /** @type {any} */ res,
    /** @type {Function} */ next,
  ) {
    const { origin, method } = req;

    // Determine what type of rate limit to apply based on method
    const rateLimitType =
      RATE_LIMIT_MAP[method] ?? RATE_LIMIT_TYPES.RATE_LIMITED;

    // If the rateLimitType is RATE_LIMITED check the rateLimitTimeouts
    const rateLimited =
      rateLimitType === RATE_LIMIT_TYPES.RATE_LIMITED &&
      typeof rateLimitTimeouts[method] !== 'undefined';

    // Get the participateInMetaMetrics state to determine if we should track
    // anything. This is extra redundancy because this value is checked in
    // the metametrics controller's trackEvent method as well.
    const userParticipatingInMetaMetrics =
      getMetricsState().participateInMetaMetrics === true;

    // Get the event type, each of which has APPROVED, REJECTED and REQUESTED
    // keys for the various events in the flow.
    const eventType = EVENT_NAME_MAP[method];

    const eventProperties = {};

    // Boolean variable that reduces code duplication and increases legibility
    const shouldTrackEvent =
      // Don't track if the request came from our own UI or background
      origin !== ORIGIN_METAMASK &&
      // Don't track if this is a blocked method
      rateLimitType !== RATE_LIMIT_TYPES.BLOCKED &&
      // Don't track if the rate limit has been hit
      rateLimited === false &&
      // Don't track if the user isn't participating in metametrics
      userParticipatingInMetaMetrics === true;

    if (shouldTrackEvent) {
      // We track an initial "requested" event as soon as the dapp calls the
      // provider method. For the events not special cased this is the only
      // event that will be fired and the event name will be
      // 'Provider Method Called'.
      const event = eventType
        ? eventType.REQUESTED
        : MetaMetricsEventName.ProviderMethodCalled;

      if (event === MetaMetricsEventName.SignatureRequested) {
        eventProperties.signature_type = method;

        // In personal messages the first param is data while in typed messages second param is data
        // if condition below is added to ensure that the right params are captured as data and address.
        let data;
        let from;
        if (isValidAddress(req?.params?.[1])) {
          data = req?.params?.[0];
          from = req?.params?.[1];
        } else {
          data = req?.params?.[1];
          from = req?.params?.[0];
        }
        const paramsExamplePassword = req?.params?.[2];

        ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
        if (req.securityAlertResponse?.providerRequestsCount) {
          Object.keys(req.securityAlertResponse.providerRequestsCount).forEach(
            (key) => {
              const metricKey = `ppom_${key}_count`;
              eventProperties[metricKey] =
                req.securityAlertResponse.providerRequestsCount[key];
            },
          );
        }

        eventProperties.security_alert_response =
          req.securityAlertResponse?.result_type ??
          BlockaidResultType.NotApplicable;
        eventProperties.security_alert_reason =
          req.securityAlertResponse?.reason ?? BlockaidReason.notApplicable;
        ///: END:ONLY_INCLUDE_IF

        const snapAndHardwareInfo = await getSnapAndHardwareInfoForMetrics(
          getAccountType,
          getDeviceModel,
          snapAndHardwareMessenger,
        );

        // merge the snapAndHardwareInfo into eventProperties
        Object.assign(eventProperties, snapAndHardwareInfo);

        const msgData = {
          msgParams: {
            ...paramsExamplePassword,
            from,
            data,
            origin,
          },
          status: TransactionStatus.unapproved,
          type: req.method,
        };

        try {
          const securityProviderResponse = await securityProviderRequest(
            msgData,
            req.method,
          );

          if (securityProviderResponse?.flagAsDangerous === 1) {
            eventProperties.ui_customizations = [
              MetaMetricsEventUiCustomization.FlaggedAsMalicious,
            ];
          } else if (securityProviderResponse?.flagAsDangerous === 2) {
            eventProperties.ui_customizations = [
              MetaMetricsEventUiCustomization.FlaggedAsSafetyUnknown,
            ];
          }

          if (method === MESSAGE_TYPE.PERSONAL_SIGN) {
            const { isSIWEMessage } = detectSIWE({ data });
            if (isSIWEMessage) {
              eventProperties.ui_customizations = (
                eventProperties.ui_customizations || []
              ).concat(MetaMetricsEventUiCustomization.Siwe);
            }
          }
        } catch (e) {
          console.warn(
            `createRPCMethodTrackingMiddleware: Error calling securityProviderRequest - ${e}`,
          );
        }
      } else {
        eventProperties.method = method;
      }

      trackEvent({
        event,
        category: MetaMetricsEventCategory.InpageProvider,
        referrer: {
          url: origin,
        },
        properties: eventProperties,
      });

      rateLimitTimeouts[method] = setTimeout(() => {
        delete rateLimitTimeouts[method];
      }, SECOND * rateLimitSeconds);
    }

    next(async (callback) => {
      if (shouldTrackEvent === false || typeof eventType === 'undefined') {
        return callback();
      }

      // The rpc error methodNotFound implies that 'eth_sign' is disabled in Advanced Settings
      const isDisabledEthSignAdvancedSetting =
        method === MESSAGE_TYPE.ETH_SIGN &&
        res.error?.code === errorCodes.rpc.methodNotFound;

      const isDisabledRPCMethod = isDisabledEthSignAdvancedSetting;

      let event;
      if (isDisabledRPCMethod) {
        event = eventType.FAILED;
        eventProperties.error = res.error;
      } else if (res.error?.code === errorCodes.provider.userRejectedRequest) {
        event = eventType.REJECTED;
      } else if (
        res.error?.code === errorCodes.rpc.internal &&
        res.error?.message === 'Request rejected by user or snap.'
      ) {
        // The signature was approved in MetaMask but rejected in the snap
        event = eventType.REJECTED;
        eventProperties.status = res.error.message;
      } else {
        event = eventType.APPROVED;
      }

      trackEvent({
        event,
        category: MetaMetricsEventCategory.InpageProvider,
        referrer: {
          url: origin,
        },
        properties: eventProperties,
      });

      return callback();
    });
  };
}
