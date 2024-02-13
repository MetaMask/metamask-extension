import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { CHAIN_IDS, NETWORK_TYPES } from '../../../../shared/constants/network';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import AssetList from './asset-list';

// Specific to just the ETH FIAT conversion
const ETH_BALANCE = '0x041173b2c0e57d'; // 0.0011 ETH ($1.83)

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

const render = (
  selectedAddress = mockState.metamask.selectedAddress,
  balance = ETH_BALANCE,
  chainId = CHAIN_IDS.MAINNET,
) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      providerConfig: { chainId, ticker: 'ETH', type: NETWORK_TYPES.MAINNET },
      accountsByChainId: {
        [CHAIN_IDS.MAINNET]: {
          [selectedAddress]: { balance },
        },
      },
      selectedAddress,
    },
  };
  const store = configureStore(state);
  return renderWithProvider(
    <AssetList onClickAsset={() => undefined} />,
    store,
  );
};

describe('AssetList Buy/Receive', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);

  it('shows Buy and Receive when the account is empty', () => {
    const { queryByText } = render(
      '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
      '0x0',
    );
    expect(queryByText('Buy')).toBeInTheDocument();
    expect(queryByText('Receive')).toBeInTheDocument();
  });

  it('shows only Receive when chainId is not buyable', () => {
    const { queryByText } = render(
      '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
      '0x0',
      '0x8675309', // Custom chain ID that isn't buyable
    );
    expect(queryByText('Buy')).not.toBeInTheDocument();
    expect(queryByText('Receive')).toBeInTheDocument();
  });

  it('shows neither when the account has a balance', () => {
    const { queryByText } = render();
    expect(queryByText('Buy')).not.toBeInTheDocument();
    expect(queryByText('Receive')).not.toBeInTheDocument();
  });
});
