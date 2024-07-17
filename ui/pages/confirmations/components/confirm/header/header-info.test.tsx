import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import configureStore from '../../../../../store/store';
import HeaderInfo from './header-info';

const mockStore = {
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: {
      id: 'testApprovalId',
      msgParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        signatureMethod: 'eth_signTypedData_v4',
      },
      type: 'eth_signTypedData',
    },
  },
};

const cases = [
  {
    description: 'for a signature',
    store: {
      ...mockStore,
    },
    expectedEvent: {
      category: MetaMetricsEventCategory.Confirmations,
      event: MetaMetricsEventName.AccountDetailsOpened,
      properties: {
        action: 'Confirm Screen',
        location: MetaMetricsEventLocation.SignatureConfirmation,
        signature_type: 'eth_signTypedData_v4',
      },
    },
  },
  {
    description: 'for a transaction',
    store: {
      ...mockStore,
      confirm: {
        currentConfirmation: {
          id: 'testApprovalId',
          type: 'a_transaction_type',
        },
      },
    },
    expectedEvent: {
      category: MetaMetricsEventCategory.Confirmations,
      event: MetaMetricsEventName.AccountDetailsOpened,
      properties: {
        action: 'Confirm Screen',
        location: MetaMetricsEventLocation.Transaction,
        transaction_type: 'a_transaction_type',
      },
    },
  },
];

const render = () => {
  const store = configureStore(mockStore);
  return renderWithProvider(<HeaderInfo />, store);
};

describe('Header', () => {
  it('should match snapshot', async () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
  it('shows account info icon', async () => {
    const { getByLabelText } = render();
    expect(getByLabelText('Account details')).toBeInTheDocument();
  });

  describe('when account info icon is clicked', () => {
    it('shows account info modal with address', async () => {
      const { getByLabelText, getByText, queryByTestId } = render();
      const accountInfoIcon = getByLabelText('Account details');
      fireEvent.click(accountInfoIcon);
      await waitFor(() => {
        expect(queryByTestId('account-details-modal')).toBeInTheDocument();
        expect(getByText('0x0DCD5...3E7bc')).toBeInTheDocument();
      });
    });

    cases.forEach(({ description, store, expectedEvent }) => {
      it(`sends "${MetaMetricsEventName.AccountDetailsOpened}" metametric ${description}`, () => {
        const mockTrackEvent = jest.fn();
        const { getByLabelText } = renderWithProvider(
          <MetaMetricsContext.Provider value={mockTrackEvent}>
            <HeaderInfo />
          </MetaMetricsContext.Provider>,
          configureStore(store),
        );
        const accountInfoIcon = getByLabelText('Account details');
        fireEvent.click(accountInfoIcon);

        expect(mockTrackEvent).toHaveBeenNthCalledWith(1, expectedEvent);
      });
    });
  });
});
