const reactTriggerChange = require('../../lib/react-trigger-change')
const {
  timeout,
  queryAsync,
  findAsync,
} = require('../../lib/util')

QUnit.module('currency localization')

QUnit.skip('renders localized currency', (assert) => {
  const done = assert.async()
  runCurrencyLocalizationTest(assert).then(done).catch((err) => {
    assert.notOk(err, `Error was thrown: ${err.stack}`)
    done()
  })
})

async function runCurrencyLocalizationTest (assert, done) {
  console.log('*** start runCurrencyLocalizationTest')
  const selectState = await queryAsync($, 'select')
  selectState.val('currency localization')
  await timeout(1000)
  reactTriggerChange(selectState[0])

  const balance = await queryAsync($, '.ether-balance.ether-balance-amount')
  const ethBalance = (await findAsync(balance, '.flex-row'))[0]
  const fiatAmount = (await findAsync(balance, '.flex-row'))[1]
  assert.equal(ethBalance.textContent, '5.172ETH', 'eth balance rendered')
  assert.equal(fiatAmount.textContent, '102707.97PHP', 'fiat balance rendered')

}
