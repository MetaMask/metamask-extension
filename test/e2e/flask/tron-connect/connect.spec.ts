import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { connectTronTestDapp } from '../../page-objects/flows/tron-dapp.flow';
import { DEFAULT_TRON_ADDRESS_SHORT } from '../../constants';
import { DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withTronAccountSnap } from './common-tron';

describe('Tron Connect - Connect & disconnect - e2e tests', function () {
  it('Should be able to connect', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();
        await testDappTron.checkPageIsLoaded();
        await testDappTron.switchTo();

        await connectTronTestDapp(driver, testDappTron);

        const header = await testDappTron.getHeader();
        await header.findHeaderConnectedState();
        await header.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);
      },
    );
  });

  it('Should be able to disconnect and connect again', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();
        await testDappTron.checkPageIsLoaded();
        await testDappTron.switchTo();

        // 1. Connect
        await connectTronTestDapp(driver, testDappTron);

        const header = await testDappTron.getHeader();
        await header.findHeaderConnectedState();
        await header.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);

        // 2. Disconnect
        await header.disconnect();
        await header.findHeaderNotConnectedState();

        // // 3. Connect again
        await connectTronTestDapp(driver, testDappTron);

        await testDappTron.switchTo();

        await header.findHeaderConnectedState();
        await header.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);
      },
    );
  });

  it('Should not disconnect the dapp after refreshing the page', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();
        await testDappTron.checkPageIsLoaded();
        await testDappTron.switchTo();

        await connectTronTestDapp(driver, testDappTron);

        const header = await testDappTron.getHeader();
        await header.findHeaderConnectedState();
        await header.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);

        await driver.refresh();

        await testDappTron.checkPageIsLoaded();

        await header.findHeaderConnectedState();
        await header.findConnectedAccount(DEFAULT_TRON_ADDRESS_SHORT);
      },
    );
  });
});
