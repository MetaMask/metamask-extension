const fs = require('fs')
const path = require('path')
const pump = require('pump')
const querystring = require('querystring')
const LocalMessageDuplexStream = require('post-message-stream')
const PongStream = require('ping-pong-stream/pong')
const ObjectMultiplex = require('obj-multiplex')
const extension = require('extensionizer')
const PortStream = require('extension-port-stream')
const TransformStream = require('stream').Transform

const inpageContent = fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'chrome', 'inpage.js')).toString()
const inpageSuffix = '//# sourceURL=' + extension.extension.getURL('inpage.js') + '\n'
const inpageBundle = inpageContent + inpageSuffix
let isEnabled = false

// Eventually this streaming injection could be replaced with:
// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Language_Bindings/Components.utils.exportFunction
//
// But for now that is only Firefox
// If we create a FireFox-only code path using that API,
// MetaMask will be much faster loading and performant on Firefox.

if (shouldInjectWeb3()) {
  injectScript(inpageBundle)
  setupStreams()
  // listenForProviderRequest()
  // checkPrivacyMode()
}

/**
 * Injects a script tag into the current document
 *
 * @param {string} content - Code to be executed in the current document
 */
function injectScript (content) {
  try {
    const container = document.head || document.documentElement
    const scriptTag = document.createElement('script')
    scriptTag.setAttribute('async', false)
    scriptTag.textContent = content
    container.insertBefore(scriptTag, container.children[0])
    container.removeChild(scriptTag)
  } catch (e) {
    console.error('MetaMask script injection failed', e)
  }
}

/**
 * Sets up two-way communication streams between the
 * browser extension and local per-page browser context
 */
function setupStreams () {
  // setup communication to page and plugin
  const pageStream = new LocalMessageDuplexStream({
    name: 'contentscript',
    target: 'inpage',
  })
  const pluginPort = extension.runtime.connect({ name: 'contentscript' })
  const pluginStream = new PortStream(pluginPort)

  // Filter out selectedAddress until this origin is enabled
  const approvalTransform = new TransformStream({
    objectMode: true,
    transform: (data, _, done) => {
      if (typeof data === 'object' && data.name && data.name === 'publicConfig' && !isEnabled) {
        data.data.selectedAddress = undefined
      }

      done(null, { ...data })
    },
  })

  // Include metadata when requesting permissions.
  const requestMetadataTransform = new TransformStream({
    objectMode: true,
    transform: (data, _, done) => {
      const origin = window.location.hostname
      const siteImage = getSiteIcon(window)
      const siteTitle = getSiteName(window)
      const metadata = { origin, siteImage, siteTitle }
      data.data.metadata = metadata

      const result = { ...data }
      done(null, data)
    },
  })

  // forward communication plugin->inpage
  pump(
    pageStream,
    requestMetadataTransform,
    pluginStream,
    approvalTransform,
    pageStream,
    (err) => logStreamDisconnectWarning('MetaMask Contentscript Forwarding', err)
  )

  // setup local multistream channels
  const mux = new ObjectMultiplex()
  mux.setMaxListeners(25)

  pump(
    mux,
    pageStream,
    mux,
    (err) => logStreamDisconnectWarning('MetaMask Inpage', err)
  )
  pump(
    mux,
    pluginStream,
    mux,
    (err) => logStreamDisconnectWarning('MetaMask Background', err)
  )

  // connect ping stream
  const pongStream = new PongStream({ objectMode: true })
  pump(
    mux,
    pongStream,
    mux,
    (err) => logStreamDisconnectWarning('MetaMask PingPongStream', err)
  )

  // connect phishing warning stream
  const phishingStream = mux.createStream('phishing')
  phishingStream.once('data', redirectToPhishingWarning)

  // ignore unused channels (handled by background, inpage)
  mux.ignoreStream('provider')
  mux.ignoreStream('publicConfig')
}

/**
 * Establishes listeners for requests to fully-enable the provider from the dapp context
 * and for full-provider approvals and rejections from the background script context. Dapps
 * should not post messages directly and should instead call provider.enable(), which
 * handles posting these messages internally.
 */
function listenForProviderRequest () {
  window.addEventListener('message', (message) => {
    const { source, data } = message
    if (source !== window || !data || !data.type) { return }
    switch (data.type) {
      case 'METAMASK_SITE_LOADED':
        extension.runtime.sendMessage({
          action: 'init-provider-request',
          origin: source.location.hostname,
          siteImage: getSiteIcon(source),
          siteTitle: getSiteName(source),
        })
        break
    }
  })
}

