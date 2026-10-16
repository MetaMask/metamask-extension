import migrate, { version } from './232';

const TEMPO_CHAIN_ID = '0x1079';
const OTHER_CHAIN_ID = '0x1';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

function buildNetworkConfiguration(chainId: string, nativeCurrency: string) {
  return {
    chainId,
    name: 'Test Network',
    nativeCurrency,
    blockExplorerUrls: ['https://explorer.example'],
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'test-network',
        url: 'https://rpc.example',
        type: 'custom',
      },
    ],
  };
}

function buildState(nativeCurrency: string): VersionedData {
  return {
    meta: { version: version - 1 },
    data: {
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          [OTHER_CHAIN_ID]: buildNetworkConfiguration(OTHER_CHAIN_ID, 'ETH'),
          [TEMPO_CHAIN_ID]: buildNetworkConfiguration(
            TEMPO_CHAIN_ID,
            nativeCurrency,
          ),
        },
      },
    },
  };
}

function getConfiguration(state: VersionedData, chainId: string) {
  const networkController = state.data.NetworkController as {
    networkConfigurationsByChainId: Record<string, { nativeCurrency: string }>;
  };
  return networkController.networkConfigurationsByChainId[chainId];
}

describe(`migration #${version}`, () => {
  it('bumps the state version', async () => {
    const state: VersionedData = {
      meta: { version: version - 1 },
      data: {},
    };

    await migrate(state, new Set());

    expect(state.meta.version).toBe(version);
  });

  it('replaces the Tempo pathUSD native currency with USD', async () => {
    const state = buildState('pathUSD');
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(getConfiguration(state, TEMPO_CHAIN_ID).nativeCurrency).toBe('USD');
    expect(changedControllers).toStrictEqual(new Set(['NetworkController']));
  });

  it('does not modify other networks', async () => {
    const state = buildState('pathUSD');

    await migrate(state, new Set());

    expect(getConfiguration(state, OTHER_CHAIN_ID)).toStrictEqual(
      buildNetworkConfiguration(OTHER_CHAIN_ID, 'ETH'),
    );
  });

  it('leaves Tempo unchanged when the native currency is already USD', async () => {
    const state = buildState('USD');
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(getConfiguration(state, TEMPO_CHAIN_ID).nativeCurrency).toBe('USD');
    expect(changedControllers.size).toBe(0);
  });

  it('leaves a customized Tempo native currency unchanged', async () => {
    const state = buildState('CUSTOM');
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(getConfiguration(state, TEMPO_CHAIN_ID).nativeCurrency).toBe(
      'CUSTOM',
    );
    expect(changedControllers.size).toBe(0);
  });

  it('is a no-op when Tempo is not configured', async () => {
    const state: VersionedData = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {},
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(state.data).toStrictEqual({
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {},
      },
    });
    expect(changedControllers.size).toBe(0);
  });

  it('is a no-op when the Tempo configuration is invalid', async () => {
    const state: VersionedData = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            [TEMPO_CHAIN_ID]: { chainId: TEMPO_CHAIN_ID },
          },
        },
      },
    };
    const changedControllers = new Set<string>();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    await migrate(state, changedControllers);

    expect(warnSpy).toHaveBeenCalledWith(
      `Migration ${version}: Invalid Tempo Mainnet network configuration, skip the migration`,
    );
    expect(state.data).toStrictEqual({
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          [TEMPO_CHAIN_ID]: { chainId: TEMPO_CHAIN_ID },
        },
      },
    });
    expect(changedControllers.size).toBe(0);
    warnSpy.mockRestore();
  });
});
