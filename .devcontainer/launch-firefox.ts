const { Builder } = require('selenium-webdriver');
const Firefox = require('selenium-webdriver/firefox');

const options = new Firefox.Options().setAcceptInsecureCerts(true);

const builder = new Builder().forBrowser('firefox').setFirefoxOptions(options);

const driver = builder.build();

driver.installAddon('./dist/firefox', true);
