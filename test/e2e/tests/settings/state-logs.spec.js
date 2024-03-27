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

const getStateLogsJson = async () => {
  try {
    const stateLogs = `${downloadsFolder}/MetaMask state logs.json`;
    await fs.access(stateLogs);
    const contents = await fs.readFile(stateLogs);
    return JSON.parse(contents.toString());
  } catch (e) {
    return null;
  }
};

describe('State logs', function () {
  it('should download state logs for the account', async function () {
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

        // Download state logs
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        await driver.clickElement({
          text: 'Download state logs',
          tag: 'button',
        });

        // Verify download
        let info;
        await driver.wait(async () => {
          info = await getStateLogsJson();
          return info !== null;
        }, 10000);
        assert.notEqual(info, null);
        // Verify Json
        assert.equal(
          info?.metamask?.identities[
            '0x5cfe73b6021e818b776b421b1c4db2474086a7e1'
          ].address,
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
        assert.equal(
          info?.metamask?.internalAccounts.accounts[
            info?.metamask?.internalAccounts.selectedAccount
          ].address,
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
      },
    );
  });
});
