import log from 'loglevel'
import extension from 'extensionizer'

/**
 * Returns a middleware that intercepts `wallet_registerOnboarding` messages
 * @param {{ location: string, registerOnboarding: Function }} opts - The middleware options
 * @returns {(req: any, res: any, next: Function, end: Function) => void}
 */
export default function createOnboardingMiddleware({
  location,
  registerOnboarding,
}) {
  return async function originMiddleware(req, res, next, end) {
    try {
      if (req.method !== 'wallet_registerOnboarding') {
        next()
        return
      }
      if (req.tabId && req.tabId !== extension.tabs.TAB_ID_NONE) {
        await registerOnboarding(location, req.tabId)
      } else {
        log.debug(
          `'wallet_registerOnboarding' message from ${location} ignored due to missing tabId`,
        )
      }
      res.result = true
      end()
    } catch (error) {
      end(error)
    }
  }
}
