import { cloneDeep } from 'lodash';
import { migrate, version } from './207';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

const MUSD_ADDRESS = '0xaca92e438df0b2401ff60da7e4337b687a2435da';
const MUSD_TOKEN = {
  address: MUSD_ADDRESS,
  decimals: 6,
  symbol: 'mUSD',
  name: 'MetaMask USD',
};

const ACCOUNT_1 = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const ACCOUNT_2 = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const OTHER_TOKEN = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  decimals: 18,
  symbol: 'FOO',
};

/** Minimal AccountsController entry for an EVM account. */
function makeEvmAccount(address: string) {
  return {
    id: address,
    address,
    type: 'eip155:eoa',
    metadata: {},
    options: {},
    methods: [],
  };
}

/** Stub NetworkController state with the given chains configured. */
function makeNetworkController(chainIds: string[]) {
  const networkConfigurationsByChainId: Record<string, unknown> = {};
  for (const chainId of chainIds) {
    networkConfigurationsByChainId[chainId] = { chainId };
  }
  return { networkConfigurationsByChainId };
}

/** Build a base storage object with common AccountsController + TokensController state. */
function makeStorage(
  allTokens: Record<string, Record<string, unknown[]>>,
  accounts: Record<string, ReturnType<typeof makeEvmAccount>> = {
    [ACCOUNT_1]: makeEvmAccount(ACCOUNT_1),
    [ACCOUNT_2]: makeEvmAccount(ACCOUNT_2),
  },
  configuredChainIds: string[] = ['0x1', '0xe708', '0x8f'],
) {
  return {
    meta: { version: OLD_VERSION },
    data: {
      AccountsController: {
        internalAccounts: {
          accounts,
          selectedAccount: ACCOUNT_1,
        },
      },
      NetworkController: makeNetworkController(configuredChainIds),
      TokensController: { allTokens },
    },
  };
}

