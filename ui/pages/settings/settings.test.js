import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import Settings from '.';
import 'jest-canvas-mock';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/settings' }),
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
        location={{ pathname: '/settings' }}
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
    breadCrumbTextKey: '',
    conversionDate: Date.now(),
    initialBreadCrumbKey: '',
    initialBreadCrumbRoute: '',
    isAddressEntryPage: false,
    isPopup: false,
    isSnapViewPage: false,
    mostRecentOverviewPage: '/',
    pathnameI18nKey: '',
  };

  const mockStore = configureMockStore()(mockState);

  it('should render correctly', () => {
    const { queryByText } = renderWithProvider(
      <Settings {...props} />,
      mockStore,
      '/settings',
    );

    expect(queryByText('Settings')).toBeInTheDocument();
  });

  it('should render search correctly', () => {
    const { queryByPlaceholderText } = renderWithProvider(
      <Settings {...props} />,
      mockStore,
      '/settings',
    );

    expect(queryByPlaceholderText('Search')).toBeInTheDocument();
  });
});
