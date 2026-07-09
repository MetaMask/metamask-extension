import path from 'path';
import { withFixtures } from '../helpers';
import {
  computeSchemaDiff,
  formatSchemaDiff,
  hasSchemaDifferences,
  readFixtureFile,
} from '../fixtures/fixture-validation';
import {
  generateDefaultFixtureState,
  generateOnboardingFixtureState,
} from '../page-objects/flows/wallet-fixture.flow';

const ONBOARDING_FIXTURE_PATH = path.resolve(
  __dirname,
  '../fixtures',
  'onboarding-fixture.json',
);

const DEFAULT_FIXTURE_PATH = path.resolve(
  __dirname,
  '../fixtures',
  'default-fixture.json',
);

describe('Wallet State', function () {
  it('matches the committed onboarding fixture schema', async function () {
    // Skip on Firefox - this.skip() throws immediately and prevents withFixtures() from running
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }

    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const validatedState = await generateOnboardingFixtureState(driver);

        const existingFixture = await readFixtureFile(ONBOARDING_FIXTURE_PATH);
        const schemaDiff = computeSchemaDiff(existingFixture, validatedState);

        if (hasSchemaDifferences(schemaDiff)) {
          const message = formatSchemaDiff(schemaDiff);
          console.log(
            '\n=============================================================================\n',
          );
          console.log('⚠️  WALLET FIXTURE STATE VALIDATION FAILED');
          console.log(
            '=============================================================================\n',
          );
          console.log(
            '🤖 Automatic update: comment @metamaskbot update-e2e-fixture',
          );
          console.log(
            '\n🛠️  Manual update steps:\n  yarn dist\n  yarn test:e2e:single test/e2e/dist/wallet-fixture-export.spec.ts --browser chrome',
          );
          console.log(
            '\n=============================================================================\n',
          );
          throw new Error(message);
        }
      },
    );
  });

  it('matches the committed default fixture schema', async function () {
    // Skip on Firefox - this.skip() throws immediately and prevents withFixtures() from running
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }

    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const validatedState = await generateDefaultFixtureState(driver);

        const existingFixture = await readFixtureFile(DEFAULT_FIXTURE_PATH);
        const schemaDiff = computeSchemaDiff(existingFixture, validatedState);

        if (hasSchemaDifferences(schemaDiff)) {
          const message = formatSchemaDiff(schemaDiff);
          console.log(
            '\n=============================================================================\n',
          );
          console.log('⚠️  WALLET FIXTURE STATE VALIDATION FAILED');
          console.log(
            '=============================================================================\n',
          );
          console.log(
            '🤖 Automatic update: comment @metamaskbot update-e2e-fixture',
          );
          console.log(
            '\n🛠️  Manual update steps:\n  yarn dist\n  yarn test:e2e:single test/e2e/dist/wallet-fixture-export.spec.ts --browser chrome',
          );
          console.log(
            '\n=============================================================================\n',
          );
          throw new Error(message);
        }
      },
    );
  });
});
