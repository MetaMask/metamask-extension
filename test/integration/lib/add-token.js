const reactTriggerChange = require('react-trigger-change')

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
  const selectState = $('select')
  selectState.val('add token')
  reactTriggerChange(selectState[0])

  await timeout(2000)

  // Check that no tokens have been added
  assert.ok($('.token-list-item').length === 0, 'no tokens added')

  // Go to Add Token screen
  let addTokenButton = $('button.btn-clear.wallet-view__add-token-button')
  assert.ok(addTokenButton[0], 'add token button present')
  addTokenButton[0].click()

  await timeout(1000)

  // Verify Add Token screen
  let addTokenWrapper = $('.add-token__wrapper')
  assert.ok(addTokenWrapper[0], 'add token wrapper renders')

  let addTokenTitle = $('.add-token__title')
  assert.equal(addTokenTitle[0].textContent, 'Add Token', 'add token title is correct')

  // Cancel Add Token
  const cancelAddTokenButton = $('button.btn-cancel.add-token__button')
  assert.ok(cancelAddTokenButton[0], 'cancel add token button present')
  cancelAddTokenButton.click()

  await timeout(1000)

  assert.ok($('.wallet-view')[0], 'cancelled and returned to account detail wallet view')

  // Return to Add Token Screen
  addTokenButton = $('button.btn-clear.wallet-view__add-token-button')
  assert.ok(addTokenButton[0], 'add token button present')
  addTokenButton[0].click()

  await timeout(1000)

  // Verify Add Token Screen
  addTokenWrapper = $('.add-token__wrapper')
  addTokenTitle = $('.add-token__title')
  assert.ok(addTokenWrapper[0], 'add token wrapper renders')
  assert.equal(addTokenTitle[0].textContent, 'Add Token', 'add token title is correct')

  // Search for token
  const searchInput = $('input.add-token__input')
  searchInput.val('a')
  reactTriggerChange(searchInput[0])

  await timeout()

  // Click token to add
  const tokenWrapper = $('div.add-token__token-wrapper')
  assert.ok(tokenWrapper[0], 'token found')
  const tokenImageProp = tokenWrapper.find('.add-token__token-icon').css('background-image')
  const tokenImageUrl = tokenImageProp.slice(5, -2)
  tokenWrapper[0].click()

  await timeout()

  // Click Next button
  let nextButton = $('button.btn-clear.add-token__button')
  assert.equal(nextButton[0].textContent, 'Next', 'next button rendered')
  nextButton[0].click()

  await timeout()

  // Confirm Add token
  assert.equal(
    $('.add-token__description')[0].textContent,
    'Would you like to add these tokens?',
    'confirm add token rendered'
  )
  assert.ok($('button.btn-clear.add-token__button')[0], 'confirm add token button found')
  $('button.btn-clear.add-token__button')[0].click()

  await timeout(2000)

  // Verify added token image
  let heroBalance = $('.hero-balance')
  assert.ok(heroBalance, 'rendered hero balance')
  assert.ok(tokenImageUrl.indexOf(heroBalance.find('img').attr('src')) > -1, 'token added')

  // Return to Add Token Screen
  addTokenButton = $('button.btn-clear.wallet-view__add-token-button')
  assert.ok(addTokenButton[0], 'add token button present')
  addTokenButton[0].click()

  await timeout(1000)

  const addCustom = $('.add-token__add-custom')
  assert.ok(addCustom[0], 'add custom token button present')
  addCustom[0].click()

  await timeout()

  // Input token contract address
  const customInput = $('input.add-token__add-custom-input')
  customInput.val('0x177af043D3A1Aed7cc5f2397C70248Fc6cDC056c')
  reactTriggerChange(customInput[0])

  await timeout(1000)

  // Click Next button
  nextButton = $('button.btn-clear.add-token__button')
  assert.equal(nextButton[0].textContent, 'Next', 'next button rendered')
  nextButton[0].click()

  await timeout(1000)

  // Verify symbol length error since contract address won't return symbol
  const errorMessage = $('.add-token__add-custom-error-message')
  assert.ok(errorMessage[0], 'error rendered')
  $('button.btn-cancel.add-token__button')[0].click()

  await timeout(2000)

  // // Confirm Add token
  // assert.equal(
  //   $('.add-token__description')[0].textContent,
  //   'Would you like to add these tokens?',
  //   'confirm add token rendered'
  // )
  // assert.ok($('button.btn-clear.add-token__button')[0], 'confirm add token button found')
  // $('button.btn-clear.add-token__button')[0].click()

  // // Verify added token image
  // heroBalance = $('.hero-balance')
  // assert.ok(heroBalance, 'rendered hero balance')
  // assert.ok(heroBalance.find('.identicon')[0], 'token added')
}

function timeout (time) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time || 1500)
  })
}
