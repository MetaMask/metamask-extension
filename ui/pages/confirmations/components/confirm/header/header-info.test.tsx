import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import {
  getMockContractInteractionConfirmState,
  getMockTypedSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import configureStore from '../../../../../store/store';
import HeaderInfo from './header-info';

const mockStore = getMockTypedSignConfirmState();

const cases = [
  {
    description: 'for a signature',
    store: mockStore,
    expectedEvent: {
      category: MetaMetricsEventCategory.Confirmations,
      event: MetaMetricsEventName.AccountDetailsOpened,
      properties: {
        action: 'Confirm Screen',
        location: MetaMetricsEventLocation.SignatureConfirmation,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        signature_type: 'eth_signTypedData_v4',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: 0,
      },
    },
  },
  {
    description: 'for a transaction',
    store: getMockContractInteractionConfirmState(),
    expectedEvent: {
      category: MetaMetricsEventCategory.Confirmations,
      event: MetaMetricsEventName.AccountDetailsOpened,
      properties: {
        action: 'Confirm Screen',
        location: MetaMetricsEventLocation.Transaction,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        transaction_type: TransactionType.contractInteraction,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: 0,
      },
    },
  },
];

const render = () => {
  const store = configureStore(mockStore);
  return renderWithConfirmContextProvider(<HeaderInfo />, store);
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
        const { getByLabelText } = renderWithConfirmContextProvider(
          <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
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
