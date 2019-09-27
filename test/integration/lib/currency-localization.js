const reactTriggerChange = require('../../lib/react-trigger-change')
const {
  timeout,
  queryAsync,
  findAsync,
} = require('../../lib/util')
const fetchMockResponses = require('../../e2e/fetch-mocks.json')

QUnit.module('currency localization')

QUnit.test('renders localized currency', (assert) => {
  const done = assert.async()
  runCurrencyLocalizationTest(assert).then(done).catch((err) => {
    assert.notOk(err, `Error was thrown: ${err.stack}`)
    done()
  })
})

async function runCurrencyLocalizationTest (assert) {
  console.log('*** start runCurrencyLocalizationTest')
  const selectState = await queryAsync($, 'select')
  selectState.val('currency localization')

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

  await timeout(1000)
  reactTriggerChange(selectState[0])
  await timeout(1000)
  const txView = await queryAsync($, '.transaction-view')
  const heroBalance = await findAsync($(txView), '.transaction-view-balance__balance')
  const fiatAmount = await findAsync($(heroBalance), '.transaction-view-balance__secondary-balance')
  assert.equal(fiatAmount[0].textContent, '₱102,707.97PHP')
}
