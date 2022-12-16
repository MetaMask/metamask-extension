import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { ASSET_TYPES } from '../../../../../shared/constants/transaction';
import SendAmountRow from '.';

const mockUpdateSendAmount = jest.fn();

jest.mock('../../../../ducks/send', () => ({
  ...jest.requireActual('../../../../ducks/send'),
  updateSendAmount: () => mockUpdateSendAmount,
}));

describe('SendAmountRow Component', () => {
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
                type: ASSET_TYPES.TOKEN,
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

    describe('Collectible Asset Type', () => {
      it('should match snapshot for token collectible type', () => {
        const collectibleState = {
          ...mockSendState,
          send: {
            currentTransactionUUID: '1-tx',
            draftTransactions: {
              '1-tx': {
                asset: {
                  balance: '',
                  details: null,
                  error: null,
                  type: ASSET_TYPES.COLLECTIBLE,
                },
              },
            },
          },
        };

        const mockStore = configureMockStore([thunk])(collectibleState);

        const { container } = renderWithProvider(<SendAmountRow />, mockStore);

        expect(container).toMatchSnapshot();
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
});
