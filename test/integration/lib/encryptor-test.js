var encryptor = require('../../../app/scripts/lib/encryptor')

QUnit.test('encryptor', function(assert) {
  var password, data, encrypted

  password = 'a sample passw0rd'
  data = { foo: 'data to encrypt' }

  encryptor.encrypt(password, data)
  .then(function(result) {
    assert.equal(typeof result, 'string', 'returns a string')
  })
  .catch(function(reason) {
    assert.ifError(reason, 'threw an error')
  })

})
