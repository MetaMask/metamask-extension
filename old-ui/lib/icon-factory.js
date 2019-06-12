var iconFactory
const isValidAddress = require('ethereumjs-util').isValidAddress
const contractMapETH = require('eth-contract-metadata')
const contractMapPOA = require('poa-contract-metadata')
const colors = require('../../colors')
const { toChecksumAddress } = require('../app/util')

module.exports = function (rockicon) {
  if (!iconFactory) {
    iconFactory = new IconFactory(rockicon)
  }
  return iconFactory
}

function IconFactory (rockicon) {
  rockicon.setColorsPalette(colors)
  this.rockicon = rockicon
  this.cache = {}
}

IconFactory.prototype.iconForAddress = function (address, diameter, network) {
  const networkID = parseInt(network)
  const addr = toChecksumAddress(network, address)
  if (iconExistsFor(addr, networkID)) {
    return imageElFor(addr, networkID)
  }

  return this.generateIdenticonSvg(address, diameter)
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
  var identicon = this.rockicon.generateIdenticon(diameter, numericRepresentation)
  return identicon
}

// util

function iconExistsFor (address, networkID) {
  const contractMap = networkID === 1 ? contractMapETH : contractMapPOA
  return contractMap[address] && isValidAddress(address) && contractMap[address].logo
}

function imageElFor (address, networkID) {
  const contractMap = networkID === 1 ? contractMapETH : contractMapPOA
  const contract = contractMap[address]
  const fileName = contract.logo
  const imagesFolder = networkID === 1 ? 'images/contract' : 'images/contractPOA'
  const path = `${imagesFolder}/${fileName}`
  const img = document.createElement('img')
  img.src = path
  img.style.width = '75%'
  return img
}

function jsNumberForAddress (address) {
  var addr = address.slice(2, 10)
  var seed = parseInt(addr, 16)
  return seed
}

