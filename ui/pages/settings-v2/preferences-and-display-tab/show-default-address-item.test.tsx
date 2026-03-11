import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { ShowDefaultAddressItem } from './show-default-address-item';

const mockSetShowDefaultAddress = jest.fn();
const mockSetDefaultAddressScope = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setShowDefaultAddress: (val: boolean) => {
    mockSetShowDefaultAddress(val);
    return { type: 'MOCK_ACTION' };
  },
  setDefaultAddressScope: (val: string) => {
    mockSetDefaultAddressScope(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

const createMockStore = (overrides = {}) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        extensionUxDefaultAddress: true,
      },
      preferences: {
        ...mockState.metamask.preferences,
        showDefaultAddress: false,
        defaultAddressScope: 'all',
      },
      ...overrides,
    },
  });

describe('ShowDefaultAddressItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders null when feature is disabled', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        remoteFeatureFlags: {
          ...mockState.metamask.remoteFeatureFlags,
          extensionUxDefaultAddress: false,
        },
      },
    });
    const { container } = renderWithProvider(
      <ShowDefaultAddressItem />,
      storeDisabled,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders title when feature is enabled', () => {
    const mockStore = createMockStore();
    renderWithProvider(<ShowDefaultAddressItem />, mockStore);

    expect(
      screen.getByText(messages.showDefaultAddress.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    const mockStore = createMockStore();
    renderWithProvider(<ShowDefaultAddressItem />, mockStore);

    expect(
      screen.getByText(messages.showDefaultAddressDescription.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const mockStore = createMockStore({
      preferences: {
        ...mockState.metamask.preferences,
        showDefaultAddress: true,
        defaultAddressScope: 'all',
      },
    });
    renderWithProvider(<ShowDefaultAddressItem />, mockStore);

    expect(screen.getByTestId('show-default-address-toggle')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('renders toggle in disabled state', () => {
    const mockStore = createMockStore({
      preferences: {
        ...mockState.metamask.preferences,
        showDefaultAddress: false,
        defaultAddressScope: 'all',
      },
    });
    renderWithProvider(<ShowDefaultAddressItem />, mockStore);

    expect(screen.getByTestId('show-default-address-toggle')).toHaveAttribute(
      'value',
      'false',
    );
  });

  it('calls setShowDefaultAddress with false when toggled off', () => {
    const mockStore = createMockStore({
      preferences: {
        ...mockState.metamask.preferences,
        showDefaultAddress: true,
        defaultAddressScope: 'all',
      },
    });
    renderWithProvider(<ShowDefaultAddressItem />, mockStore);

    fireEvent.click(screen.getByTestId('show-default-address-toggle'));

    expect(mockSetShowDefaultAddress).toHaveBeenCalledWith(false);
  });

  it('calls setShowDefaultAddress with true when toggled on', () => {
    const mockStore = createMockStore({
      preferences: {
        ...mockState.metamask.preferences,
        showDefaultAddress: false,
        defaultAddressScope: 'all',
      },
    });
    renderWithProvider(<ShowDefaultAddressItem />, mockStore);

    fireEvent.click(screen.getByTestId('show-default-address-toggle'));

    expect(mockSetShowDefaultAddress).toHaveBeenCalledWith(true);
  });

  it('renders dropdown', () => {
    const mockStore = createMockStore();
    renderWithProvider(<ShowDefaultAddressItem />, mockStore);

    expect(
      screen.getByTestId('default-address-scope-dropdown'),
    ).toBeInTheDocument();
  });
});
