# E2E test templates (MetaMask Extension)

Adjust import depths if the spec or page object lives at a different folder depth than shown.

## Spec file (`test/e2e/tests/<feature>/<name>.spec.ts`)

```typescript
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import MyFeaturePage from '../../page-objects/pages/<path-to-my-feature-page>';

describe('<Feature name>', function (this: Suite) {
  it('<describes behavior without "should">', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const page = new MyFeaturePage(driver);
        await page.checkPageIsLoaded();
        // Act + assert via page object methods
      },
    );
  });
});
```

### Spec with `testSpecificMock` (mockttp)

```typescript
import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';

async function mockMyApi(mockServer: Mockttp) {
  await mockServer.forGet('https://example.com/api').thenCallback(() => ({
    statusCode: 200,
    json: {},
  }));
}

describe('My feature', function (this: Suite) {
  it('uses mocked HTTP responses', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockMyApi,
      },
      async ({ driver }) => {
        await login(driver);
        // ...
      },
    );
  });
});
```

### Spec with remote feature flags (override a registered flag)

`myFeatureFlag` must already exist in `test/e2e/feature-flags/feature-flag-registry.ts` with a `productionDefault`. This block **overrides** it for this test only; other flags keep registry defaults. The global mock (`test/e2e/mock-e2e.js`) still sources unlisted flags from the registry.

```typescript
await withFixtures(
  {
    fixtures: new FixtureBuilderV2().build(),
    title: this.test?.fullTitle(),
    manifestFlags: {
      remoteFeatureFlags: {
        myFeatureFlag: true,
      },
    },
  },
  async ({ driver }) => {
    // ...
  },
);
```

### Register a new remote flag (before or with your E2E)

Add an entry to `FEATURE_FLAG_REGISTRY` in `test/e2e/feature-flags/feature-flag-registry.ts` (import `FeatureFlagStatus` and `FeatureFlagType` from the same file):

```typescript
myNewFeatureFlag: {
  name: 'myNewFeatureFlag',
  type: FeatureFlagType.Remote,
  inProd: false, // set true once the flag exists in production client-config
  productionDefault: false,
  status: FeatureFlagStatus.Active,
},
```

Then override per test with `manifestFlags.remoteFeatureFlags` when you need a non-default value. Run the repo’s feature-flag sync / drift checks if your team requires them (see `.github/workflows/check-feature-flag-registry-drift.yml`).

### Spec with custom fixture state

Use `FixtureBuilderV2` chained methods to set up wallet state declaratively instead of clicking through the UI. Browse `test/e2e/fixtures/fixture-builder-v2.ts` for all available `with*` methods.

**Dedicated builder method** — use when the pattern is reused across multiple specs:

```typescript
fixtures: new FixtureBuilderV2()
  .withNetworkControllerDoubleNode()
  .withPermissionControllerConnectedToTestDapp({
    chainIds: [1337, 1338],
  })
  .build(),
```

**Inline `withXController()` — one-off state** for a single spec. Pass a partial state object directly; no need to create a builder method:

```typescript
// Seed PreferencesController + CurrencyController for a fiat-display scenario
fixtures: new FixtureBuilderV2()
  .withPreferencesController({
    preferences: { showFiatInTestnets: true },
    useCurrencyRateCheck: true,
  })
  .withCurrencyController({
    currencyRates: {
      ETH: {
        conversionDate: Date.now(),
        conversionRate: 3401,
        usdConversionRate: 3401,
      },
    },
  })
  .build(),
```

```typescript
// Inject a large transactions array to stress-test port-stream chunking
fixtures: new FixtureBuilderV2()
  .withTransactionController({ transactions: largeTransactions })
  .withMetaMetricsController({
    metaMetricsId: 'fake-metrics-id',
    participateInMetaMetrics: true,
  })
  .build(),
```

**When to add a custom builder method:** If the same fixture setup is reused across multiple specs, add a dedicated `with*` method to `FixtureBuilderV2` (e.g. `.withNetworkControllerDoubleNode()`). For one-off state, use `withXController()` directly to set controller state inline without creating a new method.

### Spec with custom local node(s) setup

By default, `withFixtures` starts a single Anvil node with the default configuration. Override `localNodeOptions` when your test needs multiple nodes or custom node settings (e.g. block time, chain ID, pre-deployed contracts).

**Single node with custom options** (plain object shorthand):

```typescript
await withFixtures(
  {
    fixtures: new FixtureBuilderV2().build(),
    title: this.test?.fullTitle(),
    localNodeOptions: {
      hardfork: 'muirGlacier',
    },
  },
  async ({ driver }) => {
    /* ... */
  },
);
```

**Multiple nodes** (array form):

```typescript
await withFixtures(
  {
    fixtures: new FixtureBuilderV2().withNetworkControllerTripleNode().build(),
    title: this.test?.fullTitle(),
    localNodeOptions: [
      {
        type: 'anvil',
      },
      {
        type: 'anvil',
        options: {
          blockTime: 2,
          port: 8546,
          chainId: 1338,
        },
      },
      {
        type: 'anvil',
        options: {
          port: 7777,
          chainId: 1000,
        },
      },
    ],
  },
  async ({ driver }) => {
    /* ... */
  },
);
```

