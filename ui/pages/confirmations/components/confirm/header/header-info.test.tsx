import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import configureStore from '../../../../../store/store';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';

import HeaderInfo from './header-info';

const mockStore = {
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: {
      msgParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      },
      type: 'eth_signTypedData_v4',
    },
  },
};

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

    it(`sends "${MetaMetricsEventName.AccountDetailsOpened}" metametric`, () => {
      const mockTrackEvent = jest.fn();
      const { getByLabelText } = renderWithProvider(
        <MetaMetricsContext.Provider value={mockTrackEvent}>
          <HeaderInfo />
        </MetaMetricsContext.Provider>,
        configureStore(mockStore),
      );
      const accountInfoIcon = getByLabelText('Account details');
      fireEvent.click(accountInfoIcon);

      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Transactions,
        event: MetaMetricsEventName.AccountDetailsOpened,
        properties: {
          action: 'Confirm Screen',
          location: MetaMetricsEventLocation.SignatureConfirmation,
          signature_type: 'eth_signTypedData_v4',
        },
      });
    });
  });
});
