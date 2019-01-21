const assert = require('assert')
const { screens, menus } = require('../elements')
const testSeedPhrase = 'horn among position unable audit puzzle cannon apology gun autumn plug parrot'

const importGanacheSeedPhrase = async (f, account2, password) => {
  it('logs out', async () => {
    const menu = await f.waitUntilShowUp(menus.sandwich.menu)
    await menu.click()
    const logOut = await f.waitUntilShowUp(menus.sandwich.logOut)
    assert.equal(await logOut.getText(), menus.sandwich.textLogOut)
    await logOut.click()
  })

  it('restores from seed phrase', async () => {
    const restoreSeedLink = await f.waitUntilShowUp(screens.lock.linkRestore)
    assert.equal(await restoreSeedLink.getText(), screens.lock.linkRestoreText)
    await restoreSeedLink.click()
  })

  it('adds seed phrase', async () => {
    const seedTextArea = await f.waitUntilShowUp(screens.restoreVault.textArea)
    await seedTextArea.sendKeys(testSeedPhrase)

    let field = await f.driver.findElement(screens.restoreVault.fieldPassword)
    await field.sendKeys(password)
    field = await f.driver.findElement(screens.restoreVault.fieldPasswordConfirm)
    await field.sendKeys(password)
    field = await f.waitUntilShowUp(screens.restoreVault.buttos.ok)
    await f.click(field)
  })

  it('balance renders', async () => {
    const balance = await f.waitUntilShowUp(screens.main.balance)
    assert.equal(await balance.getText(), '100.000', "balance isn't correct")
  })

  it('sends transaction', async () => {
    const sendButton = await f.waitUntilShowUp(screens.main.buttons.send)
    assert.equal(await sendButton.getText(), screens.main.buttons.sendText)
    await f.click(sendButton)
  })

  it('adds recipient address and amount', async () => {
    const sendTranscationScreen = await f.waitUntilShowUp(screens.sendTransaction.title)
    assert.equal(await sendTranscationScreen.getText(), screens.sendTransaction.titleText, 'Transaction screen has incorrect titlr')
    const inputAddress = await f.waitUntilShowUp(screens.sendTransaction.field.address)
    const inputAmmount = await f.waitUntilShowUp(screens.sendTransaction.field.amount)
    await inputAddress.sendKeys(account2)
    await inputAmmount.sendKeys('10')
    const button = await f.waitUntilShowUp(screens.sendTransaction.buttonNext)
    assert.equal(await button.getText(), 'Next', 'button has incorrect name')
    await f.click(button)
  })

  it('confirms transaction', async () => {
    const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
    assert.equal(await button.getAttribute('value'), 'Submit', 'button has incorrect name')
    await f.click(button)
  })

  it('finds the transaction in the transactions list', async () => {
    const transactionAmount = await f.waitUntilShowUp(screens.main.transactionList)
    assert.equal(await transactionAmount.getText(), '10.0')
  })
}

module.exports = importGanacheSeedPhrase
