import React from 'react';
import configureMockStore from 'redux-mock-store';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../../../../helpers/constants/error-keys';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import SendRowErrorMessage from '.';

describe('SendRowErrorMessage Component', () => {
  describe('render', () => {
    it('should match snapshot with no error', () => {
      const mockState = {
        send: {
          draftTransactions: {},
        },
      };

      const mockStore = configureMockStore()(mockState);
      const { container } = renderWithProvider(
        <SendRowErrorMessage />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render an error message if the passed errors contain an error of errorType', () => {
      const props = {
        errorType: 'amount',
      };

      const sendErrorState = {
        send: {
          currentTransactionUUID: '1-tx',
          draftTransactions: {
            '1-tx': {
              gas: {
                error: INSUFFICIENT_FUNDS_ERROR_KEY,
              },
              amount: {
                error: INSUFFICIENT_FUNDS_ERROR_KEY,
              },
            },
          },
        },
      };
      const mockStore = configureMockStore()(sendErrorState);

      const { container } = renderWithProvider(
        <SendRowErrorMessage {...props} />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
