import { strict as assert } from 'assert';
import type { TransactionEvent } from '@sentry/core';
import type { CompletedRequest, Mockttp } from 'mockttp';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { sentryRegEx, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';

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
 * @returns The endpoint recording transactions containing the RPC span.
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
        // RPC spans can be children of an ongoing background transaction.
        // Finish it so the SDK sends the envelope without waiting for other work.
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
        const transactions = await getSentryTransactions(requests);
        const backgroundRpcSpans = getBackgroundRpcSpans(transactions);
        const backgroundRpcSpansFormatted =
          backgroundRpcSpans.length > 0
            ? backgroundRpcSpans
                .map((candidate) => `- ${candidate.description}`)
                .join('\n')
            : '(none)';
        const expectedSpan = backgroundRpcSpans.find(
          (candidate) =>
            candidate.description ===
            `Background RPC: ${expectedMessengerAction}`,
        );

        assert.ok(
          expectedSpan,
          `A Sentry span must have been created for the messenger action '${expectedMessengerAction}'. Background RPC spans received:\n${
            backgroundRpcSpansFormatted
          }`,
        );
        assert.equal(expectedSpan.op, 'rpc.handler');
        assert.ok(expectedSpan.data);
        assert.equal(expectedSpan.data.method, 'messengerCall');
        assert.equal(expectedSpan.data.action, expectedMessengerAction);
      },
    );
  });
});

/**
 * Read Sentry transactions from the captured envelope requests.
 *
 * @param requests - Requests recorded by the Sentry mock endpoint.
 * @returns The transaction payloads in the envelopes.
 */
async function getSentryTransactions(requests: CompletedRequest[]) {
  const transactions: TransactionEvent[] = [];
  for (const request of requests) {
    const body = await request.body.getText();
    assert.ok(body, 'The Sentry envelope request must have a body');
    const lines = body.split('\n');
    for (let index = 2; index < lines.length; index += 2) {
      if (lines[index]) {
        transactions.push(JSON.parse(lines[index]));
      }
    }
  }
  return transactions;
}

/**
 * Find background RPC spans among root transactions and their child spans.
 *
 * @param transactions - Transactions received by the Sentry mock endpoint.
 * @returns Spans whose names start with `Background RPC:`.
 */
function getBackgroundRpcSpans(transactions: TransactionEvent[]) {
  return transactions
    .flatMap((transaction) => [
      {
        description: transaction.transaction,
        ...transaction.contexts?.trace,
      },
      ...(transaction.spans ?? []),
    ])
    .filter((candidate) =>
      candidate.description?.startsWith('Background RPC:'),
    );
}
