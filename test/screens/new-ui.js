const path = require('path')
const fs = require('fs')
const pify = require('pify')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const webdriver = require('selenium-webdriver')
const endOfStream = require('end-of-stream')
const clipboardy = require('clipboardy')
const Ethjs = require('ethjs')
const GIFEncoder = require('gifencoder')
const pngFileStream = require('png-file-stream')
const sizeOfPng = require('image-size/lib/types/png')
const By = webdriver.By
const localesIndex = require('../../app/_locales/index.json')
const { delay, buildChromeWebDriver, getExtensionIdChrome } = require('../e2e/func')

const eth = new Ethjs(new Ethjs.HttpProvider('http://localhost:8545'))

let driver
let screenshotCount = 0

captureAllScreens()
.then(async () => {
  // build screenshots into gif
  console.log('building gif...')
  await generateGif()

  await driver.quit()
  process.exit()
})
.catch(async (err) => {
  try {
    console.error(err)
    verboseReportOnFailure({ title: 'something broke' })
  } catch (err) {
    console.error(err)
  }

  await driver.quit()
  process.exit(1)
})


async function captureAllScreens () {
  // common names
  let tabs

  await cleanScreenShotDir()

  const extPath = path.resolve('dist/chrome')
  driver = buildChromeWebDriver(extPath)
  const extensionId = await getExtensionIdChrome(driver)

  await driver.get(`chrome-extension://${extensionId}/home.html`)
  await delay(500)
  tabs = await driver.getAllWindowHandles()
  await driver.switchTo().window(tabs[0])
  await delay(1000)
  await setProviderType('localhost')
  await delay(300)

  // click try new ui
  await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-center.flex-grow > p')).click()
  await delay(300)

  // close metamask homepage and extra home.html
  tabs = await driver.getAllWindowHandles()
  // metamask homepage is opened on prod, not dev
  if (tabs.length > 2) {
    await driver.switchTo().window(tabs[2])
    driver.close()
  }
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

  const password = '123456789'
  const passwordBox = await driver.findElement(By.css('input#create-password'))
  const passwordBoxConfirm = await driver.findElement(By.css('input#confirm-password'))
  passwordBox.sendKeys(password)
  passwordBoxConfirm.sendKeys(password)
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
  const element = driver.findElement(By.linkText('Attributions'))
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

  const seedPhrase = await driver.findElement(By.css('.backup-phrase__secret-words')).getText()
  const seedPhraseWords = seedPhrase.split(' ')
  await driver.findElement(By.css('button')).click()
  await delay(300)
  await captureLanguageScreenShots('confirm secret backup phrase')

  // enter seed phrase
  const seedPhraseButtons = await driver.findElements(By.css('.backup-phrase__confirm-seed-options > button'))
  const seedPhraseButtonWords = await Promise.all(seedPhraseButtons.map(button => button.getText()))
  for (const targetWord of seedPhraseWords) {
    const wordIndex = seedPhraseButtonWords.indexOf(targetWord)
    if (wordIndex === -1) throw new Error(`Captured seed phrase word "${targetWord}" not in found seed phrase button options ${seedPhraseButtonWords.join(' ')}`)
    await driver.findElement(By.css(`.backup-phrase__confirm-seed-options > button:nth-child(${wordIndex + 1})`)).click()
    await delay(100)
  }
  await captureLanguageScreenShots('confirm secret backup phrase - words selected correctly')

  await driver.findElement(By.css('.backup-phrase__content-wrapper .first-time-flow__button')).click()
  await delay(300)
  await captureLanguageScreenShots('metamask post-initialize greeter screen deposit ether')

  await driver.findElement(By.css('.page-container__header-close')).click()
  await delay(300)
  await captureLanguageScreenShots('metamask account main screen')

  // account details + export private key
  await driver.findElement(By.css('.wallet-view__name-container > .wallet-view__details-button')).click()
  await delay(300)
  await captureLanguageScreenShots('metamask account detail screen')

  await driver.findElement(By.css('.account-modal__button:nth-of-type(2)')).click()
  await delay(300)
  await captureLanguageScreenShots('metamask account detail export private key screen - initial')

  await driver.findElement(By.css('.private-key-password > input')).sendKeys(password)
  await delay(300)
  await captureLanguageScreenShots('metamask account detail export private key screen - password entered')

  await driver.findElement(By.css('.btn-primary.btn--large.export-private-key__button')).click()
  await delay(300)
  await captureLanguageScreenShots('metamask account detail export private key screen - reveal key')

  await driver.findElement(By.css('.export-private-key__button')).click()
  await delay(300)
  await captureLanguageScreenShots('metamask account detail export private key screen - done')

  // get eth from Ganache
  // const viewAddressButton = await driver.findElement(By.css('.wallet-view__address'))
  // await driver.actions({ bridge: true }).move({ origin: viewAddressButton }).perform()
  // console.log('driver.actions', driver.actions({ bridge: true }))
  // await delay(300)
  // await captureLanguageScreenShots('metamask home - hover copy address')

  await driver.findElement(By.css('.wallet-view__address')).click()
  await delay(100)
  await captureLanguageScreenShots('metamask home - hover copy address')

  const primaryAddress = clipboardy.readSync()
  await requestEther(primaryAddress)
  // wait for block polling
  await delay(10000)
  await captureLanguageScreenShots('metamask home - has ether')

}


