import { screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { THIRD_PARTY_APIS_ROUTE } from '../../../helpers/constants/routes';
import { ThirdPartyApisItem } from './third-party-apis-item';

const createMockStore = () => configureMockStore([thunk])(mockState);

describe('ThirdPartyApisItem', () => {
  it('renders title', () => {
    const mockStore = createMockStore();
    renderWithProvider(<ThirdPartyApisItem />, mockStore);

    expect(
      screen.getByText(messages.thirdPartyApis.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    const mockStore = createMockStore();
    renderWithProvider(<ThirdPartyApisItem />, mockStore);

    expect(
      screen.getByText(messages.thirdPartyApisDescription.message),
    ).toBeInTheDocument();
  });

  it('renders navigation link', () => {
    const mockStore = createMockStore();
    renderWithProvider(<ThirdPartyApisItem />, mockStore);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });

  it('links to third-party APIs route', () => {
    const mockStore = createMockStore();
    renderWithProvider(<ThirdPartyApisItem />, mockStore);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', THIRD_PARTY_APIS_ROUTE);
  });
});
