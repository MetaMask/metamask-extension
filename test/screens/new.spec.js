const path = require('path')
const fs = require('fs')
const pify = require('pify')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const webdriver = require('selenium-webdriver')
const endOfStream = require('end-of-stream')
const GIFEncoder = require('gifencoder')
const pngFileStream = require('png-file-stream')
const sizeOfPng = require('image-size/lib/types/png')
const By = webdriver.By
const { delay, buildWebDriver } = require('./func')
const localesIndex = require('../../app/_locales/index.json')

captureAllScreens().catch(console.error)

async function captureAllScreens() {
  let screenshotCount = 0

  // common names
  let button
  let tabs
  let element

  await cleanScreenShotDir()

  // setup selenium and install extension
  const extPath = path.resolve('dist/chrome')
  const driver = buildWebDriver(extPath)
  await driver.get('chrome://extensions-frame')
  const elems = await driver.findElements(By.css('.extension-list-item-wrapper'))
  const extensionId = await elems[1].getAttribute('id')
  await driver.get(`chrome-extension://${extensionId}/home.html`)
  await delay(500)
  tabs = await driver.getAllWindowHandles()
  await driver.switchTo().window(tabs[0])
  await delay(300)

  await captureScreenShot('start-old')

  // click try new ui
  await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-center.flex-grow > p')).click()
  await delay(300)

  // close metamask homepage and extra home.html
  tabs = await driver.getAllWindowHandles()
  await driver.switchTo().window(tabs[2])
  driver.close()
  await driver.switchTo().window(tabs[1])
  driver.close()
  await driver.switchTo().window(tabs[0])
  await delay(300)
  await captureLanguageScreenShots('welcome-new-ui')

  // setup account
  await delay(1000)
  await driver.findElement(By.css('body')).click()
  await delay(300)
  await captureLanguageScreenShots('welcome')

  await driver.findElement(By.css('button')).click()
  await captureLanguageScreenShots('create password')

  const passwordBox = await driver.findElement(By.css('input[type=password]:nth-of-type(1)'))
  const passwordBoxConfirm = await driver.findElement(By.css('input[type=password]:nth-of-type(2)'))
  passwordBox.sendKeys('123456789')
  passwordBoxConfirm.sendKeys('123456789')
  await delay(500)
  await captureLanguageScreenShots('choose-password-filled')

  await driver.findElement(By.css('button')).click()
  await delay(500)
  await captureLanguageScreenShots('unique account image')

  await driver.findElement(By.css('button')).click()
  await delay(500)
  await captureLanguageScreenShots('privacy note')

  await driver.findElement(By.css('button')).click()
  await delay(300)
  await captureLanguageScreenShots('terms')

  await delay(300)
  element = driver.findElement(By.linkText('Attributions'))
  await driver.executeScript('arguments[0].scrollIntoView(true)', element)
  await delay(300)
  await captureLanguageScreenShots('terms-scrolled')

  await driver.findElement(By.css('button')).click()
  await delay(300)
  await captureLanguageScreenShots('secret backup phrase')

  await driver.findElement(By.css('button')).click()
  await delay(300)
  await captureLanguageScreenShots('secret backup phrase')

  await driver.findElement(By.css('.backup-phrase__reveal-button')).click()
  await delay(300)
  await captureLanguageScreenShots('secret backup phrase - reveal')

  await driver.findElement(By.css('button')).click()
  await delay(300)
  await captureLanguageScreenShots('confirm secret backup phrase')

  // finish up
  console.log('building gif...')
  await generateGif()
  // await driver.quit()
  return

  //
  // await button.click()
  // await delay(700)
  // this.seedPhase = await driver.findElement(By.css('.twelve-word-phrase')).getText()
  // await captureScreenShot('seed phrase')
  //
  // const continueAfterSeedPhrase = await driver.findElement(By.css('button'))
  // await continueAfterSeedPhrase.click()
  // await delay(300)
  // await captureScreenShot('main screen')
  //
  // await driver.findElement(By.css('.sandwich-expando')).click()
  // await delay(500)
  // await captureScreenShot('menu')

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

  async function captureLanguageScreenShots(label) {
    const nonEnglishLocales = localesIndex.filter(localeMeta => localeMeta.code !== 'en')
    for (let localeMeta of nonEnglishLocales) {
      // set locale
      await setLocale(localeMeta.code)
      await delay(300)
      await captureScreenShot(`${label} (${localeMeta.code})`)
    }
    await setLocale('en')
    await delay(300)
  }

  async function setLocale(code) {
    await driver.executeScript('setLocale(arguments[0])', code)
  }

  // cleanup
  await driver.quit()

  async function cleanScreenShotDir() {
    await pify(rimraf)(`./test-artifacts/screens/`)
  }

  async function captureScreenShot(label) {
    const shotIndex = screenshotCount.toString().padStart(4, '0')
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
      .pipe(encoder.createWriteStream({ repeat: -1, delay: 1000, quality: 10 }))
      .pipe(fs.createWriteStream('./test-artifacts/screens/walkthrough.gif'))

    // wait for end
    await pify(endOfStream)(stream)
  }

}
