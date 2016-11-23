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

  // Buffer <-> base64 string methods
  encodeBufferToBase64,
  decodeBase64ToBuffer,

  generateSalt,
}

// Takes a Pojo, returns cypher text.
function encrypt (password, dataObj) {
  const salt = this.generateSalt()

  return keyFromPassword(password + salt)
  .then(function (passwordDerivedKey) {
    return encryptWithKey(passwordDerivedKey, dataObj)
  })
  .then(function (payload) {
    payload.salt = salt
    return JSON.stringify(payload)
  })
}

function encryptWithKey (key, dataObj) {
  var data = JSON.stringify(dataObj)
  var dataBuffer = convertStringToArrayBufferView(data)
  var vector = global.crypto.getRandomValues(new Uint8Array(16))
  return global.crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: vector,
  }, key, dataBuffer).then(function (buf) {
    var buffer = new Uint8Array(buf)
    var vectorStr = encodeBufferToBase64(vector)
    var vaultStr = encodeBufferToBase64(buffer)
    return {
      data: vaultStr,
      iv: vectorStr,
    }
  })
}

// Takes encrypted text, returns the restored Pojo.
function decrypt (password, text) {
  const payload = JSON.parse(text)
  const salt = payload.salt
  return keyFromPassword(password + salt)
  .then(function (key) {
    return decryptWithKey(key, payload)
  })
}

function decryptWithKey (key, payload) {
  const encryptedData = decodeBase64ToBuffer(payload.data)
  const vector = decodeBase64ToBuffer(payload.iv)
  return crypto.subtle.decrypt({name: 'AES-GCM', iv: vector}, key, encryptedData)
  .then(function (result) {
    const decryptedData = new Uint8Array(result)
    const decryptedStr = convertArrayBufferViewtoString(decryptedData)
    const decryptedObj = JSON.parse(decryptedStr)
    return decryptedObj
  })
  .catch(function (reason) {
    throw new Error('Incorrect password')
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
  .then(function (passHash) {
    return global.crypto.subtle.importKey('raw', passHash, {name: 'AES-GCM'}, false, ['encrypt', 'decrypt'])
  })
}

function serializeBufferFromStorage (str) {
  var stripStr = (str.slice(0, 2) === '0x') ? str.slice(2) : str
  var buf = new Uint8Array(stripStr.length / 2)
  for (var i = 0; i < stripStr.length; i += 2) {
    var seg = stripStr.substr(i, 2)
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

function encodeBufferToBase64 (buf) {
  var b64encoded = btoa(String.fromCharCode.apply(null, buf))
  return b64encoded
}

function decodeBase64ToBuffer (base64) {
  var buf = new Uint8Array(atob(base64).split('')
  .map(function (c) {
    return c.charCodeAt(0)
  }))
  return buf
}

function generateSalt (byteCount = 32) {
  var view = new Uint8Array(byteCount)
  global.crypto.getRandomValues(view)
  var b64encoded = btoa(String.fromCharCode.apply(null, view))
  return b64encoded
}
