/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { AccountListItemMenu } from '.';

const mockShowModal = jest.fn();
const mockAddPermittedAccount = jest.fn();

jest.mock('../../../store/institutional/institution-background');

jest.mock('../../../store/actions', () => {
  return {
    showModal: () => mockShowModal,
    addPermittedAccount: () => mockAddPermittedAccount,
  };
});

const account = {
  ...mockState.metamask.internalAccounts.accounts[
    'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
  ],
};

const DEFAULT_PROPS = {
  identity: account,
  onClose: jest.fn(),
  onHide: jest.fn(),
  isRemovable: false,
  isOpen: true,
};

const render = (props = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
    activeTab: {
      origin: 'https://uniswap.org/',
    },
  });
  const allProps = { ...DEFAULT_PROPS, ...props };
  return renderWithProvider(<AccountListItemMenu {...allProps} />, store);
};

describe('AccountListItem', () => {
  it('renders remove icon with isRemovable', () => {
    const { getByTestId } = render({ isRemovable: true });
    expect(getByTestId('account-list-menu-remove')).toBeInTheDocument();
  });

  it('renders Connect account button', () => {
    process.env.MULTICHAIN = 1;
    const { getByTestId } = render({ isRemovable: true });
    const connectAccountButton = getByTestId(
      'account-list-menu-connect-account',
    );
    expect(connectAccountButton).toBeInTheDocument();
    fireEvent.click(connectAccountButton);
    expect(mockAddPermittedAccount).toHaveBeenCalled();

    delete process.env.MULTICHAIN;
  });

  it('should render remove JWT menu item if the user is custodian and click the button', async () => {
    const mockedGetCustodianToken = jest
      .fn()
      .mockReturnValue({ type: 'Custody', payload: 'token' });
    const mockedGetAllCustodianAccountsWithToken = jest
      .fn()
      .mockReturnValue({ type: 'Custody', payload: 'token' });

    mmiActionsFactory.mockReturnValue({
      getCustodianToken: mockedGetCustodianToken,
      getAllCustodianAccountsWithToken: mockedGetAllCustodianAccountsWithToken,
    });

    const newAccount = {
      ...mockState.metamask.internalAccounts.accounts[
        '694225f4-d30b-4e77-a900-c8bbce735b42'
      ],
      balance: '0x152387ad22c3f0',
    };

    const { getByTestId } = render({ identity: newAccount });

    const removeJWTButton = getByTestId('account-options-menu__remove-jwt');

    expect(removeJWTButton).toBeInTheDocument();

    fireEvent.click(removeJWTButton);

    await act(async () => {
      expect(mockedGetCustodianToken).toHaveBeenCalledWith(newAccount.address);
    });

    await act(async () => {
      expect(mockedGetAllCustodianAccountsWithToken).toHaveBeenCalled();
      expect(mockShowModal).toHaveBeenCalled();
    });
  });
});
