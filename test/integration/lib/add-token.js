const reactTriggerChange = require('react-trigger-change')
const {
  timeout,
  queryAsync,
  findAsync,
} = require('../../lib/util')

QUnit.module('Add token flow')

QUnit.skip('successful add token flow', (assert) => {
  const done = assert.async()
  runAddTokenFlowTest(assert)
    .then(done)
    .catch(err => {
      assert.notOk(err, `Error was thrown: ${err.stack}`)
      done()
    })
})

async function runAddTokenFlowTest (assert, done) {
  const selectState = await queryAsync($, 'select')

  selectState.val('add token')
  reactTriggerChange(selectState[0])

  // Used to set values on TextField input component
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set

  // Check that no tokens have been added
  assert.ok($('.token-list-item').length === 0, 'no tokens added')

  // Go to Add Token screen
  let addTokenButton = await queryAsync($, 'button.btn-primary.wallet-view__add-token-button')
  assert.ok(addTokenButton[0], 'add token button present')
  await addTokenButton[0].click()

  // Verify Add Token screen
  let addTokenTitle = await queryAsync($, '.page-subtitle')
  assert.equal(addTokenTitle[0].textContent, 'Add Token', 'add token title is correct')

  // Cancel Add Token
  const cancelAddTokenButton = await queryAsync($, 'button.btn-violet')
  assert.ok(cancelAddTokenButton[0], 'cancel add token button present')
  await cancelAddTokenButton.click()
  assert.ok((await queryAsync($, '.identicon-wrapper'))[0], 'cancelled and returned to account detail wallet view')

  // Return to Add Token Screen
  addTokenButton = await queryAsync($, 'button.btn-primary.wallet-view__add-token-button')
  assert.ok(addTokenButton[0], 'add token button present')
  await addTokenButton[0].click()

  // Verify Add Token Screen
  addTokenTitle = await queryAsync($, '.page-subtitle')
  assert.equal(addTokenTitle[0].textContent, 'Add Token', 'add token title is correct')

  // Input invalid token contract address
  const customAddress = (await findAsync($, '#token-address'))[0]
  await customAddress.focus()
  await timeout(1000)
  await nativeInputValueSetter.call(customAddress, '0x177af043D3A1Aed7cc5f2397C70248Fc6cDC056c')
  await customAddress.dispatchEvent(new Event('input', { bubbles: true }))

  // Verify button add disabled since contract is invalid
  const buttonAdd = await queryAsync($, '#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div.flex-space-around > div:nth-child(7) > button:nth-child(2)')
  assert.ok(buttonAdd[0], 'add button rendered')
  assert.equal(await buttonAdd[0].getAttribute('disabled'), '', 'add button isn\'t disabled')
  // Input token symbol with length more than 10
  const customSymbol = (await findAsync($, '#token_symbol'))[0]
  assert.ok(customSymbol, 'symbol field rendered')
  assert.equal(await customSymbol.getAttribute('disabled'), '', 'symbol field isn\'t disabled')

  // Input valid decimals
  const customDecimals = (await findAsync($, '#token_decimals'))[0]
  assert.ok(customDecimals, 'decimals field rendered')
  assert.equal(await customDecimals.getAttribute('disabled'), '', 'decimals field isn\'t disabled')
}
