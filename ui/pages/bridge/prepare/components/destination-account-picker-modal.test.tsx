import React from 'react';
import { createBridgeMockStore } from '../../../../../test/data/bridge/mock-bridge-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import { getToAccounts } from '../../../../ducks/bridge/selectors';
import { DestinationAccountPickerModal } from './destination-account-picker-modal';

describe('DestinationAccountPickerModal', () => {
  it('should render the modal when no account is selected', () => {
    const { getByTestId } = renderWithProvider(
      <DestinationAccountPickerModal
        isOpen={true}
        onClose={jest.fn()}
        onAccountSelect={jest.fn()}
        selectedAccount={null}
      />,
      configureStore(createBridgeMockStore()),
    );
    expect(getByTestId('destination-account-picker-modal')).toMatchSnapshot();
  });

  it('should render the modal when an account is selected', () => {
    const mockStore = configureStore(createBridgeMockStore());
    const selectedDestAccount = getToAccounts(mockStore.getState())[0];
    const { getByTestId } = renderWithProvider(
      <DestinationAccountPickerModal
        isOpen={true}
        onClose={jest.fn()}
        onAccountSelect={jest.fn()}
        selectedAccount={selectedDestAccount}
      />,
      mockStore,
    );
    expect(getByTestId('destination-account-picker-modal')).toMatchSnapshot();
  });
});
