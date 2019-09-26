const reactTriggerChange = require('../../lib/react-trigger-change')
const {
  queryAsync,
  findAsync,
} = require('../../lib/util')
const fetchMockResponses = require('../../e2e/fetch-mocks.json')

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

async function runTxListItemsTest (assert) {
  console.log('*** start runTxListItemsTest')
  const selectState = await queryAsync($, 'select')
  selectState.val('tx list items')
  reactTriggerChange(selectState[0])

  const realFetch = window.fetch.bind(window)
  global.fetch = (...args) => {
    if (args[0] === 'https://ethgasstation.info/json/ethgasAPI.json') {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.ethGasBasic)) })
    } else if (args[0] === 'https://ethgasstation.info/json/predictTable.json') {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.ethGasPredictTable)) })
    } else if (args[0] === 'https://dev.blockscale.net/api/gasexpress.json') {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.gasExpress)) })
    } else if (args[0].match(/chromeextensionmm/)) {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.metametrics)) })
    }
    return realFetch.fetch(...args)
  }

  const metamaskLogo = await queryAsync($, '.app-header__logo-container')
  assert.ok(metamaskLogo[0], 'metamask logo present')
  metamaskLogo[0].click()

  const txListItems = await queryAsync($, '.transaction-list-item')
  assert.equal(txListItems.length, 8, 'all tx list items are rendered')

  const unapprovedMsg = txListItems[0]
  const unapprovedMsgDescription = await findAsync($(unapprovedMsg), '.transaction-list-item__action')
  assert.equal(unapprovedMsgDescription[0].textContent, 'Signature Request', 'unapprovedMsg has correct description')

  const approvedTx = txListItems[2]
  const approvedTxRenderedStatus = await findAsync($(approvedTx), '.transaction-list-item__status')
  assert.equal(approvedTxRenderedStatus[0].textContent, 'pending', 'approvedTx has correct label')

  const confirmedTokenTx1 = txListItems[4]
  const confirmedTokenTx1Address = await findAsync($(confirmedTokenTx1), '.transaction-list-item__status')
  assert.equal(confirmedTokenTx1Address[0].textContent, 'Confirmed', 'confirmedTokenTx has correct status')

  const shapeShiftTx1 = txListItems[5]
  const shapeShiftTx1Status = await findAsync($(shapeShiftTx1), '.flex-column div:eq(1)')
  assert.equal(shapeShiftTx1Status[0].textContent, 'No deposits received', 'shapeShiftTx has correct status')

  const confirmedTokenTx2 = txListItems[6]
  const confirmedTokenTx2Address = await findAsync($(confirmedTokenTx2), '.transaction-list-item__status')
  assert.equal(confirmedTokenTx2Address[0].textContent, 'Confirmed', 'confirmedTokenTx has correct status')

  const shapeShiftTx2 = txListItems[7]
  const shapeShiftTx2Address = await findAsync($(shapeShiftTx2), '.flex-column div:eq(1)')
  assert.equal(shapeShiftTx2Address[0].textContent, 'No deposits received', 'shapeShiftTx has correct status')
}
