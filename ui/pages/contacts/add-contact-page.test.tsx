import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import configureStore from '../../store/store';
import { AddContactPage } from './add-contact-page';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AddContactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = () => {
    const store = configureStore(mockState);
    return renderWithProvider(<AddContactPage />, store);
  };

  it('renders the add contact page', () => {
    const { getByTestId } = renderPage();
    expect(getByTestId('add-contact-page')).toBeInTheDocument();
  });

  it('renders header with "Add contact" title', () => {
    const { getByText } = renderPage();
    expect(getByText(messages.addContact.message)).toBeInTheDocument();
  });

  it('renders the add contact form', () => {
    const { getByPlaceholderText } = renderPage();
    expect(getByPlaceholderText(messages.addAlias.message)).toBeInTheDocument();
  });

  it('navigates to contacts list when back button is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('add-contact-back-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/contacts');
  });

  it('rejects the dead address as a contact address', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = renderPage();
    fireEvent.change(getByPlaceholderText(messages.addAlias.message), {
      target: { value: 'Burn' },
    });
    fireEvent.change(
      getByPlaceholderText(messages.recipientAddressPlaceholderNew.message),
      { target: { value: '0x000000000000000000000000000000000000dEaD' } },
    );

    expect(getByTestId('page-container-footer-next')).toBeDisabled();
    await waitFor(() =>
      expect(
        getByText(messages.invalidAddressRecipient.message),
      ).toBeInTheDocument(),
    );
  });

  it('rejects the zero address as a contact address', () => {
    const { getByPlaceholderText, getByTestId } = renderPage();
    fireEvent.change(getByPlaceholderText(messages.addAlias.message), {
      target: { value: 'Burn' },
    });
    fireEvent.change(
      getByPlaceholderText(messages.recipientAddressPlaceholderNew.message),
      { target: { value: '0x0000000000000000000000000000000000000000' } },
    );

    expect(getByTestId('page-container-footer-next')).toBeDisabled();
  });

  it('accepts a regular address as a contact address', () => {
    const { getByPlaceholderText, getByTestId } = renderPage();
    fireEvent.change(getByPlaceholderText(messages.addAlias.message), {
      target: { value: 'Regular' },
    });
    fireEvent.change(
      getByPlaceholderText(messages.recipientAddressPlaceholderNew.message),
      {
        target: {
          value: '0x06195827297c7A80a443b6894d3BDB8824b43896',
        },
      },
    );

    expect(getByTestId('page-container-footer-next')).not.toBeDisabled();
  });

  it('navigates to default route when close button is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('add-contact-close-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
