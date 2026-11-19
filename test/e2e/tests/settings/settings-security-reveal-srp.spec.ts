import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { E2E_SRP } from '../../constants';
import RevealSrpPage from '../../page-objects/pages/reveal-srp-page';
import ManageWalletRecoverySettings from '../../page-objects/pages/settings/security-and-password/manage-wallet-recovery-settings';
import { login } from '../../page-objects/flows/login.flow';
import {
  navigateToSecurityAndPassword,
  openRevealSrp,
} from '../../page-objects/flows/settings.flow';

describe('Reveal SRP through settings', function () {
  const testPassword = 'correct horse battery staple';
  const wrongTestPassword = 'test test test test';

  it('should not reveal SRP text with incorrect password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        await navigateToSecurityAndPassword(driver);
        await openRevealSrp(driver);

        const revealSrpPage = new RevealSrpPage(driver);
        await revealSrpPage.completeRevealSrpQuiz();
        await revealSrpPage.fillPasswordToRevealSrp(
          wrongTestPassword,
          'Incorrect password',
        );
      },
    );
  });

  it('completes quiz and reveals SRP text', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        await navigateToSecurityAndPassword(driver);
        await openRevealSrp(driver);

        // fill password to reveal SRP and check the displayed SRP
        const revealSrpPage = new RevealSrpPage(driver);
        await revealSrpPage.completeRevealSrpQuiz();
        await revealSrpPage.fillPasswordToRevealSrp(testPassword);
        await revealSrpPage.checkSrpTextIsDisplayed(E2E_SRP);
        await revealSrpPage.checkDisplayedSrpCanBeCopied();

        // check that closing the reveal SRP page navigates user back to srp list page
        await revealSrpPage.backToSrpList();
        await new ManageWalletRecoverySettings(driver).checkPageIsLoaded();
      },
    );
  });

  it('completes quiz and reveals SRP QR after wrong answers in quiz', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        await navigateToSecurityAndPassword(driver);
        await openRevealSrp(driver);

        // fill password to reveal SRP and check the displayed SRP QR code
        const revealSrpPage = new RevealSrpPage(driver);
        await revealSrpPage.completeRevealSrpQuiz(true);
        await revealSrpPage.fillPasswordToRevealSrp(testPassword);
        await revealSrpPage.checkSrpTextIsDisplayed(E2E_SRP);
        await revealSrpPage.checkSrpQrCodeIsDisplayed();

        // check that closing the reveal SRP page navigates user back to srp list page
        await revealSrpPage.backToSrpList();
        await new ManageWalletRecoverySettings(driver).checkPageIsLoaded();
      },
    );
  });
});
