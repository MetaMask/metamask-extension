const reactTriggerChange = require('react-trigger-change')
const {
  timeout,
  queryAsync,
  findAsync,
} = require('../../lib/util')

QUnit.module('Add token flow')

QUnit.test('successful add token flow', (assert) => {
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
  await nativeInputValueSetter.call(customAddress, 'invalid address')
  await customAddress.dispatchEvent(new Event('input', { bubbles: true }))
  const buttonAdd = await queryAsync($, '#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div.flex-space-around > div:nth-child(7) > button:nth-child(2)')

  assert.ok(buttonAdd[0], 'add button rendered')
  await buttonAdd[0].click()

  // Verify contract  error since contract address is invalid
  const errorMessage = await queryAsync($, '.error')
  assert.ok(errorMessage[0], 'error rendered')

  // Input valid token contract address
  await nativeInputValueSetter.call(customAddress, '0x177af043D3A1Aed7cc5f2397C70248Fc6cDC056c')
  await customAddress.dispatchEvent(new Event('input', { bubbles: true }))

  // Input token symbol with length more than 10
  const customSymbol = (await findAsync($, '#token_symbol'))[0]
  assert.ok(customSymbol, 'symbol field rendered')
  /*
  await customSymbol.focus()
  await timeout(1000)
  await nativeInputValueSetter.call(customSymbol, 'POAPOAPOA20')
  await customSymbol.dispatchEvent(new Event('input', { bubbles: true }))
  await buttonAdd[0].click()
  // Verify symbol length error since length more than 10
  errorMessage = await queryAsync($, '.error')[0]
  assert.ok(errorMessage, 'error rendered')
*/
  // Input valid token symbol
  await nativeInputValueSetter.call(customSymbol, 'POA')
  await customSymbol.dispatchEvent(new Event('input', { bubbles: true }))
  // Input valid decimals
  const customDecimals = (await findAsync($, '#token_decimals'))[0]
  assert.ok(customDecimals, 'decimals field rendered')

  // Click Add button
  await buttonAdd[0].click()

  // check if main screen
  assert.ok((await queryAsync($, '.identicon-wrapper'))[0], 'returned to account detail wallet view')
}
