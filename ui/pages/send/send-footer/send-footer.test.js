import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { SEND_STAGES } from '../../../ducks/send';
import SendFooter from '.';

const mockResetSendState = jest.fn();
const mockSendTransaction = jest.fn();
const mockCancelTx = jest.fn();

jest.mock('../../../ducks/send/index.js', () => ({
  ...jest.requireActual('../../../ducks/send/index.js'),
  signTransaction: () => mockSendTransaction,
  resetSendState: () => mockResetSendState,
}));

jest.mock('../../../store/actions.ts', () => ({
  cancelTx: () => mockCancelTx,
}));

describe('SendFooter Component', () => {
  const props = {
    disabled: false,
    history: {
      push: jest.fn(),
    },
  };

  afterEach(() => {
    props.history.push.mockReset();
  });

  const mockStore = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <SendFooter {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  describe('onCancel', () => {
    it('should call reset send state and route to recent page without cancelling tx', () => {
      const { queryByText } = renderWithProvider(
        <SendFooter {...props} />,
        mockStore,
      );

      const cancelText = queryByText('Cancel');
      fireEvent.click(cancelText);

      expect(mockResetSendState).toHaveBeenCalled();
      expect(mockCancelTx).not.toHaveBeenCalled();
      expect(props.history.push).toHaveBeenCalledWith(
        '/mostRecentOverviewPage',
      );
    });

    it('should reject/cancel tx when coming from tx editing and route to index', () => {
      const sendDataState = {
        ...mockState,
        send: {
          currentTransactionUUID: '01',
          draftTransactions: {
            '01': {
              id: '99',
            },
          },
          stage: SEND_STAGES.EDIT,
        },
      };

      const sendStateStore = configureMockStore([thunk])(sendDataState);

      const { queryByText } = renderWithProvider(
        <SendFooter {...props} />,
        sendStateStore,
      );

      const rejectText = queryByText('Reject');
      fireEvent.click(rejectText);

      expect(mockResetSendState).toHaveBeenCalled();
      expect(mockCancelTx).toHaveBeenCalled();
      expect(props.history.push).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  describe('onSubmit', () => {
    it('should', async () => {
      const { queryByText } = renderWithProvider(
        <SendFooter {...props} />,
        mockStore,
      );

      const nextText = queryByText('Next');
      fireEvent.click(nextText);

      await waitFor(() => {
        expect(mockSendTransaction).toHaveBeenCalled();
        expect(props.history.push).toHaveBeenCalledWith(
          CONFIRM_TRANSACTION_ROUTE,
        );
      });
    });
  });

  describe('Component Update', () => {
    it('should match snapshot when component updated with errors', () => {
      const { container, rerender } = renderWithProvider(
        <SendFooter.WrappedComponent
          disabled={false}
          mostRecentOverviewPage="text"
        />,
      );

      const sendErrorProps = {
        disabled: false,
        mostRecentOverviewPage: 'text',
        sendErrors: {
          gasFee: 'gas fee error',
          amount: 'amount error',
        },
      };

      rerender(<SendFooter.WrappedComponent {...sendErrorProps} />);
      expect(container).toMatchSnapshot();
    });
  });
});
