const assert = require('assert')
const { screens, menus, elements, NETWORKS } = require('../elements')

const addTokeFromSearch = async (f) => {
	const request = {
      valid: 'cry',
      invalid: 'zzz',
      notExistingAddress: '0xE18035BF8712672935FDB4e5e431b1a0183d2DFC',
    }
    const Qtum = {
      name: 'Qtum (QTUM)',
      address: '0x9a642d6b3368ddc662CA244bAdf32cDA716005BC',
    }

    describe('add Mainnet\'s tokens', function () {

      it(' field \'Search\' is displayed', async () => {
        await f.setProvider(NETWORKS.MAINNET)
        await f.delay(2000)
        const tab = await f.waitUntilShowUp(screens.main.tokens.menu)
        await tab.click()
        const button = await f.waitUntilShowUp(screens.main.tokens.buttonAdd2, 300)
        await f.click(button)
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        assert.notEqual(field, false, 'field \'Search\'  isn\'t displayed')
      })

      it('button \'Next\' is disabled if no tokens found', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), false, 'button is enabled')
        assert.equal(await button.getText(), 'Next', 'button has incorrect name')
      })

      it('button \'Cancel\' is enabled and lead to main screen ', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.cancel)
        assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
        assert.equal(await button.getText(), 'Cancel', 'button has incorrect name')
      })

      it('Search by name: searching result list is empty if request invalid', async () => {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await field.sendKeys(request.invalid)
        const list = await f.waitUntilShowUp(screens.addToken.search.token.unselected, 20)
        assert.equal(list, false, 'unexpected tokens are displayed')
      })

      it('Search by name: searching result list isn\'t empty ', async () => {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await f.clearField(field)
        await field.sendKeys(request.valid)
        await f.waitUntilShowUp(screens.addToken.search.token.unselected)
        const list = await f.driver.findElements(screens.addToken.search.token.unselected)
        assert.notEqual(list, 0, 'tokens aren\'t displayed')
      })

      it('Token\'s info contains name, symbol and picture ', async () => {
        const tokens = await f.driver.findElements(screens.addToken.search.token.unselected)
        const names = await f.driver.findElements(screens.addToken.search.token.name)
        const icons = await f.driver.findElements(screens.addToken.search.token.icon)
        assert.equal(tokens.length, names.length, 'some names are missed')
        assert.equal(tokens.length, icons.length, 'some icons are missed')
      })

      it('button \'Next\' is disabled if no one token is selected', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), false, 'button is enabled')
      })

      it('user can select one token', async () => {
        const token = await f.waitUntilShowUp(screens.addToken.search.token.unselected)
        await token.click()
      })

      it('button \'Next\' is enabled if token is selected', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), true, 'button is disabled')
      })

      it('user can unselected token', async () => {
        const token = await f.waitUntilShowUp(screens.addToken.search.token.selected)
        await token.click()
      })

      it('button \'Next\' is disabled after token was unselected', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), false, 'button is enabled')
      })

      it('user can select two tokens', async () => {
        await f.waitUntilShowUp(screens.addToken.search.token.unselected)
        const tokensUnselected = await f.driver.findElements(screens.addToken.search.token.unselected)
        await tokensUnselected[0].click()
        await tokensUnselected[2].click()
        const tokensSelected = await f.driver.findElements(screens.addToken.search.token.selected)
        assert.equal(tokensSelected.length, 2, 'user can\'t select 2 tokens')
      })

      it('click button \'Next\' opens confirm screen ', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        await f.click(button)
        const buttonAdd = await f.waitUntilShowUp(screens.addToken.search.confirm.button.add)
        assert.notEqual(buttonAdd, false, 'failed to open screen confirmation')
      })

      it('confirm screen: two selected tokens are displayed and have correct parameters', async () => {
        const tokens = await f.driver.findElements(screens.addToken.search.confirm.token.item)
        assert.equal(tokens.length, 2, 'incorrect number of tokens are presented')

        const names = await f.driver.findElements(screens.addToken.search.confirm.token.name)
        const name0 = await names[0].getText()
        const name1 = await names[1].getText()
        assert.equal(name0.length > 10, true, 'empty token name')
        assert.equal(name1.length > 10, true, 'empty token name')
        await f.delay(2000)
        const balances = await f.driver.findElements(screens.addToken.search.confirm.token.balance)
        const balance0 = await balances[1].getText()
        const balance1 = await balances[2].getText()
        assert.equal(balance0, '0', 'balance isn\'t 0')
        assert.equal(balance1, '0', 'balance isn\'t 0')
      })

      it('button \'Back\' is enabled and leads to previous screen ', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.confirm.button.back)
        assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
        await f.click(button)
        const fieldSearch = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        assert.notEqual(fieldSearch, false, 'add token screen didn\'t opened')
      })

      it('button \'Next\' is enabled if confirmation list isn\'t empty', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), true, 'button is disabled')
      })

      it('previous selected tokens remain selected after new search', async () => {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await f.clearField(field)
        await field.sendKeys(request.valid)
        await f.waitUntilShowUp(screens.addToken.search.token.selected)
        const listSelected = await f.driver.findElements(screens.addToken.search.token.selected)
        assert.equal(listSelected.length, 2, 'tokens are unselected')
      })

      it('user can unselect token', async () => {
        const tokensUnselected = await f.driver.findElements(screens.addToken.search.token.unselected)
        assert.notEqual(tokensUnselected.length, 0, 'all tokens are selected')

        let tokensSelected = await f.driver.findElements(screens.addToken.search.token.selected)
        await tokensSelected[0].click()
        const old = tokensSelected.length

        tokensSelected = await f.driver.findElements(screens.addToken.search.token.selected)
        assert.equal(tokensSelected.length, old - 1, 'can\'t unselect token')
      })

      it('confirm screen: unselected token aren\'t displayed', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        await f.click(button)
        await f.waitUntilShowUp(screens.addToken.search.confirm.token.item)
        const tokens = await f.driver.findElements(screens.addToken.search.confirm.token.item)
        assert.equal(tokens.length, 1, 'incorrect number of tokens are presented')
        const back = await f.waitUntilShowUp(screens.addToken.search.confirm.button.back)
        await f.click(back)
      })

      it('Search by contract address: searching result list is empty if address invalid ', async () => {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await field.sendKeys(request.notExistingAddress)
        const list = await f.waitUntilShowUp(screens.addToken.search.token.unselected, 20)
        assert.equal(list, false, 'unexpected tokens are displayed')
      })

      it('Search by valid contract address: searching result list contains one token ', async () => {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await f.clearField(field)
        await f.clearField(field)
        await field.sendKeys(Qtum.address)
        const token = await f.waitUntilShowUp(screens.addToken.search.token.unselected)
        const list = await f.driver.findElements(screens.addToken.search.token.unselected)
        assert.notEqual(list, 0, 'tokens aren\'t displayed')
        await token.click()
      })

      it('Token\'s info contains correct name ', async () => {
        const name = await f.waitUntilShowUp(screens.addToken.search.token.name)
        assert.equal(await name.getText(), Qtum.name, 'incorrect token\'s name')
      })

      it('one more token added to confirmation list', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        await f.click(button)
        await f.waitUntilShowUp(screens.addToken.search.confirm.token.item)
        const list = await f.driver.findElements(screens.addToken.search.confirm.token.item)
        assert.equal(list.length, 2, 'token wasn\'t added')
      })

      it('button \'Add tokens\' is enabled and clickable', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.search.confirm.button.add)
        assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
        await f.click(button)
        const identicon = await f.waitUntilShowUp(screens.main.identicon)
        assert.notEqual(identicon, false, 'main screen didn\'t opened')
      })

      it('all selected tokens are displayed on main screen', async () => {
        await f.waitUntilShowUp(screens.main.tokens.token)
        const tokens = await f.driver.findElements(screens.main.tokens.token)
        assert.equal(tokens.length, 2, 'tokens weren\'t added')
      })

      it('correct value of counter of owned tokens', async () => {
        const counter = await f.waitUntilShowUp(screens.main.tokens.counter)
        assert.equal(await counter.getText(), 'You own 2 tokens', 'incorrect value of counter')
      })
    })

    describe('Token should be displayed only for network, where it was added ', async () => {

      it('token should not be displayed in POA network', async () => {
        await f.setProvider(NETWORKS.POA)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in DAI network', async () => {
        await f.setProvider(NETWORKS.DAI)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in SOKOL testnet', async () => {
        await f.setProvider(NETWORKS.SOKOL)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in LOCALHOST network', async () => {
        await f.setProvider(NETWORKS.LOCALHOST)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in ROPSTEN testnet', async () => {
        await f.setProvider(NETWORKS.ROPSTEN)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in KOVAN testnet', async () => {
        await f.setProvider(NETWORKS.KOVAN)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in RINKEBY testnet', async () => {
        await f.setProvider(NETWORKS.RINKEBY)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in RSK mainnet', async () => {
        await f.setProvider(NETWORKS.RSK)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in RSK testnet', async () => {
        await f.setProvider(NETWORKS.RSK_TESTNET)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })
    })
    describe('remove Mainnet\'s tokens', function () {

      it('remove tokens', async () => {

        let menu
        let button
        let counter
        let buttonYes

        await f.setProvider(NETWORKS.MAINNET)
        await f.waitUntilShowUp(elements.loader, 25)
        await f.waitUntilDisappear(elements.loader, 50)
        menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        button = await f.waitUntilShowUp(menus.token.remove)
        await button.click()
        buttonYes = await f.waitUntilShowUp(screens.removeToken.buttons.yes)
        await buttonYes.click()
        counter = await f.waitUntilShowUp(screens.main.tokens.counter)
        assert.equal(await counter.getText(), 'You own 1 token', 'incorrect value of counter')
        const tokensNumber = await f.driver.findElements(screens.main.tokens.token)
        assert.equal(tokensNumber.length, 1, 'incorrect amount of token\'s  is displayed')

        menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        button = await f.waitUntilShowUp(menus.token.remove)
        await button.click()
        buttonYes = await f.waitUntilShowUp(screens.removeToken.buttons.yes)
        await buttonYes.click()
        counter = await f.waitUntilShowUp(screens.main.tokens.counter)
        assert.equal(await counter.getText(), 'No tokens found', 'incorrect value of counter')

        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })
    })
}

module.exports = addTokeFromSearch
