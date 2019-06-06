const assert = require('assert')
const { screens, menus, NETWORKS } = require('../elements')
const token = { supply: 101, name: 'Test', decimals: 0, ticker: 'ABC' }
let tokenAddress

const addCustomToken = async (f, account1, account2) => {
	describe('Add token to LOCALHOST', function () {

      it('Create custom token in LOCALHOST', async () => {
        await f.setProvider(NETWORKS.LOCALHOST)
        tokenAddress = await f.createToken(account1, token, true)
        console.log('Token contract address: ' + tokenAddress)
        assert.equal(tokenAddress.length, 42, 'failed to create token')
      })

      it('navigates to the add token screen', async () => {
        await f.waitUntilShowUp(screens.main.identicon)
        const tab = await f.waitUntilShowUp(screens.main.tokens.menu)
        await tab.click()
        const addTokenButton = await f.waitUntilShowUp(screens.main.tokens.buttonAdd2)
        assert.equal(await addTokenButton.getText(), screens.main.tokens.buttonAddText)
        await f.click(addTokenButton)
        await f.delay(2000)
      })

      it('checks add token screen has correct title', async () => {
        const addTokenScreen = await f.waitUntilShowUp(screens.addToken.title)
        assert.equal(await addTokenScreen.getText(), screens.addToken.titleText)
      })

      it('adds token parameters', async () => {
        const tab = await f.waitUntilShowUp(screens.addToken.tab.custom, 30)
        if (!await f.waitUntilShowUp(screens.addToken.custom.fields.contractAddress)) await tab.click()
      })

      it('address input is displayed and has correct placeholder', async () => {
        const field = await f.waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
        assert.equal(await field.getAttribute('placeholder'), 'Token Contract Address', 'incorrect placeholder')
      })

      it('fill out address input', async () => {
        const tokenContractAddress = await f.waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
        await tokenContractAddress.sendKeys(tokenAddress)
        await f.delay(2000)
      })

      it('field \'Symbol\' enabled and has correct value', async () => {
        const field = await f.waitUntilShowUp(screens.addToken.custom.fields.tokenSymbol)
        assert.equal(await field.isEnabled(), true, 'field disabled')
        assert.equal(await field.getAttribute('placeholder'), 'Like "ETH"', 'incorrect placeholder')
        assert.equal(await field.getAttribute('value'), token.ticker, 'incorrect value')
      })

      it('field \'Decimals\' enabled and has correct value', async () => {
        const field = await f.waitUntilShowUp(screens.addToken.custom.fields.decimals)
        assert.equal(await field.isEnabled(), false, 'field disabled')
        assert.equal(await field.getAttribute('value'), token.decimals, 'incorrect value')
      })

      it('checks the token balance', async () => {
        const button = await f.waitUntilShowUp(screens.addToken.custom.buttons.add)
        await f.click(button)
        await f.delay(2000)
        const tokenBalance = await f.waitUntilShowUp(screens.main.tokens.balance)
        assert.equal(await tokenBalance.getText(), token.supply + ' ' + token.ticker, 'balance is incorrect or not displayed')
      })

      it('click to token opens the Blockscout', async () => {
        const link = await f.waitUntilShowUp(screens.main.tokens.token)
        await link.click()
        await f.delay(2000)
        const allHandles = await f.driver.getAllWindowHandles()
        console.log('allHandles.length ' + allHandles.length)
        assert.equal(allHandles.length, 2, 'blockscout wasn\'t opened')
        await f.switchToLastPage()
        await f.delay(2000)
        const title = await f.waitUntilCurrentUrl()
        console.log(title)
        assert.equal(title.includes('https://blockscout.com/poa/sokol/tokens/'), true, 'blockscout wasn\'t opened')
        await f.switchToFirstPage()
      })
    })

    describe('Token menu', function () {

      it('token menu is displayed and clickable ', async () => {
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
      })

      it('link \'View on Blockscout...\' leads to correct page ', async () => {
        const menu = await f.waitUntilShowUp(menus.token.view)
        assert.notEqual(menu, false, 'item isn\'t displayed')
        assert.equal(await menu.getText(), menus.token.viewText, 'incorrect name')
        await menu.click()
        await f.delay(2000)
        const allHandles = await f.driver.getAllWindowHandles()
        console.log('allHandles.length ' + allHandles.length)
        assert.equal(allHandles.length, 3, 'blockscout wasn\'t opened')
        await f.switchToLastPage()
        const title = await f.waitUntilCurrentUrl()

        console.log(title)
        assert.equal(title.includes('https://blockscout.com/poa/sokol/tokens/'), true, 'blockscout wasn\'t opened')
        await f.switchToFirstPage()
      })

      it('item \'Copy\' is displayed and clickable ', async () => {
        let menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const item = await f.waitUntilShowUp(menus.token.copy)
        assert.notEqual(item, false, 'item isn\'t displayed')
        assert.equal(await item.getText(), menus.token.copyText, 'incorrect name')
        await item.click()
        menu = await f.waitUntilShowUp(menus.token.menu, 10)
        assert.notEqual(menu, false, 'menu wasn\'t closed')
      })

      it('item \'Remove\' is displayed', async () => {
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const item = await f.waitUntilShowUp(menus.token.remove)
        assert.notEqual(item, false, 'item isn\'t displayed')
        assert.equal(await item.getText(), menus.token.removeText, 'incorrect name')
      })

      it('item \'Send \' is displayed', async () => {
        const item = await f.waitUntilShowUp(menus.token.send)
        assert.notEqual(item, false, 'item isn\'t displayed')
        assert.equal(await item.getText(), menus.token.sendText, 'incorrect name')
        await f.waitUntilShowUp(menus.token.menu)
      })
    })

    describe('Check support of token per network basis ', async () => {
      const inexistentToken = '0xB8c77482e45F1F44dE1745F52C74426C631bDD51'
      describe('Token should be displayed only for network, where it was added ', async () => {

        it('token should not be displayed in POA network', async () => {
          await f.setProvider(NETWORKS.POA)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not be displayed in SOKOL testnet', async () => {
          await f.setProvider(NETWORKS.SOKOL)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not be displayed in MAINNET', async () => {
          await f.setProvider(NETWORKS.MAINNET)
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
      })

      describe.skip('Custom tokens validation ', async () => {

        it('can not add inexistent token to POA network', async () => {
          await f.setProvider(NETWORKS.POA)
          console.log(tokenAddress)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in POA network')
        })

        it('can not add inexistent token to SOKOL testnet', async () => {
          await f.setProvider(NETWORKS.SOKOL)
          assert(await f.isDisabledAddInexistentToken(inexistentToken), true, 'can add inexistent token in SOKOL testnet')
        })

        it('can not add inexistent token to ROPSTEN testnet', async () => {
          await f.setProvider(NETWORKS.ROPSTEN)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in ROPSTEN testnet')
        })

        it('can not add inexistent token to KOVAN testnet', async () => {
          await f.setProvider(NETWORKS.KOVAN)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in KOVAN testnet')
        })

        it('can not add inexistent token to RINKEBY testnet', async () => {
          await f.setProvider(NETWORKS.RINKEBY)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in RINKEBY testnet')
        })

        it('can not add inexistent token to MAINNET', async () => {
          await f.setProvider(NETWORKS.MAINNET)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in MAINNET')
        })

        it('can not add inexistent token to LOCALHOST network', async () => {
          await f.setProvider(NETWORKS.LOCALHOST)
          assert(await f.isDisabledAddInexistentToken(tokenAddress.slice(0, tokenAddress.length - 2) + '0'), true, 'can add inexistent token in LOCALHOST network')
        })

        it('token still should be displayed in LOCALHOST network', async () => {
          await f.setProvider(NETWORKS.LOCALHOST)
          await f.waitUntilDisappear(screens.main.tokens.amount)
          assert.notEqual(await f.waitUntilShowUp(screens.main.tokens.amount), false, 'App is frozen')
          const tokens = await f.driver.findElements(screens.main.tokens.amount)
          assert.equal(tokens.length, 1, '\'Tokens\' section doesn\'t contain field with amount of tokens')
          assert.equal(await tokens[0].getText(), screens.main.tokens.textYouOwn1token, 'Token isn\'t displayed')
        })
      })
    })

    describe('Transfer tokens', function () {

      const invalidAddress = '0xkqjefwblknnecwe'
      const invalidAmount = 'eeeee'
      const largeAmount = '123'
      const preciseAmount = '0.123456789123456789123'
      const negativeAmount = '-1'

      it('switch to account 1 ', async () => {
        await f.setProvider(NETWORKS.LOCALHOST)
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account1)
        await item.click()
        await f.delay(2000)
        const accountName = await f.waitUntilShowUp(screens.main.accountName)
        assert.equal(await accountName.getText(), 'Account 1', 'account name incorrect')
      })

      it('open screen \'Transfer tokens\' ', async () => {
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const item = await f.waitUntilShowUp(menus.token.send)
        await item.click()
      })

      it('field \'Amount\' is displayed and has correct placeholder ', async () => {
        const item = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        assert.equal(await item.getAttribute('placeholder'), screens.sendTokens.field.amountPlaceholder, 'placeholder is incorrect')
      })

      it('field \'Address\' is displayed and has correct placeholder ', async () => {
        const item = await f.waitUntilShowUp(screens.sendTokens.field.address)
        assert.equal(await item.getAttribute('placeholder'), screens.sendTokens.field.addressPlaceholder, 'placeholder is incorrect')
      })

      it('token\'s balance is correct ', async () => {
        const item = await f.waitUntilShowUp(screens.sendTokens.balance)
        assert.equal(await item.getText(), token.supply, 'token\'s balance is incorrect')
      })

      it('token\'s symbol is correct ', async () => {
        const item = await f.waitUntilShowUp(screens.sendTokens.symbol)
        assert.equal(await item.getText(), token.ticker, 'token\'s symbol is incorrect')
      })

      it('error message if invalid token\'s amount', async () => {
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        assert.equal(await button.getText(), 'Next', 'button \'Next\' has incorrect name')
        await f.click(button)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.invalidAmount, ' error message is incorrect')
      })

      it('error message if invalid address', async () => {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await amount.sendKeys('1')
        const address = await f.waitUntilShowUp(screens.sendTokens.field.address)
        await address.sendKeys(invalidAddress)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.address, ' error message is incorrect')
      })

      it('error message if amount is large', async () => {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await amount.sendKeys(largeAmount)
        const address = await f.waitUntilShowUp(screens.sendTokens.field.address)
        await f.clearField(address)
        await address.sendKeys(account2)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.largeAmount, ' error message is incorrect')
      })

      it('error message if amount is invalid', async () => {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await f.clearField(amount)
        await amount.sendKeys(invalidAmount)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.invalidAmount, ' error message is incorrect')
      })

      it.skip('error message if amount is too precise', async () => {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await f.clearField(amount)
        await amount.sendKeys(preciseAmount)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.tooPrecise, ' error message is incorrect')
      })

      it('error message if amount is negative', async () => {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await f.clearField(amount)
        await amount.sendKeys(negativeAmount)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.negativeAmount, ' error message is incorrect')
      })

      it('\'Confirm transaction\' screen is opened if address and amount are correct', async () => {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await f.clearField(amount)
        await amount.sendKeys('5')
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)

        const buttonSubmit = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
        assert.notEqual(buttonSubmit, false, 'incorrect screen was opened')
      })

      it('\'Confirm transaction\' screen: token\'s amount is correct', async () => {
        const amount = await f.waitUntilShowUp(screens.confirmTransaction.amount)
        assert.equal(await amount.getText(), '5.000', ' amount is incorrect')
      })

      it('\'Confirm transaction\' screen: token\'s symbol is correct', async () => {
        const symbol = await f.waitUntilShowUp(screens.confirmTransaction.symbol)
        assert.equal(await symbol.getText(), token.ticker, ' symbol is incorrect')
      })

      it('submit transaction', async () => {
        await f.driver.navigate().refresh()
        const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
        await f.click(button)
        const list = await f.waitUntilShowUp(screens.main.transactionList)
        assert.notEqual(list, false, ' main screen isn\'t opened')
      })

      it('correct amount substracted from sender\'s tokens balance', async () => {
        const tab = await f.waitUntilShowUp(screens.main.tokens.menu)
        await tab.click()
        await f.driver.navigate().refresh()
        await f.delay(5000)
        await f.driver.navigate().refresh()
        await f.delay(5000)
        await f.driver.navigate().refresh()
        await f.delay(5000)
        const balance = await f.waitUntilShowUp(screens.main.tokens.balance)
        assert.equal(await balance.getText(), (token.supply - 5) + ' ' + token.ticker, 'balance is incorrect')
      })

      it('switch to account 2 ', async () => {
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account2)
        await item.click()
        await f.delay(2000)
        const accountName = await f.waitUntilShowUp(screens.main.accountName)
        assert.equal(await accountName.getText(), 'Account 2', 'account name incorrect')
      })

      it('added token isn\'t displayed for another account in the same network', async () => {
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.createAccount)
        await item.click()
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        await f.delay(2000)
      })

      it('add token to another account in the same network', async () => {
        const addTokenButton = await f.waitUntilShowUp(screens.main.tokens.buttonAdd)
        assert.equal(await addTokenButton.getText(), screens.main.tokens.buttonAddText)
        await f.click(addTokenButton)

        const tokenContractAddress = await f.waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
        await tokenContractAddress.sendKeys(tokenAddress)

        const buttonAdd = await f.waitUntilShowUp(screens.addToken.custom.buttons.add)
        await f.click(buttonAdd)
      })

      it('tokens were transfered, balance is updated', async () => {
        const balance = await f.waitUntilShowUp(screens.main.tokens.balance)
        assert.equal(await balance.getText(), '5 ' + token.ticker, 'balance is incorrect')
      })
    })

    describe('Remove token, provider is localhost', function () {

      it('switch to account 1 ', async () => {
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account1)
        await item.click()
        await f.delay(2000)
        const accountName = await f.waitUntilShowUp(screens.main.accountName)
        assert.equal(await accountName.getText(), 'Account 1', 'account name incorrect')
      })

      it('remove option opens \'Remove token\' screen ', async () => {
        await f.setProvider(NETWORKS.LOCALHOST)
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const remove = await f.waitUntilShowUp(menus.token.remove)
        await remove.click()
      })

      it('screen \'Remove token\' has correct title', async () => {
        const title = await f.waitUntilShowUp(screens.removeToken.title)
        assert.equal(await title.getText(), screens.removeToken.titleText, 'title is incorrect')
      })

      it('screen \'Remove token\' has correct label', async () => {
        const title = await f.waitUntilShowUp(screens.removeToken.label)
        assert.equal((await title.getText()).includes(screens.removeToken.labelText + token.ticker), true, 'label is incorrect')
      })

      it('button "No" bring back to "Main" screen', async () => {
        const title = await f.waitUntilShowUp(screens.removeToken.title)
        assert.equal(await title.getText(), screens.removeToken.titleText, 'title is incorrect')
        const button = await f.waitUntilShowUp(screens.removeToken.buttons.no)
        assert.notEqual(button, false, 'button \'No\' isn\'t displayed ')
        assert.equal(await button.getText(), 'No', 'button has incorrect name')
        await f.click(button)
        const token = await f.waitUntilShowUp(screens.main.tokens.balance)
        assert.notEqual(await token.getText(), '', 'token is disapeared after return from remove token screen ')
      })

      it('button "Yes" delete token', async () => {
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const remove = await f.waitUntilShowUp(menus.token.remove)
        await remove.click()

        const title = await f.waitUntilShowUp(screens.removeToken.title)
        assert.equal(await title.getText(), screens.removeToken.titleText, 'title is incorrect')

        const button = await f.waitUntilShowUp(screens.removeToken.buttons.yes)
        assert.notEqual(button, false, 'button \'Yes\' isn\'t displayed ')
        assert.equal(await button.getText(), 'Yes', 'button has incorrect name')
        await f.click(button)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from SOKOL network', async () => {
        await f.setProvider(NETWORKS.SOKOL)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from KOVAN network', async () => {
        await f.setProvider(NETWORKS.KOVAN)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from ROPSTEN network', async () => {
        await f.setProvider(NETWORKS.ROPSTEN)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from MAINNET network', async () => {
        await f.setProvider(NETWORKS.MAINNET)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from POA network', async () => {
        await f.setProvider(NETWORKS.POA)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from RINKEBY network', async () => {
        await f.setProvider(NETWORKS.RINKEBY)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })
    })
}

module.exports = addCustomToken
