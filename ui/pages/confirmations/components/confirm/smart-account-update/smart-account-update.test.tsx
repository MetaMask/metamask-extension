import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/dom';

import { flushPromises } from '../../../../../../test/lib/timer-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { upgradeAccountConfirmation } from '../../../../../../test/data/confirmations/batch-transaction';
import { Confirmation } from '../../../types/confirm';
import { setSmartAccountOptInForAccounts } from '../../../../../store/actions';
import { SmartAccountUpdate } from './smart-account-update';

jest.mock('../../../../../hooks/useMultiPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../../store/actions', () => ({
  setAccountDetailsAddress: jest.fn(),
  rejectPendingApproval: jest.fn().mockReturnValue({}),
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

  it('closes after acknowledgement if not wrapped', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getAllByRole, container } = renderWithConfirmContextProvider(
      <SmartAccountUpdate wrapped />,
      mockStore,
    );

    expect(container.firstChild).not.toBeNull();

    fireEvent.click(
      getAllByRole('button', {
        name: /Use smart account/iu,
      })[1],
    );

    expect(container.firstChild).toBeNull();
    expect(setSmartAccountOptInForAccounts).toHaveBeenCalledTimes(1);
  });

  it('show success after acknowledgement if wrapped', () => {
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

  it('call handleRejectUpgrade on rejection', async () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const mockHandleRejectUpgrade = jest.fn();
    const { getByRole } = renderWithConfirmContextProvider(
      <SmartAccountUpdate
        wrapped
        handleRejectUpgrade={mockHandleRejectUpgrade}
      />,
      mockStore,
    );

    fireEvent.click(
      getByRole('button', {
        name: /Don’t use smart account/iu,
      }),
    );
    await flushPromises();
    expect(mockHandleRejectUpgrade).toHaveBeenCalledTimes(1);
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
