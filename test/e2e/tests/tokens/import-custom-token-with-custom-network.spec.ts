import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../page-objects/pages/dialog/add-network-rpc-url';
import TokenManagementPage from '../../page-objects/pages/token-management/token-management-page';
import CustomTokenImportPage from '../../page-objects/pages/token-management/custom-token-import-page';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { WINDOW_TITLES } from '../../constants';
import { PAGES, type Driver } from '../../webdriver/driver';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

// Disabling the non-EVM account types removes the flood of Bitcoin / Solana /
// Tron background requests that otherwise slow the UI down enough to time out
// in CI. Mirrors the approach in state-persistence.spec.ts.
const NON_EVM_ACCOUNT_FLAG_OVERRIDES = [
  { bitcoinAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { solanaAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { tronAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  {
    enableMultichainAccounts: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
  {
    enableMultichainAccountsState2: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
];

const PULSECHAIN_CHAIN_ID_DECIMAL = 369;
const PULSECHAIN_RPC_URL = 'https://rpc.pulsechain.com';
const PULSECHAIN_NETWORK_NAME = 'PulseChain';
const PULSECHAIN_CURRENCY_SYMBOL = 'PLS';

const UFO_TOKEN_ADDRESS = '0x249e38ea4102d0cf8264d3701f1a0e39c4f2dc3b';
const UFO_SYMBOL = 'UFO';

const SELECTOR_SUPPORTS_INTERFACE = '0x01ffc9a7';
const SELECTOR_BALANCE_OF = '0x70a08231';
const SELECTOR_DECIMALS = '0x313ce567';

// bool(false) — supportsInterface() must return false so the token is not
// classified as an NFT (ERC-721 / ERC-1155).
const ABI_BOOL_FALSE =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

// uint256(100 * 10^18) — mocked UFO token balance (100 tokens with 18 decimals)
const ABI_UINT256_100 =
  '0x0000000000000000000000000000000000000000000000056bc75e2d63100000';

// uint8(18) — token decimals
const ABI_UINT8_18 =
  '0x0000000000000000000000000000000000000000000000000000000000000012';

// ABI-encoded string "UFO" — for name() and symbol()
const ABI_STRING_UFO =
  '0x' +
  '0000000000000000000000000000000000000000000000000000000000000020' +
  '0000000000000000000000000000000000000000000000000000000000000003' +
  '55464f0000000000000000000000000000000000000000000000000000000000';

async function mockPulseChainRpc(mockServer: Mockttp): Promise<void> {
  await mockServer
    .forPost(PULSECHAIN_RPC_URL)
    .always()
    .thenCallback(async (request) => {
      type RpcRequest = { id: number; method: string; params?: unknown[] };
      const body = (await request.body.getJson()) as RpcRequest | RpcRequest[];

      const respond = (id: number, result: unknown) => ({
        statusCode: 200,
        json: { jsonrpc: '2.0', id, result },
      });

      const handle = (id: number, method: string, params?: unknown[]) => {
        switch (method) {
          case 'eth_chainId':
            return respond(id, `0x${PULSECHAIN_CHAIN_ID_DECIMAL.toString(16)}`);
          case 'net_version':
            return respond(id, `${PULSECHAIN_CHAIN_ID_DECIMAL}`);
          case 'eth_blockNumber':
            return respond(id, '0x1');
          case 'eth_getBalance':
            return respond(id, '0x56bc75e2d63100000');
          case 'eth_getTransactionCount':
            return respond(id, '0x0');
          case 'eth_gasPrice':
            return respond(id, '0x3b9aca00');
          case 'eth_call': {
            const data = (params?.[0] as { data?: string })?.data ?? '';
            if (data.startsWith(SELECTOR_SUPPORTS_INTERFACE)) {
              return respond(id, ABI_BOOL_FALSE);
            }
            if (data.startsWith(SELECTOR_BALANCE_OF)) {
              return respond(id, ABI_UINT256_100);
            }
            if (data.startsWith(SELECTOR_DECIMALS)) {
              return respond(id, ABI_UINT8_18);
            }
            return respond(id, ABI_STRING_UFO);
          }
          default:
            return respond(id, null);
        }
      };

      if (Array.isArray(body)) {
        return {
          statusCode: 200,
          json: body.map((req) => ({
            jsonrpc: '2.0',
            id: req.id,
            result: handle(req.id, req.method, req.params).json.result,
          })),
        };
      }
      return handle(body.id, body.method, body.params);
    });
}

// The shared e2e mocks only cover the local node's chainId, so the PulseChain
// (chain 369) token list and spot-price requests fall through to the empty-200
// fallback. An empty/invalid body makes the client retry repeatedly, which adds
// noticeable background load (and slows the already-heavy token UI). Returning
// valid bodies keeps those requests one-shot.
//
// Note: the spot-price echo gives the imported token a fiat value, so the
// aggregated balance at the top of the wallet shows a non-zero amount before
// restart. That aggregate is sourced separately and is not what this test
// asserts (we check the token row amount "100 UFO"), so its value is cosmetic.
async function mockPulseChainAssetApis(mockServer: Mockttp): Promise<void> {
  await mockServer
    .forGet(
      `https://token.api.cx.metamask.io/tokens/${PULSECHAIN_CHAIN_ID_DECIMAL}`,
    )
    .always()
    .thenCallback(() => ({ statusCode: 200, json: [] }));

  // Echo a price for whatever assetIds are requested. Matching by query is
  // brittle here because token assetIds use checksummed (mixed-case) addresses,
  // so we respond generically and case-agnostically instead.
  await mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .always()
    .thenCallback((request) => {
      const assetIds = (new URL(request.url).searchParams.get('assetIds') ?? '')
        .split(',')
        .filter(Boolean);
      return {
        statusCode: 200,
        json: Object.fromEntries(
          assetIds.map((assetId) => [
            assetId,
            { price: 1, marketCap: 0, pricePercentChange1d: 0 },
          ]),
        ),
      };
    });
}

async function testSpecificMock(mockServer: Mockttp): Promise<void> {
  const prodFlags = getProductionRemoteFlagApiResponse();
  await mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: [...prodFlags, ...NON_EVM_ACCOUNT_FLAG_OVERRIDES],
    }));

  await mockPulseChainRpc(mockServer);
  await mockPulseChainAssetApis(mockServer);
}

/**
 * Reads the extension's persisted `storage.local` snapshot from the page.
 *
 * @param driver - The webdriver instance.
 * @returns The parsed `storage.local` contents.
 */
async function readExtensionStorage(
  driver: Driver,
): Promise<Record<string, unknown>> {
  const result = (await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;
    browser.storage.local
      .get(null)
      .then((value) => callback({ value }))
      .catch((error) =>
        callback({ error: error?.message ?? error?.toString?.() ?? error }),
      );
  `)) as { value?: Record<string, unknown>; error?: string };

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.value ?? {};
}

/**
 * Polls extension storage until the imported token has been persisted to
 * `storage.local`.
 *
 * @param driver - The webdriver instance.
 * @param tokenAddress - The imported token's contract address.
 */
async function waitForTokenPersisted(
  driver: Driver,
  tokenAddress: string,
): Promise<void> {
  const needle = tokenAddress.toLowerCase();
  await driver.waitUntil(
    async () => {
      const storage = await readExtensionStorage(driver);
      return JSON.stringify(storage).toLowerCase().includes(needle);
    },
    { interval: 500, timeout: 10000 },
  );
}

/**
 * Fully restarts the extension via `browser.runtime.reload()`.
 *
 * Unlike `driver.refresh()` (which only reloads the UI tab while the background
 * keeps its in-memory state), this restarts the background service worker so
 * controllers must rehydrate from `storage.local`. This is what actually
 * exercises persistence across sessions.
 *
 * @param driver - The webdriver instance.
 */
async function reloadExtension(driver: Driver): Promise<void> {
  const extensionWindow = await driver.driver.getWindowHandle();
  const blankWindow = await driver.openNewPage('about:blank');

  await driver.switchToWindow(extensionWindow);
  await driver.executeScript(
    `(globalThis.browser ?? globalThis.chrome).runtime.reload()`,
  );

  await driver.switchToWindow(blankWindow);
  // A fresh tab is required (notably on Firefox) after the reload kills the
  // extension's tabs.
  await driver.openNewPage('about:blank');

  // Navigating to HOME returns a browser error page until the background has
  // restarted; retry until the extension's title comes back.
  await driver.waitUntil(
    async () => {
      await driver.navigate(PAGES.HOME, { waitForControllers: false });
      const title = await driver.driver.getTitle();
      return title === WINDOW_TITLES.ExtensionInFullScreenView;
    },
    { interval: 100, timeout: 10000 },
  );
}

describe('Import custom token on a custom network', function () {
  it('keeps the imported token after a full extension restart on PulseChain', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock,

        manifestFlags: { testing: { forceExtensionStore: true } },
      },
      async ({ driver }) => {
        // Onboard from scratch (no wallet fixture) so the imported token lives
        // in real storage and survives a genuine background restart.
        await completeImportSRPOnboardingFlow({ driver });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // Add PulseChain as a custom network from the wallet (post-onboarding).
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();

        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField(
          PULSECHAIN_NETWORK_NAME,
        );
        await addEditNetworkModal.fillNetworkChainIdInputField(
          PULSECHAIN_CHAIN_ID_DECIMAL.toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField(
          PULSECHAIN_CURRENCY_SYMBOL,
        );
        await addEditNetworkModal.openAddRpcUrlModal();

        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput(PULSECHAIN_RPC_URL);
        await addRpcUrlModal.fillAddRpcNameInput(PULSECHAIN_NETWORK_NAME);
        await addRpcUrlModal.saveAddRpcUrl();
        try {
          await addEditNetworkModal.saveEditedNetwork();
        } catch (error) {
          // SW-PROBE (diagnostic, probe branch only): distinguish a dead
          // service worker from a slow background call at the stall point.
          const contexts = await driver.executeScript(
            'return chrome.runtime.getContexts({})',
          );
          console.log('SW-PROBE contexts:', JSON.stringify(contexts));
          const ping = await driver.executeScript(
            `return new Promise((resolve) => {
               try {
                 chrome.runtime.sendMessage({ name: 'sw-probe-ping' }, () =>
                   resolve(
                     chrome.runtime.lastError
                       ? 'dead: ' + chrome.runtime.lastError.message
                       : 'alive',
                   ),
                 );
               } catch (err) {
                 resolve('threw: ' + String(err));
               }
             })`,
          );
          console.log('SW-PROBE ping:', ping);
          await driver.delay(30000);
          const persisted = await driver.executeScript(
            `return chrome.storage.local.get('data').then((s) =>
               JSON.stringify(
                 Object.keys(
                   s.data?.NetworkController?.networkConfigurationsByChainId ??
                     {},
                 ),
               ),
             )`,
          );
          console.log('SW-PROBE network keys after 30s:', persisted);
          const contexts2 = await driver.executeScript(
            'return chrome.runtime.getContexts({})',
          );
          console.log(
            'SW-PROBE contexts after 30s:',
            JSON.stringify(contexts2),
          );
          throw error;
        }

        await selectNetworkDialog.checkAddNetworkMessageIsDisplayed(
          PULSECHAIN_NETWORK_NAME,
        );
        await selectNetworkDialog.clickCloseButton();
        await homePage.checkPageIsLoaded();

        // Switch the active network to PulseChain so the "Add a custom token"
        // page defaults to it.
        await switchToNetworkFromNetworkSelect(
          driver,
          'Custom',
          PULSECHAIN_NETWORK_NAME,
        );
        await homePage.checkPageIsLoaded();

        const tokensTab = new TokensTab(driver);
        await tokensTab.clickTokenOptionsButton();
        await tokensTab.clickManageTokens();

        const tokenManagementPage = new TokenManagementPage(driver);
        await tokenManagementPage.checkPageIsLoaded();
        await tokenManagementPage.clickAddCustomToken();

        const customTokenImportPage = new CustomTokenImportPage(driver);
        await customTokenImportPage.checkPageIsLoaded();
        await customTokenImportPage.importToken(UFO_TOKEN_ADDRESS);

        await tokenManagementPage.checkPageIsLoaded();
        await tokenManagementPage.checkSuccessToastIsDisplayed();
        await tokenManagementPage.goBackToHomepage();

        await homePage.checkPageIsLoaded();
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('100', UFO_SYMBOL);

        await waitForTokenPersisted(driver, UFO_TOKEN_ADDRESS);

        // Fully restart the extension (not just the UI tab) so controllers
        // rehydrate from storage. This is what reproduces the incident where
        // imported assets on custom networks disappear after a real restart.
        await reloadExtension(driver);
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });

        await homePage.checkPageIsLoaded();
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('100', UFO_SYMBOL);
      },
    );
  });
});
