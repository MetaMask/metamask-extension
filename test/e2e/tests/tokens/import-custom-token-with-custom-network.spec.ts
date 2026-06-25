import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import TokenManagementPage from '../../page-objects/pages/token-management/token-management-page';
import CustomTokenImportPage from '../../page-objects/pages/token-management/custom-token-import-page';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../../constants';

const PULSECHAIN_CHAIN_ID_DECIMAL = 369;
const PULSECHAIN_RPC_URL = 'https://rpc.pulsechain.com';

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

describe('Import custom token on a custom network', function () {
  it('shows the imported token in the wallet after importing on PulseChain', async function () {
    const fixture = new FixtureBuilderV2()
      .withNetworkControllerOnPulseChain()
      .withAssetsController({
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: {
            'eip155:369/slip44:60': { amount: '100' },
          },
        },
      })
      .build();

    await withFixtures(
      {
        fixtures: fixture,
        title: this.test?.fullTitle(),
        testSpecificMock: mockPulseChainRpc,
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });

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

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('100', UFO_SYMBOL);

        // Reload the extension to verify the token persists across sessions.
        await driver.refresh();

        await homePage.checkPageIsLoaded();
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('100', UFO_SYMBOL);
      },
    );
  });
});
