import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { BtcScope } from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { getOriginalNativeTokenSymbol } from '../helpers/utils/isOriginalNativeTokenSymbol';
import {
  currencyRateStartPolling,
  currencyRateStopPollingByPollingToken,
} from '../store/actions';
import useCurrencyRatePolling from './useCurrencyRatePolling';

let mockPromises: Promise<string>[];

jest.mock('../store/actions', () => ({
  currencyRateStartPolling: jest.fn().mockImplementation((input) => {
    const promise = Promise.resolve(`${input}_rates`);
    mockPromises.push(promise);
    return promise;
  }),
  currencyRateStopPollingByPollingToken: jest.fn(),
}));

jest.mock('../helpers/utils/isOriginalNativeTokenSymbol', () => ({
  getOriginalNativeTokenSymbol: jest.fn(),
}));

let originalPortfolioView: string | undefined;

describe('useCurrencyRatePolling', () => {
  const arrangeNetworkConfiguration = (props: {
    nativeCurrency: string;
    chainId: string;
    networkClientId?: string;
  }) => ({
    nativeCurrency: props.nativeCurrency,
    chainId: props.chainId,
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      { networkClientId: props.networkClientId ?? 'selectedNetworkClientId' },
    ],
  });

  const arrangeState = () => ({
    metamask: {
      isUnlocked: true,
      completedOnboarding: true,
      useCurrencyRateCheck: true,
      useSafeChainsListValidation: true,
      selectedNetworkClientId: 'selectedNetworkClientId',
      enabledNetworkMap: {
        eip155: {
          '0x1': true,
          '0x38': true,
        },
      },
      networkConfigurationsByChainId: {
        '0x1': arrangeNetworkConfiguration({
          chainId: '0x1',
          nativeCurrency: 'ETH',
        }),
        '0x38': arrangeNetworkConfiguration({
          chainId: '0x38',
          nativeCurrency: 'BNB',
        }),
      } as unknown,
      preferences: {},
      multichainNetworkConfigurationsByChainId:
        AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
      selectedMultichainNetworkChainId: BtcScope.Mainnet,
      isEvmSelected: true,
    },
  });

  const mockGetOriginalNativeTokenSymbol = jest.mocked(
    getOriginalNativeTokenSymbol,
  );

  beforeEach(() => {
    // Mock process.env.PORTFOLIO_VIEW
    originalPortfolioView = process.env.PORTFOLIO_VIEW;
    process.env.PORTFOLIO_VIEW = 'true'; // Set your desired mock value here
    mockGetOriginalNativeTokenSymbol.mockImplementation(async ({ chainId }) => {
      if (chainId === '0x1') {
        return 'ETH';
      }
      if (chainId === '0x38') {
        return 'BNB';
      }
      return null;
    });

    mockPromises = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore the original value
    process.env.PORTFOLIO_VIEW = originalPortfolioView;
  });

  it('should poll currency rates for native currencies when enabled and stop on dismount', async () => {
    const state = arrangeState();

    const { unmount } = renderHookWithProvider(
      () => useCurrencyRatePolling(),
      state,
    );

    // Wait for the asynchronous effect(s) to complete.
    await new Promise((r) => setTimeout(r, 0));
    await Promise.all(mockPromises);

    expect(currencyRateStartPolling).toHaveBeenCalledTimes(1);
    expect(currencyRateStartPolling).toHaveBeenCalledWith(['ETH', 'BNB']);

    // Simulate unmount, which should trigger stopping the polling.
    unmount();
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(1);
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledWith(
      'ETH,BNB_rates',
    );
  });

  it('should not poll if onboarding is not completed', async () => {
    const state = arrangeState();
    state.metamask.completedOnboarding = false;

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    await Promise.all(mockPromises);
    expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when locked', async () => {
    const state = arrangeState();
    state.metamask.isUnlocked = false;

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    await Promise.all(mockPromises);
    expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when currency rate checking is disabled', async () => {
    const state = arrangeState();
    state.metamask.useCurrencyRateCheck = false;

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    await Promise.all(mockPromises);
    expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should poll with original native currency instead of (if provided)', async () => {
    const state = arrangeState();
    state.metamask.networkConfigurationsByChainId = {
      '0x1': arrangeNetworkConfiguration({
        chainId: '0x1',
        nativeCurrency: 'CUSTOM_TOKEN', // Invalid Currency
      }),
    };

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    // Wait for the asynchronous effect(s) to complete.
    await new Promise((r) => setTimeout(r, 0));
    await Promise.all(mockPromises);

    expect(currencyRateStartPolling).toHaveBeenCalledTimes(1);
    expect(currencyRateStartPolling).toHaveBeenCalledWith(['ETH']); // Polling using the original native token symbol
  });

  it('should poll with ticker if unable to retrieve original token symbol', async () => {
    const state = arrangeState();
    state.metamask.networkConfigurationsByChainId = {
      '0x1': arrangeNetworkConfiguration({
        chainId: '0x1',
        nativeCurrency: 'CUSTOM_TOKEN', // Invalid Currency
      }),
    };
    mockGetOriginalNativeTokenSymbol.mockResolvedValue(null);

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    // Wait for the asynchronous effect(s) to complete.
    await new Promise((r) => setTimeout(r, 0));
    await Promise.all(mockPromises);

    expect(currencyRateStartPolling).toHaveBeenCalledTimes(1);
    expect(currencyRateStartPolling).toHaveBeenCalledWith(['CUSTOM_TOKEN']); // Polling using the original native token symbol
  });

  it('should only poll selected network, if not using portfolio view', async () => {
    const state = arrangeState();
    state.metamask.networkConfigurationsByChainId = {
      '0x1': arrangeNetworkConfiguration({
        chainId: '0x1',
        nativeCurrency: 'ETH',
        networkClientId: 'clientId-1',
      }),
      '0x89': arrangeNetworkConfiguration({
        chainId: '0x89',
        nativeCurrency: 'POL',
        networkClientId: 'clientId-2',
      }),
    };
    // Selected Eth
    state.metamask.selectedNetworkClientId = 'clientId-1';
    // Not using Portfolio View, as we only have 1 token filter
    state.metamask.preferences = {
      tokenNetworkFilter: {
        '0x1': true,
      },
    };

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    // Wait for the asynchronous effect(s) to complete.
    await new Promise((r) => setTimeout(r, 0));
    await Promise.all(mockPromises);

    expect(currencyRateStartPolling).toHaveBeenCalledTimes(1);
    expect(currencyRateStartPolling).toHaveBeenCalledWith(['ETH']); // Polling using the original native token symbol
  });
});
