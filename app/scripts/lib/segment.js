import Analytics from 'analytics-node'

const inDevelopment = process.env.METAMASK_DEBUG || process.env.IN_TEST

const flushAt = inDevelopment ? 1 : undefined

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
export const segment = process.env.SEGMENT_WRITE_KEY
  ? new Analytics(process.env.SEGMENT_WRITE_KEY, { flushAt })
  : segmentNoop

export const METAMETRICS_ANONYMOUS_ID = '0x0000000000000000'
