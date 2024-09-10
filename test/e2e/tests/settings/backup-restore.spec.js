const { strict: assert } = require('assert');
const { promises: fs } = require('fs');

const {
  defaultGanacheOptions,
  withFixtures,
  createDownloadFolder,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

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

describe('Backup and Restore', function () {
  it('should backup the account settings', async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      // Chrome shows OS level download prompt which can't be dismissed by Selenium
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
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
        await driver.clickElement('[data-testid="export-data-button"]');

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
});
