const reactTriggerChange = require('react-trigger-change')
const {
  timeout,
  queryAsync,
} = require('../../lib/util')

QUnit.module('navigate txs')

QUnit.test('successful navigate', (assert) => {
  const done = assert.async()
  runNavigateTxsFlowTest(assert)
    .then(done)
    .catch(err => {
      assert.notOk(err, `Error was thrown: ${err.stack}`)
      done()
    })
})

async function runNavigateTxsFlowTest (assert, done) {
  const selectState = await queryAsync($, 'select')

  selectState.val('navigate txs')
  reactTriggerChange(selectState[0])

  // Confirm navigation buttons present
  let navigateTxButtons = await queryAsync($, '.confirm-page-container-navigation__arrow')
  assert.ok(navigateTxButtons[0], 'navigation button present')
  assert.ok(navigateTxButtons[1], 'navigation button present')
  assert.ok(navigateTxButtons[2], 'navigation button present')
  assert.ok(navigateTxButtons[3], 'navigation button present')

  // Verify number of transactions present
  let trxNum = await queryAsync($, '.confirm-page-container-navigation')
  assert.equal(trxNum[0].innerText.includes('1'), true, 'starts on first')

  // Verify correct route
  let summaryAction = await queryAsync($, '.confirm-page-container-summary__action')
  assert.equal(summaryAction[0].innerText, 'CONTRACT DEPLOYMENT', 'correct route')

  // Click navigation button
  navigateTxButtons[2].click()
  await timeout(2000)

  // Verify transaction changed to num 2 and routed correctly
  trxNum = await queryAsync($, '.confirm-page-container-navigation')
  assert.equal(trxNum[0].innerText.includes('2'), true, 'changed transaction right')
  summaryAction = await queryAsync($, '.confirm-page-container-summary__action')
  // assert.equal(summaryAction[0].innerText, 'CONFIRM', 'correct route')

  // Click navigation button
  navigateTxButtons = await queryAsync($, '.confirm-page-container-navigation__arrow')
  navigateTxButtons[2].click()

  // Verify transation changed to num 3 and routed correctly
  trxNum = await queryAsync($, '.confirm-page-container-navigation')
  assert.equal(trxNum[0].innerText.includes('3'), true, 'changed transaction right')
  summaryAction = await queryAsync($, '.confirm-page-container-summary__action')
  assert.equal(summaryAction[0].innerText, 'CONFIRM', 'correct route')

  // Click navigation button
  navigateTxButtons = await queryAsync($, '.confirm-page-container-navigation__arrow')
  navigateTxButtons[2].click()

  // Verify transation changed to num 4 and routed correctly
  trxNum = await queryAsync($, '.confirm-page-container-navigation')
  assert.equal(trxNum[0].innerText.split('4').length, 3, '4 transactions present')
  summaryAction = await queryAsync($, '.confirm-page-container-summary__action')
  assert.equal(summaryAction[0].innerText, 'TRANSFER', 'correct route')

  // Verify left arrow is working correctly
  navigateTxButtons = await queryAsync($, '.confirm-page-container-navigation__arrow')
  navigateTxButtons[1].click()
  trxNum = await queryAsync($, '.confirm-page-container-navigation')
  assert.equal(trxNum[0].innerText.includes('3'), true, 'changed transaction left')

  // Verify navigate to last transaction is working correctly
  navigateTxButtons = await queryAsync($, '.confirm-page-container-navigation__arrow')
  navigateTxButtons[3].click()
  trxNum = await queryAsync($, '.confirm-page-container-navigation')
  assert.equal(trxNum[0].innerText.split('4').length, 3, 'navigate to last transaction')

  // Verify navigate to first transaction is working correctly
  navigateTxButtons = await queryAsync($, '.confirm-page-container-navigation__arrow')
  navigateTxButtons[0].click()
  trxNum = await queryAsync($, '.confirm-page-container-navigation')
  assert.equal(trxNum[0].innerText.includes('1'), true, 'navigate to first transaction')
}
