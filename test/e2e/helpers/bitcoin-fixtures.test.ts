/** @jest-environment node */
import type { MockedEndpoint, Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../constants';
import { withFixtures } from '../helpers';
import { BitcoinNode } from '../seeder/bitcoin/node';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from '../tests/btc/mocks';
import { proxyBitcoinBlockchainCalls } from '../tests/btc/mocks/local-bitcoin-node-mocks';
import {
  mockPriceMulti,
  mockPriceMultiBtcAndSol,
} from '../tests/btc/mocks/min-api';
import { withBitcoinFixtures } from '../tests/btc/fixtures/with-bitcoin-fixtures';

jest.mock('../helpers', () => ({ withFixtures: jest.fn() }));
jest.mock('../constants', () => ({ DEFAULT_BTC_BALANCE: 100_000 }));
jest.mock('../seeder/bitcoin/node', () => ({
  BitcoinNode: class {},
}));
jest.mock('../tests/btc/mocks', () => ({
  mockCurrencyExchangeRates: jest.fn(),
  mockExchangeRates: jest.fn(),
  mockFiatExchangeRates: jest.fn(),
  mockInitialFullScan: jest.fn(),
  mockSolanaSpotPrices: jest.fn(),
  mockSupportedVsCurrencies: jest.fn(),
  mockTokensV2SupportedNetworks: jest.fn(),
  mockTokensV3Assets: jest.fn(),
}));
jest.mock('../tests/btc/mocks/local-bitcoin-node-mocks', () => ({
  proxyBitcoinBlockchainCalls: jest.fn(),
}));
jest.mock('../tests/btc/mocks/min-api', () => ({
  mockPriceMulti: jest.fn(),
  mockPriceMultiBtcAndSol: jest.fn(),
}));

type CapturedOptions = {
  afterLocalNodesStart: (context: { localNodes: unknown[] }) => Promise<void>;
  testSpecificMock: (server: Mockttp) => Promise<MockedEndpoint[]>;
};

// helpers.js declares its options as `object`, not a typed options interface.
function capturedOptions(): CapturedOptions {
  return jest.mocked(withFixtures).mock.calls[0][0] as CapturedOptions;
}

function endpoint(id: string): MockedEndpoint {
  return { id } as MockedEndpoint;
}

const commonMocks = [
  mockExchangeRates,
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockPriceMulti,
  mockPriceMultiBtcAndSol,
  mockTokensV3Assets,
];

describe('withBitcoinFixtures', () => {
  const testSuite = jest.fn();
  const mockServer = {} as Mockttp;

  beforeEach(() => {
    jest.resetAllMocks();
    for (const [index, mock] of commonMocks.entries()) {
      jest.mocked(mock).mockResolvedValue(endpoint(`common-${index}`));
    }
    jest
      .mocked(mockTokensV2SupportedNetworks)
      .mockResolvedValue([endpoint('network-1'), endpoint('network-2')]);
    jest.mocked(mockInitialFullScan).mockResolvedValue(undefined);
    jest
      .mocked(proxyBitcoinBlockchainCalls)
      .mockResolvedValue([endpoint('proxy-1'), endpoint('proxy-2')]);
  });

  it('forwards fixture options and the unchanged test suite with default local nodes', async () => {
    const fixtures = { data: {} };
    const options = {
      fixtures,
      title: 'Bitcoin send',
      ignoredConsoleErrors: ['noise'],
    };

    await withBitcoinFixtures(options, testSuite);

    expect(withFixtures).toHaveBeenCalledTimes(1);
    expect(withFixtures).toHaveBeenCalledWith(
      {
        ...options,
        localNodeOptions: [
          'anvil',
          { type: 'bitcoin', options: { initialBalance: DEFAULT_BTC_BALANCE } },
        ],
        afterLocalNodesStart: expect.any(Function),
        testSpecificMock: expect.any(Function),
      },
      testSuite,
    );
    expect(testSuite).not.toHaveBeenCalled();
  });

  it('forwards Bitcoin node options without replacing the default balance', async () => {
    const bitcoinNodeOptions = { rpcPort: 18443, rpcUser: 'fixture-user' };

    await withBitcoinFixtures({ bitcoinNodeOptions }, testSuite);

    expect(withFixtures).toHaveBeenCalledWith(
      expect.objectContaining({
        localNodeOptions: [
          'anvil',
          {
            type: 'bitcoin',
            options: {
              initialBalance: DEFAULT_BTC_BALANCE,
              ...bitcoinNodeOptions,
            },
          },
        ],
      }),
      testSuite,
    );
    expect(capturedOptions()).not.toHaveProperty('bitcoinNodeOptions');
  });

  it('allows an explicit zero balance to override the default', async () => {
    await withBitcoinFixtures(
      { bitcoinNodeOptions: { initialBalance: 0 } },
      testSuite,
    );

    expect(withFixtures).toHaveBeenCalledWith(
      expect.objectContaining({
        localNodeOptions: [
          'anvil',
          { type: 'bitcoin', options: { initialBalance: 0 } },
        ],
      }),
      testSuite,
    );
  });

  it('uses static blockchain mocks without starting Bitcoin when localNode is false', async () => {
    await withBitcoinFixtures({ localNode: false }, testSuite);
    const options = capturedOptions();
    await options.afterLocalNodesStart({ localNodes: [{}] });

    const endpoints = await options.testSpecificMock(mockServer);

    expect(options).toEqual(
      expect.objectContaining({ localNodeOptions: ['anvil'] }),
    );
    expect(options).not.toHaveProperty('localNode');
    expect(mockInitialFullScan).toHaveBeenCalledWith(mockServer);
    expect(proxyBitcoinBlockchainCalls).not.toHaveBeenCalled();
    // mockInitialFullScan registers its own rules and resolves to void.
    expect(endpoints).not.toContain(undefined);
    for (const mock of commonMocks) {
      expect(mock).toHaveBeenCalledWith(mockServer);
    }
    expect(mockTokensV2SupportedNetworks).toHaveBeenCalledWith(mockServer);
    expect(endpoints).toHaveLength(commonMocks.length + 2);
  });

  it('rejects missing Bitcoin nodes rather than silently using static data', async () => {
    await withBitcoinFixtures({}, testSuite);
    const options = capturedOptions();
    await options.afterLocalNodesStart({ localNodes: [{}] });

    await expect(options.testSpecificMock(mockServer)).rejects.toThrow(
      'Bitcoin local node was not started',
    );
    expect(mockInitialFullScan).not.toHaveBeenCalled();
    expect(proxyBitcoinBlockchainCalls).not.toHaveBeenCalled();
    expect(mockExchangeRates).not.toHaveBeenCalled();
  });

  it('captures nodes before awaiting the startup hook and registers custom endpoints first', async () => {
    const bitcoinNode = Object.create(BitcoinNode.prototype) as BitcoinNode;
    const context = { localNodes: [{}, bitcoinNode] };
    let hookCompleted = false;
    const afterLocalNodesStart = jest.fn(async () => {
      await Promise.resolve();
      hookCompleted = true;
    });
    const customEndpoint = endpoint('custom');
    const testSpecificMock = jest.fn(async () => {
      expect(hookCompleted).toBe(true);
      expect(mockExchangeRates).not.toHaveBeenCalled();
      expect(proxyBitcoinBlockchainCalls).not.toHaveBeenCalled();
      return [customEndpoint];
    });
    await withBitcoinFixtures(
      { afterLocalNodesStart, testSpecificMock },
      testSuite,
    );
    const options = capturedOptions();
    await options.afterLocalNodesStart(context);

    const endpoints = await options.testSpecificMock(mockServer);

    expect(afterLocalNodesStart).toHaveBeenCalledWith(context);
    expect(testSpecificMock).toHaveBeenCalledWith(mockServer, context);
    expect(proxyBitcoinBlockchainCalls).toHaveBeenCalledWith(
      mockServer,
      bitcoinNode,
    );
    expect(mockInitialFullScan).not.toHaveBeenCalled();
    expect(endpoints).toStrictEqual([
      customEndpoint,
      ...commonMocks.slice(0, 7).map((_, index) => endpoint(`common-${index}`)),
      endpoint('network-1'),
      endpoint('network-2'),
      endpoint('common-7'),
      endpoint('proxy-1'),
      endpoint('proxy-2'),
    ]);
  });

  it('propagates startup hook failures', async () => {
    const error = new Error('startup hook failed');
    const afterLocalNodesStart = jest.fn().mockRejectedValue(error);
    await withBitcoinFixtures({ afterLocalNodesStart }, testSuite);

    await expect(
      capturedOptions().afterLocalNodesStart({ localNodes: [] }),
    ).rejects.toThrow(error);
  });

  it('propagates custom mock failures before registering defaults', async () => {
    const error = new Error('custom mock failed');
    const testSpecificMock = jest.fn().mockRejectedValue(error);
    await withBitcoinFixtures(
      { localNode: false, testSpecificMock },
      testSuite,
    );

    await expect(
      capturedOptions().testSpecificMock(mockServer),
    ).rejects.toThrow(error);
    expect(mockExchangeRates).not.toHaveBeenCalled();
  });

  it('awaits the fixture harness and propagates its failure', async () => {
    const error = new Error('fixture harness failed');
    jest.mocked(withFixtures).mockRejectedValue(error);

    await expect(withBitcoinFixtures({}, testSuite)).rejects.toThrow(error);
  });
});
