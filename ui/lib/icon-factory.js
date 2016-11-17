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

IconFactory.prototype.iconForAddress = function (address, diameter, imageify) {
  if (imageify) {
    return this.generateIdenticonImg(address, diameter)
  } else {
    return this.generateIdenticonSvg(address, diameter)
  }
}

// returns img dom element
IconFactory.prototype.generateIdenticonImg = function (address, diameter) {
  var identicon = this.generateIdenticonSvg(address, diameter)
  var identiconSrc = identicon.innerHTML
  var dataUri = toDataUri(identiconSrc)
  var img = document.createElement('img')
  img.src = dataUri
  return img
}

// returns svg dom element
IconFactory.prototype.generateIdenticonSvg = function (address, diameter) {
  var cacheId = `${address}:${diameter}`
  // check cache, lazily generate and populate cache
  var identicon = this.cache[cacheId] || (this.cache[cacheId] = this.generateNewIdenticon(address, diameter))
  // create a clean copy so you can modify it
  var cleanCopy = identicon.cloneNode(true)
  return cleanCopy
}

// creates a new identicon
IconFactory.prototype.generateNewIdenticon = function (address, diameter) {
  var numericRepresentation = jsNumberForAddress(address)
  var identicon = this.jazzicon(diameter, numericRepresentation)
  return identicon
}

// util

function jsNumberForAddress (address) {
  var addr = address.slice(2, 10)
  var seed = parseInt(addr, 16)
  return seed
}

function toDataUri (identiconSrc) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(identiconSrc)
}
