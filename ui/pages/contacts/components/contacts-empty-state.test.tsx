import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { ContactsEmptyState } from './contacts-empty-state';

const defaultProps = { onAddContact: () => undefined };

describe('ContactsEmptyState', () => {
  it('renders with empty state content', () => {
    const { getByTestId } = renderWithProvider(
      <ContactsEmptyState {...defaultProps} />,
    );
    expect(getByTestId('contacts-empty-state')).toBeInTheDocument();
  });

  it('renders the empty contacts image', () => {
    const { getByRole } = renderWithProvider(
      <ContactsEmptyState {...defaultProps} />,
    );
    const img = getByRole('img', { name: '' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', './images/empty-contacts.svg');
    expect(img).toHaveAttribute('width', '72');
    expect(img).toHaveAttribute('height', '72');
  });

  it('renders addFriendsAndAddresses description', () => {
    const { getByText } = renderWithProvider(
      <ContactsEmptyState {...defaultProps} />,
    );
    expect(
      getByText(messages.addFriendsAndAddresses.message),
    ).toBeInTheDocument();
  });

  it('calls onAddContact when Add contact button is clicked', () => {
    const onAddContact = jest.fn();
    const { getByTestId } = renderWithProvider(
      <ContactsEmptyState onAddContact={onAddContact} />,
    );
    getByTestId('contacts-add-contact-button').click();
    expect(onAddContact).toHaveBeenCalledTimes(1);
  });
});
