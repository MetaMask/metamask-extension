import { strict as assert } from 'assert';
import { promises as fs } from 'fs';
import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { login } from '../../page-objects/flows/login.flow';

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

pwTest.describe('Backup and Restore', () => {
  pwTest(
    'should backup the account settings',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      // Kept skipped on Chrome for parity with the Selenium spec (which
      // skipped because Chrome showed an OS-level download prompt Selenium
      // couldn't dismiss). Playwright intercepts downloads, so this could
      // potentially be enabled on Chrome in the future.
      pwTest.skip(
        testInfo.project.name === 'chrome-e2e',
        'Runs on Firefox only, mirroring the Selenium spec',
      );
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await login(driver);

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToPrivacySettings();

          const privacySettings = new PrivacySettings(driver);
          await privacySettings.checkPageIsLoaded();
          await privacySettings.exportYourData();

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
          assert.equal(
            backupData.network?.networkConfigurationsByChainId?.['0x539']
              ?.chainId,
            '0x539',
          );
        },
      );
    },
  );
});
