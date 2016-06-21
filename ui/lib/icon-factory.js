var iconFactory

module.exports = function (jazzicon) {
  if (!iconFactory) {
    iconFactory = new IconFactory(jazzicon)
  }
  return iconFactory
}

function IconFactory (jazzicon) {
  this.jazzicon = jazzicon
  this.cache = {}
}

IconFactory.prototype.iconForAddress = function (address, diameter) {
  if (this.isCached(address, diameter)) {
    return this.cache[address][diameter]
  }

  const dataUri = this.generateNewUri(address, diameter)
  this.cacheIcon(address, diameter, dataUri)
  return dataUri
}

IconFactory.prototype.generateNewUri = function (address, diameter) {
  var numericRepresentation = jsNumberForAddress(address)
  var identicon = this.jazzicon(diameter, numericRepresentation)
  var identiconSrc = identicon.innerHTML
  var dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(identiconSrc)
  return dataUri
}

IconFactory.prototype.cacheIcon = function (address, diameter, icon) {
  if (!(address in this.cache)) {
    var sizeCache = {}
    sizeCache[diameter] = icon
    this.cache[address] = sizeCache
    return sizeCache
  } else {
    this.cache[address][diameter] = icon
    return icon
  }
}

IconFactory.prototype.isCached = function (address, diameter) {
  return address in this.cache && diameter in this.cache[address]
}

function jsNumberForAddress (address) {
  var addr = address.slice(2, 10)
  var seed = parseInt(addr, 16)
  return seed
}
