/**
 * @jest-environment jsdom
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import PasswordOutdatedModal from './password-outdated-modal';

const mockStore = configureMockStore([thunk]);

describe('PasswordOutdatedModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks PasswordOutdatedModalViewed on mount when the password is outdated', async () => {
    const store = mockStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        passwordOutdatedCache: {
          isExpiredPwd: true,
        },
      },
    });
    const mockTrackEvent = jest.fn();
    const mockMetaMetricsContext = {
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    };

    renderWithProvider(
      <MetaMetricsContext.Provider
        value={mockMetaMetricsContext as typeof mockMetaMetricsContext}
      >
        <PasswordOutdatedModal />
      </MetaMetricsContext.Provider>,
      store,
    );

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.PasswordOutdatedModalViewed,
        category: MetaMetricsEventCategory.App,
      });
    });
  });

  it('does not track PasswordOutdatedModalViewed on mount when the password is not outdated', async () => {
    const store = mockStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        passwordOutdatedCache: {
          isExpiredPwd: false,
        },
      },
    });
    const mockTrackEvent = jest.fn();
    const mockMetaMetricsContext = {
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    };

    renderWithProvider(
      <MetaMetricsContext.Provider
        value={mockMetaMetricsContext as typeof mockMetaMetricsContext}
      >
        <PasswordOutdatedModal />
      </MetaMetricsContext.Provider>,
      store,
    );

    await waitFor(() => {
      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });
});
