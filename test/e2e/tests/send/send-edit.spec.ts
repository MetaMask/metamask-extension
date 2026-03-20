/**
 * Send - Edit Transaction Tests
 *
 * Tests for editing a send transaction:
 * - Going back from confirm page to edit amount and gas values
 * - Legacy and EIP1559 gas editing
 */

import { strict as assert } from 'assert';
import { MockttpServer } from 'mockttp';
import { login } from '../../page-objects/flows/login.flow';
import { createInternalTransaction } from '../../page-objects/flows/transaction';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import GasFeeModal from '../../page-objects/pages/confirmations/gas-fee-modal';
import SendTokenConfirmPage from '../../page-objects/pages/send/send-token-confirmation-page';
import SendPage from '../../page-objects/pages/send/send-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { mockPriceApi } from '../tokens/utils/mocks';
import { CHAIN_IDS } from '../../../../shared/constants/network';

const PREFERENCES_STATE_MOCK = {
  preferences: {
    showFiatInTestnets: true,
  },
};

/**
 * When assets-unify is on, `getCurrencyRateControllerCurrencyRates` maps `ETH` from the first
 * native EVM row in `assetsInfo` (lexicographic CAIP id), i.e. mainnet `eip155:1/slip44:60`,
 * not the active chain. Default fixture seeds ~2047 USD there, so fiat gas on localhost still
 * follows mainnet unless we override both (and keep {@link mockPriceApi} in sync).
 */
const E2E_ETH_NATIVE_ASSETS_PRICE_USD_1700 = {
  assetPriceType: 'fungible' as const,
  id: 'ethereum',
  price: 1700,
  usdPrice: 1700,
};

describe('Send - Edit Transaction', function () {
  it('edits ETH value and legacy gas from confirm page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .withAssetsController({
            assetsPrice: {
              'eip155:1/slip44:60': E2E_ETH_NATIVE_ASSETS_PRICE_USD_1700,
              'eip155:1337/slip44:60': E2E_ETH_NATIVE_ASSETS_PRICE_USD_1700,
            },
          })
          .build(),
        localNodeOptions: { hardfork: 'muirGlacier' },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockPriceApi(mockServer, 1700, CHAIN_IDS.LOCALHOST);
        },
      },
      async ({ driver }) => {
        await login(driver);

        await createInternalTransaction({ driver });

        const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);
        const sendPage = new SendPage(driver);

        await sendTokenConfirmPage.checkTransactionAmount('1 ETH');

        await sendTokenConfirmPage.checkNativeCurrency('$0.07');

        await sendTokenConfirmPage.clickBackButton();

        await sendPage.editAmountByKeys([driver.Key.BACK_SPACE, '2', '.', '2']);

        await sendPage.pressContinueButton();

        // Open gas fee modal and set custom legacy gas values
        await sendTokenConfirmPage.clickEditGasFeeIcon();
        await gasFeeModal.setCustomLegacyGasFee({
          gasPrice: '8',
          gasLimit: '100000',
        });

        // has correct updated value on the confirm screen the transaction
        await sendTokenConfirmPage.checkNativeCurrency('$0.29');

        // confirms the transaction
        await sendTokenConfirmPage.clickOnConfirm();

        await activityListPage.openActivityTab();
        await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);

        await activityListPage.checkTxAmountInActivity('-2.2 ETH');
      },
    );
  });

  it('edits ETH value and EIP1559 gas from confirm page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .withAssetsController({
            assetsPrice: {
              'eip155:1/slip44:60': E2E_ETH_NATIVE_ASSETS_PRICE_USD_1700,
              'eip155:1337/slip44:60': E2E_ETH_NATIVE_ASSETS_PRICE_USD_1700,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockPriceApi(mockServer, 1700, CHAIN_IDS.LOCALHOST);
        },
      },
      async ({ driver }) => {
        await login(driver);

        await createInternalTransaction({ driver });

        const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);
        const sendPage = new SendPage(driver);

        await sendTokenConfirmPage.checkTransactionAmount('1 ETH');

        await sendTokenConfirmPage.checkNativeCurrency('$0.75');

        await sendTokenConfirmPage.clickBackButton();

        await sendPage.editAmountByKeys([driver.Key.BACK_SPACE, '2', '.', '2']);

        await sendPage.pressContinueButton();

        // Open gas fee modal and set custom EIP-1559 gas values
        await sendTokenConfirmPage.clickEditGasFeeIcon();
        await gasFeeModal.setCustomEIP1559GasFee({
          maxBaseFee: '8',
          priorityFee: '8',
          gasLimit: '100000',
        });

        // has correct updated value on the confirm screen the transaction
        await sendTokenConfirmPage.checkNativeCurrency('$0.29');

        // confirms the transaction
        await sendTokenConfirmPage.clickOnConfirm();

        await activityListPage.openActivityTab();
        await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);

        await activityListPage.checkTxAmountInActivity('-2.2 ETH');
      },
    );
  });
});
