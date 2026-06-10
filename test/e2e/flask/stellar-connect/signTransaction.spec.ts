import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import {
  confirmStellarSnapSignTransaction,
  connectStellarTestDapp,
} from '../../page-objects/flows/stellar-dapp.flow';
import { DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withStellarAccountSnap } from './common-stellar';

describe('Stellar Connect - Sign Transaction - e2e tests', function () {
  it('Signs a transaction', async function () {
    await withStellarAccountSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappStellar = new TestDappStellar(driver);

        await testDappStellar.openTestDappPage();

        await connectStellarTestDapp(driver, testDappStellar);

        await testDappStellar.loadExampleTransactionXdr();
        await testDappStellar.signTransaction();

        await confirmStellarSnapSignTransaction(driver);

        await testDappStellar.switchTo();
        await testDappStellar.findSignedTransactionPresent();
      },
    );
  });
});
