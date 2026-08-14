import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { useSelector } from 'react-redux';
import thunk from 'redux-thunk';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-send-state.json';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  getAllTokens,
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getSelectedEvmInternalAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../selectors';
import {
  getNativeCurrency,
  getTokens,
} from '../../../../ducks/metamask/metamask';
import { getConversionRate } from '../../../../ducks/metamask/base-selectors';
import { getTopAssets } from '../../../../ducks/swaps/swaps';
import {
  getMultichainNetworkConfigurationsByChainId,
  getMultichainCurrentChainId,
  getMultichainCurrentCurrency,
  getMultichainIsEvm,
  getMultichainNativeCurrency,
  getMultichainCurrentNetwork,
  getMultichainSelectedAccountCachedBalance,
} from '../../../../selectors/multichain';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  ARC_USDC_ERC20_TOKEN_ADDRESS,
  STABLE_USDT0_ERC20_ADDRESS,
} from '../../../app/assets/enablement/networks-customization';
import { AssetPickerModal } from './asset-picker-modal';
import { ERC20Asset } from './types';

const mockAssetList = jest.fn();
jest.mock('./AssetList', () => (props: unknown) => {
  mockAssetList(props);
  return <>AssetList</>;
});

const mockUseAssetMetadata = jest.fn();
jest.mock('./hooks/useAssetMetadata', () => ({
  useAssetMetadata: (...args: unknown[]) => mockUseAssetMetadata(...args),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseMultichainSelector = jest.fn();
jest.mock('../../../../hooks/useMultichainSelector', () => ({
  useMultichainSelector: (selector: unknown) =>
    mockUseMultichainSelector(selector),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../../../../hooks/useTokenTracker', () => ({
  useTokenTracker: jest.fn(),
}));

const mockGetRenderableTokenData = jest.fn();
jest.mock('../../../../hooks/useTokensToSearch', () => ({
  getRenderableTokenData: (data: unknown) => mockGetRenderableTokenData(data),
}));

const mockUseMultichainBalances = jest.fn();
jest.mock('../../../../hooks/useMultichainBalances', () => ({
  useMultichainBalances: () => mockUseMultichainBalances(),
}));

describe('AssetPickerModal', () => {
  const useSelectorMock = useSelector as jest.Mock;
  const useI18nContextMock = useI18nContext as jest.Mock;
  const useTokenTrackerMock = useTokenTracker as jest.Mock;
  const mockStore = configureStore([thunk]);
  const store = mockStore(mockState);

  const onAssetChangeMock = jest.fn();
  const onCloseMock = jest.fn();
  mockAssetList.mockReturnValue(() => <div>AssetList</div>);

  const defaultProps = {
    header: 'sendSelectReceiveAsset',
    onNetworkPickerClick: jest.fn(),
    isOpen: true,
    onClose: onCloseMock,
    asset: {
      address: '0xAddress',
      symbol: 'TOKEN',
      image: 'image.png',
      type: AssetType.token,
    } as ERC20Asset,
    onAssetChange: onAssetChangeMock,
    sendingAsset: {
      image: 'image.png',
      symbol: 'SYMB',
    },
    autoFocus: true,
  };

  beforeEach(() => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getMultichainNetworkConfigurationsByChainId) {
        return { '0x1': { chainId: '0x1' } };
      }
      if (selector === getMultichainCurrentChainId) {
        return '0x1';
      }
      if (selector === getMultichainCurrentCurrency) {
        return 'USD';
      }
      if (selector === getNativeCurrencyImage) {
        return 'native-image.png';
      }
      if (selector === getSelectedAccountCachedBalance) {
        return '1000';
      }
      if (selector === getSelectedEvmInternalAccount) {
        return { address: '0xAddress' };
      }
      if (selector === getShouldHideZeroBalanceTokens) {
        return false;
      }
      if (selector === getTokenExchangeRates) {
        return {};
      }
      if (selector === getConversionRate) {
        return 1;
      }
      if (selector === getNativeCurrency) {
        return 'ETH';
      }
      if (selector === getTokens) {
        return [];
      }
      if (selector === getTopAssets) {
        return [];
      }
      return undefined;
    });

    useI18nContextMock.mockReturnValue((key: string) => key);
    useTokenTrackerMock.mockReturnValue({
      tokensWithBalances: [],
    });
    mockGetRenderableTokenData.mockReturnValue({});
    mockUseMultichainBalances.mockReturnValue({ assetsWithBalance: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // New tests
  it('renders AssetPickerModal with search input', () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />, store);

    expect(screen.getByTestId('asset-picker-modal')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('searchTokensByNameOrAddress'),
    ).toBeInTheDocument();
  });

  it('calls onClose when modal is closed', () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />, store);

    fireEvent.click(screen.getByRole('button', { name: /close/u }));
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('filters tokens based on search query', () => {
    mockUseMultichainBalances.mockReturnValue({
      assetsWithBalance: [
        {
          address: 'token-1',
          assetId: 'eip155:1/erc20:token-1',
          balance: '0',
          chainId: '0x1',
          decimals: 18,
          isNative: false,
          symbol: 'TOKEN',
          type: AssetType.token,
        },
        {
          address: 'token-2',
          assetId: 'eip155:1/erc20:token-2',
          balance: '0',
          chainId: '0x1',
          decimals: 18,
          isNative: false,
          symbol: 'TOKEN1',
          type: AssetType.token,
        },
      ],
    });
    renderWithProvider(<AssetPickerModal {...defaultProps} />, store);

    fireEvent.change(
      screen.getByPlaceholderText('searchTokensByNameOrAddress'),
      {
        target: { value: 'TO' },
      },
    );

    expect(mockAssetList.mock.calls.slice(-1)[0][0].tokenList.length).toBe(2);

    fireEvent.change(
      screen.getByPlaceholderText('searchTokensByNameOrAddress'),
      {
        target: { value: 'UNAVAILABLE TOKEN' },
      },
    );

    expect(mockAssetList.mock.calls[1][0]).not.toEqual(
      expect.objectContaining({
        asset: {
          balance: '0x0',
          details: { address: '0xAddress', decimals: 18, symbol: 'TOKEN' },
          error: null,
          type: 'NATIVE',
        },
      }),
    );
  });

  // Older tests
  it('should render the modal when isOpen is true', () => {
    const { getByText } = renderWithProvider(
      <AssetPickerModal {...defaultProps} />,
      store,
    );

    const modalContent = getByText('sendSelectReceiveAsset');
    expect(modalContent).toBeInTheDocument();
  });

  it('should not render the modal when isOpen is false', () => {
    const { queryByText } = renderWithProvider(
      <AssetPickerModal {...defaultProps} isOpen={false} />,
      store,
    );
    const modalContent = queryByText('sendSelectReceiveAsset');
    expect(modalContent).not.toBeInTheDocument();
  });

  it('should render the modal with the correct title and search placeholder', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <AssetPickerModal {...defaultProps} />,
      store,
    );
    const modalTitle = getByText('sendSelectReceiveAsset');
    const searchPlaceholder = getByPlaceholderText(
      'searchTokensByNameOrAddress',
    );

    expect(modalTitle).toBeInTheDocument();
    expect(searchPlaceholder).toBeInTheDocument();
  });

  it('should render network picker when onNetworkPickerClick prop is defined', () => {
    const { getByText, getAllByRole } = renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        header="selectNetworkHeader"
        network={{
          nativeCurrency: 'ETH',
          chainId: '0x1',
          defaultBlockExplorerUrlIndex: 0,
          blockExplorerUrls: ['https://explorerurl'],
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'test1',
              url: 'https://rpcurl',
              type: RpcEndpointType.Custom,
            },
          ],
          name: 'Network name',
        }}
      />,
      store,
    );

    const modalTitle = getByText('selectNetworkHeader');
    expect(modalTitle).toBeInTheDocument();

    expect(getAllByRole('img')).toHaveLength(2);
    const modalContent = getByText(messages.networkNameEthereum.message);
    expect(modalContent).toBeInTheDocument();
  });

  it('should not render network picker when onNetworkPickerClick prop is not defined', () => {
    const { getByText, getAllByRole } = renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        onNetworkPickerClick={undefined}
        header="selectNetworkHeader"
        network={{
          nativeCurrency: 'ETH',
          chainId: '0x1',
          defaultBlockExplorerUrlIndex: 0,
          blockExplorerUrls: ['https://explorerurl'],
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'test1',
              url: 'https://rpcurl',
              type: RpcEndpointType.Custom,
            },
          ],
          name: 'Network name',
        }}
      />,
      store,
    );

    const modalTitle = getByText('selectNetworkHeader');
    expect(modalTitle).toBeInTheDocument();

    expect(getAllByRole('img')).toHaveLength(1);
  });

  it('should hide excluded ERC-20 coming from detected tokens', () => {
    useSelectorMock.mockImplementation((selector) => {
      switch (selector) {
        case getMultichainCurrentChainId:
          return CHAIN_IDS.ARC;
        case getMultichainNetworkConfigurationsByChainId:
          return { [CHAIN_IDS.ARC]: { chainId: CHAIN_IDS.ARC } };
        case getAllTokens:
          return {
            [CHAIN_IDS.ARC]: {
              '0xAddress': [
                {
                  address: ARC_USDC_ERC20_TOKEN_ADDRESS,
                  symbol: 'USDC',
                  decimals: 6,
                },
                { address: '0xother', symbol: 'OTHER', decimals: 18 },
              ],
            },
          };
        case getSelectedEvmInternalAccount:
          return { address: '0xAddress' };
        case getMultichainCurrentCurrency:
          return 'USD';
        case getTokenExchangeRates:
          return {};
        case getConversionRate:
          return 1;
        default:
          return {};
      }
    });

    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        onNetworkPickerClick={undefined}
        isMultiselectEnabled={false}
        network={
          {
            chainId: CHAIN_IDS.ARC,
            name: 'Arc',
          } as unknown as NetworkConfiguration
        }
        selectedChainIds={[CHAIN_IDS.ARC]}
      />,
      store,
    );

    const { tokenList } = mockAssetList.mock.calls.at(-1)[0];
    const addresses = tokenList.map((t: { address?: string }) =>
      t.address?.toLowerCase(),
    );
    expect(addresses).not.toContain(ARC_USDC_ERC20_TOKEN_ADDRESS.toLowerCase());
    expect(addresses).toContain('0xother');
  });
});

