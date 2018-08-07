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
  addTokenButton[0].click()

  // Verify Add Token screen
  let addTokenWrapper = await queryAsync($, '.page-container')
  assert.ok(addTokenWrapper[0], 'add token wrapper renders')

  let addTokenTitle = await queryAsync($, '.page-container__title')
  assert.equal(addTokenTitle[0].textContent, 'Add Tokens', 'add token title is correct')

  // Cancel Add Token
  const cancelAddTokenButton = await queryAsync($, 'button.btn-default.btn--large.page-container__footer-button')
  assert.ok(cancelAddTokenButton[0], 'cancel add token button present')
  cancelAddTokenButton.click()

  assert.ok($('.wallet-view')[0], 'cancelled and returned to account detail wallet view')

  // Return to Add Token Screen
  addTokenButton = await queryAsync($, 'button.btn-primary.wallet-view__add-token-button')
  assert.ok(addTokenButton[0], 'add token button present')
  addTokenButton[0].click()

  // Verify Add Token Screen
  addTokenWrapper = await queryAsync($, '.page-container')
  addTokenTitle = await queryAsync($, '.page-container__title')
  assert.ok(addTokenWrapper[0], 'add token wrapper renders')
  assert.equal(addTokenTitle[0].textContent, 'Add Tokens', 'add token title is correct')

  // Search for token
  const searchInput = (await findAsync(addTokenWrapper, '#search-tokens'))[0]
  searchInput.focus()
  await timeout(1000)
  nativeInputValueSetter.call(searchInput, 'a')
  searchInput.dispatchEvent(new Event('input', { bubbles: true}))

  // Click token to add
  const tokenWrapper = await queryAsync($, 'div.token-list__token')
  assert.ok(tokenWrapper[0], 'token found')
  const tokenImageProp = tokenWrapper.find('.token-list__token-icon').css('background-image')
  const tokenImageUrl = tokenImageProp.slice(5, -2)
  tokenWrapper[0].click()

  // Click Next button
  const nextButton = await queryAsync($, 'button.btn-primary.btn--large')
  assert.equal(nextButton[0].textContent, 'Next', 'next button rendered')
  nextButton[0].click()

  // Confirm Add token
  const confirmAddToken = await queryAsync($, '.confirm-add-token')
  assert.ok(confirmAddToken[0], 'confirm add token rendered')
  assert.ok($('button.btn-primary.btn--large')[0], 'confirm add token button found')
  $('button.btn-primary.btn--large')[0].click()

  // Verify added token image
  let heroBalance = await queryAsync($, '.token-view-balance__balance-container')
  assert.ok(heroBalance, 'rendered hero balance')
  assert.ok(tokenImageUrl.indexOf(heroBalance.find('img').attr('src')) > -1, 'token added')

  // Return to Add Token Screen
  addTokenButton = await queryAsync($, 'button.btn-primary.wallet-view__add-token-button')
  assert.ok(addTokenButton[0], 'add token button present')
  addTokenButton[0].click()

  addTokenWrapper = await queryAsync($, '.page-container')
  const addTokenTabs = await queryAsync($, '.page-container__tab')
  assert.equal(addTokenTabs.length, 2, 'expected number of tabs')
  assert.equal(addTokenTabs[1].textContent, 'Custom Token', 'Custom Token tab present')
  assert.ok(addTokenTabs[1], 'add custom token tab present')
  addTokenTabs[1].click()
  await timeout(1000)

  // Input token contract address
  const customInput = (await findAsync(addTokenWrapper, '#custom-address'))[0]
  customInput.focus()
  await timeout(1000)
  nativeInputValueSetter.call(customInput, '0x177af043D3A1Aed7cc5f2397C70248Fc6cDC056c')
  customInput.dispatchEvent(new Event('input', { bubbles: true}))


  // Click Next button
  // nextButton = await queryAsync($, 'button.btn-primary--lg')
  // assert.equal(nextButton[0].textContent, 'Next', 'next button rendered')
  // nextButton[0].click()

  // // Verify symbol length error since contract address won't return symbol
  const errorMessage = await queryAsync($, '#custom-symbol-helper-text')
  assert.ok(errorMessage[0], 'error rendered')

  $('button.btn-default.btn--large')[0].click()

  // await timeout(100000)

  // Confirm Add token
  // assert.equal(
  //   $('.page-container__subtitle')[0].textContent,
  //   'Would you like to add these tokens?',
  //   'confirm add token rendered'
  // )
  // assert.ok($('button.btn-primary--lg')[0], 'confirm add token button found')
  // $('button.btn-primary--lg')[0].click()

  // Verify added token image
  heroBalance = await queryAsync($, '.token-view-balance__balance-container')
  assert.ok(heroBalance, 'rendered hero balance')
  assert.ok(heroBalance.find('.identicon')[0], 'token added')
}
