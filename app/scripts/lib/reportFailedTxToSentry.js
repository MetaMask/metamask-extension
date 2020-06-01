import extractEthjsErrorMessage from './extractEthjsErrorMessage'

//
// utility for formatting failed transaction messages
// for sending to sentry
//

export default function reportFailedTxToSentry ({ sentry, txMeta }) {
  const errorMessage = 'Transaction Failed: ' + extractEthjsErrorMessage(txMeta.err.message)
  sentry.captureMessage(errorMessage, {
    // "extra" key is required by Sentry
    extra: { txMeta },
  })
}
