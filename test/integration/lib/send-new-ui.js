const reactTriggerChange = require('react-trigger-change')

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

async function runSendFlowTest(assert, done) {
  console.log('*** start runSendFlowTest')
  const selectState = $('select')
  selectState.val('send new ui')
  reactTriggerChange(selectState[0])

  await timeout(2000)

  const sendScreenButton = $('button.btn-clear.hero-balance-button')
  assert.ok(sendScreenButton[1], 'send screen button present')
  sendScreenButton[1].click()

  await timeout(1000)

  const sendContainer = $('.send-v2__container')
  assert.ok(sendContainer[0], 'send container renders')

  const sendHeader = $('.send-v2__send-header-icon')
  assert.ok(sendHeader[0], 'send screen has a header icon')

  const sendTitle = $('.send-v2__title')
  assert.equal(sendTitle[0].textContent, 'Send Funds', 'Send screen title is correct')

  const sendCopy = $('.send-v2__copy')
  assert.equal(sendCopy[0].textContent, 'Only send ETH to an Ethereum address.', 'Send screen has copy')

  const sendFromField = $('.send-v2__form-field')
  assert.ok(sendFromField[0], 'send screen has a from field')

  let sendFromFieldItemAddress = $('.account-list-item__account-name')
  assert.equal(sendFromFieldItemAddress[0].textContent, 'Send Account 4', 'send from field shows correct account name')

  const sendFromFieldItem = $('.account-list-item')
  sendFromFieldItem[0].click()

  await timeout()

  const sendFromDropdownList = $('.send-v2__from-dropdown__list')
  assert.equal(sendFromDropdownList.children().length, 4, 'send from dropdown shows all accounts')
  console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! sendFromDropdownList.children()[1]`, sendFromDropdownList.children()[1]);
  sendFromDropdownList.children()[1].click()

  await timeout()

  sendFromFieldItemAddress = $('.account-list-item__account-name')
  console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! sendFromFieldItemAddress[0]`, sendFromFieldItemAddress[0]);
  assert.equal(sendFromFieldItemAddress[0].textContent, 'Send Account 2', 'send from field dropdown changes account name')

  let sendToFieldInput = $('.send-v2__to-autocomplete__input')
  sendToFieldInput[0].focus()

  await timeout()

  const sendToDropdownList = $('.send-v2__from-dropdown__list')
  assert.equal(sendToDropdownList.children().length, 5, 'send to dropdown shows all accounts and address book accounts')

  sendToDropdownList.children()[2].click()

  await timeout()

  const sendToAccountAddress = sendToFieldInput.val()
  assert.equal(sendToAccountAddress, '0x2f8d4a878cfa04a6e60d46362f5644deab66572d', 'send to dropdown selects the correct address')

  const sendAmountField = $('.send-v2__form-row:eq(2)')
  sendAmountField.find('.currency-display')[0].click()

  await timeout()

  const sendAmountFieldInput = sendAmountField.find('input:text')
  sendAmountFieldInput.val('5.1')
  reactTriggerChange(sendAmountField.find('input')[0])

  await timeout()

  let errorMessage = $('.send-v2__error')
  assert.equal(errorMessage[0].textContent, 'Insufficient funds.', 'send should render an insufficient fund error message')

  sendAmountFieldInput.val('2.0')
  reactTriggerChange(sendAmountFieldInput[0])

  await timeout()
  errorMessage = $('.send-v2__error')
  assert.equal(errorMessage.length, 0, 'send should stop rendering amount error message after amount is corrected')

  const sendGasField = $('.send-v2__gas-fee-display')
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

  const sendGasOpenCustomizeModalButton = $('.send-v2__sliders-icon-container'
  )
  sendGasOpenCustomizeModalButton[0].click()

  await timeout(1000)

  const customizeGasModal = $('.send-v2__customize-gas')
  assert.ok(customizeGasModal[0], 'should render the customize gas modal')
  
  const customizeGasPriceInput = $('.send-v2__gas-modal-card').first().find('input')
  customizeGasPriceInput.val(50)
  reactTriggerChange(customizeGasPriceInput[0])
  const customizeGasLimitInput = $('.send-v2__gas-modal-card').last().find('input')
  customizeGasLimitInput.val(60000)
  reactTriggerChange(customizeGasLimitInput[0])

  await timeout()

  const customizeGasSaveButton = $('.send-v2__customize-gas__save')
  customizeGasSaveButton[0].click()

  await timeout()

  assert.equal(
    sendGasField.find('.currency-display__input-wrapper > input').val(),
    '0.003',
    'send gas field should show customized gas total'
  )
  assert.equal(
    sendGasField.find('.currency-display__converted-value')[0].textContent,
    '3.60 USD',
    'send gas field should show customized gas total converted to USD'
  )

  const sendButton = $('.send-v2__next-btn')
  sendButton[0].click()

  await timeout(2000)

  selectState.val('send edit')
  reactTriggerChange(selectState[0])

  await timeout(2000)

  const confirmFromName = $('.confirm-screen-account-name').first()
  assert.equal(confirmFromName[0].textContent, 'Send Account 2', 'confirm screen should show correct from name')

  const confirmToName = $('.confirm-screen-account-name').last()
  assert.equal(confirmToName[0].textContent, 'Send Account 3', 'confirm screen should show correct to name')

  const confirmScreenRows = $('.confirm-screen-rows')
  const confirmScreenGas = confirmScreenRows.find('.confirm-screen-row-info')[2]
  assert.equal(confirmScreenGas.textContent, '3.6 USD', 'confirm screen should show correct gas')
  const confirmScreenTotal = confirmScreenRows.find('.confirm-screen-row-info')[3]
  assert.equal(confirmScreenTotal.textContent, '2405.36 USD', 'confirm screen should show correct total')

  const confirmScreenBackButton = $('.confirm-screen-back-button')
  confirmScreenBackButton[0].click()

  await timeout(1000)

  const sendFromFieldItemInEdit = $('.account-list-item')
  sendFromFieldItemInEdit[0].click()

  await timeout()

  const sendFromDropdownListInEdit = $('.send-v2__from-dropdown__list')
  sendFromDropdownListInEdit.children()[2].click()

  await timeout()

  const sendToFieldInputInEdit = $('.send-v2__to-autocomplete__input')
  sendToFieldInputInEdit[0].focus()
  sendToFieldInputInEdit.val('0xd85a4b6a394794842887b8284293d69163007bbb')

  await timeout()

  const sendAmountFieldInEdit = $('.send-v2__form-row:eq(2)')
  sendAmountFieldInEdit.find('.currency-display')[0].click()

  await timeout()

  const sendAmountFieldInputInEdit = sendAmountFieldInEdit.find('input:text')
  sendAmountFieldInputInEdit.val('1.0')
  reactTriggerChange(sendAmountFieldInputInEdit[0])

  await timeout()

  const sendButtonInEdit = $('.send-v2__next-btn')
  sendButtonInEdit[0].click()

  await timeout()

  // TODO: Need a way to mock background so that we can test correct transition from editing to confirm
  selectState.val('confirm new ui')
  reactTriggerChange(selectState[0])

  await timeout(2000)
  const confirmScreenConfirmButton = $('.confirm-screen-confirm-button')
  console.log(`+++++++++++++++++++++++++++++++= confirmScreenConfirmButton[0]`, confirmScreenConfirmButton[0]);
  confirmScreenConfirmButton[0].click()

  await timeout(2000)

  const txView = $('.tx-view')
  console.log(`++++++++++++++++++++++++++++++++ txView[0]`, txView[0]);

  assert.ok(txView[0], 'Should return to the account details screen after confirming')
}

function timeout (time) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time || 1500)
  })
}