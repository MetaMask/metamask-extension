const assert = require('assert')
const { screens, menus, NETWORKS } = require('../elements')

const changePassword = async (f, password, newPassword) => {
	let fieldNewPassword
    let fieldConfirmNewPassword
    let fieldOldPassword
    let buttonYes

    describe('Check screen "Settings" -> "Change password" ', async () => {

      it('checks if current network name (localhost) is correct', async () => {
        await f.setProvider(NETWORKS.LOCALHOST)
        const menu = await f.waitUntilShowUp(menus.sandwich.menu, 300)
        await menu.click()
        const settings = await f.waitUntilShowUp(menus.sandwich.settings)
        await settings.click()
        const field = await f.waitUntilShowUp(screens.settings.currentNetwork)
        assert.equal(await field.getText(), 'http://localhost:8545', 'current network is incorrect')
      })

      it('error should not be displayed', async () => {
        const error = await f.waitUntilShowUp(screens.settings.error, 10)
        assert.equal(error, false, 'improper error is displayed')
      })

      it('checks if "Change password" button is present and enabled', async () => {
        const menu = await f.waitUntilShowUp(menus.sandwich.menu, 300)
        await menu.click()
        const settings = await f.waitUntilShowUp(menus.sandwich.settings)
        await settings.click()
        await f.waitUntilShowUp(screens.settings.fieldNewRPC)
        const buttons = await f.driver.findElements(screens.settings.buttons.changePassword)
        await f.scrollTo(buttons[0])
        assert.equal(buttons.length, 1, 'Button "Change password" is not present')
        assert.equal(await buttons[0].getText(), 'Change password', 'button has incorrect name')
        assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
        await f.click(buttons[0])
      })

      it('screen has correct title', async () => {
        const title = await f.waitUntilShowUp(screens.changePassword.title)
        assert.equal(await title.getText(), screens.changePassword.titleText, '"Change password" screen contains incorrect title')
      })

      it('screen contains correct label', async () => {
        await f.waitUntilShowUp(screens.changePassword.label)
        const labels = await f.driver.findElements(screens.changePassword.label)
        assert.equal(labels.length, 1, 'screen "Change password" doesn\'t contain label')
        assert.equal(await labels[0].getText(), screens.changePassword.labelText, 'label contains incorrect title')
      })

      it('clicking the button "No" bring back to "Setting" screen ', async () => {
        const button = await f.waitUntilShowUp(screens.changePassword.buttonNo)
        assert.equal(await button.getText(), 'No', 'button has incorrect name')
        await f.click(button)
        const title = await f.waitUntilShowUp(screens.settings.title)
        assert.equal(await title.getText(), screens.settings.titleText, 'button "No" doesnt open settings screen')
        const buttonChangePass = await f.driver.findElement(screens.settings.buttons.changePassword)
        await f.scrollTo(buttonChangePass)
        await f.click(buttonChangePass)
      })
    })

    describe('Validation of errors ', async () => {

      before(async () => {
        fieldOldPassword = await f.waitUntilShowUp(screens.changePassword.fieldOldPassword)
        await fieldOldPassword.sendKeys(password)
        fieldNewPassword = await f.waitUntilShowUp(screens.changePassword.fieldNewPassword)
        fieldConfirmNewPassword = await f.waitUntilShowUp(screens.changePassword.fieldConfirmNewPassword)
        buttonYes = await f.waitUntilShowUp(screens.changePassword.buttonYes)
      })

      it('error if new password shorter than 8 digits', async () => {
        await fieldNewPassword.sendKeys(newPassword.short)
        await fieldConfirmNewPassword.sendKeys(newPassword.short)
        assert.equal(await buttonYes.getText(), 'Yes', 'button has incorrect name')
        await f.click(buttonYes)
        await f.delay(2000)
        const errors = await f.driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.notLong, 'Error\'s text incorrect')
      })

      it('error if new password  doesn\'t match confirmation', async () => {
        await f.clearField(fieldNewPassword)
        await f.clearField(fieldConfirmNewPassword)
        await fieldNewPassword.sendKeys(newPassword.correct)
        await fieldConfirmNewPassword.sendKeys(newPassword.incorrect)
        await f.click(buttonYes)
        await f.delay(2000)
        const errors = await f.driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.dontMatch, 'Error\'s text incorrect')
      })

      it('error if new password match old password', async () => {
        await f.clearField(fieldNewPassword)
        await f.clearField(fieldConfirmNewPassword)
        await fieldNewPassword.sendKeys(password)
        await fieldConfirmNewPassword.sendKeys(password)
        await f.click(buttonYes)
        await f.delay(2000)
        const errors = await f.driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.differ, 'Error\'s text incorrect')
      })

      it('error if old password incorrect', async () => {
        await f.clearField(fieldOldPassword)
        await fieldOldPassword.sendKeys(newPassword.incorrect)
        await f.click(buttonYes)
        await f.click(buttonYes)
        await f.delay(2000)
        const errors = await f.driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.incorrectPassword, 'Error\'s text incorrect')
      })

      it('no errors if old, new, confirm new passwords are correct; user can change password', async () => {
        await f.clearField(fieldNewPassword)
        await f.clearField(fieldOldPassword)
        await f.clearField(fieldConfirmNewPassword)

        await fieldOldPassword.sendKeys(password)
        await fieldNewPassword.sendKeys(newPassword.correct)
        await fieldConfirmNewPassword.sendKeys(newPassword.correct)
        await f.click(buttonYes)
        await f.waitUntilShowUp(screens.settings.buttons.changePassword, 25)
        const buttons = await f.driver.findElements(screens.settings.buttons.changePassword)
        assert.equal(buttons.length, 1, 'Button "Change password" is not present')
        assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
      })
    })

    describe('Check if new password is accepted', async () => {

      it('user can log out', async () => {
        const menu = await f.waitUntilShowUp(menus.sandwich.menu)
        await menu.click()
        const itemLogOut = await f.waitUntilShowUp(menus.sandwich.logOut)
        await itemLogOut.click()
        const field = await f.waitUntilShowUp(screens.lock.fieldPassword)
        assert.notEqual(field, false, 'password box isn\'t present after logout')
      })

      it('can\'t login with old password', async () => {
        const field = await f.waitUntilShowUp(screens.lock.fieldPassword)
        await field.sendKeys(password)
        const button = await f.waitUntilShowUp(screens.lock.buttonLogin)
        await f.click(button)
        const error = await f.waitUntilShowUp(screens.lock.error)
        assert.notEqual(error, false, 'error isn\'t displayed if password incorrect')
        assert.equal(await error.getText(), screens.lock.errorText, 'error\'s text incorrect')
      })

      it('accepts new password after lock', async () => {
        const field = await f.waitUntilShowUp(screens.lock.fieldPassword)
        await f.clearField(field)
        await field.sendKeys(newPassword.correct)
        const button = await f.waitUntilShowUp(screens.lock.buttonLogin)
        await f.click(button)

        await f.waitUntilShowUp(screens.main.buttons.buy)
        const buttons = await f.driver.findElements(screens.main.buttons.buy)
        assert.equal(buttons.length, 1, 'main screen isn\'t displayed')
        assert.equal(await buttons[0].getText(), 'Buy', 'button has incorrect name')
        password = newPassword.correct
      })
    })
}

module.exports = changePassword
