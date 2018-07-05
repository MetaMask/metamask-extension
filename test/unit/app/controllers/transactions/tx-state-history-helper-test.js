const assert = require('assert')
const txStateHistoryHelper = require('../../../../../app/scripts/controllers/transactions/lib/tx-state-history-helper')
const testVault = require('../../../../data/v17-long-history.json')

describe('Transaction state history helper', function () {

  describe('#snapshotFromTxMeta', function () {
    it('should clone deep', function () {
      const input = {
        foo: {
          bar: {
            bam: 'baz',
          },
        },
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

  describe('#migrateFromSnapshotsToDiffs', function () {
    it('migrates history to diffs and can recover original values', function () {
      testVault.data.TransactionController.transactions.forEach((tx) => {
        const newHistory = txStateHistoryHelper.migrateFromSnapshotsToDiffs(tx.history)
        newHistory.forEach((newEntry, index) => {
          if (index === 0) {
            assert.equal(Array.isArray(newEntry), false, 'initial history item IS NOT a json patch obj')
          } else {
            assert.equal(Array.isArray(newEntry), true, 'non-initial history entry IS a json patch obj')
          }
          const oldEntry = tx.history[index]
          const historySubset = newHistory.slice(0, index + 1)
          const reconstructedValue = txStateHistoryHelper.replayHistory(historySubset)
          assert.deepEqual(oldEntry, reconstructedValue, 'was able to reconstruct old entry from diffs')
        })
      })
    })
  })

  describe('#replayHistory', function () {
    it('replaying history does not mutate the original obj', function () {
      const initialState = { test: true, message: 'hello', value: 1 }
      const diff1 = [{
        'op': 'replace',
        'path': '/message',
        'value': 'haay',
      }]
      const diff2 = [{
        'op': 'replace',
        'path': '/value',
        'value': 2,
      }]
      const history = [initialState, diff1, diff2]

      const beforeStateSnapshot = JSON.stringify(initialState)
      const latestState = txStateHistoryHelper.replayHistory(history)
      const afterStateSnapshot = JSON.stringify(initialState)

      assert.notEqual(initialState, latestState, 'initial state is not the same obj as the latest state')
      assert.equal(beforeStateSnapshot, afterStateSnapshot, 'initial state is not modified during run')
    })
  })

  describe('#generateHistoryEntry', function () {

    function generateHistoryEntryTest (note) {

      const prevState = {
        someValue: 'value 1',
        foo: {
          bar: {
            bam: 'baz',
          },
        },
      }

      const nextState = {
        newPropRoot: 'new property - root',
        someValue: 'value 2',
        foo: {
          newPropFirstLevel: 'new property - first level',
          bar: {
            bam: 'baz',
          },
        },
      }

      const before = new Date().getTime()
      const result = txStateHistoryHelper.generateHistoryEntry(prevState, nextState, note)
      const after = new Date().getTime()

      assert.ok(Array.isArray(result))
      assert.equal(result.length, 3)

      const expectedEntry1 = { op: 'add', path: '/foo/newPropFirstLevel', value: 'new property - first level' }
      assert.equal(result[0].op, expectedEntry1.op)
      assert.equal(result[0].path, expectedEntry1.path)
      assert.equal(result[0].value, expectedEntry1.value)
      assert.equal(result[0].value, expectedEntry1.value)
      if (note) { assert.equal(result[0].note, note) }

      assert.ok(result[0].timestamp >= before && result[0].timestamp <= after)

      const expectedEntry2 = { op: 'replace', path: '/someValue', value: 'value 2' }
      assert.deepEqual(result[1], expectedEntry2)

      const expectedEntry3 = { op: 'add', path: '/newPropRoot', value: 'new property - root' }
      assert.deepEqual(result[2], expectedEntry3)
    }

    it('should generate history entries', function () {
      generateHistoryEntryTest()
    })

    it('should add note to first entry', function () {
      generateHistoryEntryTest('custom note')
    })
  })
})
