import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/dom';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { upgradeAccountConfirmation } from '../../../../../../test/data/confirmations/batch-transaction';
import { Confirmation } from '../../../types/confirm';
import { setSmartAccountOptInForAccounts } from '../../../../../store/actions';
import { SmartAccountUpdate } from './smart-account-update';

jest.mock('../../../../../hooks/useMultiPolling', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../../store/actions', () => ({
  setAccountDetailsAddress: jest.fn(),
  setSmartAccountOptInForAccounts: jest.fn(),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

describe('SmartAccountUpdate', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <SmartAccountUpdate />,
      mockStore,
    );

    expect(getByText('Use smart account?')).toBeInTheDocument();
  });

  it('show success after acknowledgement', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByRole, getByText, container } =
      renderWithConfirmContextProvider(<SmartAccountUpdate />, mockStore);

    expect(container.firstChild).not.toBeNull();

    fireEvent.click(
      getByRole('button', {
        name: /Use smart account/iu,
      }),
    );

    expect(setSmartAccountOptInForAccounts).toHaveBeenCalledTimes(1);
    expect(getByText('Successful!')).toBeDefined();
  });

  it('open account selection when pencil icon is clicked', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByText, getByTestId } = renderWithConfirmContextProvider(
      <SmartAccountUpdate />,
      mockStore,
    );

    fireEvent.click(getByTestId('smart-account-update-edit'));
    expect(getByText('Edit accounts')).toBeInTheDocument();
  });
});
