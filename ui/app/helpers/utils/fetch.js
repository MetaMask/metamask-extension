export default function ({ timeout = 120000 } = {}) {
  return function _fetch (url, opts) {
    return new Promise(async (resolve, reject) => {
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
        return resolve(res)
      } catch (e) {
        clearTimeout(timer)
        return reject(e)
      }
    })
  }
}
