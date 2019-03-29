module.exports = setupDappAutoReload

function setupDappAutoReload (web3, observable) {
  // export web3 as a global, checking for usage
  let reloadInProgress = false
  let lastTimeUsed
  let lastSeenNetwork

  global.web3 = new Proxy(web3, {
    get: (_web3, key) => {
      // get the time of use
      lastTimeUsed = Date.now()
      // return value normally
      return _web3[key]
    },
    set: (_web3, key, value) => {
      // set value normally
      _web3[key] = value
    },
  })

  observable.subscribe(function (state) {
    // if the auto refresh on network change is false do not
    // do anything
    if (!window.ethereum.autoRefreshOnNetworkChange) return

    // if reload in progress, no need to check reload logic
    if (reloadInProgress) return

    const currentNetwork = state.networkVersion

    // set the initial network
    if (!lastSeenNetwork) {
      lastSeenNetwork = currentNetwork
      return
    }

    // skip reload logic if web3 not used
    if (!lastTimeUsed) return

    // if network did not change, exit
    if (currentNetwork === lastSeenNetwork) return

    // initiate page reload
    reloadInProgress = true
    const timeSinceUse = Date.now() - lastTimeUsed
    // if web3 was recently used then delay the reloading of the page
    if (timeSinceUse > 500) {
      triggerReset()
    } else {
      setTimeout(triggerReset, 500)
    }
  })
}

// reload the page
function triggerReset () {
  global.location.reload()
}
