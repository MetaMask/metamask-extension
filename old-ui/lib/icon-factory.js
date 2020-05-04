import { isValidAddress } from 'ethereumjs-util'
import contractMapETH from 'eth-contract-metadata'
import contractMapPOA from 'poa-contract-metadata'
import contractMapRSK from '@rsksmart/rsk-contract-metadata'
import contractMapRSKTest from '@rsksmart/rsk-testnet-contract-metadata'
import { MAINNET_CODE, POA_CODE, RSK_CODE, RSK_TESTNET_CODE } from '../../app/scripts/controllers/network/enums'
const colors = require('../../colors')
const { toChecksumAddress, getTokenImageFolder } = require('../app/util')

let iconFactory

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
  const cacheId = `${address}:${diameter}`
  // check cache, lazily generate and populate cache
  const identicon = this.cache[cacheId] || (this.cache[cacheId] = this.generateNewIdenticon(address, diameter))
  // create a clean copy so you can modify it
  const cleanCopy = identicon.cloneNode(true)
  return cleanCopy
}

// creates a new identicon
IconFactory.prototype.generateNewIdenticon = function (address, diameter) {
  const numericRepresentation = jsNumberForAddress(address)
  const identicon = this.rockicon.generateIdenticon(diameter, numericRepresentation)
  return identicon
}

// util

function iconExistsFor (address, networkID) {
  const contractMap = _getContractMap(networkID)
  return contractMap[address] && isValidAddress(address) && contractMap[address].logo
}

function imageElFor (address, networkID) {
  const contractMap = _getContractMap(networkID)
  const contract = contractMap[address]
  const fileName = contract.logo
  const imagesFolder = getTokenImageFolder(networkID)
  const path = `${imagesFolder}/${fileName}`
  const img = document.createElement('img')
  img.src = path
  img.style.width = '75%'
  return img
}

function jsNumberForAddress (address) {
  const addr = address.slice(2, 10)
  const seed = parseInt(addr, 16)
  return seed
}

function _getContractMap (networkID) {
  switch (networkID) {
    case MAINNET_CODE:
      return contractMapETH
    case POA_CODE:
      return contractMapPOA
    case RSK_CODE:
      return contractMapRSK
    case RSK_TESTNET_CODE:
      return contractMapRSKTest
    default:
      return contractMapPOA
  }
}

