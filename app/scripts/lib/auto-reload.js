module.exports = setupDappAutoReload

function setupDappAutoReload (web3, observable) {
  // export web3 as a global, checking for usage
  let hasBeenWarned = false
  global.web3 = new Proxy(web3, {
    get: (_web3, key) => {
      // show warning once on web3 access
      if (!hasBeenWarned && key !== 'currentProvider') {
        console.warn('MetaMask: web3 will be deprecated in the near future in favor of the ethereumProvider \nhttps://github.com/ethereum/mist/releases/tag/v0.9.0')
        hasBeenWarned = true
      }
      // get the time of use
      if (key !== '_used') {
        _web3._used = Date.now()
      }
      return _web3[key]
    },
    set: (_web3, key, value) => {
      _web3[key] = value
    },
  })
  var networkVersion

  observable.subscribe(function (state) {
    // get the initial network
    const curentNetVersion = state.networkVersion
    if (!networkVersion) networkVersion = curentNetVersion

    if (curentNetVersion !== networkVersion && web3._used) {
      const timeSinceUse = Date.now() - web3._used
      // if web3 was recently used then delay the reloading of the page
      timeSinceUse > 500 ? triggerReset() : setTimeout(triggerReset, 500)
      // prevent reentry into if statement if state updates again before
      // reload
      networkVersion = curentNetVersion
    }
  })
}

// reload the page
function triggerReset () {
  global.location.reload()
}
