/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { AccountListMenu } from '.';

const render = (props = { onClose: () => jest.fn() }) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(<AccountListMenu {...props} />, store);
};

describe('AccountListMenu', () => {
  it('displays important controls', () => {
    const { getByPlaceholderText, getByText } = render();

    expect(getByPlaceholderText('Search accounts')).toBeInTheDocument();
    expect(getByText('Add account')).toBeInTheDocument();
    expect(getByText('Import account')).toBeInTheDocument();
    expect(getByText('Hardware wallet')).toBeInTheDocument();
  });

  it('displays accounts for list and filters by search', () => {
    render();
    const listItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );
    expect(listItems).toHaveLength(4);

    const searchBox = document.querySelector('input[type=search]');
    fireEvent.change(searchBox, {
      target: { value: 'Le' },
    });

    const filteredListItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );
    expect(filteredListItems).toHaveLength(1);
  });
});
