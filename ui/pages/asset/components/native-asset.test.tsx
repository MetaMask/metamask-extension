import { BtcScope } from '@metamask/keyring-api';
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import NativeAsset from './native-asset';

const mockAssetPage = jest.fn();
const mockGetMultichainAccountUrl = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/useMultichainSelector', () => ({
  useMultichainSelector: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  getNativeCurrencyForChain: jest.fn(() => 'btc.png'),
}));

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => ({
  useIsOriginalNativeTokenSymbol: jest.fn(() => true),
}));

jest.mock('../../../helpers/utils/multichain/blockExplorer', () => ({
  getMultichainAccountUrl: (...args: unknown[]) =>
    mockGetMultichainAccountUrl(...args),
}));

jest.mock('./asset-page', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: (props: unknown) => {
    const { optionsButton } = props as { optionsButton?: React.ReactNode };
    mockAssetPage(props);
    return <div data-testid="asset-page">{optionsButton}</div>;
  },
}));

jest.mock('./asset-options', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  default: ({ onClickBlockExplorer }: { onClickBlockExplorer: () => void }) => (
    <button data-testid="asset-options" onClick={onClickBlockExplorer}>
      options
    </button>
  ),
}));

describe('NativeAsset', () => {
  const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
  const mockUseMultichainSelector = useMultichainSelector as jest.MockedFunction<
    typeof useMultichainSelector
  >;

  const token = {
    symbol: 'BTC',
    address: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
    decimals: 8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMultichainSelector.mockReturnValue({} as never);
    mockGetMultichainAccountUrl.mockReturnValue('https://mempool.space/address/x');
    global.platform.openTab = jest.fn();
  });

  it('passes nativeAssetId and hides options for non-EVM without compatible account', () => {
    mockUseSelector
      .mockReturnValueOnce({ type: 'rpc' } as never)
      .mockReturnValueOnce({ address: '0x123' } as never)
      .mockReturnValueOnce({} as never)
      .mockReturnValueOnce(null as never);

    render(
      <MetaMetricsContext.Provider
        value={
          {
            trackEvent: jest.fn(),
            bufferedTrace: jest.fn(),
            bufferedEndTrace: jest.fn(),
            onboardingParentContext: { current: null },
          } as never
        }
      >
        <NativeAsset token={token as never} chainId={BtcScope.Mainnet as never} />
      </MetaMetricsContext.Provider>,
    );

    expect(mockAssetPage).toHaveBeenCalledTimes(1);
    const props = mockAssetPage.mock.calls[0][0] as {
      asset: { nativeAssetId?: string };
      optionsButton: React.ReactNode;
    };
    expect(props.asset.nativeAssetId).toBe(token.address);
    expect(props.optionsButton).toBeNull();
  });

  it('shows options for non-EVM when compatible account exists', () => {
    mockUseSelector
      .mockReturnValueOnce({ type: 'rpc' } as never)
      .mockReturnValueOnce({ address: '0x123' } as never)
      .mockReturnValueOnce({} as never)
      .mockReturnValueOnce({ address: 'bc1qabc' } as never);

    const { getByTestId } = render(
      <MetaMetricsContext.Provider
        value={
          {
            trackEvent: jest.fn(),
            bufferedTrace: jest.fn(),
            bufferedEndTrace: jest.fn(),
            onboardingParentContext: { current: null },
          } as never
        }
      >
        <NativeAsset token={token as never} chainId={BtcScope.Mainnet as never} />
      </MetaMetricsContext.Provider>,
    );

    fireEvent.click(getByTestId('asset-options'));
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://mempool.space/address/x',
    });
  });
});
