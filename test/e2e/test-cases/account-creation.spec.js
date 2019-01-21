const assert = require('assert')
const { menus, screens, NETWORKS } = require('../elements')
const clipboardy = require('clipboardy')
const createdAccounts = []

const accountCreation = async (f, password) => {
	const newAccountName = 'new name'

    it('sets provider type to localhost', async () => {
      await f.setProvider(NETWORKS.LOCALHOST)
      await f.delay(2000)
    })

    it('copy icon is displayed and clickable', async () => {
      const field = await f.waitUntilShowUp(screens.main.iconCopy)
      await field.click()
      assert.notEqual(field, false, 'copy icon doesn\'t present')
    })

    it("Account's address is displayed and has length 20 symbols", async () => {
      const field = await f.waitUntilShowUp(screens.main.address)
      createdAccounts.push((await field.getText()).toUpperCase())
      console.log(createdAccounts[0])
      assert.notEqual(createdAccounts[0].length, 20, "address isn't displayed")
    })

    it('Check clipboard buffer', async () => {
      const text = clipboardy.readSync()
      assert.equal(text.length, 42, "address account wasn't copied to clipboard")
    })

    it('open  \'Account name\' change dialog', async () => {
      const menu = await f.waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const field = await f.waitUntilShowUp(screens.main.edit)
      await field.click()
      const accountName = await f.waitUntilShowUp(screens.main.fieldAccountName)
      assert.notEqual(accountName, false, '\'Account name\' change dialog isn\'t opened')
      assert.equal(await accountName.getAttribute('value'), 'Account 1', 'incorrect account name')
    })

    it('fill out new account\'s name', async () => {
      const field = await f.waitUntilShowUp(screens.main.fieldAccountName)
      await field.clear()
      await field.sendKeys(newAccountName)
    })

    it('dialog \'Account name\' is disappeared if click button \'Save\'', async () => {
      const button = await f.waitUntilShowUp(screens.main.buttons.save)
      assert.equal(await button.getText(), 'Save', 'button has incorrect name')
      assert.notEqual(button, true, 'button \'Save\' does not present')
      await f.click(button)
      const accountName = await f.waitUntilShowUp(screens.main.fieldAccountName, 10)
      assert.equal(accountName, false, '\'Account name\' change dialog isn\'t opened')
    })

    it('account has new name', async () => {
      const accountMenu = await f.waitUntilShowUp(menus.account.menu)
      await accountMenu.click()
      const account1 = await f.waitUntilShowUp(menus.account.account1)
      assert.equal(await account1.getText(), newAccountName, 'account\'s name didn\'t changed')
      await accountMenu.click()
    })

    it('adds a second account', async () => {
      const accountMenu = await f.waitUntilShowUp(menus.account.menu)
      await accountMenu.click()
      const item = await f.waitUntilShowUp(menus.account.createAccount)
      await item.click()
    })

    it("Account's address is displayed and has length 20 symbols", async () => {
      const field = await f.waitUntilShowUp(screens.main.address)
      createdAccounts.push((await field.getText()).toUpperCase())
      console.log(createdAccounts[1])
      assert.notEqual(createdAccounts[1].length, 20, "address isn't displayed")
    })

    it('logs out of the vault', async () => {
      const menu = await f.waitUntilShowUp(menus.sandwich.menu)
      await menu.click()
      await f.delay(500)
      const button = await f.waitUntilShowUp(menus.sandwich.logOut)
      assert.equal(await button.getText(), 'Log Out', 'button has incorrect name')
      await button.click()
    })

    it('accepts account password after lock', async () => {
      const box = await f.waitUntilShowUp(screens.lock.fieldPassword)
      await box.sendKeys(password)
      const button = await f.waitUntilShowUp(screens.lock.buttonLogin)
      assert.equal(await button.getText(), 'Log In', 'button has incorrect name')
      await f.click(button)
    })

    it('shows QR code option', async () => {
      const menu = await f.waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.dot.showQRcode)
      await item.click()
    })

    it('checks QR code address is the same as account details address', async () => {
      const field = await f.waitUntilShowUp(screens.QRcode.address)
      const text = await field.getText()
      assert.equal(text.toUpperCase(), createdAccounts[1], 'QR address doesn\'t match')
    })

    it('copy icon is displayed and clickable', async () => {
      const field = await f.waitUntilShowUp(screens.QRcode.iconCopy)
      await field.click()
      assert.notEqual(field, false, 'copy icon doesn\'t present')
    })

    it('Check clipboard buffer', async () => {
      const text = clipboardy.readSync()
      assert.equal(text.length, 42, "address account wasn't copied to clipboard")
    })

    it('close QR code screen by clicking button arrow', async () => {
      const button = await f.waitUntilShowUp(screens.QRcode.buttonArrow)
      await f.click(button)
    })

    it('user is able to open \'Info\' screen', async () => {
      const accountMenu = await f.waitUntilShowUp(menus.sandwich.menu)
      await accountMenu.click()
      const item = await f.waitUntilShowUp(menus.sandwich.info)
      await item.click()
    })

    it('screen \'Info\' has correct title', async () => {
      const title = await f.waitUntilShowUp(screens.info.title)
      assert.equal(await title.getText(), screens.info.titleText, 'title is incorrect')
    })

    it('close \'Info\' screen by clicking button arrow', async () => {
      const button = await f.waitUntilShowUp(screens.info.buttonArrow)
      await button.click()
    })
}

const getCreatedAccounts = () => {
	return createdAccounts
}

module.exports = {
	accountCreation,
	getCreatedAccounts,
}
