import extractEthjsErrorMessage from './extractEthjsErrorMessage'

//
// utility for formatting failed transaction messages
// for sending to sentry
//

export function reportFailedTxToSentry({ sentry, txMeta }) {
  const errorMessage =
    'Transaction Failed: ' + extractEthjsErrorMessage(txMeta.err.message)
  sentry.captureMessage(errorMessage, {
    // "extra" key is required by Sentry
    extra: { txMeta },
  })
}

export function reportErrorTxToSentry({ sentry, txMeta }) {
  sentry.withScope(function(scope) {
    scope.setTag('ERROR_TX', 'setHash')
    scope.setLevel('error')
    scope.addEventProcessor(function(event) {
      event.extra.txMeta = txMeta
      return event
    })
    const errorMessage = 'Transaction hash found early'
    sentry.captureMessage(errorMessage)
  })
}

export function reportBuggedTxToSentry({ sentry, txMeta }) {
  sentry.withScope(function(scope) {
    scope.setTag('ERROR_TX', 'missingRawTx')
    scope.setLevel('error')
    scope.addEventProcessor(function(event) {
      event.extra.txMeta = txMeta
      return event
    })
    const errorMessage = 'Transaction rawTx missing'
    sentry.captureMessage(errorMessage)
  })
}