/* TODO: MAYBE JUST DELETE
  extension.runtime.onMessage.addListener(({ action = '', isApproved, caching, isUnlocked, selectedAddress }) => {
    switch (action) {
      case 'approve-provider-request':
        isEnabled = true
        window.postMessage({ type: 'ethereumprovider', selectedAddress }, '*')
        break
      case 'approve-legacy-provider-request':
        isEnabled = true
        window.postMessage({ type: 'ethereumproviderlegacy', selectedAddress }, '*')
        break
      case 'reject-provider-request':
        window.postMessage({ type: 'ethereumprovider', error: 'User rejected provider access' }, '*')
        break
      case 'answer-is-approved':
        window.postMessage({ type: 'ethereumisapproved', isApproved, caching }, '*')
        break
      case 'answer-is-unlocked':
        window.postMessage({ type: 'metamaskisunlocked', isUnlocked }, '*')
        break
      case 'metamask-set-locked':
        isEnabled = false
        window.postMessage({ type: 'metamasksetlocked' }, '*')
        break
    }
  })
}
*/

/**
 * Checks if MetaMask is currently operating in "privacy mode", meaning
 * dapps must call ethereum.enable in order to access user accounts
 */
function checkPrivacyMode () {
}

/**
 * Error handler for page to plugin stream disconnections
 *
 * @param {string} remoteLabel Remote stream name
 * @param {Error} err Stream connection error
 */
function logStreamDisconnectWarning (remoteLabel, err) {
  let warningMsg = `MetamaskContentscript - lost connection to ${remoteLabel}`
  if (err) warningMsg += '\n' + err.stack
  console.warn(warningMsg)
}

/**
 * Determines if Web3 should be injected
 *
 * @returns {boolean} {@code true} if Web3 should be injected
 */
function shouldInjectWeb3 () {
  return doctypeCheck() && suffixCheck() &&
    documentElementCheck() && !blacklistedDomainCheck()
}

/**
 * Checks the doctype of the current document if it exists
 *
 * @returns {boolean} {@code true} if the doctype is html or if none exists
 */
function doctypeCheck () {
  const doctype = window.document.doctype
  if (doctype) {
    return doctype.name === 'html'
  } else {
    return true
  }
}

/**
 * Returns whether or not the extension (suffix) of the current document is prohibited
 *
 * This checks {@code window.location.pathname} against a set of file extensions
 * that should not have web3 injected into them. This check is indifferent of query parameters
 * in the location.
 *
 * @returns {boolean} whether or not the extension of the current document is prohibited
 */
function suffixCheck () {
  const prohibitedTypes = [
    /\.xml$/,
    /\.pdf$/,
  ]
  const currentUrl = window.location.pathname
  for (let i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false
    }
  }
  return true
}

/**
 * Checks the documentElement of the current document
 *
 * @returns {boolean} {@code true} if the documentElement is an html node or if none exists
 */
function documentElementCheck () {
  var documentElement = document.documentElement.nodeName
  if (documentElement) {
    return documentElement.toLowerCase() === 'html'
  }
  return true
}

/**
 * Checks if the current domain is blacklisted
 *
 * @returns {boolean} {@code true} if the current domain is blacklisted
 */
function blacklistedDomainCheck () {
  var blacklistedDomains = [
    'uscourts.gov',
    'dropbox.com',
    'webbyawards.com',
    'cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html',
    'adyen.com',
    'gravityforms.com',
    'harbourair.com',
    'ani.gamer.com.tw',
    'blueskybooking.com',
  ]
  var currentUrl = window.location.href
  var currentRegex
  for (let i = 0; i < blacklistedDomains.length; i++) {
    const blacklistedDomain = blacklistedDomains[i].replace('.', '\\.')
    currentRegex = new RegExp(`(?:https?:\\/\\/)(?:(?!${blacklistedDomain}).)*$`)
    if (!currentRegex.test(currentUrl)) {
      return true
    }
  }
  return false
}

/**
 * Redirects the current page to a phishing information page
 */
function redirectToPhishingWarning () {
  console.log('MetaMask - routing to Phishing Warning component')
  const extensionURL = extension.runtime.getURL('phishing.html')
  window.location.href = `${extensionURL}#${querystring.stringify({
    hostname: window.location.hostname,
    href: window.location.href,
  })}`
}

function getSiteName (window) {
  // TODO: This looks like it MAY be vulnerable code
  // If site title were malicious script.
  const document = window.document
  const siteName = document.querySelector('head > meta[property="og:site_name"]')
  if (siteName) {
    return siteName.content
  }

  const metaTitle = document.querySelector('head > meta[name="title"]')
  if (metaTitle) {
    return metaTitle.content
  }

  return document.title
}

function getSiteIcon (window) {
  // TODO: This looks like it may be vulnerable code
  // If site icon were malicious script.
  const document = window.document

  // Use the site's favicon if it exists
  const shortcutIcon = document.querySelector('head > link[rel="shortcut icon"]')
  if (shortcutIcon) {
    return shortcutIcon.href
  }

  // Search through available icons in no particular order
  const icon = Array.from(document.querySelectorAll('head > link[rel="icon"]')).find((icon) => Boolean(icon.href))
  if (icon) {
    return icon.href
  }

  return null
}

