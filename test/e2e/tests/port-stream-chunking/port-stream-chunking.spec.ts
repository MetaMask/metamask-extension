import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { Browser } from 'selenium-webdriver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import { WALLET_PASSWORD } from '../../constants';
import { type Driver, PAGES } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import { getServerMochaToBackground } from '../../background-socket/server-mocha-to-background';
import { type PortStreamChunkingTestEventStats } from '../../background-socket/types';

const PORT_STREAM_CHUNKING_TEST_ID = 'port-stream-chunking';
const PORT_STREAM_CHUNKING_COMMAND_PREFIX = 'port-stream-chunking-test';
const STRUCTURED_CLONE_MESSAGE_SERIALIZATION = 'structured_clone';
const STRUCTURED_CLONE_CHROME_VERSION = '148';
const CHROMIUM_MESSAGE_SIZE_LIMIT = 67108864; // 64 MB
const STRUCTURED_CLONE_TEST_PAYLOAD_BYTES = 8 * 1024 * 1024;
const PORT_STREAM_PAYLOAD_WAIT_TIMEOUT = 10000;
const UNLOCK_PASSWORD_INPUT = { testId: 'unlock-password' };
const UNLOCK_SUBMIT_BUTTON = { testId: 'unlock-submit' };

type PortStreamChunkingTestOptions = {
  expectChromeChunkedEvent: boolean;
  expectedChromeMessageSerialization?: string;
  manifestTransform?: (manifest: Record<string, unknown>) => void;
  title?: string;
};

let sampleIdCounter = 0;

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
  beforeStats: PortStreamChunkingTestEventStats,
  afterStats: PortStreamChunkingTestEventStats,
  expectChunkedEvent: boolean,
) {
  if (!expectChunkedEvent) {
    assert.strictEqual(
      afterStats.count,
      beforeStats.count,
      'message-too-large event count should not change',
    );
    return;
  }

  assert.ok(
    afterStats.count > beforeStats.count,
    'message-too-large event count should increase',
  );
  assert.strictEqual(
    afterStats.lastChunkSize,
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

function getSampleId() {
  sampleIdCounter += 1;
  return `${Date.now()}-${sampleIdCounter}`;
}

async function getPortStreamPayloadCommand(driver: Driver) {
  return await driver.driver.executeScript(
    `
      const getCleanAppState = window.stateHooks?.getCleanAppState;
      if (!getCleanAppState) {
        return null;
      }

      return getCleanAppState().then((state) => {
        return state?.metamask?.dappSwapComparisonData?.[arguments[0]]?.commands ?? null;
      });
    `,
    PORT_STREAM_CHUNKING_TEST_ID,
  );
}

async function waitForPortStreamPayloadInUi(
  driver: Driver,
  expectedCommand: string,
) {
  await driver.waitUntil(
    async () => {
      return (await getPortStreamPayloadCommand(driver)) === expectedCommand;
    },
    {
      interval: 250,
      timeout: PORT_STREAM_PAYLOAD_WAIT_TIMEOUT,
    },
  );
}

async function loadWalletAndEmitPortStreamPayload({
  expectChromeChunkedEvent,
  expectedChromeMessageSerialization,
  manifestTransform,
  title,
}: PortStreamChunkingTestOptions) {
  await withFixtures(
    {
      fixtures: new FixtureBuilderV2().build(),
      driverOptions: {
        chromeBrowserVersion: STRUCTURED_CLONE_CHROME_VERSION,
      },
      localNodeOptions: [{ type: 'none' as const }],
      manifestTransform,
      title,
    },
    async ({ driver }) => {
      assertChromeMessageSerialization(expectedChromeMessageSerialization);

      await driver.navigate(PAGES.HOME);

      const loginPage = new LoginPage(driver);
      await loginPage.checkPageIsLoaded();
      await loginToHomepageWithoutSendKeys(driver);

      const homepage = new HomePage(driver);
      await homepage.checkPageIsLoaded();

      const sampleId = getSampleId();
      const expectedCommand = `${PORT_STREAM_CHUNKING_COMMAND_PREFIX}:${sampleId}`;
      const beforeStats =
        await getServerMochaToBackground().getPortStreamChunkingTestEventStats();

      await getServerMochaToBackground().emitPortStreamChunkingTestPayload(
        STRUCTURED_CLONE_TEST_PAYLOAD_BYTES,
        sampleId,
      );

      await waitForPortStreamPayloadInUi(driver, expectedCommand);

      const afterStats =
        await getServerMochaToBackground().getPortStreamChunkingTestEventStats();
      assertChunkedEvent(beforeStats, afterStats, expectChromeChunkedEvent);
    },
  );
}

describe('Port Stream Chunking', function () {
  before(function () {
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }
  });

  it('uses chunked messaging for a large typed array when structured clone messaging is not enabled', async function () {
    await loadWalletAndEmitPortStreamPayload({
      expectChromeChunkedEvent: true,
      manifestTransform: (manifest: Record<string, unknown>) => {
        delete manifest.message_serialization;
      },
      title: this.test?.fullTitle(),
    });
  });

  it('uses structured clone messaging by default for a large typed array', async function () {
    await loadWalletAndEmitPortStreamPayload({
      expectChromeChunkedEvent: false,
      expectedChromeMessageSerialization:
        STRUCTURED_CLONE_MESSAGE_SERIALIZATION,
      title: this.test?.fullTitle(),
    });
  });
});
