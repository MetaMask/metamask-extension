var vector = global.crypto.getRandomValues(new Uint8Array(16))
var key = null

module.exports = {
  encrypt,
  decrypt,
  convertArrayBufferViewtoString,
  keyFromPassword,
}

// Takes a Pojo, returns encrypted text.
function encrypt (password, dataObj) {
  var data = JSON.stringify(dataObj)
  global.crypto.subtle.encrypt({name: 'AES-CBC', iv: vector}, key, convertStringToArrayBufferView(data)).then(function(result){
    const encryptedData = new Uint8Array(result)
    return encryptedData
  },
  function(e){
    console.log(e.message)
  })
}

// Takes encrypted text, returns the restored Pojo.
function decrypt (password, text) {

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
  global.crypto.subtle.digest({name: 'SHA-256'}, convertStringToArrayBufferView(password)).then(function(result){
    return global.crypto.subtle.importKey('raw', result, {name: 'AES-CBC'}, false, ['encrypt', 'decrypt'])
  })
}

