import React from 'react';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import { setSmartTransactionsOptInStatus } from '../../../store/actions';
import SmartTransactionsOptInModal from './smart-transactions-opt-in-modal';

const middleware = [thunk];

jest.mock('../../../store/actions');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => []),
}));

describe('SmartTransactionsOptInModal', () => {
  it('displays the correct text in the modal', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText, container } = renderWithProvider(
      <SmartTransactionsOptInModal
        isOpen={true}
        hideWhatsNewPopup={jest.fn()}
      />,
      store,
    );
    expect(getByText('Enable')).toBeInTheDocument();
    expect(getByText('No thanks')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('calls setSmartTransactionsOptInStatus with false when the "No thanks" link is clicked', () => {
    (setSmartTransactionsOptInStatus as jest.Mock).mockImplementationOnce(() =>
      jest.fn(),
    );
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <SmartTransactionsOptInModal
        isOpen={true}
        hideWhatsNewPopup={jest.fn()}
      />,
      store,
    );
    const noThanksLink = getByText('No thanks');
    fireEvent.click(noThanksLink);
    expect(setSmartTransactionsOptInStatus).toHaveBeenCalledWith(false);
  });

  it('calls setSmartTransactionsOptInStatus with true when the "Enable" button is clicked', () => {
    (setSmartTransactionsOptInStatus as jest.Mock).mockImplementationOnce(() =>
      jest.fn(),
    );
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <SmartTransactionsOptInModal
        isOpen={true}
        hideWhatsNewPopup={jest.fn()}
      />,
      store,
    );
    const enableButton = getByText('Enable');
    fireEvent.click(enableButton);
    expect(setSmartTransactionsOptInStatus).toHaveBeenCalledWith(true);
  });
});
