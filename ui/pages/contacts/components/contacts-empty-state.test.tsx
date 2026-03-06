import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ContactsEmptyState } from './contacts-empty-state';

describe('ContactsEmptyState', () => {
  it('renders with empty state content', () => {
    const { getByTestId } = renderWithProvider(<ContactsEmptyState />);
    expect(getByTestId('contacts-empty-state')).toBeInTheDocument();
  });

  it('renders the empty contacts image', () => {
    const { getByRole } = renderWithProvider(<ContactsEmptyState />);
    const img = getByRole('img', { name: '' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', './images/empty-contacts.svg');
    expect(img).toHaveAttribute('width', '72');
    expect(img).toHaveAttribute('height', '72');
  });

  it('renders buildContactList heading', () => {
    const { getByText } = renderWithProvider(<ContactsEmptyState />);
    expect(getByText('Build your contact list')).toBeInTheDocument();
  });

  it('renders addFriendsAndAddresses description', () => {
    const { getByText } = renderWithProvider(<ContactsEmptyState />);
    expect(
      getByText('Add friends and addresses you trust'),
    ).toBeInTheDocument();
  });
});
