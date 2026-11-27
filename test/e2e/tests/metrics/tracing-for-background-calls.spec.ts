import { strict as assert } from 'assert';
import type { Mockttp } from 'mockttp';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { sentryRegEx, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { getStreamedSpans } from './sentry-span-envelopes';

/**
 * Finish background tracing so completed RPC spans reach the mock endpoint.
 */
const FLUSH_BACKGROUND_TRACES_SCRIPT = `
  if (sentry === undefined) {
    throw new Error("Sentry is not available. Is it loaded? (Make sure to pass --sentry when building the extension locally.)");
  }
  const activeSpan = sentry.getActiveSpan();
  if (activeSpan) {
    sentry.getRootSpan(activeSpan).end();
  }
  await sentry.flush();
`;

/**
 * Capture the homepage's messenger RPC span in a real Sentry envelope.
 *
 * @param mockServer - The test's HTTP mock server.
 * @returns The endpoint recording span envelopes containing the RPC span.
 */
async function mockMessengerRpcSpan(mockServer: Mockttp) {
  return mockServer
    .forPost(sentryRegEx)
    .always()
    .withBodyIncluding('Background RPC:')
    .thenJson(200, {});
}

describe('Sentry tracing for background calls', function () {
  it('creates Sentry spans identifying dispatched root messenger actions', async function () {
    const expectedMessengerAction = 'AppStateController:setBrowserEnvironment';

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withAnalyticsController({
            consentDecisionMade: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockMessengerRpcSpan,
        manifestFlags: {
          sentry: { forceEnable: false },
          remoteFeatureFlags: {
            sentry: { tracesSampleRate: 1, wrapperSampleRate: 1 },
          },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await login(driver);
        // RPC spans can be children of an ongoing background trace. Finish its
        // root so the SDK sends the envelope without waiting for other work.
        if (isManifestV3) {
          await driver.executeScriptInExtensionServiceWorker(
            `const sentry = globalThis.sentry; ${FLUSH_BACKGROUND_TRACES_SCRIPT}`,
          );
        } else {
          await driver.executeScript(`
            return (async () => {
              const background = await globalThis.browser.runtime.getBackgroundPage();
              const sentry = background.sentry;
              ${FLUSH_BACKGROUND_TRACES_SCRIPT}
            })();
          `);
        }
        await driver.wait(async () => {
          const requests = await mockedEndpoint.getSeenRequests();
          return requests.length > 0;
        });

        const requests = await mockedEndpoint.getSeenRequests();
        const backgroundRpcSpans = (await getStreamedSpans(requests)).filter(
          (candidate) => candidate.name.startsWith('Background RPC:'),
        );
        const backgroundRpcSpansFormatted =
          backgroundRpcSpans.length > 0
            ? backgroundRpcSpans
                .map((candidate) => `- ${candidate.name}`)
                .join('\n')
            : '(none)';
        const expectedSpan = backgroundRpcSpans.find(
          (candidate) =>
            candidate.name === `Background RPC: ${expectedMessengerAction}`,
        );

        assert.ok(
          expectedSpan,
          `A Sentry span must have been created for the messenger action '${expectedMessengerAction}'. Background RPC spans received:\n${
            backgroundRpcSpansFormatted
          }`,
        );
        assert.equal(expectedSpan.op, 'rpc.handler');
        assert.equal(expectedSpan.attributes.method, 'messengerCall');
        assert.equal(expectedSpan.attributes.action, expectedMessengerAction);
      },
    );
  });
});