async function captureLanguageScreenShots (label) {
  const nonEnglishLocales = localesIndex.filter(localeMeta => localeMeta.code !== 'en')
  // take english shot
  await captureScreenShot(`${label} (en)`)
  for (const localeMeta of nonEnglishLocales) {
    // set locale and take shot
    await setLocale(localeMeta.code)
    await delay(300)
    await captureScreenShot(`${label} (${localeMeta.code})`)
  }
  // return locale to english
  await setLocale('en')
  await delay(300)
}

async function setLocale (code) {
  await driver.executeScript('window.metamask.updateCurrentLocale(arguments[0])', code)
}

async function setProviderType (type) {
  await driver.executeScript('window.metamask.setProviderType(arguments[0])', type)
}

async function cleanScreenShotDir () {
  await pify(rimraf)(`./test-artifacts/screens/`)
}

async function captureScreenShot (label) {
  const shotIndex = screenshotCount.toString().padStart(4, '0')
  screenshotCount++
  const artifactDir = `./test-artifacts/screens/`
  await pify(mkdirp)(artifactDir)
  // capture screenshot
  const screenshot = await driver.takeScreenshot()
  await pify(fs.writeFile)(`${artifactDir}/${shotIndex} - ${label}.png`, screenshot, { encoding: 'base64' })
}

async function generateGif () {
  // calculate screenshot size
  const screenshot = await driver.takeScreenshot()
  const pngBuffer = Buffer.from(screenshot, 'base64')
  const size = sizeOfPng.calculate(pngBuffer)

  // read only the english pngs into gif
  const encoder = new GIFEncoder(size.width, size.height)
  const stream = pngFileStream('./test-artifacts/screens/* (en).png')
    .pipe(encoder.createWriteStream({ repeat: 0, delay: 1000, quality: 10 }))
    .pipe(fs.createWriteStream('./test-artifacts/screens/walkthrough (en).gif'))

  // wait for end
  await pify(endOfStream)(stream)
}

async function verboseReportOnFailure (test) {
  const artifactDir = `./test-artifacts/${test.title}`
  const filepathBase = `${artifactDir}/test-failure`
  await pify(mkdirp)(artifactDir)
  // capture screenshot
  const screenshot = await driver.takeScreenshot()
  await pify(fs.writeFile)(`${filepathBase}-screenshot.png`, screenshot, { encoding: 'base64' })
  // capture dom source
  const htmlSource = await driver.getPageSource()
  await pify(fs.writeFile)(`${filepathBase}-dom.html`, htmlSource)
}

async function requestEther (address) {
  const accounts = await eth.accounts()
  await eth.sendTransaction({ from: accounts[0], to: address, value: 1 * 1e18, data: '0x0' })
}
