import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { THIRD_PARTY_APIS_ROUTE } from '../../../helpers/constants/routes';
import { ThirdPartyApisItem } from './third-party-apis-item';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const createMockStore = () => configureMockStore([thunk])(mockState);

describe('ThirdPartyApisItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('renders navigation button with correct aria-label', () => {
    const mockStore = createMockStore();
    renderWithProvider(<ThirdPartyApisItem />, mockStore);

    const button = screen.getByRole('button', {
      name: `${messages.select.message} ${messages.thirdPartyApis.message}`,
    });
    expect(button).toBeInTheDocument();
  });

  it('navigates to third-party APIs route when button is clicked', () => {
    const mockStore = createMockStore();
    renderWithProvider(<ThirdPartyApisItem />, mockStore);

    const button = screen.getByRole('button', {
      name: `${messages.select.message} ${messages.thirdPartyApis.message}`,
    });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(THIRD_PARTY_APIS_ROUTE);
  });
});
