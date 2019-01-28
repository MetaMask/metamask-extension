const assert = require('assert')
const clipboardy = require('clipboardy')
const { screens, menus } = require('../elements')

const exportPrivateKey = async (f, password) => {
	it('open dialog', async () => {
      await f.driver.navigate().refresh()
      const menu = await f.waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.dot.exportPR)
      await item.click()
    })

    it('warning is displayed', async () => {
      await f.waitUntilShowUp(screens.exportPR.error)
      const error = await f.driver.findElements(screens.exportPR.error)
      assert.equal(error.length, 1, 'warning isn\'t present')
      assert.equal(await error[0].getText(), screens.exportPR.warningText, 'warning\'s text incorrect')
    })

    it('button \'Cancel\' leads back to main screen', async () => {
      const button = await f.waitUntilShowUp(screens.exportPR.button.cancel)
      assert.equal(await button.getText(), 'Cancel', 'button has incorrect name')
      await f.click(button)
      const field = await f.waitUntilShowUp(screens.exportPR.fieldPassword, 20)
      assert.equal(field, false, 'field \'password\' is displayed after closing')
    })

    it('error message if password incorrect', async () => {
      await f.driver.navigate().refresh()
      const menu = await f.waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.dot.exportPR)
      await item.click()
      const field = await f.waitUntilShowUp(screens.exportPR.fieldPassword)
      await field.sendKeys('abrakadabr')
      const button = await f.waitUntilShowUp(screens.exportPR.button.submit)
      assert.equal(await button.getText(), 'Submit', 'button has incorrect name')
      await f.click(button)
      await f.delay(500)
      const error = await f.driver.findElements(screens.exportPR.error)
      assert.equal(error.length, 2, 'warning isn\'t present')
      assert.equal(await error[1].getText(), screens.exportPR.errorText, 'error\'s text incorrect')
    })

    it('private key is shown if password correct', async () => {
      const field = await f.waitUntilShowUp(screens.exportPR.fieldPassword)
      await f.clearField(field)
      await field.sendKeys(password)
      const button = await f.waitUntilShowUp(screens.exportPR.button.submit)
      await f.click(button)
      const key = await f.waitUntilShowUp(screens.yourPR.key)
      const pr = await key.getText()
      assert.equal(pr.length, 32 * 2, 'private key isn\'t displayed')
    })

    it('icon copy cliboard is displayed and clickable', async () => {
      await f.waitUntilShowUp(screens.yourPR.copy)
      const icons = await f.driver.findElements(screens.yourPR.copy)
      assert.notEqual(icons[1], false, 'icon copy isn\'t displayed')
      await icons[1].click()
    })

    it('Check clipboard buffer', async () => {
      const text = clipboardy.readSync()
      assert.equal(text.length, 64, "private key wasn't copied to clipboard")
    })

    it('file loaded if click button \'Save\' ', async () => {
      const button = await f.waitUntilShowUp(screens.yourPR.button.save)
      assert.equal(await button.getText(), 'Save as File', 'button has incorrect name')
      assert.notEqual(button, false, 'button \'Save\' isn\'t displayed')
    })

    it('button \'Done\' leads back to main screen', async () => {
      const button = await f.waitUntilShowUp(screens.yourPR.button.done)
      await f.click(button)
      const field = await f.waitUntilShowUp(screens.yourPR.key, 20)
      assert.equal(field, false, 'screen \'Your PR\' is displayed after closing')
      await f.driver.navigate().refresh()
    })
}

module.exports = exportPrivateKey
