import { SECOND } from '../../../shared/constants/time';

const USER_PROMPTED_EVENT_NAME_MAP = {
  eth_signTypedData_v4: 'Signature Requested',
  eth_signTypedData_v3: 'Signature Requested',
  eth_signTypedData: 'Signature Requested',
  eth_personal_sign: 'Signature Requested',
  eth_sign: 'Signature Requested',
  eth_getEncryptionPublicKey: 'Encryption Public Key Requested',
  eth_decrypt: 'Decryption Requsted',
  wallet_requestPermissions: 'Permissions Requested',
  eth_requestAccounts: 'Permissions Requested',
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
    const { origin } = req;

    next((callback) => {
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
