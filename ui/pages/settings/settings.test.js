import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import Settings from '.';
import 'jest-canvas-mock';

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

    expect(queryByPlaceholderText('Search in Settings')).toBeInTheDocument();
  });

  it('should not render the experimental tab if there will not be experimental settings', () => {
    process.env.NFTS_V1 = false;
    process.env.TRANSACTION_SECURITY_PROVIDER = false;

    const { getByText } = renderWithProvider(
      <Settings {...props} />,
      mockStore,
      '/settings',
    );

    expect(getByText('Experimental')).toHaveLength(0);
  });

  it('should render the experimental tab if there will be experimental settings', () => {
    process.env.NFTS_V1 = true;
    process.env.TRANSACTION_SECURITY_PROVIDER = true;

    const { getByText } = renderWithProvider(
      <Settings {...props} />,
      mockStore,
      '/settings',
    );

    expect(getByText('Experimental')).toHaveLength(1);
  });
});
