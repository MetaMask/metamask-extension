const reactTriggerChange = require('../../lib/react-trigger-change')
const {
  queryAsync,
  findAsync,
} = require('../../lib/util')

QUnit.module('tx list items')

QUnit.test('renders list items successfully', (assert) => {
  const done = assert.async()
  runTxListItemsTest(assert).then(done).catch((err) => {
    assert.notOk(err, `Error was thrown: ${err.stack}`)
    done()
  })
})

global.ethQuery = global.ethQuery || {}
global.ethQuery.getTransactionCount = (_, cb) => {
  cb(null, '0x4')
}

async function runTxListItemsTest (assert, done) {
  console.log('*** start runTxListItemsTest')
  const selectState = await queryAsync($, 'select')
  selectState.val('tx list items')
  reactTriggerChange(selectState[0])

  const metamaskLogo = await queryAsync($, '.app-header__logo-container')
  assert.ok(metamaskLogo[0], 'metamask logo present')
  metamaskLogo[0].click()

  const txListItems = await queryAsync($, '.transaction-list-item')
  assert.equal(txListItems.length, 6, 'all tx list items are rendered')

  const unapprovedMsg = txListItems[0]
  const unapprovedMsgDescription = await findAsync($(unapprovedMsg), '.transaction-list-item__action')
  assert.equal(unapprovedMsgDescription[0].textContent, 'Signature Request', 'unapprovedMsg has correct description')

  const approvedTx = txListItems[2]
  const approvedTxRenderedStatus = await findAsync($(approvedTx), '.transaction-list-item__status')
  assert.equal(approvedTxRenderedStatus[0].textContent, 'pending', 'approvedTx has correct label')

  const shapeShiftTx = txListItems[4]
  const shapeShiftTxStatus = await findAsync($(shapeShiftTx), '.flex-column div:eq(1)')
  assert.equal(shapeShiftTxStatus[0].textContent, 'No deposits received', 'shapeShiftTx has correct status')

  const confirmedTokenTx = txListItems[5]
  const confirmedTokenTxAddress = await findAsync($(confirmedTokenTx), '.transaction-list-item__status')
  assert.equal(confirmedTokenTxAddress[0].textContent, 'Confirmed', 'confirmedTokenTx has correct address')
}
