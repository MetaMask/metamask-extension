import { Suite } from 'mocha';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { withSignatureFixtures } from '../confirmations/helpers';
import { TestSuiteArguments } from '../confirmations/transactions/shared';
import TestDapp from '../../page-objects/pages/test-dapp';
import { openTestSnapClickButtonAndInstall } from '../../page-objects/flows/install-test-snap.flow';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { mockLookupSnap } from '../../mock-response-data/snaps/snap-binary-mocks';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';

describe('Petnames - Signatures', function (this: Suite) {
  it('can save names for addresses in type 3 signatures', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSignTypedDatav3();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.check_nameIsDisplayed('0xCD2a3...DD826', false);
        await confirmation.check_nameIsDisplayed('0xbBbBB...bBBbB', false);
        await confirmation.saveName({
          value: '0xCD2a3...DD826',
          proposedName: 'test.lens',
        });
        await confirmation.saveName({
          value: '0xbBbBB...bBBbB',
          proposedName: 'test2.lens',
        });
        await confirmation.check_nameIsDisplayed('0xCcCCc...ccccC', false);
        await confirmation.saveName({
          value: '0xCcCCc...ccccC',
          name: 'Custom Name',
        });
        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSignTypedDatav3();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.check_nameIsDisplayed('test.lens', true);
        await confirmation.check_nameIsDisplayed('test2.lens', true);
        await confirmation.check_nameIsDisplayed('Custom Name', true);
      },
    );
  });

  it('can save names for addresses in type 4 signatures', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSignTypedDatav4();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.check_nameIsDisplayed('0xCD2a3...DD826', false);
        await confirmation.check_nameIsDisplayed('0xDeaDb...DbeeF', false);
        await confirmation.check_nameIsDisplayed('0xbBbBB...bBBbB', false);
        await confirmation.check_nameIsDisplayed('0xB0Bda...bEa57', false);
        await confirmation.check_nameIsDisplayed('0xB0B0b...00000', false);
        await confirmation.saveName({
          value: '0xCD2a3...DD826',
          proposedName: 'test.lens',
        });
        await confirmation.saveName({
          value: '0xB0Bda...bEa57',
          proposedName: 'Test Token 2',
        });
        await confirmation.check_nameIsDisplayed('0xCcCCc...ccccC', false);
        await confirmation.saveName({
          value: '0xCcCCc...ccccC',
          name: 'Custom Name',
        });
        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSignTypedDatav4();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.check_nameIsDisplayed('test.lens', true);
        await confirmation.check_nameIsDisplayed('Test Toke...', true);
        await confirmation.check_nameIsDisplayed('Custom Name', true);
      },
    );
  });

  it('can propose names using installed snaps', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withNoNames()
          .build(),
        testSpecificMock: mockLookupSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappPage();
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNameLookUpButton',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSignTypedDatav4();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.check_proposedNames('0xCD2a3...DD826', [
          ['test.lens', 'Lens Protocol'],
          ['cd2.1337.test.domain', 'Name Lookup Example Snap'],
        ]);
      },
    );
  });
});
