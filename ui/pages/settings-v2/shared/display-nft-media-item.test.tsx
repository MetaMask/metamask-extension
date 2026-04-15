import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { DisplayNftMediaToggleItem } from './display-nft-media-item';

const mockSetOpenSeaEnabled = jest.fn();
const mockSetUseNftDetection = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setOpenSeaEnabled: (val: boolean) => {
    mockSetOpenSeaEnabled(val);
    return { type: 'MOCK_ACTION' };
  },
  setUseNftDetection: (val: boolean) => {
    mockSetUseNftDetection(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('DisplayNftMediaToggleItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<DisplayNftMediaToggleItem />, mockStore);

    expect(
      screen.getByText(messages.displayNftMedia.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    renderWithProvider(<DisplayNftMediaToggleItem />, mockStore);

    expect(
      screen.getByText(messages.displayNftMediaDescriptionV2.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, openSeaEnabled: true },
    });
    renderWithProvider(<DisplayNftMediaToggleItem />, storeEnabled);

    expect(screen.getByTestId('display-nft-media')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('renders toggle in disabled state', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, openSeaEnabled: false },
    });
    renderWithProvider(<DisplayNftMediaToggleItem />, storeDisabled);

    expect(screen.getByTestId('display-nft-media')).toHaveAttribute(
      'value',
      'false',
    );
  });

  it('calls action with false when toggled off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, openSeaEnabled: true },
    });
    renderWithProvider(<DisplayNftMediaToggleItem />, storeEnabled);

    fireEvent.click(screen.getByTestId('display-nft-media'));

    expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(false);
  });

  it('calls action with true when toggled on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, openSeaEnabled: false },
    });
    renderWithProvider(<DisplayNftMediaToggleItem />, storeDisabled);

    fireEvent.click(screen.getByTestId('display-nft-media'));

    expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(true);
  });

  it('disables NFT detection when disabling display while detection is on', () => {
    const storeWithBothEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        openSeaEnabled: true,
        useNftDetection: true,
      },
    });
    renderWithProvider(<DisplayNftMediaToggleItem />, storeWithBothEnabled);

    fireEvent.click(screen.getByTestId('display-nft-media'));

    expect(mockSetUseNftDetection).toHaveBeenCalledWith(false);
    expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(false);
  });
});
