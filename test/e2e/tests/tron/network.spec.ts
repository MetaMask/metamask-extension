import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { startHeldFixtures } from '../../fixtures/held-fixtures';
import type { HeldFixturesSession } from '../../fixtures/held-fixtures';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import SelectNetworkModal from '../../page-objects/pages/networks/select-network-modal';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import { TRON_CHAIN_ID, mockTronFeatureFlags } from './mocks/common-tron';

const TRON_NILE_NAME = 'Tron Nile';
const TRON_SHASTA_NAME = 'Tron Shasta';

function buildTronNetworkFixture() {
  return new FixtureBuilderV2()
    .withPreferencesController({
      preferences: { showTestNetworks: true },
    })
    .build();
}

async function mockTronNetworkFlags(mockServer: Mockttp) {
  return [await mockTronFeatureFlags(mockServer)];
}

async function closeNetworkPickerIfOpen(driver: Driver): Promise<void> {
  const selectNetworkModal = new SelectNetworkModal(driver);
  await selectNetworkModal.close().catch(() => undefined);
}

describe('Tron - Network', function (this: Suite) {
  this.timeout(180_000);

  describe('default wallet', function () {
    let driver: Driver;
    let firstFailure: unknown;
    let session: HeldFixturesSession | undefined;

    before(async function () {
      session = await startHeldFixtures({
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.parent?.fullTitle() ?? 'Tron - Network default',
        localNodeOptions: ['anvil'],
        testSpecificMock: mockTronNetworkFlags,
        manifestFlags: {
          remoteFeatureFlags: {
            neNetworkDiscoverButton: {
              [TRON_CHAIN_ID]: true,
            },
          },
        },
      });
      driver = session.context.driver;
      try {
        await login(driver);
      } catch (error) {
        firstFailure = error;
        throw error;
      }
    });

    beforeEach(function () {
      if (firstFailure) {
        this.skip();
      }
    });

    afterEach(function () {
      if (this.currentTest?.state === 'failed' && !firstFailure) {
        firstFailure = this.currentTest.err;
      }
    });

    after(async function () {
      if (!session) {
        return;
      }
      await session.release(firstFailure);
    });

    it('shows Tron in the home network filter', async function () {
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);
      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.checkNetworkIsListed('Tron');
      await selectNetworkModal.close();
    });

    it('shows Tron in the Tokens tab network selector', async function () {
      const home = new HomePage(driver);
      await home.goToTokensTab();
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);
      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.checkNetworkIsListed('Tron');
      await selectNetworkModal.close();
    });

    it('Shows Tron on Networks page', async function () {
      const headerNavbar = new HeaderNavbar(driver);
      const networksPage = new NetworksPage(driver);
      const homePage = new HomePage(driver);

      await headerNavbar.openGlobalNetworksMenu();
      await networksPage.checkPageIsLoaded();
      await networksPage.fillNetworkSearchInput('Tron');
      await networksPage.openNetworkListOptions(TRON_CHAIN_ID);
      await networksPage.checkDiscoverButtonIsVisible();
      await driver.navigate();
      await homePage.checkPageIsLoaded();
    });

    it('selects Tron from the home network filter', async function () {
      await closeNetworkPickerIfOpen(driver);
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);

      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.selectNetworkByChainId(TRON_CHAIN_ID);
      await networkFilter.checkLabelIs('Tron');
    });
  });

  describe('test networks enabled', function () {
    let driver: Driver;
    let firstFailure: unknown;
    let session: HeldFixturesSession | undefined;

    before(async function () {
      session = await startHeldFixtures({
        fixtures: buildTronNetworkFixture(),
        title: this.test?.parent?.fullTitle() ?? 'Tron - Network testnets',
        localNodeOptions: ['anvil'],
        testSpecificMock: mockTronNetworkFlags,
      });
      driver = session.context.driver;
      try {
        await login(driver);
      } catch (error) {
        firstFailure = error;
        throw error;
      }
    });

    beforeEach(function () {
      if (firstFailure) {
        this.skip();
      }
    });

    afterEach(function () {
      if (this.currentTest?.state === 'failed' && !firstFailure) {
        firstFailure = this.currentTest.err;
      }
    });

    after(async function () {
      if (!session) {
        return;
      }
      await session.release(firstFailure);
    });

    it('shows Tron Nile when test networks are enabled', async function () {
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);
      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.checkNetworkIsListed(TRON_NILE_NAME);
      await selectNetworkModal.close();
    });

    it('shows Tron Shasta when test networks are enabled', async function () {
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);
      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.checkNetworkIsListed(TRON_SHASTA_NAME);
      await selectNetworkModal.close();
    });
  });
});
