var assert = require('assert')
var linkGen = require('../../ui/lib/explorer-link')

describe('explorer-link', function() {

  it('adds testnet prefix to morden test network', function() {
    var result = linkGen('hash', '3')
    assert.notEqual(result.indexOf('testnet'), -1, 'testnet injected')
  })

})
