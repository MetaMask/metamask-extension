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
 * @property {Function} getParticipateInMetrics - A function that returns
 * whether the user participates in MetaMetrics.
 * @property {Function} getMetaMaskVersion - A function for getting the current
 * version of the MetaMask extension.
 * @property {Function} getMetricsState - A function for getting state relevant
 * to MetaMetrics/Segment.
 */
export function getTrackSegmentEvent (
  getParticipateInMetrics,
  getMetaMaskVersion,
  getMetricsState,
) {
  const getVersion = () => {
    const metamaskVersion = getMetaMaskVersion()
    return process.env.METAMASK_ENVIRONMENT === 'production'
      ? metamaskVersion
      : `${metamaskVersion}-${process.env.METAMASK_ENVIRONMENT}`
  }

  const segmentContext = {
    app: {
      name: 'MetaMask Extension',
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
   * @param {boolean} [anonymous] - `true` if the user's MetaMetrics id should
   * not be included, and `false` otherwise. Default: `true`
   */
  return function trackSegmentEvent ({
    event,
    category,
    properties = {},
    anonymous = true,
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
        app: {
          ...segmentContext.app,
          version: getVersion(),
        },
        locale: currentLocale.replace('_', '-'),
      },
      properties,
    }

    if (anonymous) {
      trackOptions.anonymousId = METAMETRICS_ANONYMOUS_ID
      trackOptions.excludeMetaMetricsId = true
    } else {
      trackOptions.userId = metaMetricsId
    }

    segment.track(trackOptions)
  }
}
