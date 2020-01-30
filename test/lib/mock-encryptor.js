var mockHex = '0xabcdef0123456789'
var mockKey = Buffer.alloc(32)
let cacheVal

module.exports = {

  encrypt (_, dataObj) {
    cacheVal = dataObj
    return Promise.resolve(mockHex)
  },

  decrypt () {
    return Promise.resolve(cacheVal || {})
  },

  encryptWithKey (key, dataObj) {
    return this.encrypt(key, dataObj)
  },

  decryptWithKey (key, text) {
    return this.decrypt(key, text)
  },

  keyFromPassword () {
    return Promise.resolve(mockKey)
  },

  generateSalt () {
    return 'WHADDASALT!'
  },

  getRandomValues () {
    return 'SOO RANDO!!!1'
  },

}
