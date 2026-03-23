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

### Spec with remote feature flags

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
