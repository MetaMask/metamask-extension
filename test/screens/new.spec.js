const path = require('path')
const fs = require('fs')
const pify = require('pify')
const mkdirp = require('mkdirp')
const webdriver = require('selenium-webdriver')
const endOfStream = require('end-of-stream')
const GIFEncoder = require('gifencoder')
const pngFileStream = require('png-file-stream')
const sizeOfPng = require('image-size/lib/types/png')
const By = webdriver.By
const { delay, buildWebDriver } = require('./func')

captureAllScreens().catch(console.error)

async function captureAllScreens() {
  let screenshotCount = 0

  // setup selenium and install extension
  const extPath = path.resolve('dist/chrome')
  const driver = buildWebDriver(extPath)
  await driver.get('chrome://extensions-frame')
  const elems = await driver.findElements(By.css('.extension-list-item-wrapper'))
  const extensionId = await elems[1].getAttribute('id')
  await driver.get(`chrome-extension://${extensionId}/popup.html`)
  await delay(500)
  const tabs = await driver.getAllWindowHandles()
  await driver.switchTo().window(tabs[0])
  await delay(300)

  // common names
  let button

  await captureScreenShot('start-old')

  // click try new ui
  await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-center.flex-grow > p')).click()
  await captureScreenShot('start-new')
  await delay(300)
  await captureScreenShot('start-new2')
  await delay(300)
  await captureScreenShot('start-new3')
  await delay(300)
  await captureScreenShot('start-new4')
  await delay(300)
  await captureScreenShot('start-new5')

  // exit early for dev
  await generateGif()
  await driver.quit()
  return


  await captureScreenShot('privacy')

  const privacy = await driver.findElement(By.css('.terms-header')).getText()
  driver.findElement(By.css('button')).click()
  await delay(300)
  await captureScreenShot('terms')

  await delay(300)
  const terms = await driver.findElement(By.css('.terms-header')).getText()
  await delay(300)
  const element = driver.findElement(By.linkText('Attributions'))
  await driver.executeScript('arguments[0].scrollIntoView(true)', element)
  await delay(300)
  button = await driver.findElement(By.css('button'))
  const buttonEnabled = await button.isEnabled()
  await delay(500)
  await captureScreenShot('terms-scrolled')

  await button.click()
  await delay(300)
  await captureScreenShot('choose-password')

  const passwordBox = await driver.findElement(By.id('password-box'))
  const passwordBoxConfirm = await driver.findElement(By.id('password-box-confirm'))
  button = driver.findElement(By.css('button'))
  passwordBox.sendKeys('123456789')
  passwordBoxConfirm.sendKeys('123456789')
  await delay(500)
  await captureScreenShot('choose-password-filled')

  await button.click()
  await delay(700)
  this.seedPhase = await driver.findElement(By.css('.twelve-word-phrase')).getText()
  await captureScreenShot('seed phrase')

  const continueAfterSeedPhrase = await driver.findElement(By.css('button'))
  await continueAfterSeedPhrase.click()
  await delay(300)
  await captureScreenShot('main screen')

  await driver.findElement(By.css('.sandwich-expando')).click()
  await delay(500)
  await captureScreenShot('menu')

  // await driver.findElement(By.css('#app-content > div > div:nth-child(3) > span > div > li:nth-child(3)')).click()
  // await captureScreenShot('main screen')
  // it('should accept account password after lock', async () => {
  //   await delay(500)
  //   await driver.findElement(By.id('password-box')).sendKeys('123456789')
  //   await driver.findElement(By.css('button')).click()
  //   await delay(500)
  // })
  //
  // it('should show QR code option', async () => {
  //   await delay(300)
  //   await driver.findElement(By.css('.fa-ellipsis-h')).click()
  //   await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div > div:nth-child(1) > flex-column > div.name-label > div > span > i > div > div > li:nth-child(3)')).click()
  //   await delay(300)
  // })
  //
  // it('should show the account address', async () => {
  //   this.accountAddress = await driver.findElement(By.css('.ellip-address')).getText()
  //   await driver.findElement(By.css('.fa-arrow-left')).click()
  //   await delay(500)
  // })

  // cleanup
  await driver.quit()

  async function captureScreenShot(label) {
    const shotIndex = screenshotCount
    screenshotCount++
    const artifactDir = `./test-artifacts/screens/`
    await pify(mkdirp)(artifactDir)
    // capture screenshot
    const screenshot = await driver.takeScreenshot()
    await pify(fs.writeFile)(`${artifactDir}/${shotIndex} - ${label}.png`, screenshot, { encoding: 'base64' })
  }

  async function generateGif(){
    // calculate screenshot size
    const screenshot = await driver.takeScreenshot()
    const pngBuffer = Buffer.from(screenshot, 'base64')
    const size = sizeOfPng.calculate(pngBuffer)

    // read all pngs into gif
    const encoder = new GIFEncoder(size.width, size.height)
    const stream = pngFileStream('./test-artifacts/screens/*.png')
      .pipe(encoder.createWriteStream({ repeat: -1, delay: 500, quality: 10 }))
      .pipe(fs.createWriteStream('./test-artifacts/screens/walkthrough.gif'))

    // wait for end
    await pify(endOfStream)(stream)
  }

}
