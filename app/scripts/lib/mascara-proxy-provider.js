module.exports = function setupMascaraProxyProvider (extensionProvider) {
  let isMascaraActive = false
  if (global.mascaraProvider) {
    let networkVersion
    global.mascaraProvider.publicConfigStore.subscribe((state) => {
      if (!global.web3.currentProvider.isMascaraActive) return
      global.web3.eth.defaultAccount = state.selectedAddress
      // get the initial network
      const curentNetVersion = state.networkVersion
      if (!networkVersion) networkVersion = curentNetVersion
      if (curentNetVersion !== networkVersion && global.web3._used) {
        const timeSinceUse = Date.now() - global.web3._used
        // if web3 was recently used then delay the reloading of the page
        timeSinceUse > 500 ? triggerReset() : setTimeout(triggerReset, 500)
        // prevent reentry into if statement if state updates again before
        // reload
        networkVersion = curentNetVersion
      }

    })
  }
  const proxyProvider = new Proxy(extensionProvider, {
    get: (extensionProvider, key) => {
      if (key === 'isMascaraActive') return isMascaraActive
      if (isMascaraActive) return global.mascaraProvider[key]
      return extensionProvider[key]
    },
    set: (extensionProvider, key, value) => {
      if (key === 'isMascaraActive') {
        if (!global.mascaraProvider) throw new Error('No Mascara Detected')
        isMascaraActive = value
        return value
      } else {
        if (isMascaraActive) {
          global.mascaraProvider[key] = value
          return value
        } else {
          extensionProvider[key] = value
          return value
        }
      }
    },
  })

  return proxyProvider
}

function triggerReset () {
  global.location.reload()
}

