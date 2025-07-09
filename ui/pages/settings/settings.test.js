import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { ABOUT_US_ROUTE } from '../../helpers/constants/routes';
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

    expect(queryByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('should trigger support modal when click support link', async () => {
    const { queryByTestId } = renderWithProvider(
      <Settings {...props} />,
      mockStore,
      ABOUT_US_ROUTE,
    );

    const supportLink = queryByTestId('info-tab-support-center-button');
    expect(supportLink).toBeInTheDocument();
    fireEvent.click(supportLink);

    await waitFor(() =>
      expect(
        queryByTestId('visit-support-data-consent-modal'),
      ).toBeInTheDocument(),
    );
  });
});
