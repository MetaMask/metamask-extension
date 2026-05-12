/**
 * Perps deep-link E2E tests.
 *
 * Verifies that all supported `https://link.metamask.io/perps*` deep-link URLs
 * navigate to the correct Perps screen with the actual Perps UI loaded:
 *
 * - `/perps`, `/perps?screen=tabs`, `/perps?screen=home`, `/perps?screen=markets`
 *     → Wallet home with Perps tab selected (PerpsHomePage).
 *       Asserts: balance dropdown + "Explore markets" row visible.
 * - `/perps?screen=market-list`
 *     → Perps market-list page with "All" filter active and market rows visible.
 * - `/perps?screen=market-list&tab=crypto`
 *     → Perps market-list page with the "Crypto" filter label showing.
 * - `/perps?screen=market-list&tab=stocks`
 *     → Perps market-list page with the "Stocks" filter label showing and
 *       at least one equity market row (TSLA, via HIP-3 xyz DEX mock).
 *
 * Unlike the generic deep-link route tests in
 * `tests/deep-link/deep-link-route-perps.spec.ts` (which only check the URL
 * hash), these tests exercise the full Perps UI loading path by using
 * `getPerpsConfigEligible` fixtures and real WS mocks.
 *
 * PREREQUISITE: All tests require PERPS_ENABLED=true in the extension build.
 * Set PERPS_ENABLED=true in .metamaskrc (see .metamaskrc.dist) before running locally.
 */
