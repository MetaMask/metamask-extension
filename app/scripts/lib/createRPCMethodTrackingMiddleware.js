import { MESSAGE_TYPE, ORIGIN_METAMASK } from '../../../shared/constants/app';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';

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
 * return an object with APPROVED, REJECTED and REQUESTED keys that map to the
 * appropriate event names.
 */
const EVENT_NAME_MAP = {
  [MESSAGE_TYPE.ETH_SIGN]: {
    APPROVED: EVENT_NAMES.SIGNATURE_APPROVED,
    REJECTED: EVENT_NAMES.SIGNATURE_REJECTED,
    REQUESTED: EVENT_NAMES.SIGNATURE_REQUESTED,
  },
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA]: {
    APPROVED: EVENT_NAMES.SIGNATURE_APPROVED,
    REJECTED: EVENT_NAMES.SIGNATURE_REJECTED,
    REQUESTED: EVENT_NAMES.SIGNATURE_REQUESTED,
  },
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3]: {
    APPROVED: EVENT_NAMES.SIGNATURE_APPROVED,
    REJECTED: EVENT_NAMES.SIGNATURE_REJECTED,
    REQUESTED: EVENT_NAMES.SIGNATURE_REQUESTED,
  },
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4]: {
    APPROVED: EVENT_NAMES.SIGNATURE_APPROVED,
    REJECTED: EVENT_NAMES.SIGNATURE_REJECTED,
    REQUESTED: EVENT_NAMES.SIGNATURE_REQUESTED,
  },
  [MESSAGE_TYPE.PERSONAL_SIGN]: {
    APPROVED: EVENT_NAMES.SIGNATURE_APPROVED,
    REJECTED: EVENT_NAMES.SIGNATURE_REJECTED,
    REQUESTED: EVENT_NAMES.SIGNATURE_REQUESTED,
  },
  [MESSAGE_TYPE.ETH_DECRYPT]: {
    APPROVED: EVENT_NAMES.DECRYPTION_APPROVED,
    REJECTED: EVENT_NAMES.DECRYPTION_REJECTED,
    REQUESTED: EVENT_NAMES.DECRYPTION_REQUESTED,
  },
  [MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY]: {
    APPROVED: EVENT_NAMES.ENCRYPTION_PUBLIC_KEY_APPROVED,
    REJECTED: EVENT_NAMES.ENCRYPTION_PUBLIC_KEY_REJECTED,
    REQUESTED: EVENT_NAMES.ENCRYPTION_PUBLIC_KEY_REQUESTED,
  },
  [MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS]: {
    APPROVED: EVENT_NAMES.PERMISSIONS_APPROVED,
    REJECTED: EVENT_NAMES.PERMISSIONS_REJECTED,
    REQUESTED: EVENT_NAMES.PERMISSIONS_REQUESTED,
  },
  [MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS]: {
    APPROVED: EVENT_NAMES.PERMISSIONS_APPROVED,
    REJECTED: EVENT_NAMES.PERMISSIONS_REJECTED,
    REQUESTED: EVENT_NAMES.PERMISSIONS_REQUESTED,
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
 * @returns {Function}
 */
export default function createRPCMethodTrackingMiddleware({
  trackEvent,
  getMetricsState,
  rateLimitSeconds = 60,
}) {
  return function rpcMethodTrackingMiddleware(
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
        : EVENT_NAMES.PROVIDER_METHOD_CALLED;

      const properties = {};

      if (event === EVENT_NAMES.SIGNATURE_REQUESTED) {
        properties.signature_type = method;
      } else {
        properties.method = method;
      }

      trackEvent({
        event,
        category: EVENT.CATEGORIES.INPAGE_PROVIDER,
        referrer: {
          url: origin,
        },
        properties,
      });

      rateLimitTimeouts[method] = setTimeout(() => {
        delete rateLimitTimeouts[method];
      }, SECOND * rateLimitSeconds);
    }

    next((callback) => {
      if (shouldTrackEvent === false || typeof eventType === 'undefined') {
        return callback();
      }

      // An error code of 4001 means the user rejected the request, which we
      // can use here to determine which event to track.
      const event =
        res.error?.code === 4001 ? eventType.REJECTED : eventType.APPROVED;

      const properties = {};

      if (eventType.REQUESTED === EVENT_NAMES.SIGNATURE_REQUESTED) {
        properties.signature_type = method;
      } else {
        properties.method = method;
      }

      trackEvent({
        event,
        category: EVENT.CATEGORIES.INPAGE_PROVIDER,
        referrer: {
          url: origin,
        },
        properties,
      });
      return callback();
    });
  };
}
