const assert = require('assert')
const clipboardy = require('clipboardy')
const { menus, screens, elements, NETWORKS } = require('../elements')
let abiClipboard

const importContractAccount = async (f, account1, getCreatedAccounts) => {
  describe('Proxy contract', async () => {
    const proxyContract = '0x0518ac3db78eb326f42dbcfb4b2978e8059989a5'
    const proxyABI = [{'constant': true, 'inputs': [], 'name': 'proxyOwner', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'version', 'outputs': [{'name': '', 'type': 'string'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'version', 'type': 'string'}, {'name': 'implementation', 'type': 'address'}], 'name': 'upgradeTo', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'implementation', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'upgradeabilityOwner', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'version', 'type': 'string'}, {'name': 'implementation', 'type': 'address'}, {'name': 'data', 'type': 'bytes'}], 'name': 'upgradeToAndCall', 'outputs': [], 'payable': true, 'stateMutability': 'payable', 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'newOwner', 'type': 'address'}], 'name': 'transferProxyOwnership', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'inputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'constructor'}, {'payable': true, 'stateMutability': 'payable', 'type': 'fallback'}, {'anonymous': false, 'inputs': [{'indexed': false, 'name': 'previousOwner', 'type': 'address'}, {'indexed': false, 'name': 'newOwner', 'type': 'address'}], 'name': 'ProxyOwnershipTransferred', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': false, 'name': 'version', 'type': 'string'}, {'indexed': true, 'name': 'implementation', 'type': 'address'}], 'name': 'Upgraded', 'type': 'event'}] // eslint-disable-line no-unused-vars
    const joinedABI = [{'constant': true, 'inputs': [], 'name': 'proxyOwner', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'version', 'outputs': [{'name': '', 'type': 'string'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'version', 'type': 'string'}, {'name': 'implementation', 'type': 'address'}], 'name': 'upgradeTo', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'implementation', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'upgradeabilityOwner', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'version', 'type': 'string'}, {'name': 'implementation', 'type': 'address'}, {'name': 'data', 'type': 'bytes'}], 'name': 'upgradeToAndCall', 'outputs': [], 'payable': true, 'stateMutability': 'payable', 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'newOwner', 'type': 'address'}], 'name': 'transferProxyOwnership', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'inputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'constructor'}, {'payable': true, 'stateMutability': 'payable', 'type': 'fallback'}, {'anonymous': false, 'inputs': [{'indexed': false, 'name': 'previousOwner', 'type': 'address'}, {'indexed': false, 'name': 'newOwner', 'type': 'address'}], 'name': 'ProxyOwnershipTransferred', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': false, 'name': 'version', 'type': 'string'}, {'indexed': true, 'name': 'implementation', 'type': 'address'}], 'name': 'Upgraded', 'type': 'event'}, {'constant': true, 'inputs': [], 'name': 'desc', 'outputs': [{'name': '', 'type': 'string'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'methodFromImplementation', 'outputs': [{'name': 'yep', 'type': 'bool'}], 'payable': false, 'stateMutability': 'pure', 'type': 'function'}]

    describe('imports ABI of proxy and implementation together', async () => {
      it('opens import account menu', async () => {
        await f.setProvider(NETWORKS.SOKOL)
        const menu = await f.waitUntilShowUp(menus.account.menu)
        await menu.click()
        const item = await f.waitUntilShowUp(menus.account.import2)
        await item.click()
        const importAccountTitle = await f.waitUntilShowUp(screens.importAccounts.title)
        assert.equal(await importAccountTitle.getText(), screens.importAccounts.textTitle)
      })

      it("Select type 'Proxy'", async () => {
        await f.delay(1000)
        const field = await f.waitUntilShowUp(screens.importAccounts.selectArrow)
        await field.click()
        const item = await f.waitUntilShowUp(screens.importAccounts.itemProxyContract)
        await item.click()
      })

      it("Fill 'Address' with valid proxy contract , SOKOL", async () => {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractAddress)
        await f.clearField(field, 100)
        await field.sendKeys(proxyContract)
      })

      it('ABI of Proxy + Implementation is fetched and matches the pattern', async () => {
        await f.delay(5000)
        const field = await f.waitUntilShowUp(screens.importAccounts.contractABI)
        abiClipboard = await field.getText()
        console.log(abiClipboard)
        assert.deepEqual(JSON.parse(abiClipboard), joinedABI, "ABI isn't fetched")
      })

      it("Click button 'Import', main screen opens", async () => {
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        await f.click(button)
        const ident = await f.waitUntilShowUp(screens.main.identicon, 20)
        assert.notEqual(ident, false, "main screen isn't opened")
      })
    })

    describe("Check 3dots menu for 'Proxy' account", () => {

      it('open 3dots menu', async () => {
        const menu = await f.waitUntilShowUp(menus.dot.menu)
        await menu.click()
        await f.waitUntilShowUp(menus.dot.item)
        const items = await f.driver.findElements(menus.dot.item)
        assert.equal(items.length, 5, '3dot menu has incorrect number of items')
      })

      it('Check text of items', async () => {
        const items = await f.driver.findElements(menus.dot.item)
        assert.equal(await items[0].getText(), 'View on block explorer', '1st item has incorrect text')
        assert.equal(await items[1].getText(), 'Show QR Code', '2nd item has incorrect text')
        assert.equal(await items[2].getText(), 'Copy address to clipboard', '3d item has incorrect text')
        assert.equal(await items[3].getText(), 'Copy ABI to clipboard', '4th item has incorrect text')
        assert.equal(await items[4].getText(), 'Update implementation ABI', '5th item has incorrect text')
      })

      it("Click 'Update implementation ABI'", async () => {
        const items = await f.driver.findElements(menus.dot.item)
        await items[4].click()
        const menu = await f.waitUntilShowUp(menus.dot.item, 20)
        assert.equal(menu, false, "3dot menu wasn't closed")
      })
    })

    describe("Remove imported 'Proxy' account", async () => {
      it("Label 'PROXY' present", async () => {
        const menu = await f.waitUntilShowUp(menus.account.menu)
        await menu.click()
        await f.delay(2000)
        await f.waitUntilShowUp(menus.account.label)
        const labels = await f.driver.findElements(menus.account.label)
        const label = labels[1]
        assert.equal(await label.getText(), 'PROXY', 'label incorrect')
      })
      it('Delete imported account', async () => {
        await f.waitUntilShowUp(menus.account.delete)
        const items = await f.driver.findElements(menus.account.delete)
        await items[1].click()
        const button = await f.waitUntilShowUp(screens.deleteImportedAccount.buttons.yes)
        await button.click()
        const buttonArrow = await f.waitUntilShowUp(screens.settings.buttons.arrow)
        await buttonArrow.click()
        const identicon = await f.waitUntilShowUp(screens.main.identicon)
        assert.notEqual(identicon, false, 'main screen didn\'t opened')
      })
    })
  })

  describe('Simple contract', async () => {
    const contractSokol = '0x215b2ab35749e5a9f3efe890de602fb9844e842f'
    console.log('Contract ' + contractSokol + ' , Sokol')
    const wrongAddress = '0xB87b6077D59B01Ab9fa8cd5A1A21D02a4d60D35'
    const notContractAddress = '0x56B2e3C3cFf7f3921Dc2e0F8B8e20d1eEc29216b'
    describe('Import Contract', async () => {

      it('opens import account menu', async () => {
        await f.setProvider(NETWORKS.ROPSTEN)
        const menu = await f.waitUntilShowUp(menus.account.menu)
        await menu.click()
        const item = await f.waitUntilShowUp(menus.account.import2)
        await item.click()
        const importAccountTitle = await f.waitUntilShowUp(screens.importAccounts.title)
        assert.equal(await importAccountTitle.getText(), screens.importAccounts.textTitle)
      })

      it("Warning's  text is correct", async () => {
        const field = await f.waitUntilShowUp(screens.importAccounts.warning)
        assert.equal(await field.getText(), 'Imported accounts will not be associated with your originally created Nifty Wallet account seedphrase.', "incorrect warning's text")
      })

      it("Select type 'Contract'", async () => {
        await f.delay(1000)
        const field = await f.waitUntilShowUp(screens.importAccounts.selectArrow)
        await field.click()
        await f.delay(2000)
        const item = await f.waitUntilShowUp(screens.importAccounts.itemContract)
        await item.click()
      })

      it("Field 'Address' is displayed", async () => {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractAddress)
        assert.notEqual(field, false, "field 'Address' isn't displayed")
        await field.sendKeys(wrongAddress)
      })

      it("Button 'Import' is displayed", async () => {
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.notEqual(button, false, "button 'Import' isn't displayed")
        assert.equal(await button.getText(), 'Import', 'wrong name of button')
      })

      it("Button 'Import' is disabled  if incorrect address", async () => {
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.equal(await button.isEnabled(), false, 'button enabled')
      })

      it("Field 'ABI' is displayed", async () => {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractABI)
        assert.notEqual(field, false, "field 'ABI' isn't displayed")
      })

      it("Field 'ABI' is empty if contract isn't verified in current network", async () => {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractABI)
        assert.equal(await field.getText(), '', "field 'ABI' isn't displayed")
      })

      it("Fill 'Address' with not contract address , SOKOL", async () => {
        await f.setProvider(NETWORKS.SOKOL)
        const field = await f.waitUntilShowUp(screens.importAccounts.contractAddress)
        await f.clearField(field, 100)
        await field.sendKeys(notContractAddress)
      })

      it("Button 'Import' is disabled  if not contract address", async () => {
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.equal(await button.isEnabled(), false, 'button enabled')
      })

      it("Fill 'Address' with valid contract , SOKOL", async () => {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractAddress)
        await f.clearField(field, 100)
        await field.sendKeys(contractSokol)
      })

      it("Button 'Import' is enabled if contract address is correct", async () => {
        await f.delay(5000)
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.equal(await button.isEnabled(), true, 'button enabled')
      })

      it('ABI is fetched ', async () => {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractABI)
        abiClipboard = await field.getText()
        assert.equal(abiClipboard.length, 4457, "ABI isn't fetched")
      })

      it('icon copy is displayed for ABI ', async () => {
        const field = await f.waitUntilShowUp(screens.importAccounts.iconCopy)
        assert.notEqual(field, false, "icon copy isn't displayed")
        await field.click()
      })

      it('Check clipboard buffer', async () => {
        const text = clipboardy.readSync()
        assert.equal(text, abiClipboard, "address account wasn't copied to clipboard")
      })

      it("Click button 'Import', main screen opens", async () => {
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        await f.click(button)
        const ident = await f.waitUntilShowUp(screens.main.identicon, 20)
        assert.notEqual(ident, false, "main screen isn't opened")
      })
    })

    describe("Check 3dots menu for 'Contract' account", () => {

      it('open 3dots menu', async () => {
        const menu = await f.waitUntilShowUp(menus.dot.menu)
        await menu.click()
        await f.waitUntilShowUp(menus.dot.item)
        const items = await f.driver.findElements(menus.dot.item)
        assert.equal(items.length, 4, '3dot menu has incorrect number of items')
      })

      it('Check text of items', async () => {
        const items = await f.driver.findElements(menus.dot.item)
        assert.equal(await items[0].getText(), 'View on block explorer', '1st item has incorrect text')
        assert.equal(await items[1].getText(), 'Show QR Code', '2nd item has incorrect text')
        assert.equal(await items[2].getText(), 'Copy address to clipboard', '3d item has incorrect text')
        assert.equal(await items[3].getText(), 'Copy ABI to clipboard', '4th item has incorrect text')
      })

      it("Click 'Copy ABI'", async () => {
        const items = await f.driver.findElements(menus.dot.item)
        await items[3].click()
        const menu = await f.waitUntilShowUp(menus.dot.item, 20)
        assert.equal(menu, false, "3dot menu wasn't closed")
      })

      it('Check clipboard buffer', async () => {
        const text = clipboardy.readSync()
        assert.equal(text, abiClipboard, "ABI wasn't copied to clipboard")
      })
    })

    describe('Execute Method screen', () => {
      const notContractAddress = '0x56B2e3C3cFf7f3921Dc2e0F8B8e20d1eEc29216b'
      describe("Check UI and button's functionality", () => {

        it("Click button 'Execute method'", async () => {
          await f.driver.navigate().refresh()
          await f.delay(2000)
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
          assert.notEqual(button, false, "button doesn't displayed")
          assert.equal(await button.getText(), 'Execute methods', 'button has incorrect name')
          await button.click()
        })

        it('title is displayed and correct', async () => {
          const title = await f.waitUntilShowUp(screens.executeMethod.title)
          assert.notEqual(title, false, 'title isn\'t displayed')
          assert.equal(await title.getText(), screens.executeMethod.titleText, 'incorrect text')
        })

        it('Click arrow  button leads to main screen', async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonArrow)
          await f.click(button)
          const identicon = await f.waitUntilShowUp(screens.main.identicon, 40)
          assert.notEqual(identicon, false, "main screen isn't opened")
        })
      })

      describe('Check output for data type : ADDRESS', () => {

        const address = '0x56B2e3C3cFf7f3921Dc2e0F8B8e20d1eEc29216b'

        it("Click button 'Execute method'", async () => {
          await f.driver.navigate().refresh()
          await f.delay(2000)
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
          assert.notEqual(button, false, "button doesn't displayed")
          assert.equal(await button.getText(), 'Execute methods', 'button has incorrect name')
          await button.click()
        })

        it("Select method 'returnAddress'", async () => {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await f.driver.findElements(screens.executeMethod.items)
          await list[3].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it("Button 'Call data' is displayed and disabled", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), false, "Button 'Call data' is enabled")
        })

        it("Fill out input field 'Address'", async () => {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await f.driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(address)
        })

        it("Button 'Call data' is displayed and enabled", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async () => {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await f.driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text.toLowerCase(), address.toLowerCase(), 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async () => {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async () => {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), address.toLowerCase(), "output wasn't copied to clipboard")
        })

        it("2nd call doesn't throw the error", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          await button.click()
          const field = await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          assert.notEqual(field, false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(field)
          assert.equal(text.toLowerCase(), address.toLowerCase(), 'incorrect value was returned')
        })
      })

      describe('Check output for data type : STRING', () => {
        const stringValue = 'POA network'

        it("Select method 'returnString'", async () => {
          await f.delay(3000)
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await f.driver.findElements(screens.executeMethod.items)
          await list[14].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async () => {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await f.driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(stringValue)
        })

        it("Click button 'Call data' ", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async () => {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await f.driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text, stringValue, 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async () => {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async () => {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), stringValue.toLowerCase(), "output wasn't copied to clipboard")
        })
      })

      describe('Check output for data type : BOOLEAN', () => {

        it("Select method 'returnBoolean'", async () => {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await f.driver.findElements(screens.executeMethod.items)
          await list[5].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Select value TRUE from dropdown menu', async () => {
          const arrows = await f.driver.findElements(screens.executeMethod.selectArrow)
          await arrows[1].click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await f.driver.findElements(screens.executeMethod.items)
          assert.equal(await list[1].getText(), 'true', 'TRUE menu item: incorrect text')
          assert.equal(list.length, 2, "drop down menu isn't displayed")
          await list[1].click()
        })

        it("Click button 'Call data' ", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value: TRUE', async () => {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await f.driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[0], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[0])
          assert.equal(text, 'true', 'incorrect value was returned')
        })

        it('Select value FALSE from dropdown menu', async () => {
          const arrows = await f.driver.findElements(screens.executeMethod.selectArrow)
          await arrows[1].click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await f.driver.findElements(screens.executeMethod.items)
          assert.equal(await list[0].getText(), 'false', 'FALSE menu item: incorrect text')
          assert.equal(list.length, 2, "drop down menu isn't displayed")
          await list[0].click()
        })

        it("Click button 'Call data' ", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value, FALSE', async () => {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await f.driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[0], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[0])
          assert.equal(text, 'false', 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async () => {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async () => {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), 'false', "output wasn't copied to clipboard")
        })

      })

      describe('Check output for data type : BYTES', () => {

        const bytesValue = '0x010203'

        it("Select method 'returnBytes1'", async () => {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await f.driver.findElements(screens.executeMethod.items)
          await list[7].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async () => {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await f.driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(bytesValue)
        })

        it("Click button 'Call data' ", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async () => {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await f.driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text, bytesValue, 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async () => {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async () => {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), bytesValue.toLowerCase(), "output wasn't copied to clipboard")
        })
      })

      describe('Check output for data type : UINT256', () => {

        const uint256Value = '1122334455667788991122334455667788'

        it("Select method 'returnUint256'", async () => {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await f.driver.findElements(screens.executeMethod.items)
          await list[17].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async () => {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await f.driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(uint256Value)
        })

        it("Click button 'Call data' ", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async () => {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await f.driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text, uint256Value, 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async () => {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async () => {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), uint256Value.toLowerCase(), "output wasn't copied to clipboard")
        })
      })

      describe('Check output for data type : INT256', () => {

        const int256Value = '-1122334455667788991122334455667788'

        it("Select method 'returnInt256'", async () => {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await f.driver.findElements(screens.executeMethod.items)
          await list[10].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async () => {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await f.driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(int256Value)
        })

        it("Click button 'Call data' ", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async () => {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await f.driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text, int256Value, 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async () => {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async () => {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), int256Value.toLowerCase(), "output wasn't copied to clipboard")
        })
      })

      describe('Check executed method', () => {

        it("Select method 'transfer'", async () => {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await f.driver.findElements(screens.executeMethod.items)
          await list[21].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it("Button 'Copy ABI encoded' is displayed", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.notEqual(button, false, "button 'Copy ABI encoded' isn't displayed")
        })

        it("Button 'Copy ABI encoded' is disabled", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.equal(await button.isEnabled(), false, "button 'Copy ABI encoded' enabled")
        })

        it("Button 'Next' is disabled", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.equal(await button.isEnabled(), false, "button 'Next' enabled")
        })

        it("Fill out parameter '_value' with valid data", async () => {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await f.driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[1], false, "field address isn't displayed")
          await fields[1].sendKeys('1')
        })

        it("Button 'Copy ABI encoded' is disabled", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.equal(await button.isEnabled(), false, "button 'Copy ABI encoded' enabled")
        })

        it("Button 'Next' is disabled", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.equal(await button.isEnabled(), false, "button 'Next' enabled")
        })
        it("Fill out parameter '_to'  with wrong data", async () => {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await f.driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field address isn't displayed")
          await fields[0].sendKeys(wrongAddress)
        })

        it("Error message if click 'Copy ABI encoded' with wrong address", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          await button.click()
          const error = await f.waitUntilShowUp(elements.error)
          assert.notEqual(error, false, 'no error message')
        })

        it('Close error message', async () => {
          const button = await f.waitUntilShowUp(elements.errorClose)
          await button.click()
          const title = await f.waitUntilShowUp(screens.executeMethod.title)
          assert.notEqual(title, false, "error message isn't closed")
        })

        it.skip("Error message if click 'Next' with wrong address", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          await button.click()
          const error = await f.waitUntilShowUp(elements.error)
          assert.notEqual(error, false, 'no error message')
        })

        it.skip('Close error message', async () => {
          const button = await f.waitUntilShowUp(elements.errorClose)
          await button.click()
          const title = await f.waitUntilShowUp(screens.executeMethod.title)
          assert.notEqual(title, false, "error message isn't closed")
        })

        it("Fill out parameter '_to' with valid data", async () => {
          const field = await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          await f.clearField(field, 100)
          await field.sendKeys(notContractAddress)
          assert.notEqual(field, false, "field address isn't displayed")
        })

        it("Button 'Next' is enabled", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.equal(await button.isEnabled(), true, "button 'Next' disabled")
        })

        it("Button 'Copy ABI encoded' is enabled", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.equal(await button.isEnabled(), true, "button 'Copy ABI encoded' disabled")
          await button.click()
        })

        it("Click button 'Next'", async () => {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.notEqual(button, false, "button 'Next' isn't displayed")
          await button.click()
        })
      })
    })

    describe('Choose Contract Executor', () => {

      it('Title is displayed and correct', async () => {
        await f.delay(5000)
        const title = await f.waitUntilShowUp(screens.chooseContractExecutor.title)
        assert.notEqual(title, false, 'title isn\'t displayed')
        assert.equal(await title.getText(), screens.chooseContractExecutor.titleText, 'incorrect text')
      })

      it('Two accounts displayed', async () => {
        const accs = await f.waitUntilShowUp(screens.chooseContractExecutor.account)
        assert.notEqual(accs, false, 'accounts aren\'t displayed')
        const accounts = await f.driver.findElements(screens.chooseContractExecutor.account)
        assert.equal(accounts.length, 4, "number of accounts isn't 2")
      })

      it("Click arrow button leads to 'Execute Method' screen ", async () => {
        const button = await f.waitUntilShowUp(screens.chooseContractExecutor.buttonArrow)
        assert.notEqual(button, false, 'button isn\'t displayed')
        await button.click()
        await f.delay(2000)

        const title = await f.waitUntilShowUp(screens.executeMethod.title)
        assert.notEqual(title, false, 'title isn\'t displayed')
        assert.equal(await title.getText(), screens.executeMethod.titleText, "'Execute Method' screen isn't opened")
      })

      it("Return back to 'Choose Contract Executor' screen", async () => {
        const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
        assert.notEqual(button, false, "button 'Next' isn't displayed")
        await button.click()
      })

      it("Button 'Next' is disabled by default", async () => {
        const button = await f.waitUntilShowUp(screens.chooseContractExecutor.buttonNext)
        assert.notEqual(button, false, 'button isn\'t displayed')
        assert.equal(await button.isEnabled(), false, 'button enabled by default')
      })

      it('User is able to select account', async () => {
        await f.waitUntilShowUp(screens.chooseContractExecutor.account)
        const accounts = await f.driver.findElements(screens.chooseContractExecutor.account)
        const account = accounts[1]
        await account.click()
        const selected = await f.driver.findElements(screens.chooseContractExecutor.selectedAccount)
        assert.equal(selected.length, 1, "account isn't selected")
      })

      it('User is able to select only one account', async () => {
        const account = (await f.driver.findElements(screens.chooseContractExecutor.account))[2]
        await account.click()
        const selected = await f.driver.findElements(screens.chooseContractExecutor.selectedAccount)
        assert.equal(selected.length, 1, 'more than one accounts are selected')
      })

      it("Click button 'Next' open 'Confirm transaction' screen", async () => {
        const button = await f.waitUntilShowUp(screens.chooseContractExecutor.buttonNext)
        await button.click()
        await f.delay(3000)
        const reject = await f.waitUntilShowUp(screens.confirmTransaction.button.reject)
        assert.notEqual(reject, false, "button reject isn't displayed")
      })

      it("Button 'Buy Ether' is displayed", async () => {
        const button = await f.waitUntilShowUp(screens.confirmTransaction.button.buyEther)
        assert.equal(await button.getText(), 'Buy Ether', 'button has incorrect name')
        assert.equal(await button.isEnabled(), true, 'button is disabled')
      })

      it("Open screen 'Buy Ether'", async () => {
        const button = await f.waitUntilShowUp(screens.confirmTransaction.button.buyEther)
        await button.click()
        const title = await f.waitUntilShowUp(screens.buyEther.title)
        assert.equal(await title.getText(), 'Buy POA', "screen 'Buy Ether' has incorrect title text")
        const arrow = await f.waitUntilShowUp(elements.buttonArrow)
        await arrow.click()
      })

      it("Click button 'Reject' open contract's account screen", async () => {
        const reject = await f.waitUntilShowUp(screens.confirmTransaction.button.reject)
        assert.equal(await reject.getText(), 'Reject', 'button has incorrect name')
        await reject.click()
        const buttonExecute = await f.waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
        assert.notEqual(buttonExecute, false, "contract's account hasn't opened")
      })

      it("Button arrow leads to executor's account screen", async () => {
        assert.equal(await f.executeTransferMethod(0, account1), true, "can't execute the method 'transfer'")
        await f.delay(2000)
        const arrow = await f.waitUntilShowUp(elements.buttonArrow)
        await arrow.click()
        await f.delay(2000)
        const address = await f.waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(), getCreatedAccounts()[0], "executors account isn't opened")
      })

      it('Switch to contract account ', async () => {
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account4)
        await item.click()
        await f.delay(2000)
        const address = await f.waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(), contractSokol.toUpperCase(), "contract's account isn't opened")
      })

      it("Confirm transaction: button 'Reject All' leads to contract's account screen", async () => {
        assert.equal(await f.executeTransferMethod(0, account1), true, "can't execute the method 'transfer'")
        const rejectAll = await f.waitUntilShowUp(screens.confirmTransaction.button.rejectAll)
        assert.equal(await rejectAll.getText(), 'Reject All', 'button has incorrect name')
        await rejectAll.click()
        await f.delay(2000)
        const address = await f.waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(), contractSokol.toUpperCase(), "contract account isn't opened")
      })

      it("Confirm transaction: button 'Submit' leads to contract's account screen", async () => {
        assert.equal(await f.executeTransferMethod(2, account1), true, "can't execute the method 'transfer'")
        await f.delay(2000)
        const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
        assert.equal(await button.getAttribute('value'), 'Submit', 'button has incorrect name')
        await button.click()
        await f.delay(2000)
        const address = await f.waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(), contractSokol.toUpperCase(), "contract account isn't opened")
      })

      it("Label 'CONTRACT' present", async () => {
        const menu = await f.waitUntilShowUp(menus.account.menu)
        await menu.click()
        await f.waitUntilShowUp(menus.account.label)
        const label = (await f.driver.findElements(menus.account.label))[1]
        assert.equal(await label.getText(), 'CONTRACT', 'label incorrect')
      })
      it('Delete imported account', async () => {
        await f.waitUntilShowUp(menus.account.delete)
        const items = await f.driver.findElements(menus.account.delete)
        await items[1].click()
        const button = await f.waitUntilShowUp(screens.deleteImportedAccount.buttons.yes)
        await button.click()
        const buttonArrow = await f.waitUntilShowUp(screens.settings.buttons.arrow)
        await buttonArrow.click()
        const identicon = await f.waitUntilShowUp(screens.main.identicon)
        assert.notEqual(identicon, false, 'main screen didn\'t opened')
      })
    })
  })
}

module.exports = importContractAccount
