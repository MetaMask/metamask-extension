import type { MetaMaskStorageStructure } from '../../../../shared/lib/stores/base-store';
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';
import { readPersistedStateWithTrace } from './trace-state-load';

const mockGetStoredBytes = jest.fn();
const mockIsRecording = jest.fn(() => true);
const mockTraceContext = {
  isRecording: mockIsRecording,
};
const READ_END_MOCK = 1_700_000_000_000;

jest.mock('../setup-initial-state-hooks', () => ({
  persistenceManager: {
    getStoredBytes: (...args: unknown[]) => mockGetStoredBytes(...args),
  },
}));

let mockPerformanceNow = READ_END_MOCK;

jest.mock('../../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../../shared/lib/trace'),
  trace: jest.fn(),
  endTrace: jest.fn(),
  getPerformanceTimestamp: jest.fn(() => {
    mockPerformanceNow += 25;
    return mockPerformanceNow;
  }),
}));

const mockTrace = jest.mocked(trace);
const mockEndTrace = jest.mocked(endTrace);

const SPLIT_STATE: MetaMaskStorageStructure = {
  data: {
    AccountsController: {
      internalAccounts: {
        accounts: {
          'account-1': { address: '0x123', name: 'Secret Name' },
          'account-2': { address: '0x456', name: 'Other Name' },
        },
      },
    },
    AssetsController: {
      assetsBalance: {
        'account-1': {
          'eip155:1/slip44:60': { amount: '1' },
          'eip155:1/erc20:0xdai': { amount: '2' },
          'eip155:1/erc20:0xusdc': { amount: '3' },
        },
        'account-2': {
          'eip155:1/erc20:0xweth': { amount: '4' },
        },
      },
      customAssets: {
        'account-1': ['eip155:1/erc20:0xdai'],
      },
    },
    KeyringController: { vault: 'encrypted-vault' },
  },
  meta: { version: 200, storageKind: 'split' },
};

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('readPersistedStateWithTrace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow = READ_END_MOCK;
    mockIsRecording.mockReturnValue(true);
    mockTrace.mockReturnValue(mockTraceContext);
    mockGetStoredBytes.mockResolvedValue({
      bytes: 4096,
      source: 'storage_get_bytes_in_use',
    });
  });

  // Drain the deferred size-measurement macrotask so it cannot leak into later tests.
  afterEach(async () => {
    await flushPromises();
  });

  it('starts a root State Load span', async () => {
    await readPersistedStateWithTrace(async () => SPLIT_STATE);

    expect(mockTrace).toHaveBeenCalledWith({
      name: TraceName.StateLoad,
      op: TraceOperation.StateRead,
      root: true,
    });
  });

  it('returns the read result', async () => {
    const result = await readPersistedStateWithTrace(async () => SPLIT_STATE);

    expect(result).toBe(SPLIT_STATE);
  });

  it('defers size measurement until after the read helper returns', async () => {
    await readPersistedStateWithTrace(async () => SPLIT_STATE);

    expect(mockGetStoredBytes).not.toHaveBeenCalled();
    expect(mockEndTrace).not.toHaveBeenCalled();

    await flushPromises();

    expect(mockGetStoredBytes).toHaveBeenCalledTimes(1);
    expect(mockEndTrace).toHaveBeenCalledTimes(1);
  });

  it('ends the span at the read end time with size and counts', async () => {
    await readPersistedStateWithTrace(async () => SPLIT_STATE);
    await flushPromises();

    expect(mockGetStoredBytes).toHaveBeenCalledWith(
      ['AccountsController', 'AssetsController', 'KeyringController', 'meta'],
      {
        AccountsController: SPLIT_STATE.data?.AccountsController,
        AssetsController: SPLIT_STATE.data?.AssetsController,
        KeyringController: SPLIT_STATE.data?.KeyringController,
        meta: SPLIT_STATE.meta,
      },
    );
    expect(mockEndTrace).toHaveBeenCalledWith({
      name: TraceName.StateLoad,
      timestamp: READ_END_MOCK + 50,
      data: expect.objectContaining({
        'state.raw_size_bytes': 4096,
        'state.size_measurement_source': 'storage_get_bytes_in_use',
        'state.storage_kind': 'split',
        'state.is_empty': false,
        'state.account_count': 2,
        'state.asset_count': 4,
        'state.load_duration_ms': 25,
      }),
    });
  });

  it('still ends the span when endTrace throws after measurement', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockEndTrace.mockImplementationOnce(() => {
      throw new Error('endTrace failed');
    });

    await expect(
      readPersistedStateWithTrace(async () => SPLIT_STATE),
    ).resolves.toBe(SPLIT_STATE);
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[State Load] failed to end trace',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it('defaults the storage kind to data for legacy state', async () => {
    await readPersistedStateWithTrace(async () => ({
      data: SPLIT_STATE.data,
      meta: { version: 200 },
    }));
    await flushPromises();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          'state.storage_kind': 'data',
          'state.account_count': 2,
        }),
      }),
    );
  });

  it('measures legacy storage through the data and meta keys', async () => {
    const legacyState: MetaMaskStorageStructure = {
      data: SPLIT_STATE.data,
      meta: { version: 200, storageKind: 'data' },
    };
    await readPersistedStateWithTrace(async () => legacyState);
    await flushPromises();

    expect(mockGetStoredBytes).toHaveBeenCalledWith(['data', 'meta'], {
      data: legacyState.data,
      meta: legacyState.meta,
    });
  });

  it('records an estimate source when the store falls back', async () => {
    mockGetStoredBytes.mockResolvedValue({
      bytes: 512,
      source: 'json_string_length_estimate',
    });

    await readPersistedStateWithTrace(async () => SPLIT_STATE);
    await flushPromises();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          'state.raw_size_bytes': 512,
          'state.size_measurement_source': 'json_string_length_estimate',
        }),
      }),
    );
  });

  it('does not measure size when the span is not recording', async () => {
    mockIsRecording.mockReturnValue(false);

    await readPersistedStateWithTrace(async () => SPLIT_STATE);
    await flushPromises();

    expect(mockGetStoredBytes).not.toHaveBeenCalled();
    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          'state.raw_size_bytes': expect.anything(),
        }),
      }),
    );
  });

  it('does not measure size for a fresh install', async () => {
    await readPersistedStateWithTrace(async () => undefined);
    await flushPromises();

    expect(mockGetStoredBytes).not.toHaveBeenCalled();
    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          'state.is_empty': true,
          'state.storage_kind': 'data',
          'state.account_count': 0,
          'state.asset_count': 0,
        }),
      }),
    );
  });

  it('measures size when data is an empty object', async () => {
    const emptyDataState: MetaMaskStorageStructure = {
      data: {},
      meta: { version: 200, storageKind: 'split' },
    };

    await readPersistedStateWithTrace(async () => emptyDataState);
    await flushPromises();

    expect(mockGetStoredBytes).toHaveBeenCalledWith(['meta'], {
      meta: emptyDataState.meta,
    });
    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          'state.is_empty': false,
          'state.raw_size_bytes': 4096,
        }),
      }),
    );
  });

  it('measures size when data is missing but meta exists', async () => {
    const metaOnlyState = {
      meta: { version: 200, storageKind: 'split' as const },
    } as MetaMaskStorageStructure;

    await readPersistedStateWithTrace(async () => metaOnlyState);
    await flushPromises();

    expect(mockGetStoredBytes).toHaveBeenCalledWith(['meta'], {
      meta: metaOnlyState.meta,
    });
  });

  it('counts zero for malformed controller state', async () => {
    await readPersistedStateWithTrace(async () => ({
      data: {
        AccountsController: { internalAccounts: 'not-an-object' },
        AssetsController: {
          assetsBalance: { 'account-1': 'not-an-object' },
          customAssets: { 'account-1': 'not-an-array' },
        },
      },
      meta: { version: 200, storageKind: 'split' },
    }));
    await flushPromises();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          'state.account_count': 0,
          'state.asset_count': 0,
        }),
      }),
    );
  });

  it('counts the union of balance and custom-only assets per account', async () => {
    await readPersistedStateWithTrace(async () => ({
      data: {
        AssetsController: {
          assetsBalance: {
            'account-1': {
              'eip155:1/slip44:60': { amount: '1' },
              'eip155:1/erc20:0xdai': { amount: '2' },
            },
          },
          customAssets: {
            'account-1': [
              'eip155:1/erc20:0xdai',
              'eip155:1/erc20:0xcustom-only',
            ],
            'account-2': ['eip155:1/erc20:0xother-custom'],
          },
        },
      },
      meta: { version: 200, storageKind: 'split' },
    }));
    await flushPromises();

    // account-1: slip44 + dai + custom-only (dai deduped) = 3
    // account-2: other-custom = 1
    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          'state.asset_count': 4,
        }),
      }),
    );
  });

  it('contains no state values', async () => {
    await readPersistedStateWithTrace(async () => SPLIT_STATE);
    await flushPromises();

    const serialized = JSON.stringify(mockEndTrace.mock.calls[0][0].data);

    expect(serialized).not.toContain('0x123');
    expect(serialized).not.toContain('Secret Name');
    expect(serialized).not.toContain('encrypted-vault');
    expect(serialized).not.toContain('DAI');
  });

  it('omits the size when neither exact bytes nor an estimate is available', async () => {
    mockGetStoredBytes.mockResolvedValue(undefined);

    await readPersistedStateWithTrace(async () => SPLIT_STATE);
    await flushPromises();

    expect(mockEndTrace).toHaveBeenCalledTimes(1);
    expect(mockEndTrace.mock.calls[0][0].data).not.toHaveProperty(
      'state.raw_size_bytes',
    );
    expect(mockEndTrace.mock.calls[0][0].data).not.toHaveProperty(
      'state.size_measurement_source',
    );
  });

  it('ends the span even when size measurement throws', async () => {
    mockGetStoredBytes.mockRejectedValue(new Error('measure failed'));

    await readPersistedStateWithTrace(async () => SPLIT_STATE);
    await flushPromises();

    expect(mockEndTrace).toHaveBeenCalledTimes(1);
  });

  it('ends the span with an error status and rethrows when the read fails', async () => {
    const error = new Error('storage.local is broken');

    await expect(
      readPersistedStateWithTrace(async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(mockEndTrace).toHaveBeenCalledWith({
      name: TraceName.StateLoad,
      status: 'error',
      data: { 'state.load_failed': true },
    });
    expect(mockGetStoredBytes).not.toHaveBeenCalled();
  });

  it('rethrows the read error when endTrace throws', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const error = new Error('storage.local is broken');
    mockEndTrace.mockImplementationOnce(() => {
      throw new Error('endTrace failed');
    });

    await expect(
      readPersistedStateWithTrace(async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[State Load] failed to end trace',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
