import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { E2E_SRP, WALLET_PASSWORD } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
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
 * Extract `{ transaction, trace_id }` from a Sentry envelope body (newline-
 * delimited JSON; transaction payloads carry `contexts.trace.trace_id`).
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
    await mockServer.forPost(/sentry/u).thenCallback(async (request) => {
      try {
        const body = await request.body.getText();
        for (const txn of parseTransactions(body ?? '')) {
          captured.push(txn);
          // eslint-disable-next-line no-console
          console.log(
            `CAPTURED-TXN ${txn.traceId} ${JSON.stringify(txn.transaction)}`,
          );
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('CAPTURE-ERR', String(error));
      }
      return { statusCode: 200, json: {} };
    }),
  ];
}

describe('Sentry sync trace-root evidence (#43929)', function () {
  it('roots account-sync and contact-sync full ops in their own trace ids', async function () {
    // Local evidence-capture harness, not a CI regression test: the sync
    // timing depends on the identity mock round-trips and envelope flush
    // windows, and the regression falsifiers for this PR live in the unit
    // suites (`shared/lib/trace.test.ts`,
    // `account-tree-controller-init.test.ts`,
    // `user-storage-controller-init.test.ts`). Run locally per the PR's
    // Validation Run instructions to reproduce the captured evidence log.
    if (process.env.CI) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }
    // eslint-disable-next-line @typescript-eslint/no-invalid-this
    this.timeout(600000);
    captured.length = 0;

    // Shared across both phases so the account added in phase 1 persists in
    // mocked user storage and gets pulled in by phase 2's full sync.
    const userStorageMockttpController = new UserStorageMockttpController();

    const sharedMockSetup = async (server: Mockttp) => {
      await mockIdentityServices(server, userStorageMockttpController);
      return captureSentryTransactions(server);
    };

    // Phase 1: add a second account so mocked user storage differs from a
    // fresh wallet's local state. `Multichain Account Syncing - Full` is only
    // emitted when the full sync actually mutates local state
    // (mutationTracker.hasOccurred()), so an in-sync wallet emits nothing.
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

        // Rename the new account so mocked user storage carries a custom
        // name. Wallet alignment in phase 2 pre-creates the second group
        // with a DEFAULT name, so a default-named remote group makes the
        // full sync a no-op (no mutation, no trace); the custom name forces
        // a remote -> local metadata pull.
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

    // Phase 2: onboard from scratch against the same mocked user storage.
    // The FIRST full sync of a fresh wallet creates the second group and
    // pulls its custom name INSIDE the full-sync run (remote -> local
    // mutations), which emits the rooted `Multichain Account Syncing - Full`
    // trace. (On a mere relock/reboot the untraced atomic single-group sync
    // pulls the changes first and the full sync no-ops, emitting nothing.)
    // Contact syncing dispatches alongside it.
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

        // Let contact syncing run and the background flush envelopes.
        await driver.delay(30000);

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
        // Ambient collapse is broader than the SW pageload alone: pre-fix,
        // a sync op glues onto WHICHEVER trace is ambient in its process at
        // that moment (an SW-session mega-trace full of background ops, or a
        // UI-startup trace) — and that host trace's own pageload transaction
        // may not be captured in the window. So assert against sharing with
        // ANY other captured transaction, not just `/service-worker.js` —
        // EXCEPT the sync cycle's own nested child ops (contact-sync save
        // batch / update remote / delete remote, account save), which are
        // EXPECTED to reuse the full-sync root's trace id: that is the
        // correct per-cycle hierarchy, not ambient collapse.
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

        // eslint-disable-next-line no-console
        console.log(
          `EVIDENCE captured=${captured.length} accountSyncFull=${accountSyncOps.length} contactSyncFull=${contactSyncOps.length} distinctTraceIds=${distinct.length} sharingSwPageload=${sharingSw} sharingAmbient=${sharingAmbient.length}`,
        );
        // eslint-disable-next-line no-console
        console.log(`EVIDENCE-SYNC-OPS ${JSON.stringify(syncOps)}`);
        // eslint-disable-next-line no-console
        console.log(`EVIDENCE-SW-IDS ${JSON.stringify([...swIds])}`);
        // eslint-disable-next-line no-console
        console.log(`EVIDENCE-ALL ${JSON.stringify(captured)}`);

        // The PR's claim: each sync entry op (`Multichain Account Syncing -
        // Full`, `Contact Sync Full`) roots its OWN trace via `startNewTrace`
        // instead of accumulating into the SW `/service-worker.js` pageload
        // mega-trace. Assert full pairwise distinctness — ids X, X, Y must
        // fail — and that no sync op sits on the SW pageload trace.
        //
        // `Multichain Account Syncing - Full` is assert-if-present: the
        // controller only emits it when the FULL sync run itself mutates
        // state (`mutationTracker.hasOccurred()` in
        // `BackupAndSyncService#performFullSyncInner`), and in this harness
        // the untraced atomic single-group/wallet sync queue consumes the
        // remote changes first, so the full sync usually no-ops. The rooting
        // boundary for that name is pinned by the unit falsifier in
        // `account-tree-controller-init.test.ts`; the shared `root: true` ->
        // `startNewTrace` mechanism it feeds is what this spec live-proves
        // via `Contact Sync Full`.
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
