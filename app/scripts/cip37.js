import { encode, decode } from 'conflux-address-js'
import { stripHexPrefix, bufferToHex } from 'cfx-util'

function hexStrToByte(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let c = 0; c < hex.length; c += 2) {
    bytes[c / 2] = parseInt(hex.substr(c, 2), 16)
  }

  return bytes
}

function isHexString(hex) {
  return typeof hex === 'string' && /^(-)?0x[0-9a-f]*$/i.test(hex)
}

export function isValidHexAddress(addr) {
  return isHexString(addr) && /^0x[018][0-9a-fA-F]{39}$/.test(addr)
}

export function hexToBase32(hexAddr, netId) {
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
  hexAddr = stripHexPrefix(hexAddr)
  return encode(hexStrToByte(hexAddr), netId)
}

export function base32ToHex(addr) {
  const { hexAddress } = decode(addr)
  return bufferToHex(hexAddress)
}

export function isLikeBase32Address(addr) {
  // this won't return false when there's net1029, net1
  return /^(cfx(test)?|net\d+):(type=(null|user|contract|builtin):)?[0123456789abcdefghjkmnprstuvwxyz]{42}$/i.test(
    addr
  )
}

export function isValidBase32Address(addr, netId, type) {
  netId = parseInt(netId, 10)
  let decoded = false
  try {
    decoded = decode(addr)
  } catch (err) {}

  let valid = Boolean(decoded) && decoded.netId === netId
  if (type) {
 valid = valid && type === decoded.type
}

  return valid
}
