import { withTronAccountSnap } from './common-tron';
import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { DEFAULT_TRON_ADDRESS_SHORT } from '../../constants';
import {
  DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
  connectTronTestDapp,
  assertConnected,
  assertDisconnected
} from './testHelpers';
import { regularDelayMs } from '../../helpers';

describe('Tron Connect - Connect & disconnect - e2e tests', function () {
  describe(`Tron Connect - Connect & disconnect`, function () {
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
        const connectionStatus = await header.getConnectionStatus();

        assertConnected(connectionStatus);
        
        const connectedAccount = await header.getAccount();

        assertConnected(connectedAccount, DEFAULT_TRON_ADDRESS_SHORT);
      });
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
        const connectionStatus = await header.getConnectionStatus();

        assertConnected(connectionStatus);
        
        const connectedAccount = await header.getAccount();

        assertConnected(connectedAccount, DEFAULT_TRON_ADDRESS_SHORT);

        // 2. Disconnect
        await header.disconnect();

        const connectionStatusAfterDisconnect = await header.getConnectionStatus();
        assertDisconnected(connectionStatusAfterDisconnect);

        // 3. Connect again
        await connectTronTestDapp(driver, testDappTron);

        const connectionStatusAfterConnect = await header.getConnectionStatus();
        assertConnected(connectionStatusAfterConnect);

        const connectedAccountAfterConnect = await header.getAccount();
        assertConnected(connectedAccountAfterConnect, DEFAULT_TRON_ADDRESS_SHORT);
      });
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
        const connectionStatus = await header.getConnectionStatus();

        assertConnected(connectionStatus);
        
        const connectedAccount = await header.getAccount();

        assertConnected(connectedAccount, DEFAULT_TRON_ADDRESS_SHORT);

        await driver.refresh();

        await testDappTron.checkPageIsLoaded();

        await driver.delay(regularDelayMs);

        const connectionStatusAfterRefresh = await header.getConnectionStatus();
        assertConnected(connectionStatusAfterRefresh);

        const connectedAccountAfterRefresh = await header.getAccount();
        assertConnected(connectedAccountAfterRefresh, DEFAULT_TRON_ADDRESS_SHORT);
      });
    });
  })
});
