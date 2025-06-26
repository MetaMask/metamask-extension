import { Suite } from 'mocha';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { assertRejectedSignature } from '../confirmations/signatures/signature-helpers';
import { withSignatureFixtures } from '../confirmations/helpers';
import { TestSuiteArguments } from '../confirmations/transactions/shared';
import TestDapp from '../../page-objects/pages/test-dapp';
import { openTestSnapClickButtonAndInstall } from '../../page-objects/flows/install-test-snap.flow';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { mockLookupSnap } from '../../mock-response-data/snaps/snap-binary-mocks';
import Petnames from './petnames-helpers';

const WINDOW_TITLES = {
  Dialog: 'MetaMask Notification',
  TestDApp: 'E2E Test Dapp',
};

describe('Petnames - Signatures', function (this: Suite) {
  it('can save names for addresses in type 3 signatures', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        const testDapp = new TestDapp(driver);
        const petnames = new Petnames(driver);
        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSignTypedDatav3();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await petnames.expectName('0xCD2a3...DD826', false);
        await petnames.expectName('0xbBbBB...bBBbB', false);
        await petnames.saveName('0xCD2a3...DD826', undefined, 'test.lens');
        await petnames.saveName('0xbBbBB...bBBbB', undefined, 'test2.lens');
        await petnames.expectName('0xCcCCc...ccccC', false);
        await petnames.saveName('0xCcCCc...ccccC', 'Custom Name');
        await assertRejectedSignature();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSignTypedDatav3();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await petnames.expectName('test.lens', true);
        await petnames.expectName('test2.lens', true);
        await petnames.expectName('Custom Name', true);
      },
    );
  });

  it('can save names for addresses in type 4 signatures', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        const testDapp = new TestDapp(driver);
        const petnames = new Petnames(driver);
        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSignTypedDatav4();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await petnames.expectName('0xCD2a3...DD826', false);
        await petnames.expectName('0xDeaDb...DbeeF', false);
        await petnames.expectName('0xbBbBB...bBBbB', false);
        await petnames.expectName('0xB0Bda...bEa57', false);
        await petnames.expectName('0xB0B0b...00000', false);
        await petnames.saveName('0xCD2a3...DD826', undefined, 'test.lens');
        await petnames.saveName('0xB0Bda...bEa57', undefined, 'Test Token 2');
        await petnames.expectName('0xCcCCc...ccccC', false);
        await petnames.saveName('0xCcCCc...ccccC', 'Custom Name');
        await assertRejectedSignature();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSignTypedDatav4();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await petnames.expectName('test.lens', true);
        await petnames.expectName('Test Toke...', true);
        await petnames.expectName('Custom Name', true);
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
        title: this.test ? this.test.fullTitle() : 'Default Title',
      },
      async ({ driver }) => {
        const testDapp = new TestDapp(driver);
        const petnames = new Petnames(driver);
        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappPage();
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNameLookUpButton',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSignTypedDatav4();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await petnames.expectProposedNames('0xCD2a3...DD826', [
          ['test.lens', 'Lens Protocol'],
          ['cd2.1337.test.domain', 'Name Lookup Example Snap'],
        ]);
      },
    );
  });
});
