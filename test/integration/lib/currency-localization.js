const reactTriggerChange = require('../../lib/react-trigger-change')
const {
  timeout,
  queryAsync,
  findAsync,
} = require('../../lib/util')
const fetchMockResponses = require('../../data/fetch-mocks.json')

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
  window.fetch = (...args) => {
    if (args[0].match(/^http(s)?:\/\/ethgasstation\.info\/json\/ethgasAPI.*/u)) {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.ethGasBasic)) })
    } else if (args[0].match(/http(s?):\/\/ethgasstation\.info\/json\/predictTable.*/u)) {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.ethGasPredictTable)) })
    } else if (args[0].match(/chromeextensionmm/)) {
      return Promise.resolve({ json: () => Promise.resolve(JSON.parse(fetchMockResponses.metametrics)) })
    }
    return realFetch.fetch(...args)
  }

  await timeout(1000)
  reactTriggerChange(selectState[0])
  await timeout(1000)
  const txView = await queryAsync($, '.home__main-view')
  const heroBalance = await findAsync($(txView), '.eth-overview__balance')
  const fiatAmount = await findAsync($(heroBalance), '.eth-overview__secondary-balance')
  assert.equal(fiatAmount[0].textContent, '₱102,707.97PHP')
}
