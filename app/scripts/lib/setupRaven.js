const Raven = require('raven-js')
const METAMASK_DEBUG = process.env.METAMASK_DEBUG
const extractEthjsErrorMessage = require('./extractEthjsErrorMessage')
const PROD = 'https://360a79f943ec4027ada89829269783c6@sentry.io/1133071'
const DEV = 'https://8cce17b3abf749c1b93cdeb1232b853a@sentry.io/1133103'

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
      const report = opts.data
      // simplify certain complex error messages
      report.exception.values.forEach(item => {
        let errorMessage = item.value
        // simplify ethjs error messages
        errorMessage = extractEthjsErrorMessage(errorMessage)
        // simplify 'Transaction Failed: known transaction'
        if (errorMessage.indexOf('Transaction Failed: known transaction') === 0) {
          // cut the hash from the error message
          errorMessage = 'Transaction Failed: known transaction'
        }
        // finalize
        item.value = errorMessage
      })

      // modify report urls
      rewriteReportUrls(report)
      // make request normally
      client._makeRequest(opts)
    },
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
