import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Store } from 'redux';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import ViewContactContainer from './view-contact.container';
import { CONTACT_VIEW_ROUTE } from '../../../../helpers/constants/routes';

const TEST_IDS = {
  NAME: 'address-book-name',
  ADDRESS: 'address-book-view-contact-address',
};

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
const mockUseParams = jest.fn();

// Same as addressBook from mockState
const MOCK_ADDRESS = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const MOCK_ADDRESS_NAME = 'Address Book Account 1';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => mockUseLocation(),
  useParams: () => mockUseParams(),
}));

interface MockState {
  [key: string]: unknown;
}

describe('View Contact Container', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: `${CONTACT_VIEW_ROUTE}/${MOCK_ADDRESS}`,
      search: '',
      hash: '',
      state: null,
    });
    mockUseParams.mockReturnValue({});
  });

  const mockStore: Store = configureMockStore([thunk])(mockState as MockState);

  describe('Address extraction scenarios', () => {
    it('should extract address from pathname when pathname tail contains 0x', () => {
      // Mock location with address in pathname
      mockUseLocation.mockReturnValue({
        pathname: `${CONTACT_VIEW_ROUTE}/${MOCK_ADDRESS}`,
        search: '',
        hash: '',
        state: null,
      });
      mockUseParams.mockReturnValue({});

      const { getByTestId } = renderWithProvider(
        <ViewContactContainer />,
        mockStore,
      );

      // Should extract address from pathname and display it
      expect(getByTestId(TEST_IDS.NAME)).toHaveTextContent(MOCK_ADDRESS_NAME);
      // Case-insensitive since address may be checksummed
      expect(
        getByTestId(TEST_IDS.ADDRESS).textContent?.toLowerCase(),
      ).toContain(MOCK_ADDRESS.toLowerCase());
    });

    it('should use params.id when pathname tail does not contain 0x', () => {
      // Mock location with non-address pathname and address in params
      mockUseLocation.mockReturnValue({
        pathname: '/settings/contacts/view/contact-name',
        search: '',
        hash: '',
        state: null,
      });
      mockUseParams.mockReturnValue({
        id: MOCK_ADDRESS,
      });

      const { getByTestId } = renderWithProvider(
        <ViewContactContainer />,
        mockStore,
      );

      // Should use address from params.id
      expect(getByTestId(TEST_IDS.NAME)).toHaveTextContent(MOCK_ADDRESS_NAME);
      // Case-insensitive since address may be checksummed
      expect(
        getByTestId(TEST_IDS.ADDRESS).textContent?.toLowerCase(),
      ).toContain(MOCK_ADDRESS.toLowerCase());
    });

    it('should lowercase address when extracted from pathname', () => {
      const upperCaseAddress = '0xC42EDFCC21ED14DDA456AA0756C153F7985D8813';

      // Mock location with uppercase address in pathname
      mockUseLocation.mockReturnValue({
        pathname: `/settings/contacts/view/${upperCaseAddress}`,
        search: '',
        hash: '',
        state: null,
      });
      mockUseParams.mockReturnValue({});

      const { getByTestId } = renderWithProvider(
        <ViewContactContainer />,
        mockStore,
      );

      // Should display the contact found with the lowercase address
      expect(getByTestId(TEST_IDS.NAME)).toHaveTextContent(MOCK_ADDRESS_NAME);
      // Case-insensitive check since the displayed address may be checksummed
      expect(
        getByTestId(TEST_IDS.ADDRESS).textContent?.toLowerCase(),
      ).toContain(MOCK_ADDRESS.toLowerCase());
    });
  });
});
