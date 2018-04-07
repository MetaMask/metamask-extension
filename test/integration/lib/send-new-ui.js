const reactTriggerChange = require('../../lib/react-trigger-change')
const {
  timeout,
  queryAsync,
  findAsync,
} = require('../../lib/util')

const PASSWORD = 'password123'

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

async function runSendFlowTest(assert, done) {
  console.log('*** start runSendFlowTest')
  const selectState = await queryAsync($, 'select')
  selectState.val('send new ui')
  reactTriggerChange(selectState[0])

  const sendScreenButton = await queryAsync($, 'button.btn-primary.hero-balance-button')
  assert.ok(sendScreenButton[1], 'send screen button present')
  sendScreenButton[1].click()

  const sendTitle = await queryAsync($, '.page-container__title')
  assert.equal(sendTitle[0].textContent, 'Send AKA', 'Send screen title is correct')

  const sendCopy = await queryAsync($, '.page-container__subtitle')
  assert.equal(sendCopy[0].textContent, 'Only send AKA to an Akroma address.', 'Send screen has copy')

  const sendFromField = await queryAsync($, '.send-v2__form-field')
  assert.ok(sendFromField[0], 'send screen has a from field')

  let sendFromFieldItemAddress = await queryAsync($, '.account-list-item__account-name')
  assert.equal(sendFromFieldItemAddress[0].textContent, 'Send Account 4', 'send from field shows correct account name')

  const sendFromFieldItem = await queryAsync($, '.account-list-item')
  sendFromFieldItem[0].click()

  // this seems to fail if the firefox window is not in focus...
  const sendFromDropdownList = await queryAsync($, '.send-v2__from-dropdown__list')
  assert.equal(sendFromDropdownList.children().length, 4, 'send from dropdown shows all accounts')
  sendFromDropdownList.children()[1].click()

  sendFromFieldItemAddress = await queryAsync($,   '.account-list-item__account-name')
  assert.equal(sendFromFieldItemAddress[0].textContent, 'Send Account 2', 'send from field dropdown changes account name')

  let sendToFieldInput = await queryAsync($, '.send-v2__to-autocomplete__input')
  sendToFieldInput[0].focus()

  const sendToDropdownList = await queryAsync($, '.send-v2__from-dropdown__list')
  assert.equal(sendToDropdownList.children().length, 5, 'send to dropdown shows all accounts and address book accounts')

  sendToDropdownList.children()[2].click()

  const sendToAccountAddress = sendToFieldInput.val()
  assert.equal(sendToAccountAddress, '0x2f8d4a878cfa04a6e60d46362f5644deab66572d', 'send to dropdown selects the correct address')

  const sendAmountField = await queryAsync($, '.send-v2__form-row:eq(2)')
  sendAmountField.find('.currency-display')[0].click()

  const sendAmountFieldInput = await findAsync(sendAmountField, 'input:text')
  sendAmountFieldInput.val('5.1')
  reactTriggerChange(sendAmountField.find('input')[0])

  let errorMessage = await queryAsync($, '.send-v2__error')
  assert.equal(errorMessage[0].textContent, 'Insufficient funds.', 'send should render an insufficient fund error message')

  sendAmountFieldInput.val('2.0')
  reactTriggerChange(sendAmountFieldInput[0])
  await timeout()
  errorMessage = $('.send-v2__error')
  assert.equal(errorMessage.length, 0, 'send should stop rendering amount error message after amount is corrected')

  const sendGasField = await queryAsync($, '.send-v2__gas-fee-display')
  assert.equal(
    sendGasField.find('.currency-display__input-wrapper > input').val(),
    '0.000198',
    'send gas field should show estimated gas total'
  )
  assert.equal(
    sendGasField.find('.currency-display__converted-value')[0].textContent,
    '0.24 USD',
    'send gas field should show estimated gas total converted to USD'
  )

  const sendGasOpenCustomizeModalButton = await queryAsync($, '.sliders-icon-container')
  sendGasOpenCustomizeModalButton[0].click()

  const customizeGasModal = await queryAsync($, '.send-v2__customize-gas')
  assert.ok(customizeGasModal[0], 'should render the customize gas modal')

  const customizeGasPriceInput = (await queryAsync($, '.send-v2__gas-modal-card')).first().find('input')
  customizeGasPriceInput.val(50)
  reactTriggerChange(customizeGasPriceInput[0])
  const customizeGasLimitInput = (await queryAsync($, '.send-v2__gas-modal-card')).last().find('input')
  customizeGasLimitInput.val(60000)
  reactTriggerChange(customizeGasLimitInput[0])

  const customizeGasSaveButton = await queryAsync($, '.send-v2__customize-gas__save')
  customizeGasSaveButton[0].click()

  assert.equal(
    (await findAsync(sendGasField, '.currency-display__input-wrapper > input')).val(),
    '0.003',
    'send gas field should show customized gas total'
  )
  assert.equal(
    (await findAsync(sendGasField, '.currency-display__converted-value'))[0].textContent,
    '3.60 USD',
    'send gas field should show customized gas total converted to USD'
  )

  const sendButton = await queryAsync($, 'button.btn-primary--lg.page-container__footer-button')
  assert.equal(sendButton[0].textContent, 'Next', 'next button rendered')
  sendButton[0].click()
  await timeout()

  selectState.val('send edit')
  reactTriggerChange(selectState[0])

  const confirmFromName = (await queryAsync($, '.sender-to-recipient__sender-name')).first()
  assert.equal(confirmFromName[0].textContent, 'Send Account 2', 'confirm screen should show correct from name')

  const confirmToName = (await queryAsync($, '.sender-to-recipient__recipient-name')).last()
  assert.equal(confirmToName[0].textContent, 'Send Account 3', 'confirm screen should show correct to name')

  const confirmScreenRows = await queryAsync($, '.confirm-screen-rows')
  const confirmScreenGas = confirmScreenRows.find('.currency-display__converted-value')[0]
  assert.equal(confirmScreenGas.textContent, '3.60 USD', 'confirm screen should show correct gas')
  const confirmScreenTotal = confirmScreenRows.find('.confirm-screen-row-info')[2]
  assert.equal(confirmScreenTotal.textContent, '2405.36 USD', 'confirm screen should show correct total')

  const confirmScreenBackButton = await queryAsync($, '.page-container__back-button')
  confirmScreenBackButton[0].click()

  const sendFromFieldItemInEdit = await queryAsync($, '.account-list-item')
  sendFromFieldItemInEdit[0].click()

  const sendFromDropdownListInEdit = await queryAsync($, '.send-v2__from-dropdown__list')
  sendFromDropdownListInEdit.children()[2].click()

  const sendToFieldInputInEdit = await queryAsync($, '.send-v2__to-autocomplete__input')
  sendToFieldInputInEdit[0].focus()
  sendToFieldInputInEdit.val('0xd85a4b6a394794842887b8284293d69163007bbb')

  const sendAmountFieldInEdit = await queryAsync($, '.send-v2__form-row:eq(2)')
  sendAmountFieldInEdit.find('.currency-display')[0].click()

  const sendAmountFieldInputInEdit = sendAmountFieldInEdit.find('input:text')
  sendAmountFieldInputInEdit.val('1.0')
  reactTriggerChange(sendAmountFieldInputInEdit[0])

  const sendButtonInEdit = await queryAsync($, '.btn-primary--lg.page-container__footer-button')
  assert.equal(sendButtonInEdit[0].textContent, 'Next', 'next button in edit rendered')
  sendButtonInEdit[0].click()

  // TODO: Need a way to mock background so that we can test correct transition from editing to confirm
  selectState.val('confirm new ui')
  reactTriggerChange(selectState[0])
  const confirmScreenConfirmButton = await queryAsync($, '.btn-confirm.page-container__footer-button')
  console.log(`+++++++++++++++++++++++++++++++= confirmScreenConfirmButton[0]`, confirmScreenConfirmButton[0]);
  confirmScreenConfirmButton[0].click()

  const txView = await queryAsync($, '.tx-view')
  console.log(`++++++++++++++++++++++++++++++++ txView[0]`, txView[0]);

  assert.ok(txView[0], 'Should return to the account details screen after confirming')
}
