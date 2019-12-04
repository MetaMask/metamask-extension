const assert = require('assert')

const EdgeEncryptor = require('../../../app/scripts/edge-encryptor')

var password = 'passw0rd1'
var data = 'some random data'

global.crypto = global.crypto || {
  getRandomValues: function (array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.random() * 100
    }
    return array
  },
}

describe('EdgeEncryptor', function () {

  const edgeEncryptor = new EdgeEncryptor()
  describe('encrypt', function () {

    it('should encrypt the data.', function (done) {
      edgeEncryptor.encrypt(password, data)
        .then(function (encryptedData) {
          assert.notEqual(data, encryptedData)
          assert.notEqual(encryptedData.length, 0)
          done()
        }).catch(function (err) {
          done(err)
        })
    })

    it('should return proper format.', function (done) {
      edgeEncryptor.encrypt(password, data)
        .then(function (encryptedData) {
          const encryptedObject = JSON.parse(encryptedData)
          assert.ok(encryptedObject.data, 'there is no data')
          assert.ok(encryptedObject.iv && encryptedObject.iv.length !== 0, 'there is no iv')
          assert.ok(encryptedObject.salt && encryptedObject.salt.length !== 0, 'there is no salt')
          done()
        }).catch(function (err) {
          done(err)
        })
    })

    it('should not return the same twice.', function (done) {

      const encryptPromises = []
      encryptPromises.push(edgeEncryptor.encrypt(password, data))
      encryptPromises.push(edgeEncryptor.encrypt(password, data))

      Promise.all(encryptPromises).then((encryptedData) => {
        assert.equal(encryptedData.length, 2)
        assert.notEqual(encryptedData[0], encryptedData[1])
        assert.notEqual(encryptedData[0].length, 0)
        assert.notEqual(encryptedData[1].length, 0)
        done()
      })
    })
  })

  describe('decrypt', function () {
    it('should be able to decrypt the encrypted data.', function (done) {

      edgeEncryptor.encrypt(password, data)
        .then(function (encryptedData) {
          edgeEncryptor.decrypt(password, encryptedData)
            .then(function (decryptedData) {
              assert.equal(decryptedData, data)
              done()
            })
            .catch(function (err) {
              done(err)
            })
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('cannot decrypt the encrypted data with wrong password.', function (done) {

      edgeEncryptor.encrypt(password, data)
        .then(function (encryptedData) {
          edgeEncryptor.decrypt('wrong password', encryptedData)
            .then(function () {
              assert.fail('could decrypt with wrong password')
              done()
            })
            .catch(function (err) {
              assert.ok(err instanceof Error)
              assert.equal(err.message, 'Incorrect password')
              done()
            })
        })
        .catch(function (err) {
          done(err)
        })
    })
  })
})
