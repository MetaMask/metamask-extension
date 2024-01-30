import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../../../helpers/constants/error-keys';
import SendRowWrapper from '.';

describe('SendContent Component', () => {
  describe('render', () => {
    it('should render with children', () => {
      const props = {
        errorType: 'mockErrorType',
        label: 'mockLabel',
        showError: false,
      };
      const { container } = renderWithProvider(
        <SendRowWrapper {...props}>
          <span>Mock Custom Label Content</span>
          <span>Mock Form Field</span>
        </SendRowWrapper>,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render a SendRowErrorMessage with and errorType props if showError is true', () => {
      const mockState = {
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

      const mockStore = configureMockStore()(mockState);

      const props = {
        errorType: 'amount',
        label: 'mockLabel',
        showError: true,
      };
      const { container } = renderWithProvider(
        <SendRowWrapper {...props}>
          <span>Mock Form Field</span>
        </SendRowWrapper>,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
