import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { DefaultRootState } from 'react-redux';

import {
  getMockContractInteractionConfirmState,
  getMockTypedSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../store/store';
import Header from './header';

const render = (state: DefaultRootState = getMockTypedSignConfirmState()) => {
  const store = configureStore(state);
  return renderWithConfirmContextProvider(<Header />, store);
};

describe('Header', () => {
  it('should match snapshot with signature confirmation', () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with transaction confirmation', () => {
    const { container } = render(getMockContractInteractionConfirmState());

    expect(container).toMatchSnapshot();
  });

  it('contains network name and account name', () => {
    const { getByText } = render();
    expect(getByText('Test Account')).toBeInTheDocument();
    expect(getByText('Chain 5')).toBeInTheDocument();
  });

  it('contains account info icon', async () => {
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
});
