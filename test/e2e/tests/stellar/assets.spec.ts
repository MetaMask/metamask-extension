import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../page-objects/flows/stellar-network.flow';
import StellarAssetDetailsPage from '../../page-objects/pages/asset/stellar-asset-details';
import SnapChangeTrustOptInConfirmation from '../../page-objects/pages/confirmations/snap-change-trust-opt-in-confirmation';
import SnapChangeTrustOptOutConfirmation from '../../page-objects/pages/confirmations/snap-change-trust-opt-out-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { Driver } from '../../webdriver/driver';
import {
  STELLAR_AUDD_TOKEN_NAME,
  STELLAR_BIP44_FLAGS,
  STELLAR_EURC_BALANCE,
  STELLAR_EURC_TOKEN_NAME,
  STELLAR_FUNDED_XLM_BALANCE,
  STELLAR_MANIFEST_FLAGS,
  STELLAR_NATIVE_TOKEN_NAME,
  STELLAR_PORTFOLIO_BASE_RESERVE_XLM,
  STELLAR_PORTFOLIO_CLASSIC_BALANCES,
  STELLAR_PORTFOLIO_XLM_SPENDABLE,
  STELLAR_SOLVBTC_BALANCE_DISPLAY,
  STELLAR_SOLVBTC_BALANCE_SMALLEST,
  STELLAR_SOLVBTC_CONTRACT,
  STELLAR_SOLVBTC_TOKEN_NAME,
  STELLAR_SOLVBTC_TOKEN_SYMBOL,
  STELLAR_USDC_BALANCE,
  STELLAR_USDC_TOKEN_NAME,
  mockStellarActivateTrustlineMocks,
  mockStellarAssetsMocks,
} from './mocks/common-stellar';

/** Max wait for Stellar Snap balances to appear in the token list after refresh. */
const STELLAR_ASSET_LIST_TIMEOUT_MS = 30_000;

/**
 * TrackTransaction schedules the first Horizon poll after ~5s; allow time for
 * synchronize to land trustline activate/deactivate in MultichainAssets state.
 */
const STELLAR_ACTIVATE_SYNC_TIMEOUT_MS = 60_000;

type SnapChangeTrustConfirmation = {
  checkPageIsLoaded: (
    assetSymbol: string,
    options?: { timeout?: number; requireConfirmEnabled?: boolean },
  ) => Promise<void>;
};

/**
 * Fullscreen MetaMask skips opening `notification.html` for snap_dialog
 * (`triggerUi` no-ops when a MetaMask tab is focused) and ConfirmationRouter
 * also skips auto-redirect for snap_dialog. Wait until the snap has created
 * the pending approval, then open `#/confirmation` so the change-trust
 * confirmation can render.
 *
 * @param driver - WebDriver
 * @param confirmation - Snap change-trust opt-in or opt-out POM
 * @param assetSymbol - Asset symbol in the heading (e.g. AUDD)
 */
async function openPendingSnapConfirmation(
  driver: Driver,
  confirmation: SnapChangeTrustConfirmation,
  assetSymbol: string,
): Promise<void> {
  console.log(
    'Waiting for pending snap_dialog then opening #/confirmation (fullscreen path)',
  );
  await driver.wait(async () => {
    await driver.openNewURL(`${driver.extensionUrl}/home.html#/confirmation`);
    try {
      await confirmation.checkPageIsLoaded(assetSymbol, {
        timeout: 2_000,
        requireConfirmEnabled: false,
      });
      return true;
    } catch {
      return false;
    }
  }, 45_000);
  await confirmation.checkPageIsLoaded(assetSymbol);
}

type StellarListAsset = {
  name: string;
  balance?: string;
  /** Defaults to `name` when `balance` is set (override for SEP-41 display symbol). */
  symbol?: string;
};

