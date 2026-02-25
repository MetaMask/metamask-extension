/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { AccountListItemMenu } from '.';

const mockShowModal = jest.fn();
const mockAddPermittedAccount = jest.fn();

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

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

describe('AccountListItemMenu', () => {
  it('renders account details, pin, and hide menu items', () => {
    const { getByTestId } = render({ isPinned: false, isHidden: false });
    expect(getByTestId('account-list-menu-pin')).toBeInTheDocument();
    expect(getByTestId('account-list-menu-hide')).toBeInTheDocument();
  });

  it('renders remove account menu item when isRemovable is true', () => {
    const { getByTestId } = render({ isRemovable: true });
    expect(getByTestId('account-list-menu-remove')).toBeInTheDocument();
  });
});
