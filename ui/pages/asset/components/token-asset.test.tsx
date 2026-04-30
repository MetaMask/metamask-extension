import React from 'react';
import { render } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import TokenAsset from './token-asset';

const mockAssetPage = jest.fn((props: unknown) => props);
const mockGetAssetDetailsAccountUrl = jest.fn();
const mockGetTokenTrackerLink = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../../hooks/useMultichainSelector', () => ({
  useMultichainSelector: jest.fn(),
}));

jest.mock('../../../hooks/useTokenFiatAmount', () => ({
  useTokenFiatAmount: jest.fn(() => '$0'),
}));

jest.mock('../../../hooks/useTokenTracker', () => ({
  useTokenTracker: jest.fn(() => ({
    tokensWithBalances: [{ string: '0', balance: '0' }],
  })),
}));

jest.mock('../../../../shared/lib/asset-utils', () => ({
  isEvmChainId: jest.fn(),
}));

jest.mock('@metamask/etherscan-link', () => ({
  getTokenTrackerLink: (...args: unknown[]) => mockGetTokenTrackerLink(...args),
}));

jest.mock('../../../helpers/utils/multichain/blockExplorer', () => ({
  getAssetDetailsAccountUrl: (...args: unknown[]) =>
    mockGetAssetDetailsAccountUrl(...args),
}));

jest.mock('./asset-page', () => (props: unknown) => {
  mockAssetPage(props);
  return null;
});

describe('TokenAsset', () => {
  const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
  const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
  const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
  const mockUseMultichainSelector =
    useMultichainSelector as jest.MockedFunction<typeof useMultichainSelector>;
  const mockUseTokenFiatAmount =
    useTokenFiatAmount as jest.MockedFunction<typeof useTokenFiatAmount>;
  const mockUseTokenTracker =
    useTokenTracker as jest.MockedFunction<typeof useTokenTracker>;
  const mockIsEvmChainId = isEvmChainId as jest.MockedFunction<
    typeof isEvmChainId
  >;

  const trackEvent = jest.fn();
  const dispatch = jest.fn();
  const navigate = jest.fn();
  const openTabMock = jest.fn();

  const token = {
    address:
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:4UWRG4THDmdydQnr4hqECN32eNdTHKKs7KVEW1ATpump',
    symbol: 'ELONAI',
    decimals: 6,
    image: '',
  };

  const selectedAccount = {
    id: 'account-1',
    address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.platform.openTab = openTabMock;
    mockUseDispatch.mockReturnValue(dispatch);
    mockUseNavigate.mockReturnValue(navigate);
    mockUseTokenFiatAmount.mockReturnValue('$0');
    mockUseTokenTracker.mockReturnValue({
      tokensWithBalances: [{ string: '0', balance: '0' }],
    } as never);
    mockUseMultichainSelector.mockReturnValue({ blockExplorerUrl: '' });

    // getTokenList, getNetworkConfigurationsByChainId, selected account, selectERC20TokensByChain
    mockUseSelector
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce(selectedAccount)
      .mockReturnValueOnce({});
  });

  function renderComponent() {
    return render(
      <MetaMetricsContext.Provider
        value={
          {
            trackEvent,
            bufferedTrace: jest.fn(),
            bufferedEndTrace: jest.fn(),
            onboardingParentContext: { current: null },
          } as never
        }
      >
        <TokenAsset token={token as never} chainId={'0x1' as never} />
      </MetaMetricsContext.Provider>,
    );
  }

  it('hides options when chain is non-EVM and selected account is missing', () => {
    mockIsEvmChainId.mockReturnValue(false);
    mockGetTokenTrackerLink.mockReturnValue('https://etherscan.io/token');

    // override selectedAccount selector to return undefined
    mockUseSelector
      .mockReset()
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({});

    renderComponent();

    expect(mockAssetPage).toHaveBeenCalled();
    const props = (mockAssetPage.mock.calls[0]?.[0] as unknown) as {
      optionsButton: React.ReactNode;
    };
    expect(props.optionsButton).toBeNull();
  });

  it('uses multichain block explorer link for non-EVM account', () => {
    mockIsEvmChainId.mockReturnValue(false);
    mockGetTokenTrackerLink.mockReturnValue('https://etherscan.io/token');
    mockGetAssetDetailsAccountUrl.mockReturnValue('https://solscan.io/token');

    renderComponent();

    const assetPageProps = (mockAssetPage.mock.calls[0]?.[0] as unknown) as {
      optionsButton: React.ReactElement<{ onClickBlockExplorer: () => void }>;
    };
    assetPageProps.optionsButton.props.onClickBlockExplorer();

    expect(mockGetAssetDetailsAccountUrl).toHaveBeenCalled();
    expect(openTabMock).toHaveBeenCalledWith({
      url: 'https://solscan.io/token',
    });
  });
});
