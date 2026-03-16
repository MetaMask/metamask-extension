import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import configureStore from '../../store/store';
import {
  CONTACTS_ROUTE,
  CONTACTS_EDIT_ROUTE,
} from '../../helpers/constants/routes';
import { ContactDetailsPage } from './contact-details-page';

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

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  removeFromAddressBook: (...args: unknown[]) => ({
    type: 'REMOVE_FROM_ADDRESS_BOOK',
    args,
  }),
}));

describe('ContactDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({
      chainId: MOCK_CHAIN_ID,
      address: MOCK_ADDRESS,
    });
  });

  const renderPage = () => {
    const store = configureStore(mockState);
    return renderWithProvider(<ContactDetailsPage />, store);
  };

  it('renders the contact details page when contact exists', () => {
    const { getByTestId } = renderPage();
    expect(getByTestId('contact-details-page')).toBeInTheDocument();
  });

  it('renders header with "Contact details" title', () => {
    const { getByText } = renderPage();
    expect(getByText(messages.contactDetails.message)).toBeInTheDocument();
  });

  it('displays the contact name', () => {
    const { getByTestId } = renderPage();
    expect(getByTestId('address-book-name')).toHaveTextContent(MOCK_NAME);
  });

  it('displays the contact address', () => {
    const { getByTestId } = renderPage();
    expect(
      getByTestId('address-book-view-contact-address'),
    ).toBeInTheDocument();
  });

  it('navigates to contacts list when back button is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('contact-details-back-button'));
    expect(mockNavigate).toHaveBeenCalledWith(CONTACTS_ROUTE);
  });

  it('navigates to default route when close button is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('contact-details-close-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to edit route with chainId and address when edit is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('view-contact-edit-button'));
    expect(mockNavigate).toHaveBeenCalledWith(
      `${CONTACTS_EDIT_ROUTE}/${MOCK_CHAIN_ID}/${MOCK_ADDRESS}`,
    );
  });

  it('redirects to contacts list when address param is missing', () => {
    mockUseParams.mockReturnValue({
      chainId: MOCK_CHAIN_ID,
      address: undefined,
    });
    const { container } = renderWithProvider(
      <ContactDetailsPage />,
      configureStore(mockState),
    );
    expect(
      container.querySelector('[data-testid="contact-details-page"]'),
    ).not.toBeInTheDocument();
  });

  it('redirects to contacts list when chainId param is missing', () => {
    mockUseParams.mockReturnValue({
      chainId: undefined,
      address: MOCK_ADDRESS,
    });
    const { container } = renderWithProvider(
      <ContactDetailsPage />,
      configureStore(mockState),
    );
    expect(
      container.querySelector('[data-testid="contact-details-page"]'),
    ).not.toBeInTheDocument();
  });

  it('redirects when contact is not found on the given chain', () => {
    mockUseParams.mockReturnValue({
      chainId: '0x1',
      address: MOCK_ADDRESS,
    });
    const { container } = renderWithProvider(
      <ContactDetailsPage />,
      configureStore(mockState),
    );
    expect(
      container.querySelector('[data-testid="contact-details-page"]'),
    ).not.toBeInTheDocument();
  });
});
