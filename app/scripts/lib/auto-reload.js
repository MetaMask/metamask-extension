const once = require('once')
const ensnare = require('ensnare')

module.exports = setupDappAutoReload

function setupDappAutoReload (web3) {
  // export web3 as a global, checking for usage
  var pageIsUsingWeb3 = false
  var resetWasRequested = false
  global.web3 = ensnare(web3, once(function () {
    // if web3 usage happened after a reset request, trigger reset late
    if (resetWasRequested) return triggerReset()
    // mark web3 as used
    pageIsUsingWeb3 = true
    // reset web3 reference
    global.web3 = web3
  }))

  return handleResetRequest

  function handleResetRequest () {
    resetWasRequested = true
    // ignore if web3 was not used
    if (!pageIsUsingWeb3) return
    // reload after short timeout
    setTimeout(triggerReset, 500)
  }
}

// reload the page
function triggerReset () {
  global.location.reload()
}
