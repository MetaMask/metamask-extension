import {
  loadLocalStorageData,
  saveLocalStorageData,
} from '../../../lib/local-storage-helpers'
import http from './fetch'

const fetch = http({
  timeout: 30000,
})

export default function fetchWithCache (url, opts, cacheRefreshTime = 360000) {
  const currentTime = Date.now()
  const cachedFetch = loadLocalStorageData('cachedFetch') || {}
  const { cachedUrl, cachedTime } = cachedFetch[url] || {}
  if (cachedUrl && currentTime - cachedTime < cacheRefreshTime) {
    return cachedFetch[url]
  } else {
    cachedFetch[url] = { cachedUrl: url, cachedTime: currentTime }
    saveLocalStorageData(cachedFetch, 'cachedFetch')
    return fetch(url, {
      referrerPolicy: 'no-referrer-when-downgrade',
      body: null,
      method: 'GET',
      mode: 'cors',
      ...opts,
    })
  }
}
