const asmcrypto = require('asmcrypto.js')
const Unibabel = require('browserify-unibabel')

class EdgeEncryptor {

    encrypt (password, dataObject) {

        var salt = this._generateSalt()
        return this.keyFromPassword(password, salt)
            .then(function (key) {

                var data = JSON.stringify(dataObject)
                var dataBuffer = Unibabel.utf8ToBuffer(data)
                var vector = global.crypto.getRandomValues(new Uint8Array(16))
                var resultbuffer = asmcrypto.AES_GCM.encrypt(dataBuffer, key, vector)

                var buffer = new Uint8Array(resultbuffer)
                var vectorStr = Unibabel.bufferToBase64(vector)
                var vaultStr = Unibabel.bufferToBase64(buffer)
                return JSON.stringify({
                    data: vaultStr,
                    iv: vectorStr,
                    salt: salt,
                })
            })
    }

    decrypt (password, text) {

        const payload = JSON.parse(text)
        const salt = payload.salt
        return this.keyFromPassword(password, salt)
            .then(function (key) {
                const encryptedData = Unibabel.base64ToBuffer(payload.data)
                const vector = Unibabel.base64ToBuffer(payload.iv)
                return new Promise((resolve, reject) => {
                    var result
                    try {
                        result = asmcrypto.AES_GCM.decrypt(encryptedData, key, vector)
                    } catch (err) {
                        return reject(new Error('Incorrect password'))
                    }
                    const decryptedData = new Uint8Array(result)
                    const decryptedStr = Unibabel.bufferToUtf8(decryptedData)
                    const decryptedObj = JSON.parse(decryptedStr)
                    resolve(decryptedObj)
                })
            })
    }

    keyFromPassword (password, salt) {

        var passBuffer = Unibabel.utf8ToBuffer(password)
        var saltBuffer = Unibabel.base64ToBuffer(salt)
        return new Promise((resolve) => {
            var key = asmcrypto.PBKDF2_HMAC_SHA256.bytes(passBuffer, saltBuffer, 10000)
            resolve(key)
        })
    }

    _generateSalt (byteCount = 32) {
        var view = new Uint8Array(byteCount)
        global.crypto.getRandomValues(view)
        var b64encoded = btoa(String.fromCharCode.apply(null, view))
        return b64encoded
    }
}

module.exports = EdgeEncryptor
