import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { connectTronTestDapp } from '../../page-objects/flows/tron-dapp.flow';
import { DEFAULT_TRON_ADDRESS_SHORT } from '../../constants';
import { DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withTronAccountSnap } from './common-tron';

describe('Tron Connect - Connect & disconnect - e2e tests', function () {
  it('Connects', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();

        await connectTronTestDapp(driver, testDappTron);

        await testDappTron.findHeaderConnectedState();
        await testDappTron.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);
      },
    );
  });

  it('Connects, disconnects, connects again', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();

        // 1. Connect
        await connectTronTestDapp(driver, testDappTron);

        await testDappTron.findHeaderConnectedState();
        await testDappTron.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);

        // 2. Disconnect
        await testDappTron.disconnect();
        await testDappTron.findHeaderNotConnectedState();

        // // 3. Connect again
        await connectTronTestDapp(driver, testDappTron);

        await testDappTron.switchTo();

        await testDappTron.findHeaderConnectedState();
        await testDappTron.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);
      },
    );
  });

  it('Auto connects after refreshing the page', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();

        await connectTronTestDapp(driver, testDappTron);

        await testDappTron.findHeaderConnectedState();
        await testDappTron.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);

        await driver.refresh();

        await testDappTron.checkPageIsLoaded();

        await testDappTron.findHeaderConnectedState();
        await testDappTron.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);
      },
    );
  });
});
