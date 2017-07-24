module.exports = MascaraDetectionUsageSetup

function MascaraDetectionUsageSetup (provider) {
  const self = this

  const head = document.getElementsByTagName('head')[0]
  const headContent = head.children
  const childrenLength = headContent.length
  // the default is to serve the extensions provider
  self.mascara = false
  self.extensionProvider = provider
  for (let index = 0; index < childrenLength; index++) {
    const src = headContent[index].getAttribute('src')
    if (src === 'MASCARA_PROXY_ORIGIN') {
      try {
        self.mascaraProvider = global.web3.currentProvider
      } catch (error) {
        console.error(error)
      }
    }
  }
  if (self.mascaraProvider) {
    let networkVersion
    self.mascaraProvider.publicConfigStore.subscribe((state) => {
      if (!global.web3.currentProvider.mascara) return
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
  self.proxyProvider = new Proxy(provider, {
    get: (_, key) => {
      if (key === 'mascara') return self.mascara
      if (self.mascara) return self.mascaraProvider[key]
      return self.extensionProvider[key]
    },
    set: (_, key, value) => {
      if (key === 'mascara') {
        if (!self.mascaraProvider) throw new Error('No Mascara Detected')
        self.mascara = value
        return value
      } else {
        if (self.mascara) {
          self.mascaraProvider[key] = value
          return value
        } else {
          self.extensionProvider[key] = value
          return value
        }
      }
    },
  })

  return self.proxyProvider
}

function triggerReset () {
  global.location.reload()
}
