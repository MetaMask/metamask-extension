import { Suite } from 'mocha';
import { Browser } from 'selenium-webdriver';
import { Anvil } from '../../seeder/anvil';
import { withFixtures } from '../../helpers';
import { WALLET_PASSWORD } from '../../constants';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import TestDappSendEthWithPrivateKey from '../../page-objects/pages/test-dapp-send-eth-with-private-key';

describe('Vulkan', function (this: Suite) {
  it('test', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
      }: {
        driver: Driver;
      }) => {
        await driver.openNewPage('chrome://gpu');
        // to make spec fail
        await driver.findClickableElement('akshjd')
      },
    );
  });
});
