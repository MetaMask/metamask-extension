const assert = require('assert')
const { screens, menus, NETWORKS } = require('../elements')

const customRPC = async (f) => {
	const invalidStringUrl = 'http://lwkdfowi**&#v er'
    const urlWithoutHttp = 'infura.com'
    const invalidEndpoint = 'http://abrakadabrawdjkwjeciwkasuhlvflwe.com'
    const correctRpcUrl = 'https://poa.infura.io/test'

    it('switches to settings screen through menu \'Network -> Custom RPC\'', async function () {
      await f.setProvider(NETWORKS.CUSTOM)
      const settings = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await settings.getText(), screens.settings.titleText, 'inappropriate screen is opened')
    })

    it('error message if new Rpc url is invalid', async function () {
      const field = await f.waitUntilShowUp(screens.settings.fieldNewRPC)
      await field.sendKeys(invalidStringUrl)
      const button = await f.waitUntilShowUp(screens.settings.buttonSave)
      assert.equal(await button.getText(), 'Save', 'button has incorrect name')
      await f.click(button)
      await f.delay(1000)
      assert.equal(await f.waitUntilShowUp(screens.settings.buttons.delete, 5), false, 'invalid Rpc was added')
      const errors = await f.driver.findElements(screens.settings.error)
      assert.equal(errors.length, 1, 'error isn\'t displayed if Rpc url incorrect')
      assert.equal(await errors[0].getText(), screens.settings.errors.invalidRpcUrl, 'error\'s text incorrect')
    })

    it('error message if new Rpc url has no HTTP/HTTPS prefix', async function () {
      const fieldRpc = await f.driver.findElement(screens.settings.fieldNewRPC)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await fieldRpc.sendKeys(urlWithoutHttp)
      const button = await f.waitUntilShowUp(screens.settings.buttonSave)
      await f.click(button)
      await f.delay(1000)
      assert.equal(await f.waitUntilShowUp(screens.settings.buttons.delete, 5), false, 'invalid Rpc was added')
      const errors = await f.driver.findElements(screens.settings.error)
      assert.equal(errors.length, 1, 'error isn\'t displayed if Rpc url incorrect')
      assert.equal(await errors[0].getText(), screens.settings.errors.invalidHTTP, 'error\'s text incorrect')
    })

    it('error message if Rpc doesn\'t exist', async function () {
      const fieldRpc = await f.driver.findElement(screens.settings.fieldNewRPC)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await fieldRpc.sendKeys(invalidEndpoint)
      const button = await f.waitUntilShowUp(screens.settings.buttonSave)
      await f.click(button)
      await f.delay(1000)
      assert.equal(await f.waitUntilShowUp(screens.settings.buttons.delete, 5), false, 'invalid Rpc was added')
      await f.waitUntilShowUp(screens.settings.error)
      const errors = await f.driver.findElements(screens.settings.error)
      assert.equal(errors.length, 1, 'error isn\'t displayed if Rpc url incorrect')
      assert.equal(await errors[0].getText(), screens.settings.errors.invalidRpcEndpoint, 'error\'s text incorrect')
    })

    it('user can add valid custom rpc', async function () {
      const fieldRpc = await f.driver.findElement(screens.settings.fieldNewRPC)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await fieldRpc.sendKeys(correctRpcUrl + 0)
      await f.driver.findElement(screens.settings.buttonSave).click()
      await f.delay(10000)
      const customUrlElement = await f.waitUntilShowUp(screens.settings.currentNetwork)
      assert.equal(await customUrlElement.getText(), correctRpcUrl + 0, 'Added Url doesn\'t match')
    })

    it('new added Rpc displayed in network dropdown menu', async function () {
      let menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.networks.addedCustomRpc)
      assert.equal(await item.getText(), correctRpcUrl + 0, 'Added custom Url isn\'t displayed ')
      menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
    })

    it('user can add four more valid custom rpc', async function () {
      const fieldRpc = await f.waitUntilShowUp(screens.settings.fieldNewRPC)
      const customUrlElement = await f.waitUntilShowUp(screens.settings.currentNetwork)
      for (let i = 1; i < 5; i++) {
        await f.clearField(fieldRpc)
        await f.clearField(fieldRpc)
        await f.clearField(fieldRpc)
        await f.clearField(fieldRpc)
        await fieldRpc.sendKeys(correctRpcUrl + i)
        await f.driver.findElement(screens.settings.buttonSave).click()
        await f.delay(5000)
        assert.equal(await customUrlElement.getText(), correctRpcUrl + i, '#' + i + ': Current RPC field contains incorrect URL')
      }
    })

    it('new added Rpc displayed in network dropdown menu', async function () {
      let menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
      await f.waitUntilShowUp(menus.networks.addedCustomRpc)
      const items = await f.driver.findElements(menus.networks.addedCustomRpc)
      assert.equal(items.length, 5, 'Incorrect number of added RPC')

      menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
    })

    it('click button \'Delete\' opens screen \'Delete Custom RPC\'', async function () {
      await f.delay(1000)
      const button = await f.waitUntilShowUp(screens.settings.buttons.delete, 10)
      assert.equal(await button.getText(), 'Delete', 'button has incorrect name')
      await f.click(button)
      const title = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await title.getText(), screens.deleteCustomRPC.titleText, 'inappropriate screen is opened')
    })

    it('click button \'No\' opens screen \'Settings\'', async function () {
      const button = await f.waitUntilShowUp(screens.deleteCustomRPC.buttons.no)
      assert.equal(await button.getText(), 'No', 'button has incorrect name')
      await f.click(button)
      const title = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await title.getText(), screens.settings.titleText, 'inappropriate screen is opened')
    })

    it('user able to delete custom rpc', async function () {
      const buttonDelete = await f.waitUntilShowUp(screens.settings.buttons.delete, 25)
      await f.click(buttonDelete)
      const yesButton = await f.waitUntilShowUp(screens.deleteCustomRPC.buttons.yes)
      assert.equal(await yesButton.getText(), 'Yes')
      await f.click(yesButton)
      const title = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await title.getText(), screens.settings.titleText, 'inappropriate screen is opened')
    })

    it('deleted custom rpc isn\'t displayed in \'Settings\' screen', async function () {
      const currentNetwork = await f.waitUntilShowUp(screens.settings.currentNetwork)
      assert.equal(await currentNetwork.getText(), 'POA Network', 'custom Rpc is displayed after deletion')
    })

    it('deleted custom rpc isn\'t displayed in network dropdown menu', async function () {
      await f.delay(2000)
      let menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
      await f.waitUntilShowUp(menus.networks.addedCustomRpc, 20)
      const items = await f.driver.findElements(menus.networks.addedCustomRpc)
      assert.equal(items.length, 4, 'deleted custom rpc is displayed in network dropdown menu')
      menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
    })
}

module.exports = customRPC
