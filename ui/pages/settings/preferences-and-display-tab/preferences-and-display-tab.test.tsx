import React from 'react';
import { act } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import PreferencesAndDisplayTab from './preferences-and-display-tab';

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

const buildStore = (cashtagInjection?: boolean) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        ...(cashtagInjection === undefined ? {} : { cashtagInjection }),
      },
    },
  });

describe('PreferencesAndDisplayTab', () => {
  const mockStore = buildStore();

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  describe('snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProvider(
        <PreferencesAndDisplayTab />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('show web widget on X setting', () => {
    it('hides the setting when the cashtagInjection feature flag is off', async () => {
      let view!: ReturnType<typeof renderWithProvider>;
      await act(async () => {
        view = renderWithProvider(
          <PreferencesAndDisplayTab />,
          buildStore(false),
        );
      });

      expect(view.queryByTestId('show-ticker-widget')).not.toBeInTheDocument();
    });

    it('shows the setting when the cashtagInjection feature flag is on', async () => {
      let view!: ReturnType<typeof renderWithProvider>;
      await act(async () => {
        view = renderWithProvider(
          <PreferencesAndDisplayTab />,
          buildStore(true),
        );
      });

      expect(view.getByTestId('show-ticker-widget')).toBeInTheDocument();
    });
  });
});
