require('chromedriver')
require('geckodriver')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
import puppeteer from 'puppeteer'

module.exports = {
  delay,
  verboseReportOnFailure,
  buildChromeWebDriver,
  getExtensionIdPuppeteer,
  getExtensionIdChrome,
}

function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

async function buildChromeWebDriver (extPath, opts = {}) {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-chrome-profile'))
  const args = [
    `--disable-extensions-except=${extPath}`,
    `--load-extension=${extPath}`,
    `--user-data-dir=${tmpProfile}`,
  ]
  if (opts.responsive) {
    args.push('--auto-open-devtools-for-tabs')
  }
  const driver = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args,
  })

  return driver
}

async function getExtensionIdPuppeteer (browser) {
  const targets = await browser.targets()
  const backgroundPageTarget = targets.find(target => target.type() === 'background_page')
  const url = await backgroundPageTarget.url()
  const extensionId = url.split('/')[2]

  const page = await browser.newPage()
  await page.goto(`chrome-extension://${extensionId}/home.html`)
  await page.waitFor(2000) // Waiting for pages to load
}

async function getExtensionIdChrome (driver) {
  await driver.get('chrome://extensions')
  const extensionId = await driver.executeScript('return document.querySelector("extensions-manager").shadowRoot.querySelector("extensions-item-list").shadowRoot.querySelector("extensions-item:nth-child(2)").getAttribute("id")')
  return extensionId
}

async function verboseReportOnFailure ({ browser, driver, title }) {
  const artifactDir = `./test-artifacts/${browser}/${title}`
  const filepathBase = `${artifactDir}/test-failure`
  await fs.ensureDir(artifactDir)
  const screenshot = await driver.takeScreenshot()
  await fs.writeFile(`${filepathBase}-screenshot.png`, screenshot, { encoding: 'base64' })
  const htmlSource = await driver.getPageSource()
  await fs.writeFile(`${filepathBase}-dom.html`, htmlSource)
}
