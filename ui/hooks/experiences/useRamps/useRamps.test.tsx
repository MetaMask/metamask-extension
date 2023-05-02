import { cloneDeep } from 'lodash';
import { AggregatorNetwork } from '@consensys/on-ramp-sdk/dist/API';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import SDK from './OnRampSDK';
import useRamps from './useRamps';
import {
  buyPath,
  entryParam,
  entryParamValue,
  portfolioUrl,
} from './useRamps.constants';

jest.mock('./OnRampSDK');
const mockedSDK = SDK as jest.Mocked<typeof SDK>;

const mockedNetworks = [
  {
    active: true,
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 10,
    chainName: 'Optimism Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 25,
    chainName: 'Cronos Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 56,
    chainName: 'BNB Chain Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 137,
    chainName: 'Polygon Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 250,
    chainName: 'Fantom Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 1285,
    chainName: 'Moonriver Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 42161,
    chainName: 'Arbitrum Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 42220,
    chainName: 'Celo Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 43114,
    chainName: 'Avalanche C-Chain Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 1313161554,
    chainName: 'Aurora Mainnet',
    nativeTokenSupported: false,
  },
  {
    active: true,
    chainId: 1666600000,
    chainName: 'Harmony Mainnet (Shard 0)',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 11297108109,
    chainName: 'Palm',
    nativeTokenSupported: false,
  },
];

// test helpers
const storeWithChainId = (chainId: string) => ({
  metamask: {
    provider: {
      chainId,
    },
  },
});

const updateOrAddNetwork = (network: AggregatorNetwork) => {
  const clonedNetworks = cloneDeep(mockedNetworks);
  const index = clonedNetworks.findIndex(
    (mockedNetwork) => mockedNetwork.chainId === network.chainId,
  );
  if (index === -1) {
    return clonedNetworks.concat(network);
  }
  clonedNetworks[index] = network;
  return clonedNetworks;
};

describe('useRamps', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'platform', {
      value: {
        openTab: jest.fn(),
      },
    });
  });

  beforeEach(() => {
    mockedSDK.getNetworks.mockImplementation(() =>
      Promise.resolve(mockedNetworks),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render initial values', async () => {
    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.MAINNET),
    );

    expect(result.current.isBuyableChain).toBe(false);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);
    expect(result.current.getBuyURI).toBeInstanceOf(Function);
    expect(result.current.openBuyCryptoInPdapp).toBeInstanceOf(Function);
    await waitForNextUpdate();
  });

  it('should call SDK getNetworks method', async () => {
    const { waitForNextUpdate } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.MAINNET),
    );

    await waitForNextUpdate();

    expect(SDK.getNetworks).toHaveBeenCalledTimes(1);
  });

  it('should update values for active and supported native token network', async () => {
    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.MAINNET),
    );

    expect(result.current.isBuyableChain).toBe(false);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);

    await waitForNextUpdate();

    expect(result.current.isBuyableChain).toBe(true);
    expect(result.current.isNativeTokenBuyableChain).toBe(true);
  });

  it('should update values for active and unsupported native token network', async () => {
    mockedSDK.getNetworks.mockImplementation(() =>
      Promise.resolve(
        updateOrAddNetwork({
          active: true,
          chainId: 1,
          chainName: 'Mainnet',
          nativeTokenSupported: false,
        }),
      ),
    );

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.MAINNET),
    );

    expect(result.current.isBuyableChain).toBe(false);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);

    await waitForNextUpdate();

    expect(result.current.isBuyableChain).toBe(true);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);
  });

  it('should update values for inactive and supported native token network', async () => {
    mockedSDK.getNetworks.mockImplementation(() =>
      Promise.resolve(
        updateOrAddNetwork({
          active: false,
          chainId: 1,
          chainName: 'Mainnet',
          nativeTokenSupported: true,
        }),
      ),
    );

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.MAINNET),
    );

    expect(result.current.isBuyableChain).toBe(false);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);

    await waitForNextUpdate();

    expect(result.current.isBuyableChain).toBe(false);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);
  });

  it('should update values for network not found', async () => {
    mockedSDK.getNetworks.mockImplementation(() =>
      Promise.resolve(
        updateOrAddNetwork({
          active: false,
          chainId: 1,
          chainName: 'Mainnet',
          nativeTokenSupported: true,
        }),
      ),
    );
    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId('0xnonexistent'),
    );

    expect(result.current.isBuyableChain).toBe(false);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);

    await waitForNextUpdate();

    expect(result.current.isBuyableChain).toBe(false);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);
  });

  it('should update values when SDK getNetworks method throws', async () => {
    mockedSDK.getNetworks.mockImplementation(() => {
      throw new Error();
    });
    const { result } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.MAINNET),
    );

    expect(result.current.isBuyableChain).toBe(false);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);

    expect(SDK.getNetworks).toThrow();

    expect(result.current.isBuyableChain).toBe(false);
    expect(result.current.isNativeTokenBuyableChain).toBe(false);
  });

  it('should update values for manually active networks', async () => {
    mockedSDK.getNetworks.mockImplementation(() => {
      return Promise.resolve(
        updateOrAddNetwork({
          active: false,
          chainId: 11155111,
          chainName: 'Sepolia',
          nativeTokenSupported: true,
        }),
      );
    });
    const { result } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.SEPOLIA),
    );

    expect(result.current.isBuyableChain).toBe(true);
    expect(result.current.isNativeTokenBuyableChain).toBe(true);
  });

  it('should open the buy crypto URL for SEPOLIA chainId', async () => {
    const mockBuyURI = 'https://faucet.sepolia.dev/';

    const openTabSpy = jest.spyOn(global.platform, 'openTab');

    const { result } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.SEPOLIA),
    );

    result.current.openBuyCryptoInPdapp();

    expect(openTabSpy).toHaveBeenCalledWith({
      url: mockBuyURI,
    });
  });

  it('should open the buy crypto URL for a supported network', async () => {
    const url = new URL(`${portfolioUrl}${buyPath}`);
    url.searchParams.set(entryParam, entryParamValue);

    const openTabSpy = jest.spyOn(global.platform, 'openTab');

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.MAINNET),
    );

    await waitForNextUpdate();

    result.current.openBuyCryptoInPdapp();

    expect(openTabSpy).toHaveBeenCalledWith({
      url: url.toString(),
    });
  });

  it('should open the buy crypto URL with params for a supported network', async () => {
    const url = new URL(`${portfolioUrl}${buyPath}`);
    url.searchParams.set(entryParam, entryParamValue);
    url.searchParams.set('customParam', 'customValue');

    const openTabSpy = jest.spyOn(global.platform, 'openTab');

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useRamps(),
      storeWithChainId(CHAIN_IDS.MAINNET),
    );

    await waitForNextUpdate();

    result.current.openBuyCryptoInPdapp({ customParam: 'customValue' });

    expect(openTabSpy).toHaveBeenCalledWith({
      url: url.toString(),
    });
  });
});
