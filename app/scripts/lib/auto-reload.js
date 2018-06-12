module.exports = exportWeb3Global

function exportWeb3Global (web3) {
  // export web3 as a global, checking for usage
  let hasBeenWarned = false
  let lastTimeUsed

  global.web3 = new Proxy(web3, {
    get: (_web3, key) => {
      // show warning once on web3 access
      if (!hasBeenWarned && key !== 'currentProvider') {
        console.warn('MetaMask: web3 will be deprecated in the near future in favor of the ethereumProvider \nhttps://github.com/MetaMask/faq/blob/master/detecting_metamask.md#web3-deprecation')
        hasBeenWarned = true
      }
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
}