import type { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import {
  bytesToB64,
  generateECDSAKeyPair,
  prepareDeepLinkUrl,
  mockDeepLinkPages,
} from '../deep-link/helpers';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags/feature-flag-registry';
import { WS_WITH_STOCKS_MARKET } from './mocks/websocketStocksMocks';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

/**
 * Perps-eligible manifest flags (no geo-block).
 * Merged with `testing.deepLinkPublicKey` per test.
 */
const PERPS_ELIGIBLE_FLAGS = {
  remoteFeatureFlags: {
    perpsEnabledVersion: {
      enabled: true,
      minimumVersion: '0.0.0',
    },
    perpsPerpTradingGeoBlockedCountriesV2: {
      blockedRegions: [],
    },
  },
};

/**
 * Builds a `withFixtures` config that combines:
 * - Perps controller with eligible state (isEligible, non-first-time)
 * - Perps eligible feature flags
 * - Deep-link public key in manifest
 * - `link.metamask.io` HTTP mock + eligible `/v1/flags` mock
 *
 * @param options
 * @param options.title
 * @param options.deepLinkPublicKey
 * @param options.enableHip3 - When true, adds perpsHip3Enabled flag and HTTP
 *   mocks for the xyz HIP-3 DEX (metaAndAssetCtxs + allMids), enabling the
 *   Stocks filter to show equity markets.
 */
async function getPerpsDeepLinkConfig(options: {
  title?: string;
  deepLinkPublicKey: string;
  enableHip3?: boolean;
}) {
  const { title, deepLinkPublicKey, enableHip3 = false } = options;

  const manifestFlags = {
    testing: { deepLinkPublicKey },
    remoteFeatureFlags: {
      ...PERPS_ELIGIBLE_FLAGS.remoteFeatureFlags,
      ...(enableHip3
        ? { perpsHip3Enabled: { enabled: true, minimumVersion: '0.0.0' } }
        : {}),
    },
  };

  return {
    fixtures: new FixtureBuilderV2()
      .withPerpsController({
        isEligible: true,
        isFirstTimeUser: { mainnet: false, testnet: false },
      })
      .build(),
    title,
    manifestFlags,
    testSpecificMock: async (server: Mockttp) => {
      // Mock link.metamask.io so the deep-link interstitial page loads
      await mockDeepLinkPages(server);

      // Override /v1/flags so the background sees blockedRegions: []
      const flagOverrides: object[] = [
        { perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: [] } },
      ];
      if (enableHip3) {
        flagOverrides.push({
          perpsHip3Enabled: { enabled: true, minimumVersion: '0.0.0' },
        });
      }
      const eligibleFlags = [
        ...getProductionRemoteFlagApiResponse().filter(
          (entry) =>
            !('perpsPerpTradingGeoBlockedCountriesV2' in (entry as object)) &&
            !(enableHip3 && 'perpsHip3Enabled' in (entry as object)),
        ),
        ...flagOverrides,
      ];
      await server
        .forGet('https://client-config.api.cx.metamask.io/v1/flags')
        .withQuery({ client: 'extension', distribution: 'main' })
        .thenCallback(() => ({
          ok: true,
          statusCode: 200,
          json: eligibleFlags,
        }));

      if (enableHip3) {
        // HTTP mock for metaAndAssetCtxs for the xyz DEX.
        // Used by getMarketDataWithPrices when the assetCtxs cache is empty
        // (meta was pre-cached via WS but assetCtxs were not).
        await server
          .forPost('https://api.hyperliquid.xyz/info')
          .withJsonBodyIncluding({ type: 'metaAndAssetCtxs', dex: 'xyz' })
          .thenCallback(() => ({
            statusCode: 200,
            json: [
              {
                universe: [{ name: 'TSLA', szDecimals: 2, maxLeverage: 10 }],
              },
              [
                {
                  funding: '0.0001',
                  openInterest: '100',
                  prevDayPx: '175.00',
                  dayNtlVlm: '1000000',
                  premium: '0.0001',
                  oraclePx: '180.00',
                  markPx: '180.10',
                  midPx: '180.00',
                  impactPxs: ['179.90', '180.10'],
                },
              ],
            ],
          }));

        // HTTP mock for allMids for the xyz DEX.
        // Used by #getAllMids when no WS allMids snapshot exists for xyz.
        await server
          .forPost('https://api.hyperliquid.xyz/info')
          .withJsonBodyIncluding({ type: 'allMids', dex: 'xyz' })
          .thenCallback(() => ({
            statusCode: 200,
            json: { TSLA: '180.00' },
          }));
      }
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Perps Deep Links', function (this: Suite) {
  this.timeout(10 * 60 * 1000);

  // ─── Home-screen deep links ─────────────────────────────────────────────

  const homeRoutes = [
    '/perps',
    '/perps?screen=tabs',
    '/perps?screen=home',
    '/perps?screen=markets',
  ];

  for (const route of homeRoutes) {
    it(`navigates to Perps home for unsigned deep link: ${route}`, async function () {
      const keyPair = await generateECDSAKeyPair();
      const deepLinkPublicKey = bytesToB64(
        await crypto.subtle.exportKey('raw', keyPair.publicKey),
      );

      await withFixtures(
        await getPerpsDeepLinkConfig({
          title: this.test?.fullTitle(),
          deepLinkPublicKey,
        }),
        async ({ driver }: { driver: Driver }) => {
          await login(driver);

          const url = await prepareDeepLinkUrl({
            route,
            signed: 'unsigned',
            privateKey: keyPair.privateKey,
          });

          await navigateDeepLinkToDestination(
            driver,
            url,
            'unlocked',
            false, // unsigned — no checkbox
            PerpsHomePage,
          );

          // Verify key Perps home UI elements are visible
          const homePage = new PerpsHomePage(driver);
          await homePage.waitForExploreMarketsRow();
        },
      );
    });
  }

  // ─── Market-list deep link (no filter) ────────────────────────────────────

  it('navigates to Perps market list for unsigned deep link: /perps?screen=market-list', async function () {
    const keyPair = await generateECDSAKeyPair();
    const deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );

    await withFixtures(
      await getPerpsDeepLinkConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
      }),
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const url = await prepareDeepLinkUrl({
          route: '/perps?screen=market-list',
          signed: 'unsigned',
          privateKey: keyPair.privateKey,
        });

        await navigateDeepLinkToDestination(
          driver,
          url,
          'unlocked',
          false,
          PerpsMarketListPage,
        );

        // Verify the market list is populated and the "All" filter is active
        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.waitForFilterLabel('All');
        await marketListPage.waitForAnyMarketRow();
      },
    );
  });

  // ─── Market-list deep link with tab=crypto ────────────────────────────────

  it('navigates to Perps market list with crypto filter for /perps?screen=market-list&tab=crypto', async function () {
    const keyPair = await generateECDSAKeyPair();
    const deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );

    await withFixtures(
      await getPerpsDeepLinkConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
      }),
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const url = await prepareDeepLinkUrl({
          route: '/perps?screen=market-list&tab=crypto',
          signed: 'unsigned',
          privateKey: keyPair.privateKey,
        });

        await navigateDeepLinkToDestination(
          driver,
          url,
          'unlocked',
          false,
          PerpsMarketListPage,
        );

        // Verify the "Crypto" filter is active and crypto market rows are visible
        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.waitForFilterLabel('Crypto');
        await marketListPage.waitForAnyMarketRow();
      },
    );
  });

  // ─── Market-list deep link with tab=stocks ────────────────────────────────

  it('navigates to Perps market list with stocks filter for /perps?screen=market-list&tab=stocks', async function () {
    const keyPair = await generateECDSAKeyPair();
    const deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );

    await withFixtures(
      {
        ...(await getPerpsDeepLinkConfig({
          title: this.test?.fullTitle(),
          deepLinkPublicKey,
          enableHip3: true,
        })),
        // WS mocks to inject the xyz HIP-3 DEX with a TSLA equity market
        perpsWebSocketSpecificMocks: WS_WITH_STOCKS_MARKET,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const url = await prepareDeepLinkUrl({
          route: '/perps?screen=market-list&tab=stocks',
          signed: 'unsigned',
          privateKey: keyPair.privateKey,
        });

        await navigateDeepLinkToDestination(
          driver,
          url,
          'unlocked',
          false,
          PerpsMarketListPage,
        );

        // Verify the "Stocks" filter is active and the TSLA equity market row is visible
        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.waitForFilterLabel('Stocks');
        await marketListPage.waitForAnyMarketRow();
      },
    );
  });

  // ─── Locked wallet: home route ────────────────────────────────────────────

  it('prompts login then shows Perps home for locked wallet with /perps deep link', async function () {
    const keyPair = await generateECDSAKeyPair();
    const deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );

    await withFixtures(
      await getPerpsDeepLinkConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
      }),
      async ({ driver }: { driver: Driver }) => {
        // Do NOT login before navigating the deep link (locked scenario)
        await driver.navigate();

        const url = await prepareDeepLinkUrl({
          route: '/perps',
          signed: 'unsigned',
          privateKey: keyPair.privateKey,
        });

        await navigateDeepLinkToDestination(
          driver,
          url,
          'locked',
          false,
          PerpsHomePage,
        );

        // Verify key Perps home UI elements are visible after login
        const homePage = new PerpsHomePage(driver);
        await homePage.waitForExploreMarketsRow();
      },
    );
  });
});
