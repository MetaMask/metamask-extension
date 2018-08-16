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
  cb(null, '0x3')
}

async function runTxListItemsTest (assert, done) {
  console.log('*** start runTxListItemsTest')
  const selectState = await queryAsync($, 'select')
  selectState.val('tx list items')
  reactTriggerChange(selectState[0])

  const metamaskLogo = await queryAsync($, '.app-header__logo-container')
  assert.ok(metamaskLogo[0], 'metamask logo present')
  metamaskLogo[0].click()

  const txListItems = await queryAsync($, '.tx-list-item')
  assert.equal(txListItems.length, 8, 'all tx list items are rendered')

  const unapprovedTx = txListItems[0]
  assert.equal($(unapprovedTx).hasClass('tx-list-pending-item-container'), true, 'unapprovedTx has the correct class')

  const retryTx = txListItems[1]
  const retryTxLink = await findAsync($(retryTx), '.tx-list-item-retry-container span')
  assert.equal(retryTxLink[0].textContent, 'Taking too long? Increase the gas price on your transaction', 'retryTx has expected link')

  const approvedTx = txListItems[2]
  const approvedTxRenderedStatus = await findAsync($(approvedTx), '.tx-list-status')
  assert.equal(approvedTxRenderedStatus[0].textContent, 'Approved', 'approvedTx has correct label')

  const unapprovedMsg = txListItems[3]
  const unapprovedMsgDescription = await findAsync($(unapprovedMsg), '.tx-list-account')
  assert.equal(unapprovedMsgDescription[0].textContent, 'Signature Request', 'unapprovedMsg has correct description')

  const failedTx = txListItems[4]
  const failedTxRenderedStatus = await findAsync($(failedTx), '.tx-list-status')
  assert.equal(failedTxRenderedStatus[0].textContent, 'Failed', 'failedTx has correct label')

  const shapeShiftTx = txListItems[5]
  const shapeShiftTxStatus = await findAsync($(shapeShiftTx), '.flex-column div:eq(1)')
  assert.equal(shapeShiftTxStatus[0].textContent, 'No deposits received', 'shapeShiftTx has correct status')

  const confirmedTokenTx = txListItems[6]
  const confirmedTokenTxAddress = await findAsync($(confirmedTokenTx), '.tx-list-account')
  assert.equal(confirmedTokenTxAddress[0].textContent, '0xE7884118...81a9', 'confirmedTokenTx has correct address')

  const rejectedTx = txListItems[7]
  const rejectedTxRenderedStatus = await findAsync($(rejectedTx), '.tx-list-status')
  assert.equal(rejectedTxRenderedStatus[0].textContent, 'Rejected', 'rejectedTx has correct label')
}
