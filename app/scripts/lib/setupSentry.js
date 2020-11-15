import * as Sentry from '@sentry/browser'
import { Dedupe, ExtraErrorData } from '@sentry/integrations'

import extractEthjsErrorMessage from './extractEthjsErrorMessage'

const METAMASK_DEBUG = process.env.METAMASK_DEBUG
const METAMASK_ENVIRONMENT = process.env.METAMASK_ENVIRONMENT
const SENTRY_DSN_PROD =
  'https://756aa0cb47eb4b44ac25739ceba42c07@sentry.io/3624979'
const SENTRY_DSN_DEV =
  'https://756aa0cb47eb4b44ac25739ceba42c07@sentry.io/3624979'

export default setupSentry

// Setup sentry remote error reporting
function setupSentry(opts) {
  const { release, getState } = opts
  let sentryTarget
  // detect brave
  const isBrave = Boolean(window.chrome.ipcRenderer)

  if (METAMASK_DEBUG || process.env.IN_TEST) {
    console.log(
      `Setting up Sentry Remote Error Reporting for '${METAMASK_ENVIRONMENT}': SENTRY_DSN_DEV`
    )
    sentryTarget = SENTRY_DSN_DEV
  } else {
    console.log(
      `Setting up Sentry Remote Error Reporting for '${METAMASK_ENVIRONMENT}': SENTRY_DSN_PROD`
    )
    sentryTarget = SENTRY_DSN_PROD
  }

  Sentry.init({
    dsn: sentryTarget,
    debug: METAMASK_DEBUG,
    environment: METAMASK_ENVIRONMENT,
    integrations: [new Dedupe(), new ExtraErrorData()],
    release,
    beforeSend: report => rewriteReport(report),
  })

  Sentry.configureScope(scope => {
    scope.setExtra('isBrave', isBrave)
  })

  function rewriteReport(report) {
    try {
      // simplify certain complex error messages (e.g. Ethjs)
      simplifyErrorMessages(report)
      // modify report urls
      rewriteReportUrls(report)
      // append app state
      if (getState) {
        const appState = getState()
        report.extra.appState = appState
      }
    } catch (err) {
      console.warn(err)
    }
    return report
  }

  return Sentry
}

function simplifyErrorMessages(report) {
  rewriteErrorMessages(report, errorMessage => {
    // simplify ethjs error messages
    errorMessage = extractEthjsErrorMessage(errorMessage)
    // simplify 'Transaction Failed: tx already exist'
    if (errorMessage.indexOf('Transaction Failed: tx already exist') === 0) {
      // cut the hash from the error message
      errorMessage = 'Transaction Failed: tx already exist'
    }
    return errorMessage
  })
}

function rewriteErrorMessages(report, rewriteFn) {
  // rewrite top level message
  if (typeof report.message === 'string') {
    report.message = rewriteFn(report.message)
  }
  // rewrite each exception message
  if (report.exception && report.exception.values) {
    report.exception.values.forEach(item => {
      if (typeof item.value === 'string') {
        item.value = rewriteFn(item.value)
      }
    })
  }
}

function rewriteReportUrls(report) {
  // update request url
  report.request.url = toMetamaskUrl(report.request.url)
  // update exception stack trace
  if (report.exception && report.exception.values) {
    report.exception.values.forEach(item => {
      item.stacktrace.frames.forEach(frame => {
        frame.filename = toMetamaskUrl(frame.filename)
      })
    })
  }
}

function toMetamaskUrl(origUrl) {
  const filePath = origUrl.split(location.origin)[1]
  if (!filePath) {
    return origUrl
  }
  const metamaskUrl = `portal${filePath}`
  return metamaskUrl
}
