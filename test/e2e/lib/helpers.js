import assert from 'assert'

module.exports = {
  amountChecker,
  balanceChecker,
  clickByText,
  clearInput,
}

async function clickByText (page, text) {
  const xpath = `//*[contains(text(), '${text}')]`
  const elements = await page.$x(xpath)
  elements[0].click()
  await page.waitFor(500)
}

async function clearInput (page) {
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyA')
  await page.keyboard.up('Control')
  await page.keyboard.press('Backspace')
}

async function balanceChecker (page, selector, expectedBalanceText) {
  const balance = await page.$eval(selector, el => {
    return el.title // Have to use title here for balance in token amount
  })
  await page.waitFor(500)
  assert.equal(expectedBalanceText, balance)
}

async function amountChecker (pageElement, expectedAmountText) {
  const amount = await pageElement.evaluate(el => el.innerText)
  assert.equal(expectedAmountText, amount)
}
