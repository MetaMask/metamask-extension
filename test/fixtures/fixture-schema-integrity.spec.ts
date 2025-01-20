import assert from 'assert';
import { Driver } from '../e2e/webdriver/driver';
import { withFixtures, WALLET_PASSWORD } from '../e2e/helpers';
import { importSRPOnboardingFlow } from '../e2e/page-objects/flows/onboarding.flow';
import { E2E_SRP, defaultFixture } from '../e2e/default-fixture';

type SchemaType = string | SchemaType[] | { [key: string]: SchemaType } | null;
type StateType = {
  data: {
    [key: string]: unknown;
  };
  meta: {
    version: number;
  };
};

describe('Fixture Schema Integrity', function () {
  let driver: Driver;
  let walletState: StateType;

  before(async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
      },
      async ({ driver: testDriver }) => {
        driver = testDriver;
        await driver.waitUntilXWindowHandles(2);
        const windowHandles = await driver.driver.getAllWindowHandles();
        await driver.driver.switchTo().window(windowHandles[2]);

        // Get fresh wallet state after onboarding
        await importSRPOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
          seedPhrase: E2E_SRP,
        });

        walletState = (await driver.executeScript(`
          return await window.stateHooks.getPersistedState();
        `)) as StateType;
      },
    );
  });

  // Compare each controller's schema
  Object.keys(defaultFixture().data).forEach((controllerName) => {
    it(`should have matching schema for ${controllerName}`, function () {
      const walletController = walletState.data[controllerName];
      const fixtureController = defaultFixture().data[controllerName];

      // Compare schema structure
      const walletSchema = getObjectSchema(walletController);
      const fixtureSchema = getObjectSchema(fixtureController);

      try {
        assert.deepStrictEqual(
          walletSchema,
          fixtureSchema,
          `Schema mismatch in ${controllerName}. Wallet schema: ${JSON.stringify(
            walletSchema,
            null,
            2,
          )}, Fixture schema: ${JSON.stringify(fixtureSchema, null, 2)}`,
        );
      } catch (err) {
        console.error(`Schema validation failed for ${controllerName}`);
        console.error('Wallet Schema:', JSON.stringify(walletSchema, null, 2));
        console.error(
          'Fixture Schema:',
          JSON.stringify(fixtureSchema, null, 2),
        );
        console.log(
          'Please update the default-fixture file and methods to match the updated state schema.',
        );
        throw err;
      }
    });
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });
});

// Helper to get schema structure of an object
function getObjectSchema(obj: unknown): SchemaType {
  if (obj === null) {
    return 'null';
  }
  if (Array.isArray(obj)) {
    return obj.length > 0 ? [getObjectSchema(obj[0])] : ['array'];
  }
  if (typeof obj === 'object') {
    const schema: Record<string, SchemaType> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      schema[key] = getObjectSchema(value);
    }
    return schema;
  }
  return typeof obj;
}
