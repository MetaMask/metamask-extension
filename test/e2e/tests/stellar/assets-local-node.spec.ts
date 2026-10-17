import { Suite } from 'mocha';
import { DEFAULT_STELLAR_ADDRESS } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../page-objects/flows/stellar-network.flow';
import StellarAssetDetailsPage from '../../page-objects/pages/asset/stellar-asset-details';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import {
  seedStellarClassicTrustlines,
  toStellarTokenMetadata,
} from '../../seeder/stellar/assets';
import {
  getXlmSpendableBreakdown,
  isDockerAvailable,
  StellarNode,
} from '../../seeder/stellar/node';
import { Driver } from '../../webdriver/driver';
import {
  requireSuiteStellarNode,
  withStellarFixture,
} from './fixtures/with-stellar-fixture';
import {
  STELLAR_AUDD_TOKEN_NAME,
  STELLAR_BIP44_FLAGS,
  STELLAR_EURC_BALANCE,
  STELLAR_EURC_TOKEN_NAME,
  STELLAR_NATIVE_TOKEN_NAME,
  STELLAR_USDC_BALANCE,
  STELLAR_USDC_TOKEN_NAME,
  StellarTokenMetadata,
} from './mocks/common-stellar';

/** Max wait for Stellar Snap balances to appear in the token list after refresh. */
const STELLAR_ASSET_LIST_TIMEOUT_MS = 30_000;

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
      asset.balance === undefined
        ? undefined
        : `${asset.balance} ${asset.symbol ?? asset.name}`;
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

/**
 * Stellar assets E2E against `stellar/quickstart --local`.
 *
 * Quickstart starts once in `before` and is removed in `after`. Each `it`
 * borrows that node via `withStellarFixture` (Friendbot + Infura proxy).
 * Client-service mocks (flags, tokens, prices, search) stay in place — those
 * are not the chain.
 *
 * Coverage vs the mocked suite:
 * - XLM spendable breakdown from live Horizon (Friendbot amount, 2 trustlines)
 * - Classic USDC (funded) + EURC (zero) seeded on-chain with local issuers
 * - Imported AUDD activate card (catalog only, no trustline)
 * - Funded USDC cannot be deactivated (snap rejects before confirm)
 *
 * Not mirrored: SEP-41 SolvBTC (would need a local contract id, not pubnet
 * catalog) and activate/deactivate submit (snap signs pubnet passphrase;
 * Quickstart `--local` is standalone).
 *
 * Skips when Docker is not available so the rest of the suite still runs.
 */
describe('Stellar - Assets - local Quickstart node', function (this: Suite) {
  this.timeout(600_000);

  let stellarNode: StellarNode | undefined;
  const extraTokenAssets: StellarTokenMetadata[] = [];

  before(async function () {
    if (!(await isDockerAvailable())) {
      this.skip();
    }
    stellarNode = new StellarNode();
    await stellarNode.start();
    await stellarNode.fundAccount(DEFAULT_STELLAR_ADDRESS);
    const seeded = await seedStellarClassicTrustlines(
      stellarNode,
      DEFAULT_STELLAR_ADDRESS,
    );
    extraTokenAssets.push(...seeded.map(toStellarTokenMetadata));
  });

  after(async function () {
    await stellarNode?.quit();
  });

  describe('Asset details', function () {
    it('visits XLM, activated trustlines, and imported AUDD details', async function () {
      const node = requireSuiteStellarNode(stellarNode);

      await withStellarFixture(
        {
          extraTokenAssets,
          fixtures: buildStellarAssetsFixture().build(),
          stellarNode: node,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await landOnStellarHome(driver);

          const tokensTab = new TokensTab(driver);
          const details = new StellarAssetDetailsPage(driver);
          const account = await node.getAccount(DEFAULT_STELLAR_ADDRESS);
          if (!account) {
            throw new Error(
              `Horizon has no account ${DEFAULT_STELLAR_ADDRESS} after seeding`,
            );
          }
          const xlm = getXlmSpendableBreakdown(account);

          await checkStellarAssetsInList(tokensTab, [
            { name: STELLAR_NATIVE_TOKEN_NAME },
            { name: STELLAR_USDC_TOKEN_NAME, balance: STELLAR_USDC_BALANCE },
            { name: STELLAR_EURC_TOKEN_NAME, balance: STELLAR_EURC_BALANCE },
          ]);

          // Manual import: classic trustline not present on Horizon yet.
          // Non-EVM uses Manage tokens (`importTokens-button`), not the EVM import modal.
          await tokensTab.importTokenBySearchViaManageTokensNonEvm({
            tokenName: STELLAR_AUDD_TOKEN_NAME,
          });
          await checkStellarAssetsInList(tokensTab, [
            { name: STELLAR_AUDD_TOKEN_NAME },
          ]);

          await tokensTab.clickOnAsset(STELLAR_NATIVE_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_NATIVE_TOKEN_NAME);
          await details.checkSpendableBalance(xlm);
          await details.checkNoTrustlineActivationControls();
          await details.clickBack();
          await new HomePage(driver).checkPageIsLoaded();

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

          await tokensTab.clickOnAsset(STELLAR_AUDD_TOKEN_NAME);
          await details.checkPageIsLoaded(STELLAR_AUDD_TOKEN_NAME);
          await details.checkInactiveImportedTrustlineControls();
        },
      );
    });

    it('rejects deactivating a funded classic trustline (USDC)', async function () {
      await withStellarFixture(
        {
          extraTokenAssets,
          fixtures: buildStellarAssetsFixture().build(),
          stellarNode: requireSuiteStellarNode(stellarNode),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await landOnStellarHome(driver);

          const tokensTab = new TokensTab(driver);
          const details = new StellarAssetDetailsPage(driver);

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
        },
      );
    });
  });
});
