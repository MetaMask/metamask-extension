const assert = require('assert')

const EdgeEncryptor = require('../../app/scripts/edge-encryptor')

var password = 'passw0rd1'
var data = 'some random data'

// polyfill fetch
global.crypto = global.crypto || {
  getRandomValues (array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.random() * 100;
    }
  }
}

describe('EdgeEncryptor', function () {
  const edgeEncryptor = new EdgeEncryptor()

  describe('encrypt', function () {

    it('should encrypt the data.', function () {
      edgeEncryptor.encrypt(password, data)
        .then(function (encryptedData) {
          assert.notEqual(data, encryptedData)
          assert.notEqual(encryptedData.length, 0)
          done()
        }).catch(function (err) {
          done(err)
        })
    })

    it('should not return the same twice.', function () {

      const encryptPromises = []
      encryptPromises.push(edgeEncryptor.encrypt(password, data))
      encryptPromises.push(edgeEncryptor.encrypt(password, data))

      Promise.all(encryptPromises).then((encryptedData) => {
        assert.equal(encryptedData.length, 2)
        assert.notEqual(encryptedData[0], encryptedData[1])
        assert.notEqual(encryptedData[0].length, 0)
        assert.notEqual(encryptedData[1].length, 0)
      })
    })    
  })

  describe('decrypt', function () {
    it('should be able to decrypt the encrypted data.', function () {

      edgeEncryptor.encrypt(password, data)
        .then(function (encryptedData) {
          edgeEncryptor.decrypt(password, encryptedData)
          .then(function (decryptedData) {
            assert.equal(decryptedData, data)
          })
          .catch(function (err) {
            done(err)
          })
        })
        .catch(function (err) {
          done(err)
        })
    })
  })
})
