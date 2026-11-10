import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { E2E_SRP, WALLET_PASSWORD } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../helpers/identity/user-storage/userStorageMockttpController';
import { mockIdentityServices } from '../identity/mocks';
import { arrangeTestUtils } from '../identity/account-syncing/helpers';

// Literals for TraceName.AccountSyncFull / TraceName.ContactSyncFull — the ops
// this PR roots via the account-tree / user-storage trace boundaries.
const ACCOUNT_SYNC_FULL = 'Multichain Account Syncing - Full';
const CONTACT_SYNC_FULL = 'Contact Sync Full';
const RENAMED_ACCOUNT = 'EVIDENCE ACCOUNT';

type CapturedTxn = { transaction: string; traceId: string };

const captured: CapturedTxn[] = [];

/**
 * Extract `{ transaction, traceId }` from a Sentry envelope (NDJSON).
 *
 * @param body - Raw envelope POST body.
 */
function parseTransactions(body: string): CapturedTxn[] {
  const out: CapturedTxn[] = [];
  for (const line of body.split('\n')) {
    if (!line.trim()) {
      continue;
    }
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    // Error events also carry `transaction` (the scope's name) and a trace
    // context; only transaction items are operations.
    if (obj.type !== 'transaction') {
      continue;
    }
    const transaction = obj.transaction as string | undefined;
    const trace = (obj.contexts as { trace?: Record<string, unknown> })?.trace;
    const traceId = trace?.trace_id;
    if (typeof transaction === 'string' && typeof traceId === 'string') {
      out.push({ transaction, traceId });
    }
  }
  return out;
}

async function captureSentryTransactions(mockServer: Mockttp) {
  return [
    // `always()`: the harness also mocks the fake-DSN envelope URL, and mockttp
    // hands every request after the first to that later rule otherwise.
    await mockServer
      .forPost(/sentry/u)
      .always()
      .thenCallback(async (request) => {
        try {
          const body = await request.body.getText();
          for (const txn of parseTransactions(body ?? '')) {
            captured.push(txn);
            console.log(
              `CAPTURED-TXN ${txn.traceId} ${JSON.stringify(txn.transaction)}`,
            );
          }
        } catch (error) {
          console.log('CAPTURE-ERR', String(error));
        }
        return { statusCode: 200, json: {} };
      }),
  ];
}