describe(`migration #${VERSION}`, () => {
  it('seeds mUSD on mainnet, Linea, and Monad for all EVM accounts even when allTokens is empty', async () => {
    const oldStorage = makeStorage({});

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);

    const { allTokens } = versionedData.data.TokensController as {
      allTokens: Record<string, Record<string, (typeof MUSD_TOKEN)[]>>;
    };

    for (const chainId of ['0x1', '0xe708', '0x8f']) {
      expect(allTokens[chainId][ACCOUNT_1]).toStrictEqual([MUSD_TOKEN]);
      expect(allTokens[chainId][ACCOUNT_2]).toStrictEqual([MUSD_TOKEN]);
    }

    expect(changedControllers).toStrictEqual(new Set(['TokensController']));
  });

  it('preserves existing tokens and appends mUSD', async () => {
    const oldStorage = makeStorage(
      { '0x1': { [ACCOUNT_1]: [OTHER_TOKEN], [ACCOUNT_2]: [] } },
      {
        [ACCOUNT_1]: makeEvmAccount(ACCOUNT_1),
        [ACCOUNT_2]: makeEvmAccount(ACCOUNT_2),
      },
    );

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    const { allTokens } = versionedData.data.TokensController as {
      allTokens: Record<string, Record<string, unknown[]>>;
    };

    expect(allTokens['0x1'][ACCOUNT_1]).toStrictEqual([
      OTHER_TOKEN,
      MUSD_TOKEN,
    ]);
    expect(allTokens['0x1'][ACCOUNT_2]).toStrictEqual([MUSD_TOKEN]);
    expect(allTokens['0xe708'][ACCOUNT_1]).toStrictEqual([MUSD_TOKEN]);
    expect(allTokens['0x8f'][ACCOUNT_2]).toStrictEqual([MUSD_TOKEN]);

    expect(changedControllers).toStrictEqual(new Set(['TokensController']));
  });

  it('does not add a duplicate when mUSD is already present for an account + network', async () => {
    const oldStorage = makeStorage(
      {
        '0x1': { [ACCOUNT_1]: [MUSD_TOKEN] },
        '0xe708': { [ACCOUNT_1]: [OTHER_TOKEN, MUSD_TOKEN] },
        '0x8f': { [ACCOUNT_1]: [MUSD_TOKEN] },
      },
      { [ACCOUNT_1]: makeEvmAccount(ACCOUNT_1) },
    );

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    const { allTokens } = versionedData.data.TokensController as {
      allTokens: Record<string, Record<string, unknown[]>>;
    };

    expect(allTokens['0x1'][ACCOUNT_1]).toStrictEqual([MUSD_TOKEN]);
    expect(allTokens['0xe708'][ACCOUNT_1]).toStrictEqual([
      OTHER_TOKEN,
      MUSD_TOKEN,
    ]);
    expect(allTokens['0x8f'][ACCOUNT_1]).toStrictEqual([MUSD_TOKEN]);

    // Nothing changed
    expect(changedControllers).toStrictEqual(new Set([]));
  });

  it('treats a checksummed mUSD address as already present (case-insensitive)', async () => {
    const checksummedMusd = {
      ...MUSD_TOKEN,
      address: '0xACA92E438dF0B2401Ff60Da7E4337b687A2435dA',
    };
    const oldStorage = makeStorage(
      {
        '0x1': { [ACCOUNT_1]: [checksummedMusd] },
        '0xe708': { [ACCOUNT_1]: [checksummedMusd] },
        '0x8f': { [ACCOUNT_1]: [checksummedMusd] },
      },
      { [ACCOUNT_1]: makeEvmAccount(ACCOUNT_1) },
    );

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    const { allTokens } = versionedData.data.TokensController as {
      allTokens: Record<string, Record<string, unknown[]>>;
    };

    expect(allTokens['0x1'][ACCOUNT_1]).toStrictEqual([checksummedMusd]);
    expect(allTokens['0xe708'][ACCOUNT_1]).toStrictEqual([checksummedMusd]);
    expect(allTokens['0x8f'][ACCOUNT_1]).toStrictEqual([checksummedMusd]);
    expect(changedControllers).toStrictEqual(new Set([]));
  });

  it('only seeds chains that are present in NetworkController.networkConfigurationsByChainId', async () => {
    const oldStorage = makeStorage(
      {},
      { [ACCOUNT_1]: makeEvmAccount(ACCOUNT_1) },
      ['0x1', '0xe708'],
    );

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    const { allTokens } = versionedData.data.TokensController as {
      allTokens: Record<string, Record<string, unknown[]>>;
    };

    expect(allTokens['0x1'][ACCOUNT_1]).toStrictEqual([MUSD_TOKEN]);
    expect(allTokens['0xe708'][ACCOUNT_1]).toStrictEqual([MUSD_TOKEN]);
    expect(allTokens['0x8f']).toBeUndefined();
    expect(changedControllers).toStrictEqual(new Set(['TokensController']));
  });

  it('does nothing when no mUSD chains are configured in NetworkController', async () => {
    const oldStorage = makeStorage(
      {},
      { [ACCOUNT_1]: makeEvmAccount(ACCOUNT_1) },
      ['0x89'],
    );

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(
      (versionedData.data.TokensController as { allTokens: unknown }).allTokens,
    ).toStrictEqual({});
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when NetworkController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: { [ACCOUNT_1]: makeEvmAccount(ACCOUNT_1) },
            selectedAccount: ACCOUNT_1,
          },
        },
        TokensController: { allTokens: {} },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(
      (versionedData.data.TokensController as { allTokens: unknown }).allTokens,
    ).toStrictEqual({});
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when AccountsController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: { TokensController: { allTokens: {} } },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when AccountsController has no EVM accounts', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AccountsController: {
          internalAccounts: { accounts: {}, selectedAccount: '' },
        },
        TokensController: { allTokens: {} },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(
      (versionedData.data.TokensController as { allTokens: unknown }).allTokens,
    ).toStrictEqual({});
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when TokensController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: { [ACCOUNT_1]: makeEvmAccount(ACCOUNT_1) },
            selectedAccount: ACCOUNT_1,
          },
        },
        NetworkController: makeNetworkController(['0x1', '0xe708', '0x8f']),
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when allTokens is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: { [ACCOUNT_1]: makeEvmAccount(ACCOUNT_1) },
            selectedAccount: ACCOUNT_1,
          },
        },
        NetworkController: makeNetworkController(['0x1', '0xe708', '0x8f']),
        TokensController: { allTokens: 'not-an-object' },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(
      (versionedData.data.TokensController as { allTokens: unknown }).allTokens,
    ).toBe('not-an-object');
    expect(changedControllers.size).toBe(0);
  });
});
