const reactTriggerChange = require('../../lib/react-trigger-change')
const {
  queryAsync,
  findAsync,
} = require('../../lib/util')
const fetchMockResponses = require('../../data/fetch-mocks.json')

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
  window.fetch = (...args) => {
    if (args[0] === 'https://ethgasstation.info/json/ethgasAPI.json') {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.ethGasBasic)) })
    } else if (args[0] === 'https://ethgasstation.info/json/predictTable.json') {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.ethGasPredictTable)) })
    } else if (args[0].match(/chromeextensionmm/)) {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.metametrics)) })
    }
    return realFetch.fetch(...args)
  }

  const metamaskLogo = await queryAsync($, '.app-header__logo-container')
  assert.ok(metamaskLogo[0], 'metamask logo present')
  metamaskLogo[0].click()

  const txListItems = await queryAsync($, '.transaction-list-item')
  assert.equal(txListItems.length, 6, 'all tx list items are rendered')

  const unapprovedMsg = txListItems[0]
  const unapprovedMsgDescription = await findAsync($(unapprovedMsg), '.transaction-list-item__status--unapproved')
  assert.equal(unapprovedMsgDescription[0].textContent, 'Unapproved', 'unapprovedMsg has correct description')

  const approvedTx = txListItems[2]
  const approvedTxRenderedStatus = await findAsync($(approvedTx), '.transaction-list-item__status--queued')
  assert.equal(approvedTxRenderedStatus[0].textContent, 'Queued', 'approvedTx has correct label')

  const confirmedTokenTx1 = txListItems[4]
  const confirmedTokenTx1Token = await findAsync($(confirmedTokenTx1), '.list-item__heading')
  const confirmedTokenTx1Address = await findAsync($(confirmedTokenTx1), '.list-item__subheading')
  assert.equal(confirmedTokenTx1Token[0].textContent, 'Send FTO ', 'Confirm token symbol is correct')
  assert.equal(confirmedTokenTx1Address[0].textContent, 'Mar 29, 2018 · To: 0xe788...81a9', 'confirmedTokenTx has correct status')

  const confirmedTokenTx2 = txListItems[5]
  const confirmedTokenTx2Address = await findAsync($(confirmedTokenTx2), '.list-item__subheading')
  const confirmedTokenTx2Token = await findAsync($(confirmedTokenTx2), '.list-item__heading')
  assert.equal(confirmedTokenTx2Token[0].textContent, 'Send FTT ', 'Confirm token symbol is correct')
  assert.equal(confirmedTokenTx2Address[0].textContent, 'Mar 29, 2018 · To: 0xe788...81a9', 'confirmedTokenTx has correct status')
}
