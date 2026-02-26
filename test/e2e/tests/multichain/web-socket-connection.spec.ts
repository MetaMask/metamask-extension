import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import WebSocketRegistry from '../../websocket/registry';

describe('Multichain account Web Socket', function (this: Suite) {
  it('a websocket connection is open when MetaMask full view is open', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerComponent = new HeaderNavbar(driver);
        const accountListPage = new AccountListPage(driver);
        await headerComponent.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();

        await waitForWebsocketConnections(driver, 2);
      },
    );
  });

  it('the websocket connection is maintained for a grace period when MetaMask window is closed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerComponent = new HeaderNavbar(driver);
        const accountListPage = new AccountListPage(driver);
        await headerComponent.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();

        // Open a blank page to prevent browser from closing
        await driver.openNewPage('about:blank');

        // Switch back to MetaMask window and close it
        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForWebsocketConnections(driver, 2);
      },
    );
  });

  it('websocket connection is shared between multiple MetaMask windows', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerComponent = new HeaderNavbar(driver);
        await headerComponent.openAccountMenu();

        await waitForWebsocketConnections(driver, 2);

        // Open a blank page to prevent browser from closing
        await driver.openNewPage('about:blank');

        // Open a new MetaMask window
        await driver.openNewPage(`${driver.extensionUrl}/home.html`);

        await waitForWebsocketConnections(driver, 2);

        // Close the first MetaMask window
        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForWebsocketConnections(driver, 2);

        // Close the second MetaMask window
        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForWebsocketConnections(driver, 1, ['solana']);

        // The websocket close grace period is 5 minutes, we can't wait for this long to check if it's closed
      },
    );
  });
});

async function waitForWebsocketConnections(
  driver: Driver,
  expectedCount: number,
  expectedServices: string[] = ['solana', 'accountActivity'],
) {
  let connectionCount: number | undefined;
  let openConnections: { name: string; port: number; count: number }[] = [];
  const sortedExpected = [...expectedServices].sort();

  await driver.wait(async () => {
    openConnections = WebSocketRegistry.getOpenConnections();
    connectionCount = WebSocketRegistry.getTotalConnectionCount();
    const openNames = openConnections.map((c) => c.name).sort();
    return (
      connectionCount === expectedCount &&
      JSON.stringify(openNames) === JSON.stringify(sortedExpected)
    );
  }, 30000);

  assert.equal(
    connectionCount,
    expectedCount,
    `Expected ${expectedCount} websocket connections, but found ${connectionCount}. ` +
      `Open: ${JSON.stringify(openConnections)}`,
  );

  const openNames = openConnections.map((c) => c.name).sort();
  assert.deepEqual(
    openNames,
    sortedExpected,
    `Expected services ${JSON.stringify(expectedServices)} but found ${JSON.stringify(openNames)}`,
  );
}