async function checkStellarAssetsInList(
  tokensTab: TokensTab,
  assets: StellarListAsset[],
  options: { timeout?: number } = {
    timeout: STELLAR_ASSET_LIST_TIMEOUT_MS,
  },
): Promise<void> {
  for (const asset of assets) {
    const amount =
      asset.balance !== undefined
        ? `${asset.balance} ${asset.symbol ?? asset.name}`
        : undefined;
    await tokensTab.checkTokenExistsInList(asset.name, amount, options);
  }
}

async function landOnStellarHome(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });
  await selectStellarNetwork(driver);
  // Refresh re-hydrates the UI from background state so asynchronously-fetched
  // Snap balances appear reliably in the token list.
  await driver.refresh();
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
}

function buildStellarAssetsFixture(): FixtureBuilderV2 {
  return new FixtureBuilderV2()
    .withShowNativeTokenAsMainBalanceDisabled()
    .withRemoteFeatureFlagController({
      remoteFeatureFlags: {
        stellarAccounts: STELLAR_BIP44_FLAGS.stellarAccounts,
      },
    });
}

describe('Stellar - Assets', function (this: Suite) {
  this.timeout(240_000);

  describe('Asset details', function () {
    it('visits XLM, activated trustlines, SEP-41, and imported AUDD details', async function () {
      await withFixtures(
        {
          fixtures: buildStellarAssetsFixture().build(),
          manifestFlags: STELLAR_MANIFEST_FLAGS,
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: Mockttp) =>
            mockStellarAssetsMocks(mockServer, {
              xlmBalance: STELLAR_FUNDED_XLM_BALANCE,
              classicBalances: STELLAR_PORTFOLIO_CLASSIC_BALANCES,
              sep41BalancesByContractId: {
                [STELLAR_SOLVBTC_CONTRACT]: STELLAR_SOLVBTC_BALANCE_SMALLEST,
              },
            }),
        },
        async ({ driver }: { driver: Driver }) => {
          await landOnStellarHome(driver);

          const tokensTab = new TokensTab(driver);
          const details = new StellarAssetDetailsPage(driver);

          await checkStellarAssetsInList(tokensTab, [
            { name: STELLAR_NATIVE_TOKEN_NAME },
            { name: STELLAR_USDC_TOKEN_NAME, balance: STELLAR_USDC_BALANCE },
            { name: STELLAR_EURC_TOKEN_NAME, balance: STELLAR_EURC_BALANCE },
            {
              name: STELLAR_SOLVBTC_TOKEN_NAME,
              balance: STELLAR_SOLVBTC_BALANCE_DISPLAY,
              symbol: STELLAR_SOLVBTC_TOKEN_SYMBOL,
            },
          ]);

          // Manual import: classic trustline not present on Horizon yet.
          // Non-EVM uses Manage tokens (`importTokens-button`), not the EVM import modal.
          await tokensTab.importTokenBySearchViaManageTokensNonEvm({
            tokenName: STELLAR_AUDD_TOKEN_NAME,
          });
          await checkStellarAssetsInList(tokensTab, [
            { name: STELLAR_AUDD_TOKEN_NAME },
          ]);

          // XLM — spendable breakdown (2 trustlines → 2 XLM reserve)
          await tokensTab.clickOnAsset(STELLAR_NATIVE_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_NATIVE_TOKEN_NAME);
          await details.checkSpendableBalance({
            totalBalance: STELLAR_FUNDED_XLM_BALANCE,
            spendableBalance: STELLAR_PORTFOLIO_XLM_SPENDABLE,
            minimumReserveBalance: STELLAR_PORTFOLIO_BASE_RESERVE_XLM,
          });
          await details.checkNoTrustlineActivationControls();
          await details.clickBack();
          await new HomePage(driver).checkPageIsLoaded();

          // Activated classic trustlines — deactivate CTA
          await tokensTab.clickOnAsset(STELLAR_USDC_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_USDC_TOKEN_NAME);
          await details.checkActivatedTrustlineControls();
          await details.clickBack();
          await new HomePage(driver).checkPageIsLoaded();

          await tokensTab.clickOnAsset(STELLAR_EURC_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_EURC_TOKEN_NAME);
          await details.checkActivatedTrustlineControls();
          await details.clickBack();
          await new HomePage(driver).checkPageIsLoaded();

          // SEP-41 — details title uses symbol when name metadata differs
          await tokensTab.clickOnAsset(STELLAR_SOLVBTC_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_SOLVBTC_TOKEN_SYMBOL);
          await details.checkNoTrustlineActivationControls();
          await details.clickBack();
          await new HomePage(driver).checkPageIsLoaded();

          // Imported AUDD — activate card (not on Horizon)
          await tokensTab.clickOnAsset(STELLAR_AUDD_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_AUDD_TOKEN_NAME);
          await details.checkInactiveImportedTrustlineControls();
        },
      );
    });

    it('activates then deactivates an imported classic trustline (AUDD)', async function () {
      await withFixtures(
        {
          fixtures: buildStellarAssetsFixture().build(),
          manifestFlags: STELLAR_MANIFEST_FLAGS,
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: Mockttp) =>
            mockStellarActivateTrustlineMocks(mockServer),
        },
        async ({ driver }: { driver: Driver }) => {
          await landOnStellarHome(driver);

          const tokensTab = new TokensTab(driver);
          const details = new StellarAssetDetailsPage(driver);
          const optInConfirmation = new SnapChangeTrustOptInConfirmation(
            driver,
          );
          const optOutConfirmation = new SnapChangeTrustOptOutConfirmation(
            driver,
          );
          const homePage = new HomePage(driver);

          await checkStellarAssetsInList(tokensTab, [
            { name: STELLAR_NATIVE_TOKEN_NAME },
            { name: STELLAR_USDC_TOKEN_NAME, balance: STELLAR_USDC_BALANCE },
          ]);

          // Funded trustline cannot be deactivated — snap rejects before confirm.
          await tokensTab.clickOnAsset(STELLAR_USDC_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_USDC_TOKEN_NAME);
          await details.checkActivatedTrustlineControls();
          await details.clickDeactivate();
          await details.checkActivationErrorToastIsDisplayed();
          await details.clickBack();
          await homePage.checkPageIsLoaded();

          await tokensTab.importTokenBySearchViaManageTokensNonEvm({
            tokenName: STELLAR_AUDD_TOKEN_NAME,
          });
          await checkStellarAssetsInList(tokensTab, [
            { name: STELLAR_AUDD_TOKEN_NAME },
          ]);

          await tokensTab.clickOnAsset(STELLAR_AUDD_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_AUDD_TOKEN_NAME);
          await details.checkInactiveImportedTrustlineControls();

          await details.clickActivate();
          // Snap `showDialog` creates a pending snap_dialog; in fullscreen E2E
          // the notification popup does not open, so open the confirmation route
          // once the approval exists.
          await openPendingSnapConfirmation(
            driver,
            optInConfirmation,
            STELLAR_AUDD_TOKEN_NAME,
          );
          await optInConfirmation.clickFooterConfirmButton();

          // Snap confirm navigates to Activity; switch to Tokens and re-open AUDD.
          await homePage.checkPageIsLoaded();
          await homePage.goToTokensTab();
          await tokensTab.clickOnAsset(STELLAR_AUDD_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_AUDD_TOKEN_NAME);
          await details.checkActivatedTrustlineControls({
            timeout: STELLAR_ACTIVATE_SYNC_TIMEOUT_MS,
          });

          await details.clickDeactivate();
          await openPendingSnapConfirmation(
            driver,
            optOutConfirmation,
            STELLAR_AUDD_TOKEN_NAME,
          );
          await optOutConfirmation.clickFooterConfirmButton();

          await homePage.checkPageIsLoaded();
          await homePage.goToTokensTab();
          await tokensTab.clickOnAsset(STELLAR_AUDD_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_AUDD_TOKEN_NAME);
          await details.checkInactiveImportedTrustlineControls({
            timeout: STELLAR_ACTIVATE_SYNC_TIMEOUT_MS,
          });
        },
      );
    });
  });
});
