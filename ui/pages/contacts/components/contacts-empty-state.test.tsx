import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { ThemeType } from '../../../../shared/constants/preferences';
import { ContactsEmptyState } from './contacts-empty-state';

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

const defaultProps = { onAddContact: () => undefined };

const { useTheme } = jest.requireMock('../../../hooks/useTheme');

describe('ContactsEmptyState', () => {
  beforeEach(() => {
    useTheme.mockReturnValue(ThemeType.dark);
  });

  it('renders with empty state content', () => {
    const { getByTestId } = renderWithProvider(
      <ContactsEmptyState {...defaultProps} />,
    );
    expect(getByTestId('contacts-empty-state')).toBeInTheDocument();
  });

  it('renders the empty contacts image in dark mode', () => {
    useTheme.mockReturnValue(ThemeType.dark);
    const { getByRole } = renderWithProvider(
      <ContactsEmptyState {...defaultProps} />,
    );
    const img = getByRole('img', { name: '' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', './images/empty-contacts.svg');
    expect(img).toHaveAttribute('width', '72');
    expect(img).toHaveAttribute('height', '72');
  });

  it('renders the light empty contacts image in light mode', () => {
    useTheme.mockReturnValue(ThemeType.light);
    const { getByRole } = renderWithProvider(
      <ContactsEmptyState {...defaultProps} />,
    );
    const img = getByRole('img', { name: '' });
    expect(img).toHaveAttribute('src', './images/empty-contacts-light.svg');
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
