const fs = require('fs')
const path = require('path')
const pump = require('pump')
const log = require('loglevel')
const Dnode = require('dnode')
const querystring = require('querystring')
const LocalMessageDuplexStream = require('post-message-stream')
const ObjectMultiplex = require('obj-multiplex')
const extension = require('extensionizer')
const PortStream = require('extension-port-stream')

const inpageContent = fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'chrome', 'inpage.js')).toString()
const inpageSuffix = '//# sourceURL=' + extension.runtime.getURL('inpage.js') + '\n'
const inpageBundle = inpageContent + inpageSuffix

// Eventually this streaming injection could be replaced with:
// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Language_Bindings/Components.utils.exportFunction
//
// But for now that is only Firefox
// If we create a FireFox-only code path using that API,
// MetaMask will be much faster loading and performant on Firefox.

if (shouldInjectWeb3()) {
  injectScript(inpageBundle)
  start()
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
 * Sets up the stream communication and submits site metadata
 *
 */
async function start () {
  await setupStreams()
  await domIsReady()
}

/**
 * Sets up two-way communication streams between the
 * browser extension and local per-page browser context.
 *
 */
async function setupStreams () {
  // the transport-specific streams for communication between inpage and background
  const pageStream = new LocalMessageDuplexStream({
    name: 'contentscript',
    target: 'inpage',
  })
  const extensionPort = extension.runtime.connect({ name: 'contentscript' })
  const extensionStream = new PortStream(extensionPort)

  // create and connect channel muxers
  // so we can handle the channels individually
  const pageMux = new ObjectMultiplex()
  pageMux.setMaxListeners(25)
  const extensionMux = new ObjectMultiplex()
  extensionMux.setMaxListeners(25)

  pump(
    pageMux,
    pageStream,
    pageMux,
    (err) => logStreamDisconnectWarning('MetaMask Inpage Multiplex', err)
  )
  pump(
    extensionMux,
    extensionStream,
    extensionMux,
    (err) => logStreamDisconnectWarning('MetaMask Background Multiplex', err)
  )

  // forward communication across inpage-background for these channels only
  forwardTrafficBetweenMuxers('provider', pageMux, extensionMux)
  forwardTrafficBetweenMuxers('publicConfig', pageMux, extensionMux)

  // connect "phishing" channel to warning system
  const phishingStream = extensionMux.createStream('phishing')
  phishingStream.once('data', redirectToPhishingWarning)

  // connect "publicApi" channel to submit page metadata
  const publicApiStream = extensionMux.createStream('publicApi')
  const background = await setupPublicApi(publicApiStream)

  return { background }
}

function forwardTrafficBetweenMuxers (channelName, muxA, muxB) {
  const channelA = muxA.createStream(channelName)
  const channelB = muxB.createStream(channelName)
  pump(
    channelA,
    channelB,
    channelA,
    (err) => logStreamDisconnectWarning(`MetaMask muxed traffic for channel "${channelName}" failed.`, err)
  )
}

async function setupPublicApi (outStream) {
  const api = {
    getSiteMetadata: (cb) => cb(null, getSiteMetadata()),
  }
  const dnode = Dnode(api)
  pump(
    outStream,
    dnode,
    outStream,
    (err) => {
      // report any error
      if (err) log.error(err)
    }
  )
  const background = await new Promise(resolve => dnode.once('remote', resolve))
  return background
}

/**
 * Gets site metadata and returns it
 *
 */
function getSiteMetadata () {
  // get metadata
  const metadata = {
    name: getSiteName(window),
    icon: getSiteIcon(window),
  }
  return metadata
}

/**
 * Error handler for page to extension stream disconnections
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
  const documentElement = document.documentElement.nodeName
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
  const blacklistedDomains = [
    'uscourts.gov',
    'dropbox.com',
    'webbyawards.com',
    'cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html',
    'adyen.com',
    'gravityforms.com',
    'harbourair.com',
    'ani.gamer.com.tw',
    'blueskybooking.com',
    'sharefile.com',
  ]
  const currentUrl = window.location.href
  let currentRegex
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


/**
 * Extracts a name for the site from the DOM
 */
function getSiteName (window) {
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

/**
 * Extracts an icon for the site from the DOM
 */
function getSiteIcon (window) {
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

/**
 * Returns a promise that resolves when the DOM is loaded (does not wait for images to load)
 */
async function domIsReady () {
  // already loaded
  if (['interactive', 'complete'].includes(document.readyState)) return
  // wait for load
  await new Promise(resolve => window.addEventListener('DOMContentLoaded', resolve, { once: true }))
}
