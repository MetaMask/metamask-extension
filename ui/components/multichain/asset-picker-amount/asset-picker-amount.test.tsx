import * as React from 'react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockSendState from '../../../../test/data/mock-send-state.json';
import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import { AssetType } from '../../../../shared/constants/transaction';
import { AssetPickerAmount } from './asset-picker-amount';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

describe('AssetPickerAmount', () => {
  it('should render the token ID', () => {
    const tokenAssetState = {
      ...mockSendState,
      send: {
        ...mockSendState.send,
        draftTransactions: {
          '1-tx': {
            ...mockSendState.send.draftTransactions['1-tx'],
            asset: {
              balance: '0x3635c9adc5dea00000',
              type: AssetType.NFT,
              error: null,
              details: {
                address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
                symbol: 'BAYC',
                isERC721: true,
                tokenId: 1,
              },
            },
          },
        },
      },
      metamask: {
        ...mockSendState.metamask,
        providerConfig: {
          chainId: CHAIN_IDS.GOERLI,
          nickname: GOERLI_DISPLAY_NAME,
          type: NETWORK_TYPES.GOERLI,
        },
      },
    };
    const mockedNftStore = configureStore()(tokenAssetState);

    const { getByText } = renderWithProvider(
      <AssetPickerAmount />,
      mockedNftStore,
    );

    expect(getByText('Token ID')).toBeInTheDocument();
  });
});
