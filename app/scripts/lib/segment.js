import Analytics from 'analytics-node'

const inDevelopment = process.env.METAMASK_DEBUG || process.env.IN_TEST

const flushAt = inDevelopment ? 1 : undefined

const METAMETRICS_ANONYMOUS_ID = '0x0000000000000000'

const segmentNoop = {
  track () {
    // noop
  },
  page () {
    // noop
  },
  identify () {
    // noop
  },
}

// We do not want to track events on development builds unless specifically
// provided a SEGMENT_WRITE_KEY. This also holds true for test environments and
// E2E, which is handled in the build process by never providing the SEGMENT_WRITE_KEY
// which process.env.IN_TEST is true
const segment = process.env.SEGMENT_WRITE_KEY
  ? new Analytics(process.env.SEGMENT_WRITE_KEY, { flushAt })
  : segmentNoop

/**
 * Returns a function for tracking Segment events.
 *
 * @param {string} metamaskVersion - The current version of the MetaMask
 * extension.
 * @param {Function} getParticipateInMetrics - A function that returns
 * whether the user participates in MetaMetrics.
 * @param {Function} getMetricsState - A function for getting state relevant
 * to MetaMetrics/Segment.
 */
export function getTrackSegmentEvent (
  metamaskVersion,
  getParticipateInMetrics,
  getMetricsState,
) {
  const version = process.env.METAMASK_ENVIRONMENT === 'production'
    ? metamaskVersion
    : `${metamaskVersion}-${process.env.METAMASK_ENVIRONMENT}`

  const segmentContext = {
    app: {
      name: 'MetaMask Extension',
      version,
    },
    page: {
      path: '/background-process',
      title: 'Background Process',
      url: '/background-process',
    },
    userAgent: window.navigator.userAgent,
  }

  /**
   * Tracks a Segment event per the given arguments.
   *
   * @param {string} event - The event name.
   * @param {string} category - The event category.
   * @param {Object} [properties] - The event properties.
   * @param {string} [referrerUrl] - The event's referrer URL, if relevant.
   * @param {boolean} [excludeMetaMetricsId] - `true` if the user's MetaMetrics id should
   * not be included, and `false` otherwise. Default: `true`
   */
  return function trackSegmentEvent ({
    event,
    category,
    properties = {},
    excludeMetaMetricsId = true,
    referrerUrl,
  }) {
    if (!event || !category) {
      throw new Error('Must specify event and category.')
    }

    if (!getParticipateInMetrics()) {
      return
    }

    const { currentLocale, metaMetricsId } = getMetricsState()

    const trackOptions = {
      event,
      category,
      context: {
        ...segmentContext,
        locale: currentLocale.replace('_', '-'),
      },
      properties,
    }

    if (excludeMetaMetricsId) {
      trackOptions.anonymousId = METAMETRICS_ANONYMOUS_ID
    } else {
      trackOptions.userId = metaMetricsId
    }

    if (referrerUrl) {
      trackOptions.context.referrer = {
        url: referrerUrl,
      }
    }

    segment.track(trackOptions)
  }
}
