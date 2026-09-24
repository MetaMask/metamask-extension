import migration31 from './031';

type MigrationInput = Parameters<typeof migration31.migrate>[0];

describe('migration #31', () => {
  it('should set completedOnboarding to true if vault exists', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 30 },
      data: {
        PreferencesController: {
          tokens: [
            { address: '0xa', symbol: 'A', decimals: 4 },
            { address: '0xb', symbol: 'B', decimals: 4 },
          ],
          identities: {
            '0x6d14': {},
            '0x3695': {},
          },
        },
        KeyringController: {
          vault: {
            data: 'test0',
            iv: 'test1',
            salt: 'test2',
          },
        },
      },
    };

    const newStorage = await migration31.migrate(
      oldStorage as unknown as MigrationInput,
    );

    expect(
      (
        newStorage.data.PreferencesController as {
          completedOnboarding: boolean;
        }
      ).completedOnboarding,
    ).toStrictEqual(true);
  });

  it('should set completedOnboarding to false if vault does not exist', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 30 },
      data: {
        PreferencesController: {
          tokens: [
            { address: '0xa', symbol: 'A', decimals: 4 },
            { address: '0xb', symbol: 'B', decimals: 4 },
          ],
          identities: {
            '0x6d14': {},
            '0x3695': {},
          },
        },
        KeyringController: {},
      },
    };

    const newStorage = await migration31.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(
      (
        newStorage.data.PreferencesController as {
          completedOnboarding: boolean;
        }
      ).completedOnboarding,
    ).toStrictEqual(false);
  });
});
