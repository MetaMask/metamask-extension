import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import { MOCK_ANALYTICS_ID } from '../../constants';
import { PAGES } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';

const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;
const PORT_STREAM_CHUNKED_EVENT = 'Port Stream Chunked';
const STRUCTURED_CLONE_MESSAGE_SERIALIZATION = 'structured_clone';
const CHROMIUM_MESSAGE_SIZE_LIMIT = 67108864; // 64 MB

type SegmentEvent = {
  event: string;
  properties: {
    category?: string;
    chunkSize?: number;
  };
};

type HugeStateTestOptions = {
  expectChromeChunkedEvent: boolean;
  expectedChromeMessageSerialization?: string;
  manifestTransform?: (manifest: Record<string, unknown>) => void;
  title?: string;
};

async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: PORT_STREAM_CHUNKED_EVENT }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

const hugeTx: TransactionMeta & {
  loadingDefaults: boolean;
  testingNoise: string;
} = {
  id: '4243712234858512',
  time: 1589314601567,
  status: TransactionStatus.confirmed,
  chainId: '0x5' as const,
  networkClientId: 'goerli',
  loadingDefaults: false,
  txParams: {
    from: '0xabca64466f257793eaa52fcfff5066894b76a149' as `0x${string}`,
    to: '0xefg5bc4e8f1f969934d773fa67da095d2e491a97' as `0x${string}`,
    nonce: '0xc',
    value: '0xde0b6b3a7640000',
    gas: '0x5208',
    gasPrice: '0x2540be400',
    data: `0x${'11'.repeat(10 ** 6)}` as `0x${string}`,
  },
  origin: 'metamask',
  type: TransactionType.simpleSend,
  testingNoise: '😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀',
};

function getBuiltManifest() {
  const browser = process.env.SELENIUM_BROWSER ?? Browser.CHROME;

  return JSON.parse(
    readFileSync(`dist/${browser}/manifest.json`, 'utf8'),
  ) as Record<string, unknown>;
}

function assertChromeMessageSerialization(expected?: string) {
  if (isFirefox) {
    return;
  }

  const manifest = getBuiltManifest();
  if (expected === undefined) {
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(manifest, 'message_serialization'),
      false,
      'message_serialization should not be set in the test manifest',
    );
    return;
  }

  assert.strictEqual(manifest.message_serialization, expected);
}

function assertChunkedEvent(
  events: SegmentEvent[],
  expectChunkedEvent: boolean,
) {
  const chunkEvent = events.find(
    (event) => event.event === PORT_STREAM_CHUNKED_EVENT,
  );

  if (!expectChunkedEvent) {
    assert.strictEqual(
      chunkEvent,
      undefined,
      `${PORT_STREAM_CHUNKED_EVENT} event should not be present`,
    );
    return;
  }

  assert.ok(chunkEvent, `${PORT_STREAM_CHUNKED_EVENT} event should be present`);
  assert.strictEqual(chunkEvent.properties.category, 'Port Stream');
  assert.strictEqual(
    chunkEvent.properties.chunkSize,
    CHROMIUM_MESSAGE_SIZE_LIMIT,
  );
}

async function loadWalletWithHugeBackgroundState({
  expectChromeChunkedEvent,
  expectedChromeMessageSerialization,
  manifestTransform,
  title,
}: HugeStateTestOptions) {
  const largeTransactions = Array.from({ length: 40 }, () => hugeTx);

  await withFixtures(
    {
      fixtures: new FixtureBuilderV2()
        .withTransactionController({ transactions: largeTransactions })
        .withMetaMetricsController({
          analyticsId: MOCK_ANALYTICS_ID,
          completedMetaMetricsOnboarding: true,
          optedIn: true,
        })
        .build(),
      manifestTransform,
      title,
      testSpecificMock: mockSegment,
    },
    async ({ driver, mockedEndpoint }) => {
      assertChromeMessageSerialization(expectedChromeMessageSerialization);

      // We need an unusual amount of time because of the large background state.
      await driver.navigate(PAGES.HOME, { waitForControllersTimeout: 20000 });
      const loginPage = new LoginPage(driver);
      await loginPage.checkPageIsLoaded();
      await loginPage.loginToHomepage();

      const homepage = new HomePage(driver);
      // Just check that the balance is displayed (wallet is usable).
      await homepage.checkExpectedBalanceIsDisplayed();

      const expectChunkedEvent = !isFirefox && expectChromeChunkedEvent;
      const events = await getEventPayloads(
        driver,
        mockedEndpoint,
        expectChunkedEvent,
      );
      assertChunkedEvent(events as SegmentEvent[], expectChunkedEvent);
    },
  );
}

describe('Port Stream Chunking', function () {
  it('uses chunked messaging with a huge background state when structured clone messaging is not enabled', async function () {
    await loadWalletWithHugeBackgroundState({
      expectChromeChunkedEvent: true,
      manifestTransform: (manifest: Record<string, unknown>) => {
        delete manifest.message_serialization;
      },
      title: this.test?.fullTitle(),
    });
  });

  it('uses structured clone messaging by default with a huge background state', async function () {
    await loadWalletWithHugeBackgroundState({
      expectChromeChunkedEvent: false,
      expectedChromeMessageSerialization:
        STRUCTURED_CLONE_MESSAGE_SERIALIZATION,
      title: this.test?.fullTitle(),
    });
  });
});
