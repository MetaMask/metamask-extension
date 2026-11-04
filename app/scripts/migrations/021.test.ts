import wallet2 from '../../../test/lib/migrations/002.json';
import migration21 from './021';

type MigrationInput = Parameters<typeof migration21.migrate>[0];

describe('wallet2 is migrated successfully with out the BlacklistController', () => {
  it('should delete BlacklistController key', async () => {
    const migratedData = await migration21.migrate(wallet2 as MigrationInput);

    expect(migratedData.meta.version).toStrictEqual(21);
    expect(migratedData.data.BlacklistController).toBeUndefined();
    expect(migratedData.data.RecentBlocks).toBeUndefined();
  });
});
