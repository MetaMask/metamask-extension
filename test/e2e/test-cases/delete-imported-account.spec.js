const assert = require('assert')
const { menus, screens } = require('../elements')
const { account } = menus
const { deleteImportedAccount: deleteImportedAccountScr, main } = screens

const deleteImportedAccount = async (f) => {
	it('Open delete imported account screen', async function () {
      const menu = await f.waitUntilShowUp(account.menu)
      await menu.click()
      const item = await f.waitUntilShowUp(account.delete)
      await item.click()
      await f.delay(2000)
      const deleteImportedAccountTitle = await f.waitUntilShowUp(deleteImportedAccountScr.title)
      assert.equal(await deleteImportedAccountTitle.getText(), deleteImportedAccountScr.titleText)
    })

    it("Can't remove imported account with 'No' button", async function () {
      const button = await f.waitUntilShowUp(deleteImportedAccountScr.buttons.no2)
      assert.equal(await button.getText(), 'No', 'button has incorrect name')
      await f.click(button)
      await f.driver.findElements(main.container)
      // check, that imported account still exists
      const menu = await f.waitUntilShowUp(account.menu)
      await menu.click()
      await f.delay(2000)
      const label = await f.waitUntilShowUp(account.label)
      assert.equal(await label.getText(), 'IMPORTED')
    })

    it('Open delete imported account screen again', async function () {
      const menu = await f.waitUntilShowUp(account.menu)
      await menu.click()
      await f.delay(2000)
      await menu.click()
      await f.waitUntilShowUp(account.delete)
      const buttons = await f.driver.findElements(account.delete)
      assert.notEqual(buttons[0], false, "icon 'remove' isn't displayed")
      await buttons[0].click()
    })

    it("Remove imported account with 'Yes' button", async function () {
      const button = await f.waitUntilShowUp(deleteImportedAccountScr.buttons.yes)
      assert.equal(await button.getText(), 'Yes', 'button has incorrect name')
      await f.click(button)
      await f.delay(2000)
      await f.driver.findElements(main.container)
      // check, that imported account is removed
      const menu = await f.waitUntilShowUp(account.menu)
      await menu.click()
      await f.delay(3000)
      const label = await f.waitUntilShowUp(account.label, 25)
      assert.equal(label, false, "account isn't deleted")
      await menu.click()
    })
}

module.exports = deleteImportedAccount
