const { decode } = require('conflux-address-js')
const { format } = require('js-conflux-sdk/src/index')

function isHexString(hex) {
  return typeof hex === 'string' && /^(-)?0x[0-9a-f]*$/i.test(hex)
}

function isValidHexAddress(addr) {
  return isHexString(addr) && /^0x[018][0-9a-fA-F]{39}$/.test(addr)
}

function hexToBase32(hexAddr, netId) {
  if (hexAddr === undefined) {
    return hexAddr
  }
  if (!isValidHexAddress(hexAddr)) {
    throw new Error(`invalid address: ${hexAddr}, must be a 0x prefixed string`)
  }
  if (Number.isNaN(netId)) {
    return ''
  }
  if (!Number.isSafeInteger(netId)) {
    throw new Error(`invalid netId: ${netId}, must be a safe integer`)
  }
  return format.address(hexAddr, netId)
}

function isLikeBase32Address(addr) {
  // this won't return false when there's net1029, net1
  return /^(cfx(test)?|net\d+):(type\.(null|user|contract|builtin):)?[0123456789abcdefghjkmnprstuvwxyz]{42}$/i.test(
    addr
  )
}

function isValidBase32Address(addr, netId, type) {
  if (netId !== undefined) {
    netId = parseInt(netId, 10)
  }
  let decoded = false
  try {
    decoded = decode(addr)
  } catch (err) {}

  let valid = Boolean(decoded)
  if (netId !== undefined) {
    valid = valid && decoded.netId === netId
  }
  if (type) {
    valid = valid && type === decoded.type
  }

  return valid
}

const NET_ID_LIMIT = 0xffffffff
function encodeNetId(netId) {
  if (!Number.isInteger(netId)) {
    throw new Error('netId should be passed as an integer')
  }
  if (netId <= 0 || netId > NET_ID_LIMIT) {
    throw new Error('netId should be passed as in range [1, 0xFFFFFFFF]')
  }

  switch (netId) {
    case 1:
      return 'cfxtest'
    case 1029:
      return 'cfx'
    default:
      return `net${netId}`
  }
}

module.exports = {
  isValidBase32Address,
  hexToBase32,
  base32ToHex: format.hexAddress,
  encodeNetId,
  isLikeBase32Address,
  isValidHexAddress,
}
