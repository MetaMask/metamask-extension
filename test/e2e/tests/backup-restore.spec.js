const { strict: assert } = require('assert');
const { promises: fs } = require('fs');
const path = require('path');
const {
  convertToHexValue,
  withFixtures,
  createDownloadFolder,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const downloadsFolder = `${process.cwd()}/test-artifacts/downloads`;

const getBackupJson = async () => {
  const date = new Date();

  const prependZero = (num, maxLength) => {
    return num.toString().padStart(maxLength, '0');
  };

  const prefixZero = (num) => prependZero(num, 2);

  /*
   * userData.YYYY_MM_DD_HH_mm_SS e.g userData.2022_01_13_13_45_56
   * */
  const userDataFileName = `MetaMaskUserData.${date.getFullYear()}_${prefixZero(
    date.getMonth() + 1,
  )}_${prefixZero(date.getDay())}_${prefixZero(date.getHours())}_${prefixZero(
    date.getMinutes(),
  )}_${prefixZero(date.getDay())}.json`;

  try {
    const backup = `${downloadsFolder}/${userDataFileName}`;
    await fs.access(backup);
    const contents = await fs.readFile(backup);
    return JSON.parse(contents.toString());
  } catch (e) {
    return null;
  }
};

const restoreFile = path.join(
  __dirname,
  '..',
  'restore',
  'MetaMaskUserData.json',
);

describe('Backup and Restore', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should backup the account settings', async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      // Chrome shows OS level download prompt which can't be dismissed by Selenium
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await createDownloadFolder(downloadsFolder);
        await unlockWallet(driver);

        // Download user settings
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        await driver.clickElement({
          text: 'Back up',
          tag: 'button',
        });

        // Verify download
        let info;
        await driver.wait(async () => {
          info = await getBackupJson();
          return info !== null;
        }, 10000);
        assert.notEqual(info, null);
        // Verify Json
        assert.equal(
          Object.values(info?.network?.networkConfigurations)?.[0].chainId,
          '0x539',
        );
      },
    );
  });

  it('should restore the account settings', async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      // Chrome shows OS level download prompt which can't be dismissed by Selenium
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Restore
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        const restore = await driver.findElement('#restore-file');
        await restore.sendKeys(restoreFile);

        // Dismiss success message
        await driver.waitForSelector({
          css: '[data-testid="restore-user-data-banner-alert-description"]',
          text: 'Your data has been restored successfully',
        });
        await driver.clickElement({ text: 'Dismiss', tag: 'button' });

        // Verify restore
        await driver.clickElement({ text: 'Contacts', tag: 'div' });
        const recipient = await driver.findElement('[data-testid="recipient"]');
        assert.ok(
          /Test\sAccount\s*0x0c54...AaFb/u.test(await recipient.getText()),
        );
      },
    );
  });
});
