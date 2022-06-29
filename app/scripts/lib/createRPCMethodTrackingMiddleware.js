import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';
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

// The inpage provider invokes some methods upon being injected into the page.
// We do not want to collect this data, as it is not triggered by dapps.
const BLOCKED_METHODS = [
  MESSAGE_TYPE.SEND_METADATA,
  MESSAGE_TYPE.GET_PROVIDER_STATE,
];

const samplingTimeouts = {};

/**
 * Invokes provided fn at most once in every rate milliseconds, uses key to log
 * the timeout for rate limiting.
 *
 * @param {number} rate - Number of milliseconds to block invocation of fn for.
 * @param {string} key - Key to store timeout id at.
 * @param {Function} fn - Function to invoke if not rate limited at time of
 *  invocation.
 */
function rateLimit(rate, key, fn) {
  if (typeof samplingTimeouts[key] === 'undefined') {
    console.log('not rate limited!', key);
    fn();
    // Only record one call to this method every sixty seconds to avoid
    // overloading network requests.
    samplingTimeouts[key] = setTimeout(() => {
      delete samplingTimeouts[key];
    }, rate);
  } else {
    console.log('rate limited', key);
  }
}
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
      if (
        // Skip if the user isn't participating in metametrics
        getMetricsState().participateInMetaMetrics === false ||
        // Skip if one of the methods called at time of inpage provider init
        BLOCKED_METHODS.includes(req.method) ||
        // Skip if being called by our own extension UI/background process
        req.origin === 'metamask'
      ) {
        return callback();
      }
      const eventName = USER_PROMPTED_EVENT_NAME_MAP[req.method];

      if (eventName) {
        const userRejected = res.error?.code === 4001;
        rateLimit(
          // Rate limit only if dealing with permissions requests
          eventName === EVENT_NAMES.PERMISSIONS_REQUESTED ? 0 : SECOND * 60,
          eventName,
          () => {
            trackEvent({
              event: USER_PROMPTED_EVENT_NAME_MAP[req.method],
              category: EVENT.CATEGORIES.INPAGE_PROVIDER,
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
          },
        );
      } else {
        rateLimit(SECOND * 60, req.method, () => {
          trackEvent({
            event: 'Provider Method Called',
            category: EVENT.CATEGORIES.INPAGE_PROVIDER,
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
        });
      }
      return callback();
    });
  };
}
