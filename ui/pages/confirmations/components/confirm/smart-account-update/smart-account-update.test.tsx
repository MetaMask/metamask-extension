import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/dom';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { upgradeAccountConfirmation } from '../../../../../../test/data/confirmations/batch-transaction';
import { Confirmation } from '../../../types/confirm';
import { setSmartAccountOptIn } from '../../../../../store/actions';
import { SmartAccountUpdate } from './smart-account-update';

jest.mock('../../../../../hooks/useMultiPolling', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../../store/actions', () => ({
  setAccountDetailsAddress: jest.fn(),
  setSmartAccountOptIn: jest.fn(),
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});
const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

describe('SmartAccountUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByText } = renderWithProvider(<SmartAccountUpdate />, mockStore);

    expect(getByText('Use smart account?')).toBeInTheDocument();
  });

  it('show success after acknowledgement', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByRole, getByText, container } = renderWithProvider(
      <SmartAccountUpdate />,
      mockStore,
    );

    expect(container.firstChild).not.toBeNull();

    fireEvent.click(
      getByRole('button', {
        name: /Use smart account/iu,
      }),
    );

    expect(setSmartAccountOptIn).toHaveBeenCalledTimes(1);
    expect(getByText('Successful!')).toBeDefined();
  });

  it('call useNavigate when close button is clicked', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByTestId } = renderWithProvider(
      <SmartAccountUpdate />,
      mockStore,
    );

    fireEvent.click(getByTestId('smart-account-update-close'));
    expect(mockUseNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
