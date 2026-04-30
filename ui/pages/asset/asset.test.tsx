import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { BtcScope } from '@metamask/keyring-api';
import Asset from './asset';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useParams: jest.fn(),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
}));

jest.mock('../../components/app/assets/nfts/nft-details/nft-details', () => (
  <div data-testid="nft-details" />
));

jest.mock(
  './components/native-asset',
  () =>
    ({ token }: { token: { symbol: string; address: string } }) =>
      <div data-testid="native-asset">{`${token.symbol}:${token.address}`}</div>,
);

jest.mock('./components/token-asset', () => () => (
  <div data-testid="token-asset" />
));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

const BTC_ASSET_ID = 'bip122:000000000019d6689c085ae165831e93/slip44:0';

describe('Asset route', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseParams.mockReturnValue({
      chainId: BtcScope.Mainnet,
      asset: encodeURIComponent(BTC_ASSET_ID),
      id: undefined,
    });

    mockUseLocation.mockReturnValue({
      pathname: '/asset',
      search: '',
      hash: '',
      state: undefined,
      key: 'asset-test',
    });

    mockUseSelector
      .mockReturnValueOnce([])
      .mockReturnValueOnce({
        [BTC_ASSET_ID]: {
          name: 'Bitcoin',
          symbol: 'BTC',
          iconUrl: 'btc.png',
          units: [{ decimals: 8 }],
        },
      })
      .mockReturnValueOnce(null);
  });

  it('renders non-EVM native fallback token when owned token is unavailable', () => {
    const { getByTestId, queryByTestId } = render(<Asset />);

    expect(getByTestId('native-asset')).toHaveTextContent(`BTC:${BTC_ASSET_ID}`);
    expect(queryByTestId('token-asset')).not.toBeInTheDocument();
    expect(queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('navigates to default route when CAIP asset chain does not match route chain', () => {
    mockUseParams.mockReturnValue({
      chainId: BtcScope.Mainnet,
      asset: encodeURIComponent(
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      ),
      id: undefined,
    });

    // Re-seed selector queue for this render
    mockUseSelector.mockReset();
    mockUseSelector
      .mockReturnValueOnce([])
      .mockReturnValueOnce({})
      .mockReturnValueOnce(null);

    const { getByTestId, queryByTestId } = render(<Asset />);

    expect(getByTestId('navigate')).toHaveTextContent('/');
    expect(queryByTestId('native-asset')).not.toBeInTheDocument();
  });
});
