/**
 * Send ERC20 - Gas Customization Tests
 *
 * Tests for ERC20 token transfers with custom gas settings:
 * - Custom gas values from extension
 * - Custom gas values from dApp
 * - Transfers without specifying gas
 */

import { Mockttp } from 'mockttp';
import { mockedSourcifyTokenSend } from '../confirmations/helpers';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { login } from '../../page-objects/flows/login.flow';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import TestDapp from '../../page-objects/pages/test-dapp';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/token-transfer-confirmation';
import GasFeeModal from '../../page-objects/pages/confirmations/gas-fee-modal';
import SendPage from '../../page-objects/pages/send/send-page';

const recipientAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Send ERC20 - Gas Customization', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const symbol = 'TST';
  const valueWithSymbol = (value: string) => `${value} ${symbol}`;
  const GAS_LIMIT = '60000';
  const GAS_PRICE = '10';

  it('sends with custom gas from extension', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().build(),
        localNodeOptions: { hardfork: 'muirGlacier' },
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mocks,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        const sendPage = new SendPage(driver);
        const tokenTransferRedesignedConfirmPage =
          new TokenTransferTransactionConfirmation(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);

        await homePage.checkPageIsLoaded();
        await assetListPage.importCustomTokenByChain(
          '0x539',
          '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        );
        // go to custom tokens view on extension, perform send tokens
        await assetListPage.openTokenDetails(symbol);
        await assetListPage.clickSendButton();

        await sendPage.fillRecipient(recipientAddress);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        // check transaction details
        const expectedNetworkFee = '0.0001';
        await tokenTransferRedesignedConfirmPage.checkTokenTransferPageIsLoaded(
          '1',
          symbol,
          expectedNetworkFee,
        );

        // edit gas fee using the new gas fee modal
        await tokenTransferRedesignedConfirmPage.openGasFeeModal();
        await gasFeeModal.setCustomLegacyGasFee({
          gasPrice: GAS_PRICE,
          gasLimit: GAS_LIMIT,
        });

        await tokenTransferRedesignedConfirmPage.checkGasFee('0.0005');
        await tokenTransferRedesignedConfirmPage.clickConfirmButton();

        // check that transaction has completed correctly and is displayed in the activity list
        await homePage.goToActivityList();
        await activityListPage.checkTxAction({ action: `Sent ${symbol}` });
        await activityListPage.checkTxAmountInActivity(valueWithSymbol('-1'));

        // check token amount is correct after transaction
        await homePage.goToTokensTab();
        await assetListPage.checkTokenExistsInList(
          symbol,
          valueWithSymbol('9'),
          { amountTimeout: 20000 },
        );
      },
    );
  });

  it('sends with custom gas from dApp', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'muirGlacier' },
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mocks,
      },
      async ({ driver, contractRegistry, localNodes }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await login(driver, { localNode: localNodes[0] });

        const testDapp = new TestDapp(driver);
        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        const tokenTransferRedesignedConfirmPage =
          new TokenTransferTransactionConfirmation(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);

        await homePage.checkPageIsLoaded();
        await assetListPage.importCustomTokenByChain(
          '0x539',
          '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        );
        // transfer token from dapp
        await testDapp.openTestDappPage({ contractAddress });
        await testDapp.checkPageIsLoaded();
        await testDapp.clickTransferTokens();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // check transaction details
        const expectedNetworkFee = '0.0001';
        await tokenTransferRedesignedConfirmPage.checkTokenTransferPageIsLoaded(
          '1.5',
          symbol,
          expectedNetworkFee,
        );

        // edit gas fee using the new gas fee modal
        await tokenTransferRedesignedConfirmPage.openGasFeeModal();
        await gasFeeModal.setCustomLegacyGasFee({
          gasPrice: GAS_PRICE,
          gasLimit: GAS_LIMIT,
        });
        await tokenTransferRedesignedConfirmPage.clickConfirmButton();

        // in extension, check that transaction has completed correctly and is displayed in the activity list
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homePage.goToActivityList();
        await activityListPage.checkTxAction({ action: `Sent ${symbol}` });
        await activityListPage.checkTxAmountInActivity(valueWithSymbol('-1.5'));

        // check token amount is correct after transaction
        await homePage.goToTokensTab();
        await assetListPage.checkTokenExistsInList(
          symbol,
          valueWithSymbol('8.5'),
          { amountTimeout: 20000 },
        );
      },
    );
  });

  it('sends from dApp without specifying gas', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mocks,
      },
      async ({ driver, contractRegistry, localNodes }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await login(driver, { localNode: localNodes[0] });

        const testDapp = new TestDapp(driver);
        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        const tokenTransferRedesignedConfirmPage =
          new TokenTransferTransactionConfirmation(driver);
        const activityListPage = new ActivityListPage(driver);

        await homePage.checkPageIsLoaded();
        await assetListPage.importCustomTokenByChain(
          '0x539',
          '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        );
        // transfer token from dapp
        await driver.openNewPage(`${DAPP_URL}/?contract=${contractAddress}`);

        await testDapp.checkPageIsLoaded();
        await testDapp.clickTransferTokensWithoutGas();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // check transaction details and confirm
        const expectedNetworkFee = '0.001';
        await tokenTransferRedesignedConfirmPage.checkTokenTransferPageIsLoaded(
          '1.5',
          symbol,
          expectedNetworkFee,
        );
        await tokenTransferRedesignedConfirmPage.clickConfirmButton();

        // in extension, check that transaction has completed correctly and is displayed in the activity list
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homePage.goToActivityList();
        await activityListPage.checkTxAction({ action: `Sent ${symbol}` });
        await activityListPage.checkTxAmountInActivity(valueWithSymbol('-1.5'));

        // check token amount is correct after transaction
        await homePage.goToTokensTab();
        await assetListPage.checkTokenExistsInList(
          symbol,
          valueWithSymbol('8.5'),
          { amountTimeout: 20000 },
        );
      },
    );
  });

  async function mocks(server: Mockttp) {
    return [
      await mockedSourcifyTokenSend(server),
      await server
        .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
        .always()
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            // Localhost chain 1337 native token uses slip44:1
            'eip155:1337/slip44:1': {
              id: 'ethereum',
              price: 3401,
              marketCap: 0,
              pricePercentChange1d: 0,
            },
            // TST token on localhost chain 1337
            'eip155:1337/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947': {
              price: 0.5,
              marketCap: 0,
              pricePercentChange1d: 0,
            },
          },
        })),
      await server
        .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
        .always()
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            usd: {
              name: 'US Dollar',
              ticker: 'usd',
              value: 1,
              currencyType: 'fiat',
            },
            eth: {
              name: 'Ether',
              ticker: 'eth',
              value: 1 / 3401,
              currencyType: 'crypto',
            },
          },
        })),
      await server
        .forGet('https://accounts.api.cx.metamask.io/v2/supportedNetworks')
        .always()
        .thenJson(200, {
          fullSupport: [],
          partialSupport: { balances: [] },
        }),
      await server
        .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
        .always()
        .thenCallback((request) => {
          const url = new URL(request.url);
          const assetIds = url.searchParams.getAll('assetIds').join(',');
          const results = [];

          if (assetIds.includes('eip155:1337')) {
            results.push({
              assetId: 'eip155:1337/slip44:1',
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            });
          }

          if (
            assetIds.includes(
              'eip155:1337/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947',
            ) ||
            assetIds.includes(
              'eip155:1337/erc20:0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
            )
          ) {
            results.push({
              assetId:
                'eip155:1337/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947',
              name: 'Test Standard Token',
              symbol: 'TST',
              decimals: 18,
            });
          }

          return { statusCode: 200, json: { data: results } };
        }),
    ];
  }
});
