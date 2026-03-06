import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { AutodetectTokensToggleItem } from './autodetect-tokens-item';

const mockSetUseTokenDetection = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setUseTokenDetection: (val: boolean) => {
    mockSetUseTokenDetection(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('AutodetectTokensToggleItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<AutodetectTokensToggleItem />, mockStore);

    expect(
      screen.getByText(messages.autoDetectTokens.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    renderWithProvider(<AutodetectTokensToggleItem />, mockStore);

    expect(
      screen.getByText(messages.autoDetectTokensDescriptionV2.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, useTokenDetection: true },
    });
    renderWithProvider(<AutodetectTokensToggleItem />, storeEnabled);

    expect(screen.getByTestId('autodetect-tokens')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('renders toggle in disabled state', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, useTokenDetection: false },
    });
    renderWithProvider(<AutodetectTokensToggleItem />, storeDisabled);

    expect(screen.getByTestId('autodetect-tokens')).toHaveAttribute(
      'value',
      'false',
    );
  });

  it('calls action with false when toggled off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, useTokenDetection: true },
    });
    renderWithProvider(<AutodetectTokensToggleItem />, storeEnabled);

    fireEvent.click(screen.getByTestId('autodetect-tokens'));

    expect(mockSetUseTokenDetection).toHaveBeenCalledWith(false);
  });

  it('calls action with true when toggled on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, useTokenDetection: false },
    });
    renderWithProvider(<AutodetectTokensToggleItem />, storeDisabled);

    fireEvent.click(screen.getByTestId('autodetect-tokens'));

    expect(mockSetUseTokenDetection).toHaveBeenCalledWith(true);
  });
});
