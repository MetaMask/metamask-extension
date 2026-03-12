import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import configureStore from '../../store/store';
import {
  CONTACTS_VIEW_ROUTE,
  CONTACTS_ADD_ROUTE,
} from '../../helpers/constants/routes';
import { ContactsListPage } from './contacts-list-page';

const MOCK_ADDRESS = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const MOCK_CHAIN_ID = '0x5';
const MOCK_NAME = 'Address Book Account 1';

const mockNavigate = jest.fn();
const mockLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation(),
  useSearchParams: () => [new URLSearchParams()],
}));

describe('ContactsListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.mockReturnValue({ state: {}, pathname: '/contacts' });
  });

  const renderPage = (state = mockState) => {
    const store = configureStore(state);
    return renderWithProvider(<ContactsListPage />, store);
  };

  it('renders the contacts page', () => {
    const { getByTestId } = renderPage();
    expect(getByTestId('contacts-page')).toBeInTheDocument();
  });

  it('renders header with "Contacts" title', () => {
    const { getByText } = renderPage();
    expect(getByText(messages.contacts.message)).toBeInTheDocument();
  });

  it('renders the contact list with existing contacts', () => {
    const { getByTestId } = renderPage();
    expect(getByTestId('contact-list-item')).toBeInTheDocument();
  });

  it('renders the add contact button when contacts exist', () => {
    const { getByTestId } = renderPage();
    expect(getByTestId('contacts-add-contact-button')).toBeInTheDocument();
  });

  it('navigates to view route with chainId and address when contact is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('contact-list-item'));
    expect(mockNavigate).toHaveBeenCalledWith(
      `${CONTACTS_VIEW_ROUTE}/${MOCK_CHAIN_ID}/${MOCK_ADDRESS}`,
    );
  });

  it('navigates to add contact route when add button is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('contacts-add-contact-button'));
    expect(mockNavigate).toHaveBeenCalledWith(CONTACTS_ADD_ROUTE);
  });

  it('renders empty state when no contacts exist', () => {
    const emptyState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        addressBook: {},
      },
    };
    const { queryByTestId } = renderPage(emptyState);
    expect(queryByTestId('contact-list-item')).not.toBeInTheDocument();
    expect(
      queryByTestId('contacts-add-contact-button'),
    ).not.toBeInTheDocument();
  });

  it('navigates to default route when back button is clicked', () => {
    const { getByTestId } = renderPage();
    fireEvent.click(getByTestId('contacts-back-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  describe('chain-aware navigation', () => {
    it('includes the correct chainId for contacts on different chains', () => {
      const multiChainState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          addressBook: {
            '0x1': {
              '0xabc0000000000000000000000000000000000001': {
                address: '0xabc0000000000000000000000000000000000001',
                chainId: '0x1',
                isEns: false,
                memo: '',
                name: 'Mainnet Contact',
              },
            },
            '0xaa36a7': {
              '0xdef0000000000000000000000000000000000002': {
                address: '0xdef0000000000000000000000000000000000002',
                chainId: '0xaa36a7',
                isEns: false,
                memo: '',
                name: 'Sepolia Contact',
              },
            },
          },
        },
      };

      const { getAllByTestId } = renderPage(multiChainState);
      const items = getAllByTestId('contact-list-item');
      expect(items).toHaveLength(2);

      fireEvent.click(items[0]);
      const firstCall = mockNavigate.mock.calls[0][0] as string;
      expect(firstCall).toMatch(/\/contacts\/view\/0x/u);

      mockNavigate.mockClear();
      fireEvent.click(items[1]);
      const secondCall = mockNavigate.mock.calls[0][0] as string;
      expect(secondCall).toMatch(/\/contacts\/view\/0x/u);

      expect(firstCall).not.toBe(secondCall);
    });
  });
});
