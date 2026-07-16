/**
 * @jest-environment jsdom
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import PasswordOutdatedModal from './password-outdated-modal';

const mockStore = configureMockStore([thunk]);

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

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

    renderWithProvider(<PasswordOutdatedModal />, store);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.PasswordOutdatedModalViewed,
        properties: {
          category: MetaMetricsEventCategory.App,
        },
        sensitiveProperties: {},
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

    renderWithProvider(<PasswordOutdatedModal />, store);

    await waitFor(() => {
      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });
});
