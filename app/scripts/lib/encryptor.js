var ethUtil = require('ethereumjs-util')

module.exports = {

  // Simple encryption methods:
  encrypt,
  decrypt,

  // More advanced encryption methods:
  keyFromPassword,
  encryptWithKey,
  decryptWithKey,

  // Buffer <-> String methods
  convertArrayBufferViewtoString,
  convertStringToArrayBufferView,

  // Buffer <-> Hex string methods
  serializeBufferForStorage,
  serializeBufferFromStorage,
}

// Takes a Pojo, returns encrypted text.
function encrypt (password, dataObj) {
  return keyFromPassword(password)
  .then(function (passwordDerivedKey) {
    return encryptWithKey(passwordDerivedKey, dataObj)
  })
}

function encryptWithKey (key, dataObj) {
  var data = JSON.stringify(dataObj)
  var dataBuffer = convertStringToArrayBufferView(data)
  var vector = global.crypto.getRandomValues(new Uint8Array(16))

  return global.crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: vector,
  }, key, dataBuffer).then(function(buf){
    var buffer = new Uint8Array(buf)
    var vectorStr = serializeBufferForStorage(vector)
    return serializeBufferForStorage(buffer) + vectorStr
  })
}

// Takes encrypted text, returns the restored Pojo.
function decrypt (password, text) {
  return keyFromPassword(password)
  .then(function (key) {
    return decryptWithKey(key, text)
  })
}

function decryptWithKey (key, text) {
  const parts = text.split('0x')
  const encryptedData = serializeBufferFromStorage(parts[1])
  const vector = serializeBufferFromStorage(parts[2])
  return crypto.subtle.decrypt({name: 'AES-GCM', iv: vector}, key, encryptedData)
  .then(function(result){
    const decryptedData = new Uint8Array(result)
    const decryptedStr = convertArrayBufferViewtoString(decryptedData)
    const decryptedObj = JSON.parse(decryptedStr)
    return decryptedObj
  })
}

function convertStringToArrayBufferView (str) {
  var bytes = new Uint8Array(str.length)
  for (var i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i)
  }

  return bytes
}

function convertArrayBufferViewtoString (buffer) {
  var str = ''
  for (var i = 0; i < buffer.byteLength; i++) {
    str += String.fromCharCode(buffer[i])
  }

  return str
}

function keyFromPassword (password) {
  var passBuffer = convertStringToArrayBufferView(password)
  return global.crypto.subtle.digest('SHA-256', passBuffer)
  .then(function (passHash){
    return global.crypto.subtle.importKey('raw', passHash, {name: 'AES-GCM'}, false, ['encrypt', 'decrypt'])
  })
}

function serializeBufferFromStorage (str) {
  str = ethUtil.stripHexPrefix(str)
  var buf = new Uint8Array(str.length / 2)
  for (var i = 0; i < str.length; i += 2) {
    var seg = str.substr(i, 2)
    buf[i / 2] = parseInt(seg, 16)
  }
  return buf
}

// Should return a string, ready for storage, in hex format.
function serializeBufferForStorage (buffer) {
  var result = '0x'
  var len = buffer.length || buffer.byteLength
  for (var i = 0; i < len; i++) {
    result += unprefixedHex(buffer[i])
  }
  return result
}

function unprefixedHex (num) {
  var hex = num.toString(16)
  while (hex.length < 2) {
    hex = '0' + hex
  }
  return hex
}
