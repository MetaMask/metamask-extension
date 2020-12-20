const fetchWithTimeout = ({ timeout = 120000 } = {}) => {
  return async function _fetch(url, opts) {
    const abortController = new window.AbortController()
    const { signal } = abortController
    const f = window.fetch(url, {
      ...opts,
      signal,
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
