const assert = require('assert')
let id = 0
const migration37 = require('../../../app/scripts/migrations/037')
const nullStorage = {meta: { version: 0 }, data: {}}
const storage = {
  meta: {},
  data: { TransactionController: {
    transactions: [],
  } },
}

const counts = {}

let status = [
  'unapproved',
  'rejected',
  'approved',
  'signed',
  'submitted',
  'confirmed',
  'failed',
  'dropped',
]
const nets = [ 1, 2, 3, 4, 5]
let currentStatus = status.pop()
let nid = 0

const transactions160 = []
const transactions60 = []

do {
  ++id
  if (counts[currentStatus] === 20) currentStatus = status.pop()
  transactions160.push(generateTxMeta(id, nets[nid], currentStatus))

  if (!counts[currentStatus]) counts[currentStatus] = 1
  else counts[currentStatus] += 1

  if (id % 5 === 0) {
    if (nid === 4) {
      nid = 0
    } else {
      ++nid
    }
  }

} while (id < 160)

id = 0
nid = 0
const counts60 = {}
status = [
  'unapproved',
  'approved',
  'failed',
  'submitted',

  'rejected',
  'signed',
  'confirmed',
  'dropped',
]

do {
  ++id
  // i only want unapproved
  if (id % 10 === 0) currentStatus = status.pop()
  if (counts60[currentStatus] === 5 && currentStatus === 'unapproved') currentStatus = status.pop()
  if (counts60[currentStatus] === 5 && currentStatus === 'approved') currentStatus = status.pop()
  if (counts60[currentStatus] === 4 && currentStatus === 'submitted') currentStatus = status.pop()
  if (counts60[currentStatus] === 6 && currentStatus === 'failed') currentStatus = status.pop()

  transactions60.push(generateTxMeta(id, nets[nid], currentStatus))
  if (!counts60[currentStatus]) counts60[currentStatus] = 1
  else counts60[currentStatus] += 1

  if (id % 5 === 0) {
    if (nid === 4) {
      nid = 0
    } else {
      ++nid
    }
  }

} while (id < 60)

describe('storage is migrated successfully', () => {
  it('should not fail', (done) => {
    migrationTemplate.migrate(nullStorage)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 36)
        done()
      }).catch(done)
  })


  it('should remove down to 40 transactions if their are over 40 transactions and their are enough final transactions to remove', (done) => {
    storage.data.TransactionController.transactions = transactions60
    migrationTemplate.migrate(storage)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 36)
        const len = migratedData.data.TransactionController.transactions.length
        assert(len === 40, `should be 40 got ${len}`)
        done()
      }).catch(done)
  })

  it('should remove transactions but it will still be greater than 40', (done) => {
    storage.data.TransactionController.transactions = transactions160
    migrationTemplate.migrate(storage)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 36)
        const len = migratedData.data.TransactionController.transactions.length
        assert(len === 80, `should be 80 but got ${len}`)
        done()
      }).catch(done)
  })
})


function generateTxMeta (id, metamaskNetworkId, status) {
  return {
    id,
    time: (new Date()).getTime(),
    status,
    metamaskNetworkId,
    loadingDefaults: false,
  }
}
