import { migrate, version } from './133.2';

const oldVersion = 133.1;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if theres no tokens controller state defined', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if theres empty tokens controller state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokensController: {},
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if theres empty tokens controller state for allTokens', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokensController: {
          allTokens: {},
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if theres empty tokens controller state for mainnet', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokensController: {
          allTokens: {
            '0x1': {},
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('Does nothing if theres no tokens with empty address', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokensController: {
          allTokens: {
            '0x1': {
              '0x123': [
                { address: '0x1', symbol: 'TOKEN1', decimals: 18 },
                { address: '0x2', symbol: 'TOKEN2', decimals: 18 },
              ],
              '0x123456': [
                { address: '0x3', symbol: 'TOKEN3', decimals: 18 },
                { address: '0x4', symbol: 'TOKEN4', decimals: 18 },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('Removes tokens with empty address', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokensController: {
          allTokens: {
            '0x1': {
              '0x123': [
                {
                  address: '0x0000000000000000000000000000000000000000',
                  symbol: 'eth',
                  decimals: 18,
                },
                { address: '0x2', symbol: 'TOKEN2', decimals: 18 },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TokensController: {
        allTokens: {
          '0x1': {
            '0x123': [{ address: '0x2', symbol: 'TOKEN2', decimals: 18 }],
          },
        },
      },
    });
  });

  it('Removes tokens with empty address across multiple accounts', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokensController: {
          allTokens: {
            '0x1': {
              '0x123': [
                {
                  address: '0x0000000000000000000000000000000000000000',
                  symbol: 'eth',
                  decimals: 18,
                },
                { address: '0x2', symbol: 'TOKEN2', decimals: 18 },
              ],
              '0x456': [
                {
                  address: '0x0000000000000000000000000000000000000000',
                  symbol: 'eth',
                  decimals: 18,
                },
                { address: '0x3', symbol: 'TOKEN3', decimals: 18 },
              ],
              '0x789': [{ address: '0x4', symbol: 'TOKEN4', decimals: 18 }],
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TokensController: {
        allTokens: {
          '0x1': {
            '0x123': [{ address: '0x2', symbol: 'TOKEN2', decimals: 18 }],
            '0x456': [{ address: '0x3', symbol: 'TOKEN3', decimals: 18 }],
            '0x789': [{ address: '0x4', symbol: 'TOKEN4', decimals: 18 }],
          },
        },
      },
    });
  });

  it('Does not change state on chains other than mainnet', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokensController: {
          allTokens: {
            '0x999': {
              '0x123': [
                {
                  address: '0x0000000000000000000000000000000000000000',
                  symbol: 'eth',
                  decimals: 18,
                },
                { address: '0x2', symbol: 'TOKEN2', decimals: 18 },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
