import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Store } from 'redux';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import EditContactContainer from './edit-contact.container';
import {CONTACT_EDIT_ROUTE} from "../../../../helpers/constants/routes";

const TEST_IDS = {
  NAME: 'address-book-edit-contact-name',
  ADDRESS: 'address-book-edit-contact-address',
  NETWORK: 'address-book-edit-contact-network',
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

describe('Edit Contact Container', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default mock values for router
    mockUseLocation.mockReturnValue({
      pathname: `${CONTACT_EDIT_ROUTE}/${MOCK_ADDRESS}`,
      search: '',
      hash: '',
      state: null,
    });
    mockUseParams.mockReturnValue({});
  });

  const mockStore: Store = configureMockStore([thunk])(mockState as MockState);

  describe('Address extraction scenarios', () => {
    it('should extract address from pathname with provided address', () => {
      mockUseLocation.mockReturnValue({
        pathname: `${CONTACT_EDIT_ROUTE}/${MOCK_ADDRESS}`,
        search: '',
        hash: '',
        state: null,
      });
      mockUseParams.mockReturnValue({});

      const { getByTestId } = renderWithProvider(
        <EditContactContainer />,
        mockStore,
      );

      expect((getByTestId(TEST_IDS.NAME) as HTMLInputElement).value).toStrictEqual(
        MOCK_ADDRESS_NAME,
      );
      expect(
        (getByTestId(TEST_IDS.ADDRESS) as HTMLInputElement).value,
      ).toStrictEqual(MOCK_ADDRESS);
      expect(getByTestId(TEST_IDS.NETWORK)).toHaveTextContent(
        'Goerli',
      );
    });

    it('should use params.id when pathname does not contain address', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/settings/contacts/edit/contact-name',
        search: '',
        hash: '',
        state: null,
      });
      mockUseParams.mockReturnValue({
        id: MOCK_ADDRESS,
      });

      const { getByTestId } = renderWithProvider(
        <EditContactContainer />,
        mockStore,
      );

      expect((getByTestId(TEST_IDS.NAME) as HTMLInputElement).value).toStrictEqual(
        MOCK_ADDRESS_NAME,
      );
      expect(
        (getByTestId(TEST_IDS.ADDRESS) as HTMLInputElement).value,
      ).toStrictEqual(MOCK_ADDRESS);
      expect(getByTestId(TEST_IDS.NETWORK)).toHaveTextContent(
        'Goerli',
      );
    });

    it('should lowercase address when extracted from pathname', () => {
      const upperCaseAddress = '0xC42EDFCC21ED14DDA456AA0756C153F7985D8813';

      // Mock location with uppercase address in pathname
      mockUseLocation.mockReturnValue({
        pathname: `/settings/contacts/edit/${upperCaseAddress}`,
        search: '',
        hash: '',
        state: null,
      });
      mockUseParams.mockReturnValue({});

      const { getByTestId } = renderWithProvider(
        <EditContactContainer />,
        mockStore,
      );

      expect(
        (getByTestId(TEST_IDS.ADDRESS) as HTMLInputElement).value,
      ).toStrictEqual(upperCaseAddress.toLowerCase());
    });
  });
});
