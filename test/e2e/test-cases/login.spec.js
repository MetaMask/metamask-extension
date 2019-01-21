const assert = require('assert')
const { screens } = require('../elements')

const login = async (f, password) => {
  it('title is \'Nifty Wallet\'', async () => {
    const title = await f.driver.getTitle()
    assert.equal(title, 'Nifty Wallet', 'title is incorrect')
  })

  it('screen \'Terms of Use\' has not empty agreement', async () => {
    await f.delay(5000)
    const terms = await f.waitUntilShowUp(screens.TOU.agreement, 900)
    const text = await terms.getText()
    assert.equal(text.length > 400, true, 'agreement is too short')
  })

  it('screen \'Terms of Use\' has correct title', async () => {
    const terms = await f.waitUntilShowUp(screens.TOU.title)
    assert.equal(await terms.getText(), screens.TOU.titleText, 'title is incorrect')
  })

  it('checks if the TOU contains link \'Terms of service\'', async () => {
    const element = await f.waitUntilShowUp(screens.TOU.linkTerms)
    await f.scrollTo(screens.TOU.linkTerms)
    assert.notEqual(element, null, ' link \'Terms of service\' isn\'t present')
    assert.equal(await element.getText(), screens.TOU.linkTermsText, 'incorrect name of link \'Terms of service\'')
  })

  it('checks if the button \'Accept\' is present and enabled', async () => {
    const button = await f.waitUntilShowUp(screens.TOU.button)
    assert.notEqual(button, false, 'button isn\'t present')
    assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
    assert.equal(await button.getText(), 'Accept', 'button has incorrect name')
    await f.click(button)
  })

  it('accepts password with length of eight', async () => {
    const passwordBox = await f.waitUntilShowUp(screens.create.fieldPassword)
    const passwordBoxConfirm = await f.waitUntilShowUp(screens.create.fieldPasswordConfirm)
    const button = await f.waitUntilShowUp(screens.create.button)
    assert.equal(await button.getText(), 'Create', 'button has incorrect name')
    await passwordBox.sendKeys(password)
    await passwordBoxConfirm.sendKeys(password)
    await f.click(button)
  })

  it('shows vault was created and seed phrase', async () => {
    await f.delay(300)
    const element = await f.waitUntilShowUp(screens.seedPhrase.fieldPhrase)
    const seedPhrase = await element.getText()
    assert.equal(seedPhrase.split(' ').length, 12)
    const continueAfterSeedPhrase = await f.waitUntilShowUp(screens.seedPhrase.buttonIveCopied)
    assert.equal(await continueAfterSeedPhrase.getText(), screens.seedPhrase.textButtonIveCopied)
    await f.click(continueAfterSeedPhrase)
  })
}

module.exports = login
