import { strict as assert } from 'assert';
import type { BrowserContext } from '@playwright/test';
import { test as pwTest } from '@playwright/test';
import { MockttpServer } from 'mockttp';
import { E2E_DRIVER } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { expectMockRequest } from '../../helpers/mock-server';
import { login } from '../../page-objects/flows/login.flow';

// Globals that code still reads after LavaMoat scuttles them. Each read logs a
// warning and fails, and the callers we know of swallow the failure, so a new
// entry here means something stopped working without an error.
const KNOWN_SCUTTLED_READS = [
  // Sentry request matching and URL parsing. Excepting `URL` alone makes Sentry
  // name every UI navigation transaction `/`, so it needs the route-name fix
  // that ships with it.
  'URL',
];

const SCUTTLED_READ = /property "([^"]+)" of globalThis is inaccessible/u;

async function mockSentryHomePageload(mockServer: MockttpServer) {
  return [
    await mockServer
      .forPost(/sentry/u)
      .withBodyIncluding('"transaction":"/home.html"')
      .thenCallback(() => ({ statusCode: 200, json: {} })),
  ];
}

pwTest.describe('LavaMoat scuttling', () => {
  pwTest(
    'reads no scuttled globals beyond the known set while the wallet opens',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      pwTest.skip(
        testInfo.project.name !== 'chrome-e2e',
        'Scuttling warnings are collected on Chrome only',
      );
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2()
            .withAnalyticsController({
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: testInfo.titlePath.join(' '),
          testSpecificMock: mockSentryHomePageload,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          const reads = new Set<string>();
          // Covers UI pages and the service worker, but not the service
          // worker's startup, which runs before this callback.
          (driver.driver as BrowserContext).on('console', (message) => {
            const match = SCUTTLED_READ.exec(message.text());
            if (match) {
              reads.add(match[1]);
            }
          });

          await login(driver);
          // Sentry's pageload ends once the page settles, so its request
          // means Sentry ran and the page's startup reads have happened.
          await expectMockRequest(driver, mockedEndpoint[0], {
            timeout: 30000,
          });

          assert.deepStrictEqual(
            [...reads].sort(),
            [...KNOWN_SCUTTLED_READS].sort(),
            'The set of scuttled globals read while the wallet opens changed. A new name means code is failing silently on a scuttled global: except it in development/webpack/utils/plugins/LavamoatPlugin/index.ts or stop reading it. A missing name means a read was fixed: remove it from KNOWN_SCUTTLED_READS.',
          );
        },
      );
    },
  );
});
