const Raven = require('raven-js')
const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'
const PROD = 'https://3567c198f8a8412082d32655da2961d0@sentry.io/273505'
const DEV = 'https://f59f3dd640d2429d9d0e2445a87ea8e1@sentry.io/273496'

module.exports = setupRaven

// Setup raven / sentry remote error reporting
function setupRaven(opts) {
  const { release } = opts
  let ravenTarget

  if (METAMASK_DEBUG) {
    console.log('Setting up Sentry Remote Error Reporting: DEV')
    ravenTarget = DEV
  } else {
    console.log('Setting up Sentry Remote Error Reporting: PROD')
    ravenTarget = PROD
  }

  const client = Raven.config(ravenTarget, {
    release,
    transport: function(opts) {
      // modify report urls
      const report = opts.data
      rewriteReportUrls(report)
      // make request normally
      client._makeRequest(opts)
    }
  })
  client.install()

  return Raven
}

function rewriteReportUrls(report) {
  // update request url
  report.request.url = toMetamaskUrl(report.request.url)
  // update exception stack trace
  report.exception.values.forEach(item => {
    item.stacktrace.frames.forEach(frame => {
      frame.filename = toMetamaskUrl(frame.filename)
    })
  })
}

function toMetamaskUrl(origUrl) {
  const filePath = origUrl.split(location.origin)[1]
  if (!filePath) return origUrl
  const metamaskUrl = `metamask${filePath}`
  return metamaskUrl
}
