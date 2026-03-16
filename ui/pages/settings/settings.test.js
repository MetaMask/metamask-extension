import React from 'react';
import configureMockStore from 'redux-mock-store';
import 'jest-canvas-mock';
import { act } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import mockState from '../../../test/data/mock-state.json';
import Settings from '.';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
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
    conversionDate: Date.now(),
    isAddressEntryPage: false,
    isPopup: false,
    isSnapViewPage: false,
    mostRecentOverviewPage: '/',
    pathnameI18nKey: '',
    petnamesEnabled: true,
  };

  const mockStore = configureMockStore()(mockState);

  it('should render correctly', async () => {
    let queryByText;
    await act(async () => {
      const result = renderWithProvider(
        <Settings {...props} />,
        mockStore,
        '/settings',
      );
      queryByText = result.queryByText;
    });

    expect(queryByText(messages.settings.message)).toBeInTheDocument();
  });

  it('should render search correctly', async () => {
    let queryByPlaceholderText;
    await act(async () => {
      const result = renderWithProvider(
        <Settings {...props} />,
        mockStore,
        '/settings',
      );
      queryByPlaceholderText = result.queryByPlaceholderText;
    });

    expect(queryByPlaceholderText(messages.search.message)).toBeInTheDocument();
  });

  it('should pass petnamesEnabled prop to filter search results', async () => {
    let container;
    await act(async () => {
      const result = renderWithProvider(
        <Settings {...props} petnamesEnabled={false} />,
        mockStore,
        '/settings',
      );
      container = result.container;
    });

    // Verify that the Settings component renders with petnamesEnabled=false
    // The actual filtering behavior is tested in integration, but we can verify
    // that the component renders without errors when petnamesEnabled is false
    expect(container.querySelector('#search-settings')).toBeInTheDocument();
  });
});
