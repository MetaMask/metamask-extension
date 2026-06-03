import { Suite } from 'mocha';
import { SolScope } from '@metamask/keyring-api';

import {
  DAPP_PATH,
  DAPP_URL,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  DEFAULT_FIXTURE_SOLANA_ACCOUNT,
  LOCALHOST_NETWORK_CLIENT_ID,
  MM_CONNECT_EVM_CHAINS,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { approveConnect } from '../../page-objects/flows/connect.flow';
import { connectSolanaTestDapp } from '../../flask/solana-wallet-standard/testHelpers';
import { Driver, PAGES } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { TestDappMmConnect as TestDapp } from '../../page-objects/pages/test-dapp-mm-connect';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';

// ── Shared fixture options ─────────────────────────────────────────────────

const EVM_AND_SOLANA_FIXTURE_SCOPES_WITH_EIP1193_COMPATIBLE = {
  isMultichainOrigin: true,
  requiredScopes: {},
  optionalScopes: {
    'eip155:1337': {
      accounts: [`eip155:1337:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`],
    },
    'wallet:eip155': {
      accounts: [`wallet:eip155:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`],
    },
    [SolScope.Mainnet]: {
      accounts: [`${SolScope.Mainnet}:${DEFAULT_FIXTURE_SOLANA_ACCOUNT}`],
    },
  },
  sessionProperties: { 'eip1193-compatible': true },
};

const EVM_AND_SOLANA_FIXTURE_SCOPES_WITHOUT_EIP1193_COMPATIBLE = {
  ...EVM_AND_SOLANA_FIXTURE_SCOPES_WITH_EIP1193_COMPATIBLE,
  sessionProperties: {},
};

// ── Shared helpers ─────────────────────────────────────────────────────────

/**
 * Open the MetaMask popup with the test dapp as `activeTabOrigin`. The
 * `DappConnectionControlBar` is only rendered when the wallet popup has a
 * non-empty active tab origin, so this is the only way to drive its
 * conditional render in E2E tests.
 *
 * @param driver - Selenium driver
 * @returns A `HeaderNavbar` page object scoped to the popup window.
 */
async function openPopupForDapp(driver: Driver): Promise<HeaderNavbar> {
  await driver.openNewPage(
    `${driver.extensionUrl}/${PAGES.POPUP}.html?activeTabOrigin=${DAPP_URL}`,
  );
  return new HeaderNavbar(driver);
}

describe('DappConnectionControlBar - network picker visibility', function (this: Suite) {
  describe('single-provider connections', function (this: Suite) {
    it('renders the network picker after connect-evm Legacy EVM connection', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_MM_CONNECT],
          },
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();

          // Legacy EVM uses wallet_requestPermissions, which the extension's
          // chain-agnostic-permission middleware converts into a CAIP-25
          // caveat with `eip1193-compatible: true`.
          await testDapp.connectLegacy();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkLegacyCardVisible();

          const headerNavbar = await openPopupForDapp(driver);
          await headerNavbar.checkDappNetworkButtonVisible();
        },
      );
    });

    it('renders the network picker after connect-evm Wagmi connection', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_MM_CONNECT],
          },
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();

          // Wagmi goes through @metamask/connect-evm which explicitly sends
          // sessionProperties['eip1193-compatible'] = true in its
          // wallet_createSession call.
          await testDapp.connectWagmi();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkWagmiCardVisible();

          const headerNavbar = await openPopupForDapp(driver);
          await headerNavbar.checkDappNetworkButtonVisible();
        },
      );
    });

    it('does not render the network picker after a pure Multichain API connection with EVM scopes only', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_MM_CONNECT],
          },
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();

          // Pure multichain wallet_createSession does NOT send
          // eip1193-compatible. Even though only EVM scopes are requested,
          // the picker must stay hidden.
          await testDapp.selectNetworks([
            MM_CONNECT_EVM_CHAINS.LOCALHOST,
            MM_CONNECT_EVM_CHAINS.POLYGON,
          ]);
          await testDapp.clickConnect();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkConnectionStatus('connected');

          const headerNavbar = await openPopupForDapp(driver);
          await headerNavbar.checkDappNetworkButtonNotVisible();
        },
      );
    });

    it('does not render the network picker after a Solana-only Wallet Standard connection', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
          },
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);

          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          await connectSolanaTestDapp(driver, testDapp);

          const headerNavbar = await openPopupForDapp(driver);
          await headerNavbar.checkDappNetworkButtonNotVisible();
        },
      );
    });
  });

  describe('reconnection / session property preservation', function (this: Suite) {
    it('shows the network picker after upgrading a pure Multichain connection with connect-evm', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_MM_CONNECT],
          },
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();

          // 1. Pure Multichain connection — eip1193-compatible NOT set.
          await testDapp.selectNetworks([MM_CONNECT_EVM_CHAINS.LOCALHOST]);
          await testDapp.clickConnect();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkConnectionStatus('connected');

          const headerNavbarBefore = await openPopupForDapp(driver);
          await headerNavbarBefore.checkDappNetworkButtonNotVisible();
          await driver.closeWindow();

          // 2. Same origin reconnects via the window.ethereum EIP-1193
          // entrypoint. The Legacy EVM button is hidden by the playground
          // dapp while a multichain session is active, so we use the
          // window.ethereum button instead. The EIP-1193 path injects
          // `eip1193-compatible: true` into the existing CAIP-25 caveat, so
          // the picker must become visible.
          await testDapp.switchTo();
          await testDapp.connectWindowEthereum();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkLegacyCardVisible();

          const headerNavbarAfter = await openPopupForDapp(driver);
          await headerNavbarAfter.checkDappNetworkButtonVisible();
        },
      );
    });
  });

  describe('mixed-provider origins', function (this: Suite) {
    // These tests pre-seed combined EVM + Solana CAIP-25 caveats via the
    // fixture builder so they isolate the picker's gating logic from the
    // exact sequence used to reach that state in the wild (e.g. connect-evm
    // followed by Solana Wallet Standard). The per-domain selected network
    // (set by the wallet during a real connect) is also seeded so the only
    // variable across these two tests is `sessionProperties['eip1193-compatible']`.

    it('renders the network picker when EVM and Solana scopes coexist with eip1193-compatible set', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp({
              scopes: EVM_AND_SOLANA_FIXTURE_SCOPES_WITH_EIP1193_COMPATIBLE,
            })
            .withSelectedNetworkController({
              domains: { [DAPP_URL]: LOCALHOST_NETWORK_CLIENT_ID },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);

          const headerNavbar = await openPopupForDapp(driver);
          await headerNavbar.checkDappNetworkButtonVisible();
        },
      );
    });

    it('does not render the network picker when EVM and Solana scopes coexist without eip1193-compatible', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp({
              scopes: EVM_AND_SOLANA_FIXTURE_SCOPES_WITHOUT_EIP1193_COMPATIBLE,
            })
            .withSelectedNetworkController({
              domains: { [DAPP_URL]: LOCALHOST_NETWORK_CLIENT_ID },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);

          const headerNavbar = await openPopupForDapp(driver);
          await headerNavbar.checkDappNetworkButtonNotVisible();
        },
      );
    });
  });
});
