module.exports = setupFetchDebugging

//
// This is a utility to help resolve cases where `window.fetch` throws a
// `TypeError: Failed to Fetch` without any stack or context for the request
// https://github.com/getsentry/sentry-javascript/pull/1293
//

function setupFetchDebugging () {
  if (!global.fetch) return
  const originalFetch = global.fetch

  global.fetch = wrappedFetch

  async function wrappedFetch (...args) {
    const initialStack = getCurrentStack()
    try {
      return await originalFetch.call(window, ...args)
    } catch (err) {
      if (!err.stack) {
        console.warn('FetchDebugger - fetch encountered an Error without a stack', err)
        console.warn('FetchDebugger - overriding stack to point of original call')
        err.stack = initialStack
      }
      throw err
    }
  }
}

function getCurrentStack () {
  try {
    throw new Error('Fake error for generating stack trace')
  } catch (err) {
    return err.stack
  }
}
