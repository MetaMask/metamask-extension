const assert = require('assert')
const { screens, menus, NETWORKS } = require('../elements')
const eventsEmitter = 'https://vbaranov.github.io/event-listener-dapp/'

const checkEmittedEvents = async (f, account1, account2) => {
	it('emit event', async () => {
    await f.setProvider(NETWORKS.SOKOL)
    let account
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      account = account1
    } else if (process.env.SELENIUM_BROWSER === 'firefox') {
      account = account2
      const accountMenu = await f.waitUntilShowUp(menus.account.menu)
      await accountMenu.click()
      const item = await f.waitUntilShowUp(menus.account.account2)
      await item.click()
    }

    const balanceField = await f.waitUntilShowUp(screens.main.balance)
    await f.delay(2000)
    const balance = await balanceField.getText()
    console.log('Account = ' + account)
    console.log('Balance = ' + balance)
    assert.equal(parseFloat(balance) > 0.001, true, 'Balance of account ' + account + ' TOO LOW !!! Please refill with Sokol eth!!!!')
    await f.driver.get(eventsEmitter)
    const button = await f.waitUntilShowUp(screens.eventsEmitter.button)
    await button.click()
    await f.delay(1000)
  })

  it('confirms transaction in MetaMask popup', async () => {
    const windowHandles = await f.driver.getAllWindowHandles()
    await f.driver.switchTo().window(windowHandles[windowHandles.length - 1])
    await f.delay(5000)
    const gasPrice = await f.waitUntilShowUp(screens.confirmTransaction.fields.gasPrice)
    await gasPrice.sendKeys('10')
    const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
    await f.click(button)
  })

  it('check  number of events', async () => {
    const windowHandles = await f.driver.getAllWindowHandles()
    await f.driver.switchTo().window(windowHandles[0])
    await f.delay(5000)
    const event = await f.waitUntilShowUp(screens.eventsEmitter.event, 600)
    const events = await f.driver.findElements(screens.eventsEmitter.event)
    console.log('number of events = ' + events.length)
    if (!event) console.log("event wasn't created or transaction failed".toUpperCase())
    else {
      const events = await f.driver.findElements(screens.eventsEmitter.event)
      assert.equal(events.length, 1, 'More than 1 event was fired: ' + events.length + ' events')
    }
  })

  it('open app', async () => {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      await f.driver.get(`chrome-extension://${f.extensionId}/popup.html`)
    } else if (process.env.SELENIUM_BROWSER === 'firefox') {
      await f.driver.get(`moz-extension://${f.extensionId}/popup.html`)
      const accountMenu = await f.waitUntilShowUp(menus.account.menu)
      await accountMenu.click()
      const item = await f.waitUntilShowUp(menus.account.account1)
      await item.click()
    }
  })
}

module.exports = checkEmittedEvents
