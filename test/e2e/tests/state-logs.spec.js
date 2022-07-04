const { strict: assert } = require('assert');
const { promises: fs } = require('fs');
const { convertToHexValue, withFixtures } = require('../helpers');

const downloadsFolder = `${process.cwd()}/test-artifacts/downloads`;

const createDownloadFolder = async () => {
  await fs.rm(downloadsFolder, { recursive: true, force: true });
  await fs.mkdir(downloadsFolder, { recursive: true });
};

const stateLogsExist = async () => {
  try {
    const stateLogs = `${downloadsFolder}/MetaMask State Logs.json`;
    await fs.access(stateLogs);
    return true;
  } catch (e) {
    return false;
  }
};

describe('State logs', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should download state logs for the account', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await createDownloadFolder();
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Download State Logs
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        await driver.clickElement({
          text: 'Download State Logs',
          tag: 'button',
        });

        // Verify download
        let fileExists;
        await driver.wait(async () => {
          fileExists = await stateLogsExist();
          return fileExists === true;
        }, 10000);
        assert.equal(fileExists, true);
      },
    );
  });
});
