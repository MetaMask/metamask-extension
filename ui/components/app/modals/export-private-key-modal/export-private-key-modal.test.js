import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as actions from '../../../../store/actions';
import ExportPrivateKeyModal from '.';

jest.mock('../../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../../store/actions.ts'),
  exportAccount: jest.fn().mockReturnValue(jest.fn().mockResolvedValueOnce()),
  hideWarning: () => jest.fn(),
  showModal: () => jest.fn(),
  hideModal: () => jest.fn(),
  clearAccountDetails: () => jest.fn(),
}));

describe('Export PrivateKey Modal', () => {
  const password = 'a-password';

  const privKeyModalState = {
    ...mockState,
    appState: {
      ...mockState.appState,
      accountDetail: {
        privateKey: '0xPrivKey',
      },
    },
  };
  const mockStore = configureMockStore([thunk])(privKeyModalState);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <ExportPrivateKeyModal />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should disable confirm button by default', () => {
    const { queryByText } = renderWithProvider(
      <ExportPrivateKeyModal />,
      mockStore,
    );

    const confirmButton = queryByText('Confirm');

    expect(confirmButton).toBeDisabled();
  });

  it('should call export account with password and selected address', () => {
    const { queryByTestId, queryByText } = renderWithProvider(
      <ExportPrivateKeyModal />,
      mockStore,
    );

    const passwordInput = queryByTestId('password-input');

    const passwordInputEvent = {
      target: {
        value: password,
      },
    };

    fireEvent.change(passwordInput, passwordInputEvent);

    const confirmButton = queryByText('Confirm');

    fireEvent.click(confirmButton);

    expect(actions.exportAccount).toHaveBeenCalledWith(
      password,
      mockState.metamask.selectedAddress,
    );
  });
});
