import assert from 'assert'

const {
  save,
  next,
  confirm,
} = require('../../../../app/_locales/en/messages.json')

import {
  amountChecker,
  clickByText,
  clearInput,
} from '../helpers'

import {
  clickSend,
} from '../../view/index'

import {
  calcGasTotal,
} from '../../../../ui/app/pages/send/send.utils'

module.exports = {
  send,
  editGasPrice,
  editGasLimit,
  editTx,
}

async function send (page, opts = {}) {
  let contactName

  await clickSend(page)

  const sendTo = '.ens-input.send__to-row'
  await page.waitFor(sendTo)


  if (opts.addressBook === true) {

    await page.waitFor('.send__select-recipient-wrapper__group-item__title')
    const contact = `.send__select-recipient-wrapper__group-item__content`
    const name = await page.evaluate(el => el.innerText, contact)
    assert.equal(name, contactName)

    await page.click('.send__select-recipient-wrapper__group-item')

  } else {

    await page.type(sendTo, opts.address)

  }

  await page.waitFor('.send-v2__form')
  const input = '.unit-input__input'

  if (opts.addToaddressBook === true) {

    contactName = 'Test Name 1'

    await page.waitFor('.send__dialog.dialog--message')
    await page.click('.send__dialog.dialog--message')

    await page.waitFor('.add-to-address-book-modal')

    await page.type('.add-to-address-book-modal__input', contactName)

    await clickByText(page, save.message)

    await page.waitFor('.ens-input__selected-input__subtitle')

    const ensTitle = await page.$('.ens-input__selected-input__title')
    const name = await page.evaluate(el => el.innerText, ensTitle)

    assert.equal(name, contactName, 'Send Screen Address Contact Save')

  }

  switch (opts.gasOption) {
    case undefined:
      const amount = '1000'
      await page.type(input, amount)

      const error = await page.$('.send-v2__error-amount')
      const errorAmount = await page.evaluate(el => el.innerText, error)

      assert.equal(errorAmount, 'Insufficient funds.', 'Send screen should render an insufficient fund error message')

      const inputValue = await page.$eval(input, el => el.value)
      for (const char of inputValue) { // eslint-disable-line
        await page.keyboard.press('Backspace')
      }

      await page.click('.send-v2__amount-max')
      const isDisabled = await page.$('input[disabled]') !== null
      assert(isDisabled)
      assert(Number(await page.$eval(input, el => el.value)) > 99)

      await page.click('.send-v2__amount-max')
      const isEnabled = await page.$('input[disabled]') === null
      assert(isEnabled)
      break

    case 'Advanced':
      await customizeGas(page, opts)
      break

    case 'Slow':
    case 'Average':
    case 'Fast':
      const gasGroup = '.gas-price-button-group--small'
      await page.waitFor(gasGroup)
      await clickByText(page, opts.gasOption)
      break

    default:
      throw new Error(`Select gas options 'Slow', 'Average', 'Fast', or 'Advanced'`)
  }

  await page.type(input, opts.amount)

  await page.waitFor(500) // Do We need to wait here?

  await clickByText(page, next.message)

  if ('editTx' in opts) {
    await editTx(page)

    const newOpts = {
      amount: '2.2',
      gasPrice: '8',
      gasLimit: '100000',
    }

    const newAmount = await page.$(input)
    await newAmount.focus()
    await clearInput(page)
    await page.type(input, newOpts.amount)

    await customizeGas(page, newOpts)
    await clickByText(page, next.message)

    await validateConfTx(page, newOpts)
  }

  await page.waitFor('.confirm-page-container-content')
  await clickByText(page, confirm.message)

}

async function customizeGas (page, opts = {}) {
  await page.click('.advanced-gas-options-btn')
  await page.waitFor('.gas-modal-page-container')

  await editGasPrice(page, opts.gasPrice)
  await editGasLimit(page, opts.gasLimit)

  const expectedTxFee = calcTxFee(opts.gasLimit, opts.gasPrice)

  const txFee = await page.$('.gas-modal-content__info-row__transaction-info__value')

  await amountChecker(txFee, expectedTxFee + ' ETH')

  await clickByText(page, save.message)
}

async function editGasPrice (page, value) {
  await page.waitFor('.advanced-gas-inputs__gas-edit-row__input')
  const [gasPriceInput] = await page.$$('.advanced-gas-inputs__gas-edit-row__input')
  await gasPriceInput.focus()
  await clearInput(page)
  await page.keyboard.type(value)
  await page.waitFor(500)
}

async function editGasLimit (page, value) {
  await page.waitFor('.advanced-gas-inputs__gas-edit-row__input')
  const [_, gasLimitInput] = await page.$$('.advanced-gas-inputs__gas-edit-row__input') // eslint-disable-line
  await gasLimitInput.focus()
  await clearInput(page)
  await page.keyboard.type(value)
  await page.waitFor(500)
}

async function editTx (page) {
  await page.waitFor('.confirm-page-container-header')
  await page.click('.confirm-page-container-header__back-button')
}

async function validateConfTx (page, opts = {}) {
  const [ethAmount, gasFee, total] = await page.$$('.currency-display-component__text')

  const expectedTxFee = calcTxFee(opts.gasLimit, opts.gasPrice)
  const totalTxAmount = newTotal(expectedTxFee, opts.amount)

  await amountChecker(ethAmount, opts.amount)

  await amountChecker(gasFee, expectedTxFee)

  await amountChecker(total, totalTxAmount)

}

function calcTxFee (gasLimit, gasPrice) {
  let expectedTxFee = calcGasTotal(gasLimit, gasPrice)
  expectedTxFee /= Math.pow(10, 9)
  return expectedTxFee
}

function newTotal (gasTotal, amount) {
  const totalTxFee = gasTotal + Number(amount)
  return totalTxFee
}
