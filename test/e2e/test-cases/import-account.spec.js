const assert = require('assert')
const { menus, screens, elements, NETWORKS } = require('../elements')
const { account } = menus
const { main: {
        tokens: tokensEl,
        balance: balanceEl,
    },
    importAccounts,
} = screens
const addr = '0xf4702CbA917260b2D6731Aea6385215073e8551b'
const addrPrivKey = '76bd0ced0a47055bb5d060e1ae4a8cb3ece658d668823e250dae6e79d3ab4435'

const importAccount = async (f) => {
	it('Open import account menu', async () => {
    await f.setProvider(NETWORKS.POA)
    await f.delay(2000)
    const menu = await f.waitUntilShowUp(account.menu)
    await menu.click()
    const item = await f.waitUntilShowUp(account.import)
    await item.click()
    const importAccountTitle = await f.waitUntilShowUp(importAccounts.title)
    assert.equal(await importAccountTitle.getText(), importAccounts.textTitle)
  })

  it('Imports account', async () => {
    const privateKeyBox = await f.waitUntilShowUp(importAccounts.fieldPrivateKey)
    await privateKeyBox.sendKeys(addrPrivKey)
    const button = await f.waitUntilShowUp(importAccounts.buttonImport)
    assert.equal(await button.getText(), 'Import', 'button has incorrect name')
    await f.click(button)
    const menu = await f.waitUntilShowUp(account.menu)
    await menu.click()
    await f.waitUntilShowUp(account.label)
    const labels = await f.driver.findElements(account.label)
    const label = labels[0]
    assert.equal(await label.getText(), 'IMPORTED')
    await menu.click()
  })

  it('Auto-detect tokens for POA core network ', async () => {
    // await setProvider(NETWORKS.POA)
    const tab = await f.waitUntilShowUp(tokensEl.menu)
    await tab.click()
    const balance = await f.waitUntilShowUp(tokensEl.balance)
    console.log(await balance.getText())
    assert.equal(await balance.getText(), '1 DOPR', 'token isnt\' auto-detected')
  })

  it.skip('Auto-detect tokens for MAIN core network ', async () => {
    await f.setProvider(NETWORKS.MAINNET)
    await f.waitUntilShowUp(elements.loader, 25)
    await f.waitUntilDisappear(elements.loader, 25)
    const balance = await f.waitUntilShowUp(tokensEl.balance)
    console.log(await balance.getText())
    assert.equal(await balance.getText(), '0.001 WETH', 'token isnt\' auto-detected')
  })

  it('Check Sokol balance', async () => {
    await f.setProvider(NETWORKS.POA)
    await f.delay(2000)
    const balanceField = await f.waitUntilShowUp(balanceEl)
    const balance = await balanceField.getText()
    console.log(`Account = ${addr}`)
    console.log('Balance = ' + balance)
    assert.equal(parseFloat(balance) > 0.001, true, `Balance of account ${addr} TOO LOW !!! Please refill with Sokol eth!!!!`)
  })
}

module.exports = importAccount
