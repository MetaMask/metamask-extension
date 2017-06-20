const chromedriver = require('chromedriver')
const webdriver = require('selenium-webdriver')

function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

let crdvIsStarted = false

exports.startChromeDriver = function startChromeDriver () {
  if (crdvIsStarted) return Promise.resolve()
  chromedriver.start()
  process.on('exit', chromedriver.stop)
  crdvIsStarted = true
  return delay(1000)
}

exports.buildWebDriver = function buildWebDriver (extPath) {
  return new webdriver.Builder()
    .usingServer('http://localhost:9515')
    .withCapabilities({
      chromeOptions: {
        args: [`load-extension=${extPath}`],
      },
    })
    .forBrowser('chrome')
    .build()
}

exports.delay = delay
