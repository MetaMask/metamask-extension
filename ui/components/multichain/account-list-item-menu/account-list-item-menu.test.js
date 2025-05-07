/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { AccountListItemMenu } from '.';

const mockShowModal = jest.fn();
const mockAddPermittedAccount = jest.fn();

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
  account,
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
});
