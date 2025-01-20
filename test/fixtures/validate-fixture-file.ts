import { validateStateSchema } from './validate-schema';
import updatedFixture from './fixture-updated.json';

try {
  validateStateSchema(updatedFixture);
  console.log('Schema validation passed!');
} catch (err) {
  console.error('Schema validation failed:', err);
  process.exit(1);
}
