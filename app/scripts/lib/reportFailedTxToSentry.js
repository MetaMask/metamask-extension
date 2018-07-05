const extractEthjsErrorMessage = require('./extractEthjsErrorMessage')

module.exports = reportFailedTxToSentry

//
// utility for formatting failed transaction messages
// for sending to sentry
//

function reportFailedTxToSentry ({ raven, txMeta }) {
  const errorMessage = 'Transaction Failed: ' + extractEthjsErrorMessage(txMeta.err.message)
  raven.captureMessage(errorMessage, {
    // "extra" key is required by Sentry
    extra: txMeta,
  })
}
