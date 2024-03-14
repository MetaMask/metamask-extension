import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';

import HeaderInfo from './header-info';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
    confirm: {
      currentConfirmation: {
        msgParams: {
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        },
      },
    },
  });

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
  it('shows modal when account info icon is clicked', async () => {
    const { getByLabelText, queryByTestId } = render();
    expect(queryByTestId('account-details-modal')).not.toBeInTheDocument();
    const accountInfoIcon = getByLabelText('Account details');
    fireEvent.click(accountInfoIcon);
    await waitFor(() => {
      expect(queryByTestId('account-details-modal')).toBeInTheDocument();
    });
  });
  it('shows account info modal with address', async () => {
    const { getByLabelText, getByText, queryByTestId } = render();
    const accountInfoIcon = getByLabelText('Account details');
    fireEvent.click(accountInfoIcon);
    await waitFor(() => {
      expect(queryByTestId('account-details-modal')).toBeInTheDocument();
      expect(getByText('0x0DCD5...3E7bc')).toBeInTheDocument();
    });
  });
});
