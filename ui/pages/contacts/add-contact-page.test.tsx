import React from 'react';
import { fireEvent } from '@testing-library/react';
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

  it('navigates to default route when close button is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('add-contact-close-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
