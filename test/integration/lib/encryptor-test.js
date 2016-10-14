var encryptor = require('../../../app/scripts/lib/encryptor')

QUnit.test('encryptor', function(assert) {
  var done = assert.async();
  var password, data, encrypted

  password = 'a sample passw0rd'
  data = { foo: 'data to encrypt' }

  encryptor.encrypt(password, data)
  .then(function(encryptedStr) {

    assert.equal(typeof encryptedStr, 'string', 'returns a string')

    // Now try decrypting!jk
    //
    return encryptor.decrypt(password, encryptedStr)

  })
  .then(function (decryptedObj) {
    assert.equal(decryptedObj, data, 'decrypted what was encrypted')
    done()
  })
  .catch(function(reason) {
    assert.ifError(reason, 'threw an error')
  })

})
