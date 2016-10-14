var vector = global.crypto.getRandomValues(new Uint8Array(16))

module.exports = {
  encrypt,
  decrypt,
  convertArrayBufferViewtoString,
  keyFromPassword,
  encryptWithKey,
  decryptWithKey,
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
  }, key, dataBuffer).then(function(result){
    const encryptedData = new Uint8Array(result)
    const encryptedStr =  encryptedData.toString()
    return encryptedStr
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
  return crypto.subtle.decrypt({name: "AES-CBC", iv: vector}, key, encrypted_data)
  .then(function(result){
    debugger
    const decryptedData = new Uint8Array(result)
    const decryptedStr = convertArrayBufferViewtoString(decryptedData))
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

