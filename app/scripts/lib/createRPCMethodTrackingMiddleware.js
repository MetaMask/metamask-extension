import { EVENT_NAMES } from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';

const USER_PROMPTED_EVENT_NAME_MAP = {
  eth_signTypedData_v4: EVENT_NAMES.SIGNATURE_REQUESTED,
  eth_signTypedData_v3: EVENT_NAMES.SIGNATURE_REQUESTED,
  eth_signTypedData: EVENT_NAMES.SIGNATURE_REQUESTED,
  eth_personal_sign: EVENT_NAMES.SIGNATURE_REQUESTED,
  eth_sign: EVENT_NAMES.SIGNATURE_REQUESTED,
  eth_getEncryptionPublicKey: EVENT_NAMES.ENCRYPTION_PUBLIC_KEY_REQUESTED,
  eth_decrypt: EVENT_NAMES.DECRYPTION_REQUESTED,
  wallet_requestPermissions: EVENT_NAMES.PERMISSIONS_REQUESTED,
  eth_requestAccounts: EVENT_NAMES.PERMISSIONS_REQUESTED,
};

const samplingTimeouts = {};

/**
 * Returns a middleware that tracks inpage_provider usage using sampling for
 * each type of event except those that require user interaction, such as
 * signature requests
 *
 * @param {object} opts - options for the rpc method tracking middleware
 * @param {Function} opts.trackEvent - trackEvent method from MetaMetricsController
 * @param {Function} opts.getMetricsState - get the state of MetaMetricsController
 * @returns {Function}
 */
export default function createRPCMethodTrackingMiddleware({
  trackEvent,
  getMetricsState,
}) {
  return function rpcMethodTrackingMiddleware(
    /** @type {any} */ req,
    /** @type {any} */ res,
    /** @type {Function} */ next,
  ) {
    const startTime = Date.now();
    const { origin } = req;

    next((callback) => {
      const endTime = Date.now();
      if (!getMetricsState().participateInMetaMetrics) {
        return callback();
      }
      if (USER_PROMPTED_EVENT_NAME_MAP[req.method]) {
        const userRejected = res.error?.code === 4001;
        trackEvent({
          event: USER_PROMPTED_EVENT_NAME_MAP[req.method],
          category: 'inpage_provider',
          referrer: {
            url: origin,
          },
          properties: {
            method: req.method,
            status: userRejected ? 'rejected' : 'approved',
            error_code: res.error?.code,
            error_message: res.error?.message,
            has_result: typeof res.result !== 'undefined',
            duration: endTime - startTime,
          },
        });
      } else if (typeof samplingTimeouts[req.method] === 'undefined') {
        trackEvent({
          event: 'Provider Method Called',
          category: 'inpage_provider',
          referrer: {
            url: origin,
          },
          properties: {
            method: req.method,
            error_code: res.error?.code,
            error_message: res.error?.message,
            has_result: typeof res.result !== 'undefined',
            duration: endTime - startTime,
          },
        });
        // Only record one call to this method every ten seconds to avoid
        // overloading network requests.
        samplingTimeouts[req.method] = setTimeout(() => {
          delete samplingTimeouts[req.method];
        }, SECOND * 10);
      }
      return callback();
    });
  };
}
