const assert = require('assert')
const txStateHistoryHelper = require('../../app/scripts/lib/tx-state-history-helper')
const testVault = require('../data/v17-long-history.json')


describe('tx-state-history-helper', function () {
  it('migrates history to diffs and can recover original values', function () {
    testVault.data.TransactionController.transactions.forEach((tx, index) => {
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
<<<<<<< Updated upstream
=======

  it('replaying history does not mutate the original obj', function () {
    const initialState = { test: true, message: 'hello', value: 1 }
    const diff1 = [{
      "op": "replace",
      "path": "/message",
      "value": "haay",
    }]
    const diff2 = [{
      "op": "replace",
      "path": "/value",
      "value": 2,
    }]
    const history = [initialState, diff1, diff2]

    const beforeStateSnapshot = JSON.stringify(initialState)
    const latestState = txStateHistoryHelper.replayHistory(history)
    const afterStateSnapshot = JSON.stringify(initialState)

    assert.notEqual(initialState, latestState, 'initial state is not the same obj as the latest state')
    assert.equal(beforeStateSnapshot, afterStateSnapshot, 'initial state is not modified during run')
  })

>>>>>>> Stashed changes
})
