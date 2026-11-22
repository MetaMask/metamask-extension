import firstTimeState from '../first-time-state';
import migration28 from './028';

type MigrationInput = Parameters<typeof migration28.migrate>[0];

const oldStorage: MigrationInput = {
  meta: { version: 27 },
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
  },
};

describe('migration #28', () => {
  it('should add corresponding tokens to accountTokens', async () => {
    const newStorage = await migration28.migrate(
      oldStorage as unknown as MigrationInput,
    );

    const preferences = newStorage.data.PreferencesController as {
      tokens: { address: string; symbol: string; decimals: number }[];
      accountTokens: Record<
        string,
        { mainnet: { address: string; symbol: string; decimals: number }[] }
      >;
    };

    const newTokens = preferences.tokens;
    const newAccountTokens = preferences.accountTokens;

    const testTokens = [
      { address: '0xa', symbol: 'A', decimals: 4 },
      { address: '0xb', symbol: 'B', decimals: 4 },
    ];
    expect(newTokens).toHaveLength(0);

    expect(newAccountTokens['0x6d14'].mainnet).toHaveLength(2);

    expect(newAccountTokens['0x3695'].mainnet).toHaveLength(2);

    expect(Object.keys(newAccountTokens)).toHaveLength(2);

    expect(newAccountTokens['0x6d14'].mainnet).toStrictEqual(testTokens);

    expect(newAccountTokens['0x3695'].mainnet).toStrictEqual(testTokens);
  });

  it('should successfully migrate first time state', async () => {
    const migratedData = await migration28.migrate({
      meta: { version: 27 },
      data: firstTimeState,
    });

    expect(migratedData.meta.version).toStrictEqual(migration28.version);
  });
});
