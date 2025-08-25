import { strict as assert } from 'assert';
import { promises as fs } from 'fs';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

const downloadsFolder = `${process.cwd()}/test-artifacts/downloads`;

type BackupData = {
  network?: {
    networkConfigurationsByChainId?: {
      [key: string]: {
        chainId: string;
      };
    };
  };
};

const getBackupJson = async (): Promise<BackupData | null> => {
  const date = new Date();

  const prependZero = (num: number, maxLength: number): string => {
    return num.toString().padStart(maxLength, '0');
  };

  const prefixZero = (num: number): string => prependZero(num, 2);

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
    const contents = await fs.readFile(backup);
    return JSON.parse(contents.toString());
  } catch (e) {
    console.log('Error reading the backup file', e);
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
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Download user settings
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettings = new AdvancedSettings(driver);
        await advancedSettings.checkPageIsLoaded();
        await advancedSettings.downloadData();

        // Verify download
        let info: BackupData | null = null;
        await driver.wait(async () => {
          info = await getBackupJson();
          return info !== null;
        }, 10000);
        assert.notEqual(info, null);
        if (info === null) {
          throw new Error('Backup data is null after waiting');
        }
        const backupData = info as BackupData;
        // Verify Json
        assert.equal(
          backupData.network?.networkConfigurationsByChainId?.['0x539']
            ?.chainId,
          '0x539',
        );
      },
    );
  });
});