### Spec with pre-deployed smart contracts

Use the `smartContract` option in `withFixtures` to deploy a contract on the local node before the test runs. The contract address is available via `contractRegistry.getContractAddress(smartContract)` inside the callback.

**Single contract** (pass an enum value from `SMART_CONTRACTS`):

```typescript
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';

const smartContract = SMART_CONTRACTS.NFTS;

await withFixtures(
  {
    dappOptions: { numberOfTestDapps: 1 },
    fixtures: new FixtureBuilderV2()
      .withPermissionControllerConnectedToTestDapp()
      .build(),
    smartContract,
    title: this.test?.fullTitle(),
  },
  async ({ driver, contractRegistry }) => {
    const contractAddress = contractRegistry.getContractAddress(smartContract);
    // ...
  },
);
```

**Contract with custom deployer** (e.g. deploy from a Ledger account):

```typescript
await withFixtures(
  {
    dappOptions: { numberOfTestDapps: 1 },
    fixtures: new FixtureBuilderV2()
      .withLedgerAccount()
      .withPermissionControllerConnectedToTestDapp({
        account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
      })
      .build(),
    smartContract: [
      {
        name: SMART_CONTRACTS.HST,
        deployerOptions: {
          fromAddress: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
        },
      },
    ],
    title: this.test?.fullTitle(),
  },
  async ({ driver, contractRegistry }) => {
    /* ... */
  },
);
```

**Contract + custom local node** (e.g. specific mnemonic for an insufficient-funds scenario):

```typescript
await withFixtures(
  {
    dappOptions: { numberOfTestDapps: 1 },
    fixtures: new FixtureBuilderV2()
      .withPermissionControllerConnectedToTestDapp()
      .build(),
    localNodeOptions: {
      mnemonic: 'test test test test test test test test test test test junk',
    },
    smartContract: SMART_CONTRACTS.NFTS,
    title: this.test?.fullTitle(),
  },
  async ({ driver, contractRegistry }) => {
    /* ... */
  },
);
```

### Spec with test dapps

Use `dappOptions` to serve one or more test dapps alongside the extension.

**Single test dapp:**

```typescript
await withFixtures(
  {
    dappOptions: { numberOfTestDapps: 1 },
    fixtures: new FixtureBuilderV2()
      .withPermissionControllerConnectedToTestDapp()
      .build(),
    title: this.test?.fullTitle(),
  },
  async ({ driver }) => {
    /* ... */
  },
);
```

**Multiple test dapps** (e.g. request queueing across origins):

```typescript
await withFixtures(
  {
    dappOptions: { numberOfTestDapps: 2 },
    fixtures: new FixtureBuilderV2()
      .withSelectedNetworkControllerPerDomain()
      .build(),
    title: this.test?.fullTitle(),
  },
  async ({ driver }) => {
    /* ... */
  },
);
```

**Custom dapp path** (e.g. snap simple keyring site):

```typescript
import { DAPP_PATH } from '../../constants';

await withFixtures(
  {
    dappOptions: {
      customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
    },
    fixtures: new FixtureBuilderV2()
      .withSnapsPrivacyWarningAlreadyShown()
      .build(),
    testSpecificMock: mockSnapSimpleKeyringAndSite,
    title: this.test?.fullTitle(),
  },
  async ({ driver }) => {
    /* ... */
  },
);
```

## Page object (`test/e2e/page-objects/pages/<area>/<name>.ts`)

```typescript
import type { RawLocator } from '../../common';
import { Driver } from '../../../webdriver/driver';

class MyFeaturePage {
  private driver: Driver;

  private readonly primaryActionButton: RawLocator = {
    testId: 'my-feature-primary-action',
  };

  private readonly screenTitle: RawLocator = {
    testId: 'my-feature-title',
    text: 'Expected title',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.screenTitle,
      this.primaryActionButton,
    ]);
  }

  async clickPrimaryAction(): Promise<void> {
    await this.driver.clickElement(this.primaryActionButton);
  }
}

export default MyFeaturePage;
```

**Import path depth:** From `test/e2e/page-objects/pages/foo.ts` use `../../webdriver/driver`. From `test/e2e/page-objects/pages/subdir/foo.ts` use `../../../webdriver/driver`.

## Flow object (`test/e2e/page-objects/flows/<name>.flow.ts`)

`console.log` lines are **breadcrumbs for E2E logs** (same pattern as `login.flow.ts`); keep them concise.

```typescript
import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import MyFeaturePage from '../pages/<path-to-my-feature-page>';

/**
 * Completes the my-feature journey from home.
 *
 * @param driver - WebDriver instance.
 */
export async function openMyFeatureFromHome(driver: Driver): Promise<void> {
  console.log('Opening my feature from home');
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  // Navigate via home page methods...

  const myFeaturePage = new MyFeaturePage(driver);
  await myFeaturePage.checkPageIsLoaded();
}
```
