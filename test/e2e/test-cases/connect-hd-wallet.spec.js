const assert = require('assert')
const { menus, screens } = require('../elements')

const connectHDWallet = async (f) => {
	it("Account menu contais item 'Connect HD wallet'", async () => {
    const menu = await f.waitUntilShowUp(menus.account.menu)
    await menu.click()
    await f.waitUntilShowUp(menus.account.item)
    const items = await f.driver.findElements(menus.account.item)
    await f.delay(500)
    assert.equal(await items[4].getText(), 'Connect hardware wallet', "item's text incorrect")
    await items[4].click()
  })


  it("Opens screen 'Connect HD wallet',title is correct", async () => {
    const title = await f.waitUntilShowUp(screens.hdWallet.title)
    assert.equal(await title.getText(), 'Connect to hardware wallet', "item's text incorrect")
  })

  if (process.env.SELENIUM_BROWSER === 'chrome') {
    it("Button 'Connect' disabled by default", async () => {
      const button = await f.waitUntilShowUp(screens.hdWallet.buttonConnect.disabled)
      assert.notEqual(button, false, "button isn't displayed")
      assert.equal(await button.getText(), 'CONNECT', 'button has incorrect text')
    })

    it('Ledger image is displayed', async () => {
      const image = await f.waitUntilShowUp(screens.hdWallet.image)
      assert.notEqual(image, false, "ledger's image isn't displayed")
      const src = await image.getAttribute('src')
      assert.equal(src.includes('images/ledger-logo.svg'), true, 'Ledger has incorrect image')
    })

    it('Trezor image is displayed', async () => {
      const images = await f.driver.findElements(screens.hdWallet.image)
      assert.notEqual(images[1], false, "trezor's image isn't displayed")
      const src = await images[1].getAttribute('src')
      assert.equal(src.includes('images/trezor-logo.svg'), true, 'Trezor has incorrect image')
    })

    it("Button 'Connect' enabled if Trezor selected", async () => {
      const images = await f.driver.findElements(screens.hdWallet.image)
      await images[1].click()
      const button = await f.waitUntilShowUp(screens.hdWallet.buttonConnect.enabled)
      assert.equal(await button.isEnabled(), true, 'button is disabled')
    })

    it("Button 'Connect' enabled if Ledger selected", async () => {
      const images = await f.driver.findElements(screens.hdWallet.image)
      await images[0].click()
      const button = await f.waitUntilShowUp(screens.hdWallet.buttonConnect.enabled)
      assert.equal(await button.isEnabled(), true, 'button is disabled')
    })

    it('Only one device can be selected', async () => {
      const selected = await f.driver.findElements(screens.hdWallet.imageSelected)
      assert.equal(await selected.length, 1, 'more than one device is selected')
    })

    it('Error message if connect Ledger', async () => {
      const button = await f.waitUntilShowUp(screens.hdWallet.buttonConnect.enabled)
      await button.click()
      const error = await f.waitUntilShowUp(screens.hdWallet.error)
      const shouldBe = "TransportError: U2F browser support is needed for Ledger. Please use Chrome, Opera or Firefox with a U2F extension. Also make sure you're on an HTTPS connection"
      assert.equal(await error.getText(), shouldBe, 'error has incorrect text')
    })

    it('Popup opens if connect Trezor', async () => {
      const images = await f.driver.findElements(screens.hdWallet.image)
      await images[1].click()
      const button = await f.waitUntilShowUp(screens.hdWallet.buttonConnect.enabled)
      await button.click()
      await f.delay(2000)
      const allHandles = await f.driver.getAllWindowHandles()
      assert.equal(allHandles.length, 2, "popup isn't opened")
      driver.switchTo().window(allHandles[1])
      await f.delay(2000)
      driver.close()
      driver.switchTo().window(allHandles[0])
      await f.delay(2000)
      assert.equal(allHandles.length, 2, "popup isn't opened")
      await f.switchToFirstPage()
      await f.driver.navigate().refresh()
    })
  }
  it('Button arrow leads to main screen', async () => {
   const menu = await f.waitUntilShowUp(menus.account.menu)
   await menu.click()
   await f.waitUntilShowUp(menus.account.item)
   const items = await f.driver.findElements(menus.account.item)
   await f.delay(500)
   await items[4].click()
   const arrow = await f.waitUntilShowUp(screens.hdWallet.buttonArrow)
   await arrow.click()
   const ident = await f.waitUntilShowUp(screens.main.identicon, 20)
   assert.notEqual(ident, false, "main screen isn't opened")
 })
}

module.exports = connectHDWallet
