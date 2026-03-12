import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import configureStore from '../../store/store';
import { PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { EditContactPage } from './edit-contact-page';

const MOCK_ADDRESS = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const MOCK_CHAIN_ID = '0x5';
const MOCK_NAME = 'Address Book Account 1';

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

describe('EditContactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({
      chainId: MOCK_CHAIN_ID,
      address: MOCK_ADDRESS,
    });
  });

  const renderPage = () => {
    const store = configureStore(mockState);
    return renderWithProvider(<EditContactPage />, store);
  };

  it('renders the edit contact page when contact exists', () => {
    const { getByTestId } = renderPage();
    expect(getByTestId('edit-contact-page')).toBeInTheDocument();
  });

  it('renders header with "Edit contact" title', () => {
    const { getByText } = renderPage();
    expect(getByText(messages.editContact.message)).toBeInTheDocument();
  });

  it('renders edit contact form with contact name', () => {
    const { getByDisplayValue } = renderPage();
    expect(getByDisplayValue(MOCK_NAME)).toBeInTheDocument();
  });

  it('renders edit contact form with contact address', () => {
    const { getByDisplayValue } = renderPage();
    expect(getByDisplayValue(MOCK_ADDRESS)).toBeInTheDocument();
  });

  it('navigates to previous route when back button is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('edit-contact-back-button'));
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('navigates to default route when close button is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('edit-contact-close-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('redirects to contacts list when address param is missing', () => {
    mockUseParams.mockReturnValue({
      chainId: MOCK_CHAIN_ID,
      address: undefined,
    });
    const { container } = renderWithProvider(
      <EditContactPage />,
      configureStore(mockState),
    );
    expect(
      container.querySelector('[data-testid="edit-contact-page"]'),
    ).not.toBeInTheDocument();
  });

  it('redirects to contacts list when contact is not in address book', () => {
    mockUseParams.mockReturnValue({
      chainId: MOCK_CHAIN_ID,
      address: '0x0000000000000000000000000000000000000001',
    });
    const { container } = renderWithProvider(
      <EditContactPage />,
      configureStore(mockState),
    );
    expect(
      container.querySelector('[data-testid="edit-contact-page"]'),
    ).not.toBeInTheDocument();
  });
});
