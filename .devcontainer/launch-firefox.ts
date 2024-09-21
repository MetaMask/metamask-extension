import { Builder } from 'selenium-webdriver';
import Firefox from 'selenium-webdriver/firefox';

const options: any = new Firefox.Options().setAcceptInsecureCerts(true);

const builder = new Builder().forBrowser('firefox').setFirefoxOptions(options);

const driver: any = builder.build();

driver.installAddon('./dist/firefox', true);
