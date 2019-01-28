const assert = require('assert')
const webdriver = require('selenium-webdriver')
const { By } = webdriver
const { screens, NETWORKS } = require('../elements')

const signData = async (f) => {
	it('Simulate sign request ', async () => {
      await f.delay(5000)
      await f.setProvider(NETWORKS.LOCALHOST)
      await f.driver.get('https://danfinlay.github.io/js-eth-personal-sign-examples/')
      const button = await f.waitUntilShowUp(By.id('ethSignButton'))
      assert.notEqual(button, false, "resource isn't responding")
      await button.click()
      await f.delay(5000)
    })

    it('navigates back to MetaMask popup in the tab', async () => {
      if (process.env.SELENIUM_BROWSER === 'chrome') {
        await f.driver.get(`chrome-extension://${f.extensionId}/popup.html`)
      } else if (process.env.SELENIUM_BROWSER === 'firefox') {
        await f.driver.get(`moz-extension://${f.extensionId}/popup.html`)
      }
      await f.delay(700)
    })

    it('error message is displayed and contains text', async () => {
      const error = await f.waitUntilShowUp(screens.signMessage.error)
      assert.notEqual(error, false, 'error message isn\'t displayed')
      const text = await error.getText()
      assert.equal(text.length > 183, true, 'error message hasn\'t text')
    })

    it('account name is displayed and correct', async () => {
      const name = await f.waitUntilShowUp(screens.signMessage.accountName)
      assert.notEqual(name, false, 'account name isn\'t displayed')
      assert.equal(await name.getText(), 'new name', 'account name is incorrect')
    })

    it('title is displayed and correct', async () => {
      const title = await f.waitUntilShowUp(screens.signMessage.title)
      assert.notEqual(title, false, 'title isn\'t displayed')
      assert.equal(await title.getText(), 'Sign message', 'title is incorrect')
    })

    it('message is displayed and correct', async () => {
      const message = await f.waitUntilShowUp(screens.signMessage.message)
      assert.notEqual(message, false, 'message isn\'t displayed')
      assert.equal((await message.getText()).length > 32, true, 'message is incorrect')
    })

    it('button \'Cancel\' is enabled and lead to main screen ', async () => {
      const button = await f.waitUntilShowUp(screens.signMessage.buttons.cancel)
      assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
      assert.equal(await button.getText(), 'Cancel', 'button has incorrect name')
    })

    it('button \'Sign\' is enabled and lead to main screen ', async () => {
      const button = await f.waitUntilShowUp(screens.signMessage.buttons.sign)
      assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
      assert.equal(await button.getText(), 'Sign', 'button has incorrect name')
      await f.click(button)
      const identicon = await f.waitUntilShowUp(screens.main.identicon)
      assert.notEqual(identicon, false, 'main screen didn\'t opened')
    })
}

module.exports = signData
