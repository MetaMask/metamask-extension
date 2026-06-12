import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { CONSENSYS_PRIVACY_LINK } from '../../../../shared/lib/ui-utils';
import { BasicFunctionalityToggleItem } from './basic-functionality-item';

const mockToggleExternalServices = jest.fn();
const mockOpenBasicFunctionalityModal = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  toggleExternalServices: (val: boolean) => {
    mockToggleExternalServices(val);
    return { type: 'MOCK_ACTION' };
  },
}));

jest.mock('../../../ducks/app/app', () => ({
  ...jest.requireActual('../../../ducks/app/app'),
  openBasicFunctionalityModal: () => {
    mockOpenBasicFunctionalityModal();
    return { type: 'MOCK_OPEN_MODAL' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('BasicFunctionalityToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    renderWithProvider(<BasicFunctionalityToggleItem />, mockStore);

    expect(
      screen.getByText(messages.basicConfigurationLabel.message),
    ).toBeInTheDocument();
  });

  it('renders description with privacy link', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    renderWithProvider(<BasicFunctionalityToggleItem />, mockStore);

    const link = screen.getByRole('link', {
      name: messages.privacyMsg.message,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', CONSENSYS_PRIVACY_LINK);
  });

  it('renders toggle in enabled state when useExternalServices is true', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useExternalServices: true,
      },
    });
    renderWithProvider(<BasicFunctionalityToggleItem />, storeEnabled);

    expect(screen.getByTestId('basic-functionality-toggle')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('renders toggle in disabled state when useExternalServices is false', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useExternalServices: false,
      },
    });
    renderWithProvider(<BasicFunctionalityToggleItem />, storeDisabled);

    expect(screen.getByTestId('basic-functionality-toggle')).toHaveAttribute(
      'value',
      'false',
    );
  });

  it('opens modal when toggling off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useExternalServices: true,
      },
    });
    renderWithProvider(<BasicFunctionalityToggleItem />, storeEnabled);

    fireEvent.click(screen.getByTestId('basic-functionality-toggle'));

    expect(mockOpenBasicFunctionalityModal).toHaveBeenCalled();
    expect(mockToggleExternalServices).not.toHaveBeenCalled();
  });

  it('calls toggleExternalServices when toggling on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useExternalServices: false,
      },
    });
    renderWithProvider(<BasicFunctionalityToggleItem />, storeDisabled);

    fireEvent.click(screen.getByTestId('basic-functionality-toggle'));

    expect(mockToggleExternalServices).toHaveBeenCalledWith(true);
    expect(mockOpenBasicFunctionalityModal).not.toHaveBeenCalled();
  });
});
