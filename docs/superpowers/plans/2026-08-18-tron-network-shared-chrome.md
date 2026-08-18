# Tron network shared Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run `network.spec.ts` with two Chrome sessions: one default wallet
(including the Networks-page Discover assertion) and one `showTestNetworks`
wallet (Nile + Shasta).

**Architecture:** Use `startHeldFixtures` from
`test/e2e/fixtures/held-fixtures.ts` (implement
`docs/superpowers/plans/2026-08-18-tron-held-fixtures.md` first). Do not
start a Java-Tron node. Two `describe` blocks, each with its own held
session and `firstFailure` skip.

**Tech Stack:** Mocha, `withFixtures` via `startHeldFixtures`, existing
network page objects.

## Global Constraints

- Prerequisite: `startHeldFixtures` exists.
- Two Chromes, not three. Put `neNetworkDiscoverButton[TRON_CHAIN_ID]=true`
  on the default session. Other default tests do not assert that button is
  missing. Production default already includes Tron
  (`test/e2e/feature-flags/feature-flag-registry.ts`).
- Do not add a Tron local node. Keep `localNodeOptions: ['anvil']`.
- Isolation is UI reset (close modal / leave Networks page), not per-address.
- New code is TypeScript.

## Why not three sessions

`Shows Tron on Networks page` today sets only:

```typescript
manifestFlags: {
  remoteFeatureFlags: {
    neNetworkDiscoverButton: {
      [TRON_CHAIN_ID]: true,
    },
  },
},
```

That is an extension-start flag. Sharing it with “Tron is listed” / “select
Tron” / “Tokens tab lists Tron” does not change those assertions.

## File map

- Modify: `test/e2e/tests/tron/network.spec.ts`
- Reuse: `test/e2e/fixtures/held-fixtures.ts`

---

### Task 1: Split the spec into two held sessions

**Files:**
- Modify: `test/e2e/tests/tron/network.spec.ts`

**Interfaces:**
- Consumes: `startHeldFixtures`, `HeldFixturesSession`
- Produces: `describe('default')` (4 tests) and `describe('testnets')` (2 tests)

- [ ] **Step 1: Rewrite the spec**

Replace `test/e2e/tests/tron/network.spec.ts` with:

