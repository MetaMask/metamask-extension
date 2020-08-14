
const recordedWeb3Usage = {}

/**
 * Returns a middleware that implements the following RPC methods:
 * - metamask_logInjectedWeb3Usage
 *
 * @param {Object} opts - The middleware options
 * @param {string} opts.origin - The origin for the middleware stack
 * @param {Function} opts.sendMetrics - A function for sending a metrics event
 * @returns {(req: any, res: any, next: Function, end: Function) => void}
 */
export default function createMethodMiddleware ({ origin, sendMetrics }) {
  return function methodMiddleware (req, res, next, end) {
    switch (req.method) {

      case 'metamask_logInjectedWeb3Usage':

        const { action, name } = req.params[0]

        if (!recordedWeb3Usage[origin]) {
          recordedWeb3Usage[origin] = {}
        }
        if (!recordedWeb3Usage[origin][name]) {
          recordedWeb3Usage[origin][name] = true
          sendMetrics({
            action,
            name,
            customVariables: { origin },
          })
        }

        res.result = true
        break

      default:
        return next()
    }
    return end()
  }
}
