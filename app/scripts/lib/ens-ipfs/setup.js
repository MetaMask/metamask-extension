const extension = require('extensionizer')
const resolveEnsToIpfsContentId = require('./resolver.js')

const supportedTopLevelDomains = ['eth']

module.exports = setupEnsIpfsResolver

function setupEnsIpfsResolver({ provider }) {

  // install listener
  const urlPatterns = supportedTopLevelDomains.map(tld => `*://*.${tld}/`)
  extension.webRequest.onErrorOccurred.addListener(webRequestDidFail, { urls: urlPatterns })

  // return api object
  return {
    // uninstall listener
    remove () {
      extension.webRequest.onErrorOccurred.removeListener(webRequestDidFail)
    },
  }

  async function webRequestDidFail (details) {
    const { tabId, url } = details
    // ignore requests that are not associated with tabs
    if (tabId === -1) return
    // parse ens name
    const name = url.substring(7, url.length - 1)
    const path = name.split('.')
    const topLevelDomain = path[path.length - 1]
    // if unsupported TLD, abort
    if (!supportedTopLevelDomains.includes(topLevelDomain)) return
    // otherwise attempt resolve
    attemptResolve({ name, tabId })
  }

  async function attemptResolve({ tabId, name }) {
    extension.tabs.update(tabId, { url: `loading.html` })
    try {
      const ipfsContentId = await resolveEnsToIpfsContentId({ provider, name })
      const url = `https://ipfs.infura.io/ipfs/${ipfsContentId}`
      try {
        // check if ipfs gateway has result
        const response = await fetch(url, { method: 'HEAD' })
        // if failure, redirect to 404 page
        if (response.status !== 200) {
          extension.tabs.update(tabId, { url: '404.html' })
          return
        }
        // otherwise redirect to the correct page
        extension.tabs.update(tabId, { url })
      } catch (err) {
        console.warn(err)
        // if HEAD fetch failed, redirect so user can see relevant error page
        extension.tabs.update(tabId, { url })
      }
    } catch (err) {
      console.warn(err)
      extension.tabs.update(tabId, { url: `error.html?name=${name}` })
    }
  }
}
