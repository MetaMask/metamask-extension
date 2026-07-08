import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import { MOCK_ANALYTICS_ID, WALLET_PASSWORD } from '../../constants';
import { type Driver, PAGES } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';

const PORT_STREAM_CHUNKED_EVENT = 'Port Stream Chunked';
const STRUCTURED_CLONE_MESSAGE_SERIALIZATION = 'structured_clone';
const STRUCTURED_CLONE_CHROME_VERSION = '148';
const CHROMIUM_MESSAGE_SIZE_LIMIT = 67108864; // 64 MB
const HUGE_BACKGROUND_STATE_MARGIN = 1024;
const BACKGROUND_STATE_SYNC_TIMEOUT = 60000;
const UNLOCK_PASSWORD_INPUT = { testId: 'unlock-password' };
const UNLOCK_SUBMIT_BUTTON = { testId: 'unlock-submit' };

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

function getHugeBackgroundStateValue() {
  return '1'.repeat(
    CHROMIUM_MESSAGE_SIZE_LIMIT + HUGE_BACKGROUND_STATE_MARGIN,
  );
}

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

function getBuiltManifest() {
  const browser = process.env.SELENIUM_BROWSER ?? Browser.CHROME;

  return JSON.parse(
    readFileSync(`dist/${browser}/manifest.json`, 'utf8'),
  ) as Record<string, unknown>;
}

function assertChromeMessageSerialization(expected?: string) {
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

async function loginToHomepageWithoutSendKeys(driver: Driver) {
  const passwordInput = await driver.findElement(UNLOCK_PASSWORD_INPUT);

  await driver.driver.executeScript(
    `
      const [input, password] = arguments;
      const inputWindow = input.ownerDocument.defaultView;
      const valueSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(input),
        'value',
      )?.set;
      if (valueSetter) {
        valueSetter.call(input, password);
      } else {
        input.value = password;
      }
      input.dispatchEvent(new inputWindow.Event('input', { bubbles: true }));
      input.dispatchEvent(new inputWindow.Event('change', { bubbles: true }));
    `,
    passwordInput,
    WALLET_PASSWORD,
  );

  await driver.clickElement(UNLOCK_SUBMIT_BUTTON);
}

async function loadWalletWithHugeBackgroundState({
  expectChromeChunkedEvent,
  expectedChromeMessageSerialization,
  manifestTransform,
  title,
}: HugeStateTestOptions) {
  await withFixtures(
    {
      fixtures: new FixtureBuilderV2()
        .withMetaMetricsController({
          analyticsId: MOCK_ANALYTICS_ID,
          completedMetaMetricsOnboarding: true,
          marketingCampaignCookieId: getHugeBackgroundStateValue(),
          optedIn: true,
        })
        .build(),
      driverOptions: {
        chromeBrowserVersion: STRUCTURED_CLONE_CHROME_VERSION,
      },
      manifestTransform,
      title,
      testSpecificMock: mockSegment,
    },
    async ({ driver, mockedEndpoint }) => {
      assertChromeMessageSerialization(expectedChromeMessageSerialization);

      // We need an unusual amount of time because of the large background state.
      await driver.navigate(PAGES.HOME, {
        waitForControllersTimeout: BACKGROUND_STATE_SYNC_TIMEOUT,
      });
      const loginPage = new LoginPage(driver);
      await loginPage.checkPageIsLoaded();
      await loginToHomepageWithoutSendKeys(driver);

      const homepage = new HomePage(driver);
      // Just check that the balance is displayed (wallet is usable).
      await homepage.checkExpectedBalanceIsDisplayed();

      const events = await getEventPayloads(
        driver,
        mockedEndpoint,
        expectChromeChunkedEvent,
      );
      assertChunkedEvent(events as SegmentEvent[], expectChromeChunkedEvent);
    },
  );
}

describe('Port Stream Chunking', function () {
  before(function () {
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }
  });

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
