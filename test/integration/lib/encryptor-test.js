var encryptor = require('../../../app/scripts/lib/encryptor')

QUnit.test('encryptor:serializeBufferForStorage', function (assert) {
  assert.expect(1)
  var buf = new Buffer(2)
  buf[0] = 16
  buf[1] = 1

  var output = encryptor.serializeBufferForStorage(buf)

  var expect = '0x1001'
  assert.equal(expect, output)
})

QUnit.test('encryptor:serializeBufferFromStorage', function (assert) {
  assert.expect(2)
  var input = '0x1001'
  var output = encryptor.serializeBufferFromStorage(input)

  assert.equal(output[0], 16)
  assert.equal(output[1], 1)
})

QUnit.test('encryptor:encrypt & decrypt', function(assert) {
  var done = assert.async();
  var password, data, encrypted

  password = 'a sample passw0rd'
  data = { foo: 'data to encrypt' }

  encryptor.encrypt(password, data)
  .then(function(encryptedStr) {
    assert.equal(typeof encryptedStr, 'string', 'returns a string')
    return encryptor.decrypt(password, encryptedStr)
  })
  .then(function (decryptedObj) {
    assert.deepEqual(decryptedObj, data, 'decrypted what was encrypted')
    done()
  })
  .catch(function(reason) {
    assert.ifError(reason, 'threw an error')
  })

})
