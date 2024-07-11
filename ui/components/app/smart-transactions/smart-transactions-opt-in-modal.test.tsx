import React from 'react';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { useHistory } from 'react-router-dom';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import { setSmartTransactionsOptInStatus } from '../../../store/actions';
import { ADVANCED_ROUTE } from '../../../helpers/constants/routes';
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
    expect(getByText('Manage in settings')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('calls setSmartTransactionsOptInStatus with false when the "Manage in settings" link is clicked and redirects to Advanced Settings', () => {
    (setSmartTransactionsOptInStatus as jest.Mock).mockImplementationOnce(() =>
      jest.fn(),
    );
    const historyPushMock = jest.fn();
    (useHistory as jest.Mock).mockImplementationOnce(() => ({
      push: historyPushMock,
    }));
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <SmartTransactionsOptInModal
        isOpen={true}
        hideWhatsNewPopup={jest.fn()}
      />,
      store,
    );
    const manageInSettingsLink = getByText('Manage in settings');
    fireEvent.click(manageInSettingsLink);
    expect(setSmartTransactionsOptInStatus).toHaveBeenCalledWith(false);
    expect(historyPushMock).toHaveBeenCalledWith(
      `${ADVANCED_ROUTE}#smart-transactions`,
    );
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