```typescript
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { startHeldFixtures } from '../../fixtures/held-fixtures';
import type { HeldFixturesSession } from '../../fixtures/held-fixtures';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import SelectNetworkModal from '../../page-objects/pages/networks/select-network-modal';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import { TRON_CHAIN_ID, mockTronFeatureFlags } from './mocks/common-tron';

const TRON_NILE_NAME = 'Tron Nile';
const TRON_SHASTA_NAME = 'Tron Shasta';

function buildTronNetworkFixture() {
  return new FixtureBuilderV2()
    .withPreferencesController({
      preferences: { showTestNetworks: true },
    })
    .build();
}

async function mockTronNetworkFlags(mockServer: Mockttp) {
  return [await mockTronFeatureFlags(mockServer)];
}

async function closeNetworkPickerIfOpen(driver: Driver): Promise<void> {
  const selectNetworkModal = new SelectNetworkModal(driver);
  await selectNetworkModal.close().catch(() => undefined);
}

function bindHeldSession(suite: Suite, startSession: () => Promise<HeldFixturesSession>) {
  let driver: Driver;
  let firstFailure: unknown;
  let session: HeldFixturesSession | undefined;

  suite.beforeAll(async function () {
    session = await startSession();
    driver = session.context.driver;
    try {
      await login(driver);
    } catch (error) {
      firstFailure = error;
      throw error;
    }
  });

  suite.beforeEach(function () {
    if (firstFailure) {
      this.skip();
    }
  });

  suite.afterEach(function () {
    if (this.currentTest?.state === 'failed' && !firstFailure) {
      firstFailure = this.currentTest.err;
    }
  });

  suite.afterAll(async function () {
    if (!session) {
      return;
    }
    await session.release(firstFailure);
  });

  return {
    getDriver: () => driver,
  };
}

describe('Tron - Network', function (this: Suite) {
  this.timeout(180_000);

  describe('default wallet', function (this: Suite) {
    const { getDriver } = bindHeldSession(this, async () =>
      startHeldFixtures({
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.parent?.fullTitle() ?? 'Tron - Network default',
        localNodeOptions: ['anvil'],
        testSpecificMock: mockTronNetworkFlags,
        manifestFlags: {
          remoteFeatureFlags: {
            neNetworkDiscoverButton: {
              [TRON_CHAIN_ID]: true,
            },
          },
        },
      }),
    );

    it('shows Tron in the home network filter', async function () {
      const driver = getDriver();
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);
      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.checkNetworkIsListed('Tron');
      await selectNetworkModal.close();
    });

    it('shows Tron in the Tokens tab network selector', async function () {
      const driver = getDriver();
      const home = new HomePage(driver);
      await home.goToTokensTab();
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);
      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.checkNetworkIsListed('Tron');
      await selectNetworkModal.close();
    });

    it('Shows Tron on Networks page', async function () {
      const driver = getDriver();
      const headerNavbar = new HeaderNavbar(driver);
      const networksPage = new NetworksPage(driver);
      const homePage = new HomePage(driver);

      await headerNavbar.openGlobalNetworksMenu();
      await networksPage.checkPageIsLoaded();
      await networksPage.fillNetworkSearchInput('Tron');
      await networksPage.openNetworkListOptions(TRON_CHAIN_ID);
      await networksPage.checkDiscoverButtonIsVisible();
      await driver.navigate();
      await homePage.checkPageIsLoaded();
    });

    it('selects Tron from the home network filter', async function () {
      const driver = getDriver();
      await closeNetworkPickerIfOpen(driver);
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);

      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.selectNetworkByChainId(TRON_CHAIN_ID);
      await networkFilter.checkLabelIs('Tron');
    });
  });

  describe('test networks enabled', function (this: Suite) {
    const { getDriver } = bindHeldSession(this, async () =>
      startHeldFixtures({
        fixtures: buildTronNetworkFixture(),
        title: this.test?.parent?.fullTitle() ?? 'Tron - Network testnets',
        localNodeOptions: ['anvil'],
        testSpecificMock: mockTronNetworkFlags,
      }),
    );

    it('shows Tron Nile when test networks are enabled', async function () {
      const driver = getDriver();
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);
      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.checkNetworkIsListed(TRON_NILE_NAME);
      await selectNetworkModal.close();
    });

    it('shows Tron Shasta when test networks are enabled', async function () {
      const driver = getDriver();
      const selectNetworkModal = new SelectNetworkModal(driver);
      const networkFilter = new NetworkFilter(driver);
      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.checkNetworkIsListed(TRON_SHASTA_NAME);
      await selectNetworkModal.close();
    });
  });
});
```

Notes for the implementer:

- Mocha nested `describe` with `this.timeout` on the parent applies to
  children. Keep `180_000` on the parent so `before` (Anvil + Chrome +
  login) can finish.
- `bindHeldSession` above uses `suite.beforeAll`. If that is awkward with
  the `this` typing, inline the `before`/`afterEach`/`after` blocks from
  `send.spec.ts` twice instead. Inlining twice is acceptable; do not invent
  a third helper.
- Select Tron **last** in the default session so listing tests run against
  the default network. If select Tron is not last, `driver.navigate()`
  after it and re-open the filter for later listing tests.
- `SelectNetworkModal.close()` throws if the modal is not open. The
  `.catch(() => undefined)` in `closeNetworkPickerIfOpen` is required.
- Nested `describe` + `startHeldFixtures` in `before` is two Chromes
  sequentially in one file (Mocha does not parallelize `describe` in this
  repo). That is the intended tradeoff versus six Chromes.

If `suite.beforeAll` is not available on the typed `Suite` object, do not
fight it — copy the `send.spec.ts` `before`/`beforeEach`/`afterEach`/`after`
blocks into each nested `describe` and close over `driver` / `session` /
`firstFailure` locally.

- [ ] **Step 2: Lint**

```bash
yarn lint:changed:fix
```

- [ ] **Step 3: Commit**

```bash
git add test/e2e/tests/tron/network.spec.ts
git commit -m "test(e2e): share two Chrome sessions across Tron network cases"
```

---

### Task 2: Run the network suite

- [ ] **Step 1: Run**

```bash
yarn test:e2e:single test/e2e/tests/tron/network.spec.ts --browser=chrome
```

Expected: 6 passing. Failures to look for:

- Discover button missing → `manifestFlags` did not land on the default
  session.
- Nile/Shasta missing → they ran in the default session instead of the
  `showTestNetworks` session.
- Element click intercepted → previous test left the picker or Networks
  page open.

- [ ] **Step 2: Commit fixes if the run required code changes**
