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
