const assert = require('assert')
const clone = require('clone')
const txStateHistoryHelper = require('../../app/scripts/lib/tx-state-history-helper')

describe('deepCloneFromTxMeta', function () {
  it('should clone deep', function () {
    const input = {
      foo: {
        bar: {
          bam: 'baz'
        }
      }
    }
    const output = txStateHistoryHelper.snapshotFromTxMeta(input)
    assert('foo' in output, 'has a foo key')
    assert('bar' in output.foo, 'has a bar key')
    assert('bam' in output.foo.bar, 'has a bar key')
    assert.equal(output.foo.bar.bam, 'baz', 'has a baz value')
  })

  it('should remove the history key', function () {
    const input = { foo: 'bar', history: 'remembered' }
    const output = txStateHistoryHelper.snapshotFromTxMeta(input)
    assert(typeof output.history, 'undefined', 'should remove history')
  })
})
