import React from 'react';
import configureMockStore from 'redux-mock-store';
import 'jest-canvas-mock';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import mockState from '../../../test/data/mock-state.json';
import Settings from '.';

let mockRouterLocation = { pathname: '/settings', search: '' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockRouterLocation,
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
}));

jest.mock(
  '../../helpers/higher-order-components/with-router-hooks/with-router-hooks',
  () => {
    // eslint-disable-next-line react/display-name
    return (Component) => (props) => (
      <Component
        {...props}
        navigate={jest.fn()}
        location={mockRouterLocation}
        params={{}}
      />
    );
  },
);

describe('SettingsPage', () => {
  const props = {
    addNewNetwork: false,
    addressName: '',
    backRoute: '/',
    conversionDate: Date.now(),
    isAddressEntryPage: false,
    isPopup: false,
    isSnapViewPage: false,
    mostRecentOverviewPage: '/',
    pathnameI18nKey: '',
  };

  const mockStore = configureMockStore()(mockState);

  beforeEach(() => {
    mockRouterLocation = { pathname: '/settings', search: '' };
  });

  it('should render correctly', () => {
    const { queryByText } = renderWithProvider(
      <Settings {...props} />,
      mockStore,
      '/settings',
    );

    expect(queryByText(messages.settings.message)).toBeInTheDocument();
  });

  it('should render search correctly', () => {
    const { queryByPlaceholderText } = renderWithProvider(
      <Settings {...props} />,
      mockStore,
      '/settings',
    );

    expect(queryByPlaceholderText(messages.search.message)).toBeInTheDocument();
  });
});
