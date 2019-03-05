const reactTriggerChange = require('../../lib/react-trigger-change')
const {
  timeout,
  queryAsync,
  findAsync,
} = require('../../lib/util')
const fetchMockResponses = require('../../e2e/beta/fetch-mocks.js')

QUnit.module('new ui send flow')

QUnit.test('successful send flow', (assert) => {
  const done = assert.async()
  runSendFlowTest(assert).then(done).catch((err) => {
    assert.notOk(err, `Error was thrown: ${err.stack}`)
    done()
  })
})

global.ethQuery = {
  sendTransaction: () => {},
}

global.ethereumProvider = {}

async function runSendFlowTest (assert, done) {
  const tempFetch = global.fetch

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
    return window.fetch(...args)
  }

  console.log('*** start runSendFlowTest')
  const selectState = await queryAsync($, 'select')
  selectState.val('send new ui')
  reactTriggerChange(selectState[0])

  const sendScreenButton = await queryAsync($, 'button.btn-primary.transaction-view-balance__button')
  assert.ok(sendScreenButton[1], 'send screen button present')
  sendScreenButton[1].click()

  const sendTitle = await queryAsync($, '.page-container__title')
  assert.equal(sendTitle[0].textContent, 'Send ETH', 'Send screen title is correct')

  const sendCopy = await queryAsync($, '.page-container__subtitle')
  assert.equal(sendCopy[0].textContent, 'Only send ETH to an Ethereum address.', 'Send screen has copy')

  const sendFromField = await queryAsync($, '.send-v2__form-field')
  assert.ok(sendFromField[0], 'send screen has a from field')

  const sendFromFieldItemAddress = await queryAsync($, '.account-list-item__account-name')
  assert.equal(sendFromFieldItemAddress[0].textContent, 'Send Account 2', 'send from field shows correct account name')

  const sendToFieldInput = await queryAsync($, '.send-v2__to-autocomplete__input')
  sendToFieldInput[0].focus()

  await timeout(1000)

  const sendToDropdownList = await queryAsync($, '.send-v2__from-dropdown__list')
  assert.equal(sendToDropdownList.children().length, 5, 'send to dropdown shows all accounts and address book accounts')

  sendToDropdownList.children()[2].click()

  const sendToAccountAddress = sendToFieldInput.val()
  assert.equal(sendToAccountAddress, '0x2f8D4a878cFA04A6E60D46362f5644DeAb66572D', 'send to dropdown selects the correct address')

  const sendAmountField = await queryAsync($, '.send-v2__form-row:eq(2)')
  sendAmountField.find('.unit-input')[0].click()

  const sendAmountFieldInput = await findAsync(sendAmountField, '.unit-input__input')
  sendAmountFieldInput.val('5.1')
  reactTriggerChange(sendAmountField.find('input')[0])

  let errorMessage = await queryAsync($, '.send-v2__error')
  assert.equal(errorMessage[0].textContent, 'Insufficient funds.', 'send should render an insufficient fund error message')

  sendAmountFieldInput.val('2.0')
  reactTriggerChange(sendAmountFieldInput[0])
  await timeout()
  errorMessage = $('.send-v2__error')
  assert.equal(errorMessage.length, 0, 'send should stop rendering amount error message after amount is corrected')

  const sendButton = await queryAsync($, 'button.btn-primary.btn--large.page-container__footer-button')
  assert.equal(sendButton[0].textContent, 'Next', 'next button rendered')
  sendButton[0].click()
  await timeout()

  selectState.val('send edit')
  reactTriggerChange(selectState[0])

  const confirmFromName = (await queryAsync($, '.sender-to-recipient__name')).first()
  assert.equal(confirmFromName[0].textContent, 'Send Account 2', 'confirm screen should show correct from name')

  const confirmToName = (await queryAsync($, '.sender-to-recipient__name')).last()
  assert.equal(confirmToName[0].textContent, 'Send Account 3', 'confirm screen should show correct to name')

  const confirmScreenRowFiats = await queryAsync($, '.confirm-detail-row__secondary')
  const confirmScreenGas = confirmScreenRowFiats[0]
  assert.equal(confirmScreenGas.textContent, '$3.60', 'confirm screen should show correct gas')
  const confirmScreenTotal = confirmScreenRowFiats[1]
  assert.equal(confirmScreenTotal.textContent, '$2,405.37', 'confirm screen should show correct total')

  const confirmScreenBackButton = await queryAsync($, '.confirm-page-container-header__back-button')
  confirmScreenBackButton[0].click()

  const sendToFieldInputInEdit = await queryAsync($, '.send-v2__to-autocomplete__input')
  sendToFieldInputInEdit[0].focus()
  sendToFieldInputInEdit.val('0xd85a4b6a394794842887b8284293d69163007bbb')

  const sendAmountFieldInEdit = await queryAsync($, '.send-v2__form-row:eq(2)')
  sendAmountFieldInEdit.find('.unit-input')[0].click()

  const sendAmountFieldInputInEdit = sendAmountFieldInEdit.find('.unit-input__input')
  sendAmountFieldInputInEdit.val('1.0')
  reactTriggerChange(sendAmountFieldInputInEdit[0])

  const sendButtonInEdit = await queryAsync($, '.btn-primary.btn--large.page-container__footer-button')
  assert.equal(sendButtonInEdit[0].textContent, 'Next', 'next button in edit rendered')

  selectState.val('send new ui')
  reactTriggerChange(selectState[0])

  const cancelButtonInEdit = await queryAsync($, '.btn-default.btn--large.page-container__footer-button')
  cancelButtonInEdit[0].click()

  global.fetch = tempFetch
  // sendButtonInEdit[0].click()

  // // TODO: Need a way to mock background so that we can test correct transition from editing to confirm
  // selectState.val('confirm new ui')
  // reactTriggerChange(selectState[0])


  // const confirmScreenConfirmButton = await queryAsync($, '.btn-confirm.page-container__footer-button')
  // console.log(`+++++++++++++++++++++++++++++++= confirmScreenConfirmButton[0]`, confirmScreenConfirmButton[0]);
  // confirmScreenConfirmButton[0].click()

  // await timeout(10000000)

  // const txView = await queryAsync($, '.tx-view')
  // console.log(`++++++++++++++++++++++++++++++++ txView[0]`, txView[0]);

  // assert.ok(txView[0], 'Should return to the account details screen after confirming')
}
