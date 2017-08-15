const assert = require('assert')
const txStateHistoryHelper = require('../../app/scripts/lib/tx-state-history-helper')
const testVault = require('../data/v17-long-history.json')


describe('history-differ', function () {
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
})
