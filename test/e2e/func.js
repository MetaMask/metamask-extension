require('chromedriver')
require('geckodriver')
const fs = require('fs')
const os = require('os')
const path = require('path')
const webdriver = require('selenium-webdriver')
const Command = require('selenium-webdriver/lib/command').Command

const { By, Key } = webdriver

module.exports = {
  delay,
  buildChromeWebDriver,
  buildFirefoxWebdriver,
  installWebExt,
  getExtensionIdChrome,
  getExtensionIdFirefox,
}

function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

function buildChromeWebDriver (extPath) {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-chrome-profile'))
  return new webdriver.Builder()
    .withCapabilities({
      chromeOptions: {
        args: [
          `load-extension=${extPath}`,
          `user-data-dir=${tmpProfile}`,
        ],
        binary: process.env.SELENIUM_CHROME_BINARY,
      },
    })
    .build()
}

function buildFirefoxWebdriver () {
  return new webdriver.Builder().build()
}

async function getExtensionIdChrome (driver) {
  await driver.get('chrome://extensions')
  const extensionId = await driver.executeScript('return document.querySelector("extensions-manager").shadowRoot.querySelector("extensions-view-manager extensions-item-list").shadowRoot.querySelector("extensions-item:nth-child(2)").getAttribute("id")')
  return extensionId
}

async function getExtensionIdFirefox (driver) {
  await driver.get('about:debugging#addons')
  const extensionId = await driver.findElement(By.css('dd.addon-target-info-content:nth-child(6) > span:nth-child(1)')).getText()
  return extensionId
}

async function installWebExt (driver, extension) {
  const cmd = await new Command('moz-install-web-ext')
    .setParameter('path', path.resolve(extension))
    .setParameter('temporary', true)

  await driver.getExecutor()
    .defineCommand(cmd.getName(), 'POST', '/session/:sessionId/moz/addon/install')

  return await driver.execute(cmd, 'installWebExt(' + extension + ')')
}