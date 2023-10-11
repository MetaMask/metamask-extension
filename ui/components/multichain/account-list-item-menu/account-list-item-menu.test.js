/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { AccountListItemMenu } from '.';

const mockShowModal = jest.fn();

jest.mock('../../../store/institutional/institution-background');

jest.mock('../../../store/actions', () => {
  return {
    showModal: () => mockShowModal,
  };
});

const identity = {
  ...mockState.metamask.identities[
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
  ],
  balance: '0x152387ad22c3f0',
};

const DEFAULT_PROPS = {
  identity,
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
  });
  const allProps = { ...DEFAULT_PROPS, ...props };
  return renderWithProvider(<AccountListItemMenu {...allProps} />, store);
};

describe('AccountListItem', () => {
  it('renders remove icon with isRemovable', () => {
    const { getByTestId } = render({ isRemovable: true });
    expect(getByTestId('account-list-menu-remove')).toBeInTheDocument();
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

    const newIdentity = {
      ...mockState.metamask.identities[
        '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281'
      ],
      balance: '0x152387ad22c3f0',
    };

    const { getByTestId } = render({ identity: newIdentity });

    const removeJWTButton = getByTestId('account-options-menu__remove-jwt');

    expect(removeJWTButton).toBeInTheDocument();

    fireEvent.click(removeJWTButton);

    await act(async () => {
      expect(mockedGetCustodianToken).toHaveBeenCalledWith(newIdentity.address);
    });

    await act(async () => {
      expect(mockedGetAllCustodianAccountsWithToken).toHaveBeenCalled();
      expect(mockShowModal).toHaveBeenCalled();
    });
  });
});