describe('Sentry sync trace-root evidence (#43929)', function () {
  it('roots account-sync and contact-sync full ops in their own trace ids', async function () {
    // Evidence capture, not a regression test: sync timing depends on mocked
    // identity round-trips and envelope flushes, so CI skips it.
    if (process.env.CI) {
      this.skip();
    }
    this.timeout(600000);
    captured.length = 0;

    // Shared across both phases so the account added in phase 1 persists in
    // mocked user storage and gets pulled in by phase 2's full sync.
    const userStorageMockttpController = new UserStorageMockttpController();

    const sharedMockSetup = async (server: Mockttp) => {
      await mockIdentityServices(server, userStorageMockttpController);
      return captureSentryTransactions(server);
    };

    // Phase 1: make mocked user storage differ from a fresh wallet, since the
    // account full sync emits its trace only when it mutates local state.
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
        driverOptions: { timeOut: 120000 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ driver }: any) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();

        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        const {
          prepareEventsEmittedCounter,
          waitUntilSyncedAccountsNumberEquals,
        } = arrangeTestUtils(driver, userStorageMockttpController);
        const { waitUntilEventsEmittedNumberEquals } =
          prepareEventsEmittedCounter(
            UserStorageMockttpControllerEvents.PUT_SINGLE,
          );

        await accountListPage.addMultichainAccount();
        await waitUntilSyncedAccountsNumberEquals(2);
        await waitUntilEventsEmittedNumberEquals(1);

        // A custom name makes phase 2's full sync pull remote metadata; with a
        // default name it is a no-op and emits no trace.
        await accountListPage.openMultichainAccountMenu({
          accountLabel: 'Account 2',
        });
        await accountListPage.clickMultichainAccountMenuItem('Rename');
        await accountListPage.changeMultichainAccountLabel(RENAMED_ACCOUNT);

        // Wait for the rename to persist to mocked user storage before this
        // instance tears down.
        await waitUntilEventsEmittedNumberEquals(2);
      },
    );

    // Phase 2: onboard a fresh wallet against the same storage, so its first
    // full sync, not the untraced single-group sync, pulls the renamed group.
    captured.length = 0;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
        manifestFlags: { sentry: { forceEnable: true, tracesSampleRate: 1 } },
        driverOptions: { timeOut: 120000 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ driver }: any) => {
        // Opt into MetaMetrics during onboarding so the Sentry transport
        // does not drop envelopes.
        await completeImportSRPOnboardingFlow({
          driver,
          seedPhrase: E2E_SRP,
          password: WALLET_PASSWORD,
          optedIn: true,
        });

        const homePage = new HomePage(driver);
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();

        // Prove the remote -> local mutation actually landed.
        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(
          RENAMED_ACCOUNT,
        );

        // Wait for the contact-sync full transaction to reach the Sentry mock.
        // Only that name is required below; the account-sync one is
        // assert-if-present.
        await driver.waitUntil(
          async () => captured.some((t) => t.transaction === CONTACT_SYNC_FULL),
          { interval: 500, timeout: 30000 },
        );

        const accountSyncOps = captured.filter(
          (t) => t.transaction === ACCOUNT_SYNC_FULL,
        );
        const contactSyncOps = captured.filter(
          (t) => t.transaction === CONTACT_SYNC_FULL,
        );
        const syncOps = [...accountSyncOps, ...contactSyncOps];
        const distinct = [...new Set(syncOps.map((t) => t.traceId))];
        const swIds = new Set(
          captured
            .filter((t) => t.transaction === '/service-worker.js')
            .map((t) => t.traceId),
        );
        const sharingSw = syncOps.filter((t) => swIds.has(t.traceId)).length;
        // Compare against every other captured transaction, since the host
        // trace's pageload may fall outside the capture window. Ops nested in
        // a sync are expected to share its trace id.
        const SYNC_CHILD_OPS = new Set([
          'Contact Sync Save Batch',
          'Contact Sync Update Remote',
          'Contact Sync Delete Remote',
          'Account Sync Save Individual',
        ]);
        const otherIds = new Set(
          captured
            .filter(
              (t) =>
                t.transaction !== ACCOUNT_SYNC_FULL &&
                t.transaction !== CONTACT_SYNC_FULL &&
                !SYNC_CHILD_OPS.has(t.transaction),
            )
            .map((t) => t.traceId),
        );
        const sharingAmbient = syncOps.filter((t) => otherIds.has(t.traceId));

        console.log(
          `EVIDENCE captured=${captured.length} accountSyncFull=${accountSyncOps.length} contactSyncFull=${contactSyncOps.length} distinctTraceIds=${distinct.length} sharingSwPageload=${sharingSw} sharingAmbient=${sharingAmbient.length}`,
        );
        console.log(`EVIDENCE-SYNC-OPS ${JSON.stringify(syncOps)}`);
        console.log(`EVIDENCE-SW-IDS ${JSON.stringify([...swIds])}`);
        console.log(`EVIDENCE-ALL ${JSON.stringify(captured)}`);

        // Every sync op needs its own trace id, off the SW pageload trace. The
        // account full sync is asserted only if present: the controller emits
        // it only when the full sync mutates state, which this flow rarely does.
        assert.ok(
          contactSyncOps.length >= 1,
          `expected at least 1 '${CONTACT_SYNC_FULL}' op, got 0: ${JSON.stringify(captured)}`,
        );
        assert.equal(
          distinct.length,
          syncOps.length,
          `expected one distinct trace id per sync full op, got ${distinct.length} distinct across ${syncOps.length} ops: ${JSON.stringify(syncOps)}`,
        );
        assert.equal(
          sharingSw,
          0,
          `expected no sync full op on the /service-worker.js pageload trace, got ${sharingSw}`,
        );
        assert.equal(
          sharingAmbient.length,
          0,
          `expected no sync full op to share a trace id with any other captured transaction (ambient SW/UI mega-trace collapse), got ${sharingAmbient.length}: ${JSON.stringify(sharingAmbient)}`,
        );
      },
    );
  });
});
