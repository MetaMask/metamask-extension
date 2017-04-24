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

  this.presets = {
    '1':{ // Main network:
      '0x48c80f1f4d53d5951e5d5438b54cba84f29f32a5': 'https://etherscan.io/token/images/augur.png',
      '0xc66ea802717bfb9833400264dd12c2bceaa34a6d': 'https://etherscan.io/token/images/mkr-etherscan-35.png',
      '0xa74476443119a942de498590fe1f2454d7d4ac0d': 'https://etherscan.io/token/images/golem.png',
      '0xaec2e87e0a235266d9c5adc9deb4b2e29b54d009': 'https://etherscan.io/token/images/sngls.png',

    }
  }
}

IconFactory.prototype.iconForAddress = function (address, diameter, imageify, network) {

  try {
    const presetUri = this.presets[network][address.toLowerCase()]
    if (presetUri) {
      var img = document.createElement('img')
      img.src = presetUri
      img.style.width = `${diameter}px`
      img.style.height = `${diameter}px`
      img.style.borderRadius = `${diameter/2}px`
      return img
    }
  } catch (e) {}


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
