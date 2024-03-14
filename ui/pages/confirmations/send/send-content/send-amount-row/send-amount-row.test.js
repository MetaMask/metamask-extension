import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockSendState from '../../../../../../test/data/mock-send-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import {
  AssetType,
  TokenStandard,
} from '../../../../../../shared/constants/transaction';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import { decimalToHex } from '../../../../../../shared/modules/conversion.utils';
import SendAmountRow from '.';

const mockUpdateSendAmount = jest.fn();

jest.mock('../../../../../ducks/send', () => ({
  ...jest.requireActual('../../../../../ducks/send'),
  updateSendAmount: () => mockUpdateSendAmount,
}));

jest.mock('../../../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

jest.mock('../../../../../../shared/modules/conversion.utils', () => ({
  ...jest.requireActual('../../../../../../shared/modules/conversion.utils'),
  decimalToHex: jest
    .fn()
    .mockImplementation((decimal) => `mockedHex-${decimal}`),
}));

describe('SendAmountRow Component', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);
  describe('render', () => {
    describe('Native Asset Type', () => {
      const mockStore = configureMockStore([thunk])(mockSendState);

      it('should match snapshot for native asset type', () => {
        const { container } = renderWithProvider(<SendAmountRow />, mockStore);

        expect(container).toMatchSnapshot();
      });
    });

    describe('Token Asset Type', () => {
      const tokenState = {
        ...mockSendState,
        send: {
          currentTransactionUUID: '1-tx',
          draftTransactions: {
            '1-tx': {
              asset: {
                balance: '0x1158e460913d00000', // 20000000000000000000
                details: {
                  address: '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4',
                  symbol: 'META',
                  balance: '1000000000000000000',
                  decimals: 18,
                  string: '1',
                  balanceError: null,
                  isERC721: false,
                  image: '',
                  standard: 'ERC20',
                },
                error: null,
                type: AssetType.token,
              },
            },
          },
        },
      };
      const mockStore = configureMockStore([thunk])(tokenState);

      it('should match snapshot for token asset type', () => {
        const { container } = renderWithProvider(<SendAmountRow />, mockStore);

        expect(container).toMatchSnapshot();
      });
    });

    describe('NFT Asset Type', () => {
      it('should match snapshot for token NFT type', () => {
        const nftState = {
          ...mockSendState,
          send: {
            currentTransactionUUID: '1-tx',
            draftTransactions: {
              '1-tx': {
                asset: {
                  balance: '',
                  details: {
                    standard: TokenStandard.ERC721,
                  },
                  error: null,
                  type: AssetType.NFT,
                },
              },
            },
          },
        };

        const mockStore = configureMockStore([thunk])(nftState);

        const { container } = renderWithProvider(<SendAmountRow />, mockStore);

        expect(container).toMatchSnapshot();
      });

      it('should render amount field and balance for erc1155', () => {
        const nftState = {
          ...mockSendState,
          send: {
            currentTransactionUUID: '1-tx',
            draftTransactions: {
              '1-tx': {
                asset: {
                  balance: '',
                  details: {
                    balance: '2',
                    standard: TokenStandard.ERC1155,
                  },
                  error: null,
                  type: AssetType.NFT,
                },
              },
            },
          },
        };

        const mockStore = configureMockStore([thunk])(nftState);

        const { getByText } = renderWithProvider(<SendAmountRow />, mockStore);

        expect(getByText('Amount:')).toBeInTheDocument();
        expect(getByText('Balance: 2 tokens')).toBeInTheDocument();
      });
    });
  });

  describe('updateAmount', () => {
    const mockStore = configureMockStore([thunk])(mockSendState);

    it('should call updateSendAmount', () => {
      const { queryByTestId } = renderWithProvider(
        <SendAmountRow />,
        mockStore,
      );
      queryByTestId('currency-input');

      fireEvent.change(queryByTestId('currency-input'), {
        target: { value: 0.5 },
      });

      expect(mockUpdateSendAmount).toHaveBeenCalled();
    });
  });

  describe('SendAmountRow', () => {
    it('calls decimalToHex on handleChange for erc1155 token', () => {
      const erc1155State = {
        ...mockSendState,
        send: {
          currentTransactionUUID: '1-tx',
          draftTransactions: {
            '1-tx': {
              asset: {
                balance: '',
                details: {
                  standard: TokenStandard.ERC1155,
                },
                error: null,
                type: AssetType.NFT,
              },
            },
          },
        },
      };
      const mockStoreErc1155 = configureMockStore([thunk])(erc1155State);
      const { queryByTestId } = renderWithProvider(
        <SendAmountRow />,
        mockStoreErc1155,
      );

      const input = queryByTestId('token-input');
      fireEvent.change(input, { target: { value: '456' } });

      expect(decimalToHex).toHaveBeenCalledWith('456');
      expect(mockUpdateSendAmount).toHaveBeenCalled();
    });
  });
});
