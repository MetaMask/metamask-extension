import path from 'path';
import fs from 'fs-extra';
import { withFixtures } from '../helpers';
import {
  computeSchemaDiff,
  hasSchemaDifferences,
  mergeFixtureChanges,
  readFixtureFile,
} from '../fixtures/fixture-validation';
import {
  generateDefaultFixtureState,
  generateOnboardingFixtureState,
} from '../page-objects/flows/wallet-fixture.flow';

type JsonLike = Record<string, unknown>;

describe('Wallet State', function () {
  it('export onboarding fixture', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const validatedState = await generateOnboardingFixtureState(driver);

        const outDir = path.resolve(process.cwd(), 'test', 'e2e', 'fixtures');
        await fs.ensureDir(outDir);
        const outPath = path.join(outDir, 'onboarding-fixture.json');
        console.log(
          '\n=============================================================================\n',
        );
        console.log('📁 WALLET FIXTURE STATE EXPORT');
        console.log(
          '=============================================================================\n',
        );

        // Try to read existing fixture and compute diff
        let finalState: JsonLike;
        try {
          const existingFixture = await readFixtureFile(outPath);
          const schemaDiff = computeSchemaDiff(existingFixture, validatedState);

          if (hasSchemaDifferences(schemaDiff)) {
            console.log('📊 Schema differences detected:');
            if (schemaDiff.newKeys.length > 0) {
              console.log(`  ✨ New keys: ${schemaDiff.newKeys.length}`);
              schemaDiff.newKeys.forEach((key) => console.log(`     + ${key}`));
            }
            if (schemaDiff.missingKeys.length > 0) {
              console.log(
                `  🗑️  Missing keys: ${schemaDiff.missingKeys.length}`,
              );
              schemaDiff.missingKeys.forEach((key) =>
                console.log(`     - ${key}`),
              );
            }
            if (schemaDiff.typeMismatches.length > 0) {
              console.log(
                `  🔄 Type mismatches: ${schemaDiff.typeMismatches.length}`,
              );
              schemaDiff.typeMismatches.forEach((entry) =>
                console.log(`     ~ ${entry}`),
              );
            }
            if (schemaDiff.valueMismatches.length > 0) {
              console.log(
                `  📝 Value changes: ${schemaDiff.valueMismatches.length}`,
              );
              schemaDiff.valueMismatches.forEach((entry) =>
                console.log(`     ↔ ${entry}`),
              );
            }

            // Merge only the changes into the existing fixture
            finalState = mergeFixtureChanges(
              existingFixture,
              validatedState,
              schemaDiff,
            );
            console.log(
              '\n✅ Merged changes into existing fixture (preserving ignored keys)',
            );
          } else {
            console.log(
              '✅ No schema differences detected - fixture is up to date',
            );
            finalState = existingFixture;
          }
        } catch (error) {
          console.error('❌ Failed to read existing fixture file:', error);
          throw error;
        }

        console.log(`\n📂 Output: ${outPath}`);
        console.log(
          '\n=============================================================================\n',
        );

        await fs.writeJson(outPath, finalState, { spaces: 2 });
      },
    );
  });
  it('export default fixture', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const validatedState = await generateDefaultFixtureState(driver);

        const outDir = path.resolve(process.cwd(), 'test', 'e2e', 'fixtures');
        await fs.ensureDir(outDir);
        const outPath = path.join(outDir, 'default-fixture.json');
        console.log(
          '\n=============================================================================\n',
        );
        console.log('📁 WALLET FIXTURE STATE EXPORT');
        console.log(
          '=============================================================================\n',
        );

        // Try to read existing fixture and compute diff
        let finalState: JsonLike;
        try {
          const existingFixture = await readFixtureFile(outPath);
          const schemaDiff = computeSchemaDiff(existingFixture, validatedState);

          if (hasSchemaDifferences(schemaDiff)) {
            console.log('📊 Schema differences detected:');
            if (schemaDiff.newKeys.length > 0) {
              console.log(`  ✨ New keys: ${schemaDiff.newKeys.length}`);
              schemaDiff.newKeys.forEach((key) => console.log(`     + ${key}`));
            }
            if (schemaDiff.missingKeys.length > 0) {
              console.log(
                `  🗑️  Missing keys: ${schemaDiff.missingKeys.length}`,
              );
              schemaDiff.missingKeys.forEach((key) =>
                console.log(`     - ${key}`),
              );
            }
            if (schemaDiff.typeMismatches.length > 0) {
              console.log(
                `  🔄 Type mismatches: ${schemaDiff.typeMismatches.length}`,
              );
              schemaDiff.typeMismatches.forEach((entry) =>
                console.log(`     ~ ${entry}`),
              );
            }
            if (schemaDiff.valueMismatches.length > 0) {
              console.log(
                `  📝 Value changes: ${schemaDiff.valueMismatches.length}`,
              );
              schemaDiff.valueMismatches.forEach((entry) =>
                console.log(`     ↔ ${entry}`),
              );
            }

            // Merge only the changes into the existing fixture
            finalState = mergeFixtureChanges(
              existingFixture,
              validatedState,
              schemaDiff,
            );
            console.log(
              '\n✅ Merged changes into existing fixture (preserving ignored keys)',
            );
          } else {
            console.log(
              '✅ No schema differences detected - fixture is up to date',
            );
            finalState = existingFixture;
          }
        } catch (error) {
          console.error('❌ Failed to read existing fixture file:', error);
          throw error;
        }

        console.log(`\n📂 Output: ${outPath}`);
        console.log(
          '\n=============================================================================\n',
        );

        await fs.writeJson(outPath, finalState, { spaces: 2 });
      },
    );
  });
});
