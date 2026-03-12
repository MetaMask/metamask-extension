import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { AutodetectNftsToggleItem } from './autodetect-nfts-item';

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

describe('AutodetectNftsToggleItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<AutodetectNftsToggleItem />, mockStore);

    expect(
      screen.getByText(messages.useNftDetection.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    renderWithProvider(<AutodetectNftsToggleItem />, mockStore);

    expect(
      screen.getByText(messages.useNftDetectionDescription.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, useNftDetection: true },
    });
    renderWithProvider(<AutodetectNftsToggleItem />, storeEnabled);

    expect(screen.getByTestId('use-nft-detection')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('renders toggle in disabled state', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, useNftDetection: false },
    });
    renderWithProvider(<AutodetectNftsToggleItem />, storeDisabled);

    expect(screen.getByTestId('use-nft-detection')).toHaveAttribute(
      'value',
      'false',
    );
  });

  it('calls action with false when toggled off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, useNftDetection: true },
    });
    renderWithProvider(<AutodetectNftsToggleItem />, storeEnabled);

    fireEvent.click(screen.getByTestId('use-nft-detection'));

    expect(mockSetUseNftDetection).toHaveBeenCalledWith(false);
  });

  it('calls action with true when toggled on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, useNftDetection: false },
    });
    renderWithProvider(<AutodetectNftsToggleItem />, storeDisabled);

    fireEvent.click(screen.getByTestId('use-nft-detection'));

    expect(mockSetUseNftDetection).toHaveBeenCalledWith(true);
  });

  it('enables OpenSea when enabling detection while OpenSea is disabled', () => {
    const storeWithBothDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        openSeaEnabled: false,
        useNftDetection: false,
      },
    });
    renderWithProvider(<AutodetectNftsToggleItem />, storeWithBothDisabled);

    fireEvent.click(screen.getByTestId('use-nft-detection'));

    expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(true);
    expect(mockSetUseNftDetection).toHaveBeenCalledWith(true);
  });

  it('does not enable OpenSea when enabling detection while OpenSea is already enabled', () => {
    const storeWithOpenSeaEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        openSeaEnabled: true,
        useNftDetection: false,
      },
    });
    renderWithProvider(<AutodetectNftsToggleItem />, storeWithOpenSeaEnabled);

    fireEvent.click(screen.getByTestId('use-nft-detection'));

    expect(mockSetOpenSeaEnabled).not.toHaveBeenCalled();
    expect(mockSetUseNftDetection).toHaveBeenCalledWith(true);
  });
});
