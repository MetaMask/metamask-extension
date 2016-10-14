var ethUtil = require('ethereumjs-util')
var vector = global.crypto.getRandomValues(new Uint8Array(16))

module.exports = {
  encrypt,
  decrypt,
  convertArrayBufferViewtoString,
  keyFromPassword,
  encryptWithKey,
  decryptWithKey,
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

  return global.crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: vector
  }, key, dataBuffer).then(function(buf){
    var buffer = new Uint8Array(buf)
    return serializeBufferForStorage(buffer)
  })
}

// Takes encrypted text, returns the restored Pojo.
function decrypt (password, text) {
  return keyFromPassword(password)
  .then(function (key) {
    return decryptWithKey(key, text)
  })
}

// AUDIT: See if this still works when generating a fresh vector
function decryptWithKey (key, text) {
  const encryptedData = serializeBufferFromStorage(text)
  return crypto.subtle.decrypt({name: "AES-GCM", iv: vector}, key, encryptedData)
  .then(function(result){
    const decryptedData = new Uint8Array(result)
    const decryptedStr = convertArrayBufferViewtoString(decryptedData)
    const numArr = decryptedStr.split(',')
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
  var buf = new Uint8Array(str.length/2)
  for (var i = 0; i < str.length; i+= 2) {
    var seg = str.substr(i, 2)
    buf[i/2] = parseInt(seg, 16)
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