describe('AssetPickerModal token filtering', () => {
  const onAssetChangeMock = jest.fn();
  const useI18nContextMock = useI18nContext as jest.Mock;

  const defaultProps = {
    header: 'Select Token',
    isOpen: true,
    onClose: jest.fn(),
    autoFocus: true,
    onAssetChange: onAssetChangeMock,
    network: {
      chainId: '0xa',
      name: 'Optimism',
    } as unknown as NetworkConfiguration,
    selectedChainIds: ['0xa', '0x1', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
    isMultiselectEnabled: true,
    networks: [
      {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
      },
      {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana',
      },
      {
        chainId: '0xa',
        name: 'Optimism',
      },
    ] as unknown as NetworkConfiguration[],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useI18nContextMock.mockReturnValue((key: string) => key);
    mockGetRenderableTokenData.mockImplementation((data) => data);
    mockUseMultichainBalances.mockReturnValue({
      assetsWithBalance: [
        {
          address: '',
          balance: '1.5',
          chainId: '0x1',
          decimals: 18,
          image: './images/eth_logo.svg',
          isNative: true,
          symbol: 'ETH',
          type: 'NATIVE',
        },
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          balance: '100',
          chainId: '0x1',
          decimals: 18,
          isNative: false,
          symbol: 'UNI',
          type: 'TOKEN',
        },
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f985',
          balance: '10',
          chainId: '0xa',
          decimals: 6,
          isNative: false,
          symbol: 'USDC',
          type: 'TOKEN',
        },
        {
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          balance: '50',
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          decimals: 6,
          isNative: false,
          symbol: 'USDC',
          type: 'TOKEN',
        },
      ],
    });

    const useSelectorMock = useSelector as jest.Mock;
    useSelectorMock.mockImplementation((selector) => {
      switch (selector) {
        case getMultichainCurrentChainId:
          return '0xa';
        case getMultichainIsEvm:
          return true;
        case getMultichainCurrentCurrency:
          return 'USD';
        default:
          return {};
      }
    });

    mockUseMultichainSelector.mockImplementation((selector) => {
      if (selector === getMultichainCurrentNetwork) {
        return 'ETH';
      }
      switch (selector) {
        case getMultichainCurrentNetwork:
          return {
            chainId: '0xa',
            name: 'Optimism',
          };
        case getMultichainNativeCurrency:
          return 'ETH';
        case getMultichainSelectedAccountCachedBalance:
          return '1000';
        default:
          return {};
      }
    });
  });

  it('should render all tokens from multiple chains', () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />);

    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should render all tokens from single chain', () => {
    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        isMultiselectEnabled={false}
        network={
          {
            chainId: '0x1',
            name: 'Ethereum Mainnet',
          } as unknown as NetworkConfiguration
        }
      />,
    );

    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should filter tokens by symbol', async () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'searchTokensByNameOrAddress',
    );
    fireEvent.change(searchInput, { target: { value: 'UNI' } });

    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should filter tokens by address', async () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'searchTokensByNameOrAddress',
    );
    fireEvent.change(searchInput, {
      target: { value: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
    });

    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();

    // Test case-insensitive search
    fireEvent.change(searchInput, {
      target: { value: '0x1f9840a85d5af5bf1d1762f925bdaddc4201F984' },
    });

    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should show selected token first when selected network is not active', () => {
    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        isMultiselectEnabled={false}
        selectedChainIds={[MultichainNetworks.SOLANA]}
        network={
          {
            chainId: MultichainNetworks.SOLANA,
            name: 'Solana',
          } as unknown as NetworkConfiguration
        }
        asset={{
          address: 'NEWTOKEN',
          chainId: MultichainNetworks.SOLANA,
          symbol: 'USDT',
          image: 'image.png',
          type: AssetType.token,
        }}
        customTokenListGenerator={() =>
          [
            {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              balance: '50',
              chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
              decimals: 6,
              isNative: false,
              symbol: 'USDC',
              type: 'TOKEN',
            },
            {
              address: 'NEWTOKEN',
              chainId: MultichainNetworks.SOLANA,
              symbol: 'USDT',
              image: 'image.png',
              type: AssetType.token,
            },
          ] as unknown as (keyof typeof AssetPickerModal)['customTokenListGenerator']
        }
      />,
    );

    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should show selected token first when selected network is active', () => {
    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        asset={{
          address: 'NEWTOKEN',
          chainId: '0xa',
          symbol: 'USDT',
          image: 'image.png',
          type: AssetType.token,
        }}
      />,
    );

    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should filter tokens by chain when multichain network is selected', async () => {
    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        selectedChainIds={['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp']}
        network={
          {
            chainId: MultichainNetworks.SOLANA,
            name: 'Solana',
          } as unknown as NetworkConfiguration
        }
      />,
    );

    expect(
      screen.queryByTestId('solana-account-creation-prompt'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('searchTokensByNameOrAddress'),
    ).toBeInTheDocument();
    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should show all tokens when search query is cleared', async () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'searchTokensByNameOrAddress',
    );
    fireEvent.change(searchInput, { target: { value: 'UNI' } });
    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();

    fireEvent.change(searchInput, { target: { value: '' } });
    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should only show tokens with balances in send mode', async () => {
    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        isMultiselectEnabled={false}
        action="send"
      />,
    );

    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();

    // Add a token without balance to the list
    mockUseMultichainBalances.mockImplementationOnce(() => ({
      assetsWithBalance: [
        ...useMultichainBalances().assetsWithBalance,
        {
          address: '0xnewtoken',
          balance: '0',
          chainId: '0x1',
          decimals: 18,
          isNative: false,
          symbol: 'ZERO',
          type: AssetType.token,
        },
      ],
    }));

    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        isMultiselectEnabled={false}
        action="send"
      />,
    );
    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should handle case-insensitive search', async () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'searchTokensByNameOrAddress',
    );

    fireEvent.change(searchInput, { target: { value: 'uni' } });
    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();

    fireEvent.change(searchInput, { target: { value: 'UNI' } });
    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should respect MAX_UNOWNED_TOKENS_RENDERED limit', async () => {
    // Create an array of 31 tokens (MAX_UNOWNED_TOKENS_RENDERED + 1)
    const manyTokens = Array.from({ length: 31 }, (_, i) => ({
      address: `0xtoken${i}`,
      balance: '0',
      chainId: '0x1',
      decimals: 18,
      isNative: false,
      symbol: `TOKEN${i}`,
      type: AssetType.token,
    }));

    mockUseMultichainBalances.mockImplementationOnce(() => ({
      assetsWithBalance: manyTokens,
    }));

    renderWithProvider(<AssetPickerModal {...defaultProps} />);

    expect(mockAssetList.mock.calls.at(-1)?.[0].tokenList).toHaveLength(30);
  });

  it('should fetch metadata for unlisted tokens', async () => {
    mockUseAssetMetadata.mockReturnValue({
      address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f123',
      chainId: '0x1',
      decimals: 18,
      image: 'https://example.com/image.png',
      symbol: 'UNI',
    });

    renderWithProvider(<AssetPickerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'searchTokensByNameOrAddress',
    );
    fireEvent.change(searchInput, {
      target: { value: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f123' },
    });

    expect(mockUseAssetMetadata.mock.calls.at(-1)).toMatchSnapshot();
    expect(mockAssetList.mock.calls.at(-1)).toMatchSnapshot();
  });

  it('should hide excluded homonym ERC-20s (Arc USDC, Stable USDT0)', () => {
    mockUseMultichainBalances.mockReturnValue({
      assetsWithBalance: [
        {
          address: '',
          balance: '100',
          chainId: CHAIN_IDS.STABLE,
          decimals: 6,
          isNative: true,
          symbol: 'USDT0',
          type: 'NATIVE',
        },
        {
          address: STABLE_USDT0_ERC20_ADDRESS,
          balance: '100',
          chainId: CHAIN_IDS.STABLE,
          decimals: 6,
          isNative: false,
          symbol: 'USDT0',
          type: 'TOKEN',
        },
        {
          address: ARC_USDC_ERC20_TOKEN_ADDRESS,
          balance: '50',
          chainId: CHAIN_IDS.ARC,
          decimals: 6,
          isNative: false,
          symbol: 'USDC',
          type: 'TOKEN',
        },
      ],
    });

    mockUseAssetMetadata.mockReturnValue(undefined);

    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        selectedChainIds={[CHAIN_IDS.STABLE, CHAIN_IDS.ARC]}
      />,
    );

    const { tokenList } = mockAssetList.mock.calls.at(-1)[0];
    const addresses = tokenList.map((token: { address: string }) =>
      token.address?.toLowerCase(),
    );
    expect(addresses).not.toContain(STABLE_USDT0_ERC20_ADDRESS);
    expect(addresses).not.toContain(ARC_USDC_ERC20_TOKEN_ADDRESS.toLowerCase());
    expect(
      tokenList.some(
        (token: { isNative?: boolean; symbol: string }) =>
          token.isNative && token.symbol === 'USDT0',
      ),
    ).toBe(true);
  });

  it('should not filter excluded ERC-20s supplied by customTokenListGenerator (bridge/swap exception)', () => {
    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        isMultiselectEnabled={false}
        network={
          {
            chainId: CHAIN_IDS.ARC,
            name: 'Arc',
          } as unknown as NetworkConfiguration
        }
        selectedChainIds={[CHAIN_IDS.ARC]}
        customTokenListGenerator={function* () {
          yield {
            address: ARC_USDC_ERC20_TOKEN_ADDRESS,
            balance: '50',
            chainId: CHAIN_IDS.ARC,
            decimals: 6,
            isNative: false,
            symbol: 'USDC',
            type: AssetType.token,
          } as never;
        }}
      />,
    );

    const { tokenList } = mockAssetList.mock.calls.at(-1)[0];
    expect(
      tokenList.some(
        (t: { address?: string }) =>
          t.address?.toLowerCase() ===
          ARC_USDC_ERC20_TOKEN_ADDRESS.toLowerCase(),
      ),
    ).toBe(true);
  });
});
