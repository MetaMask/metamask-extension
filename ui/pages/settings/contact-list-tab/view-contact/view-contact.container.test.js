import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import ViewContactContainer from './view-contact.container';

const mockUseNavigate = jest.fn();
// Same as addressBook from mockState
const MOCK_ADDRESS = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const MOCK_ADDRESS_NAME = 'Address Book Account 1';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => ({
    pathname: `/settings/contact-list/view-contact/${MOCK_ADDRESS}`,
  }),
  useParams: () => ({}),
}));

describe('View Contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockStore = configureMockStore([thunk])(mockState);

  it('should render contact information correctly', () => {
    const { getByTestId } = renderWithProvider(
      <ViewContactContainer />,
      mockStore,
    );
    expect(getByTestId('address-book-name')).toHaveTextContent(
      MOCK_ADDRESS_NAME,
    );
    // Case-insensitive since it's checksummed
    expect(
      getByTestId(
        'address-book-view-contact-address',
      ).textContent.toLowerCase(),
    ).toContain(MOCK_ADDRESS.toLowerCase());
  });
});
