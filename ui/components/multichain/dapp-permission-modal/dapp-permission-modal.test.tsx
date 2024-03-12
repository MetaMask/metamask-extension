import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest/rendering';
import {
  getDappPermissionModal,
  getPermissionsForActiveTab,
  getOriginOfCurrentTab,
  getUseBlockie,
  getPermissionSubjects,
} from '../../../selectors';
import {
  hideDappPermissionModal,
  removePermittedAccount,
} from '../../../store/actions';
import { DappPermissionModal } from '.';

jest.mock('../../../store/actions', () => ({
  hideDappPermissionModal: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue({})),
  removePermittedAccount: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue({})),
}));

jest.mock('../../../selectors', () => ({
  getDappPermissionModal: jest.fn(),
  getPermissionsForActiveTab: jest.fn(),
  getOriginOfCurrentTab: jest.fn(),
  getUseBlockie: jest.fn(),
  getPermissionSubjects: jest.fn(),
}));

describe('DappPermissionModal', () => {
  const mockStore = configureMockStore([thunk]);
  let store: any;

  beforeEach(() => {
    store = mockStore({
      appState: {},
    });
    jest.clearAllMocks();
  });

  beforeEach(() => {
    getDappPermissionModal.mockReturnValue({
      open: true,
      account: { address: '0x123', label: 'Test Account' },
    });
    getPermissionsForActiveTab.mockReturnValue([]);
    getOriginOfCurrentTab.mockReturnValue('http://example.com');
    getUseBlockie.mockReturnValue(false);
    getPermissionSubjects.mockReturnValue({});
  });

  it('should render the modal when open', () => {
    const { getByTestId } = renderWithProvider(<DappPermissionModal />, store);
    expect(getByTestId('dapp-permission-modal')).toBeInTheDocument();
  });

  it('should close the modal on close button click', () => {
    const { getByLabelText } = renderWithProvider(
      <DappPermissionModal />,
      store,
    );
    getByLabelText('Close').click();
    expect(hideDappPermissionModal).toHaveBeenCalled();
  });

  it('should dispatch removePermittedAccount and close modal on disconnect button click', () => {
    const activeTabOrigin = 'http://example.com';
    const accountAddress = '0x123';

    const { getByText } = renderWithProvider(<DappPermissionModal />, store);
    getByText('Disconnect').click();
    expect(removePermittedAccount).toHaveBeenCalledWith(
      activeTabOrigin,
      accountAddress,
    );
    expect(hideDappPermissionModal).toHaveBeenCalled();
  });
});
