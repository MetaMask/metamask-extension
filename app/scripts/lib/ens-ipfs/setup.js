const urlUtil = require('url')
const extension = require('extensionizer')
const resolveEnsToIpfsContentId = require('./resolver.js')

const supportedTopLevelDomains = ['eth']

module.exports = setupEnsIpfsResolver

function setupEnsIpfsResolver ({ provider }) {

  // install listener
  const urlPatterns = supportedTopLevelDomains.map(tld => `*://*.${tld}/*`)
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
    const urlData = urlUtil.parse(url)
    const { hostname: name, path, search } = urlData
    const domainParts = name.split('.')
    const topLevelDomain = domainParts[domainParts.length - 1]
    // if unsupported TLD, abort
    if (!supportedTopLevelDomains.includes(topLevelDomain)) return
    // otherwise attempt resolve
    attemptResolve({ tabId, name, path, search })
  }

  async function attemptResolve ({ tabId, name, path, search }) {
    extension.tabs.update(tabId, { url: `loading.html` })
    let url = `https://manager.ens.domains/name/${name}`
    try {
      const {type, hash} = await resolveEnsToIpfsContentId({ provider, name })
      if (type === 'ipfs-ns') {
        const resolvedUrl = `https://gateway.ipfs.io/ipfs/${hash}${path}${search || ''}`
        try {
          // check if ipfs gateway has result
          const response = await fetch(resolvedUrl, { method: 'HEAD' })
          if (response.status === 200) url = resolvedUrl
        } catch (err) {
          console.warn(err)
        }
      } else if (type === 'swarm-ns') {
        url = `https://swarm-gateways.net/bzz:/${hash}${path}${search || ''}`
      } else if (type === 'onion' || type === 'onion3') {
        url = `http://${hash}.onion${path}${search || ''}`
      }
    } catch (err) {
      console.warn(err)
    } finally {
      extension.tabs.update(tabId, { url })
    }
  }
}
