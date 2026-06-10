import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import { connectStellarTestDapp } from '../../page-objects/flows/stellar-dapp.flow';
import { DEFAULT_STELLAR_ADDRESS_SHORT } from '../../constants';
import { DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withStellarAccountSnap } from './common-stellar';

describe('Stellar Connect - Connect & disconnect - e2e tests', function () {
  it('Connects', async function () {
    await withStellarAccountSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappStellar = new TestDappStellar(driver);

        await testDappStellar.openTestDappPage();

        await connectStellarTestDapp(driver, testDappStellar);

        await testDappStellar.findHeaderConnectedState();
        await testDappStellar.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);
      },
    );
  });

  it('Connects, disconnects, connects again', async function () {
    await withStellarAccountSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappStellar = new TestDappStellar(driver);

        await testDappStellar.openTestDappPage();

        await connectStellarTestDapp(driver, testDappStellar);

        await testDappStellar.findHeaderConnectedState();
        await testDappStellar.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);

        await testDappStellar.disconnect();
        await testDappStellar.findHeaderNotConnectedState();

        await connectStellarTestDapp(driver, testDappStellar);

        await testDappStellar.findHeaderConnectedState();
        await testDappStellar.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);
      },
    );
  });

  it('Auto connects after refreshing the page', async function () {
    await withStellarAccountSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappStellar = new TestDappStellar(driver);

        await testDappStellar.openTestDappPage();

        await connectStellarTestDapp(driver, testDappStellar);

        await testDappStellar.findHeaderConnectedState();
        await testDappStellar.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);

        await driver.refresh();

        await testDappStellar.checkPageIsLoaded();

        await testDappStellar.findHeaderConnectedState();
        await testDappStellar.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);
      },
    );
  });
});
