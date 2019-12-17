const fetchWithTimeout = ({ timeout = 120000 } = {}) => {
  return async function _fetch (url, opts) {
    const abortController = new AbortController()
    const abortSignal = abortController.signal
    const f = fetch(url, {
      ...opts,
      signal: abortSignal,
    })

    const timer = setTimeout(() => abortController.abort(), timeout)

    try {
      const res = await f
      clearTimeout(timer)
      return res
    } catch (e) {
      clearTimeout(timer)
      throw e
    }
  }
}

export default fetchWithTimeout
