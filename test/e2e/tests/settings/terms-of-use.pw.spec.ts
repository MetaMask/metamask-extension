// eslint-disable-next-line @typescript-eslint/no-shadow -- @playwright/test exports `test` as a callable namespace; the global `test` is Mocha's
import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import TermsOfUseUpdateModal from '../../page-objects/pages/dialog/terms-of-use-update-modal';

pwTest.describe('Terms of use', () => {
  pwTest(
    'accepts the updated terms of use',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      const firstOfJan = 1672574400;
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withAppStateController({
              termsOfUseLastAgreed: firstOfJan,
            })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });

          const updateTermsOfUseModal = new TermsOfUseUpdateModal(driver);
          await updateTermsOfUseModal.checkPageIsLoaded();
          await updateTermsOfUseModal.confirmAcceptTermsOfUseUpdate();
        },
      );
    },
  );
});
