import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import TermsOfUseUpdateModal from '../../page-objects/pages/dialog/terms-of-use-update-modal';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Terms of use', function (this: Suite) {
  it('accepts the updated terms of use', async function () {
    const firstOfJan = 1672574400;
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            termsOfUseLastAgreed: firstOfJan,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        // Delay click to mitigate flakiness
        await driver.delay(1_000);

        // accept updated terms of use
        const updateTermsOfUseModal = new TermsOfUseUpdateModal(driver);
        await updateTermsOfUseModal.checkPageIsLoaded();
        await updateTermsOfUseModal.confirmAcceptTermsOfUseUpdate();
      },
    );
  });
});
