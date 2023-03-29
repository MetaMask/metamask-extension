/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { renderWithProvider, fireEvent } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { AccountListItemMenu } from '.';

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
  it('renders the URL for explorer', () => {
    const blockExplorerDomain = 'etherscan.io';
    const { getByText, getByTestId } = render({
      blockExplorerUrlSubTitle: blockExplorerDomain,
    });
    expect(getByText(blockExplorerDomain)).toBeInTheDocument();

    Object.defineProperty(global, 'platform', {
      value: {
        openTab: jest.fn(),
      },
    });
    const openExplorerTabSpy = jest.spyOn(global.platform, 'openTab');
    fireEvent.click(getByTestId('account-list-menu-open-explorer'));
    expect(openExplorerTabSpy).toHaveBeenCalled();
  });

  it('renders remove icon with isRemovable', () => {
    const { getByTestId } = render({ isRemovable: true });
    expect(getByTestId('account-list-menu-remove')).toBeInTheDocument();
  });
});
