import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  FEEDBACK_CONFIG,
  SUPPORT_CONFIG,
} from '../../../../../shared/constants/perps';
import { PERPS_ROUTE } from '../../../../helpers/constants/routes';
import { PerpsSupportLearn } from './perps-support-learn';

const mockTrackEvent = jest.fn();

jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

describe('PerpsSupportLearn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error test platform
    globalThis.platform = {
      openTab: jest.fn(),
      closeCurrentWindow: jest.fn(),
    };
  });

  it('opens the support URL and tracks analytics when Contact support is clicked on the Perps tab', () => {
    const store = configureStore(mockState);
    renderWithProvider(<PerpsSupportLearn />, store, PERPS_ROUTE);

    fireEvent.click(screen.getByTestId('perps-contact-support'));

    // Legacy MetaMetrics used PageTitle, which overwrote the hardcoded
    // `perps_support_learn` location with PATH_NAME_MAP title for /perps.
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Settings,
          url: SUPPORT_CONFIG.Url,
          location: 'Perps Tab',
        }),
      }),
    );
    expect(globalThis.platform.openTab).toHaveBeenCalledWith({
      url: SUPPORT_CONFIG.Url,
    });
  });

  it('opens the feedback survey and tracks analytics when Give feedback is clicked on the Perps tab', () => {
    const store = configureStore(mockState);
    renderWithProvider(<PerpsSupportLearn />, store, PERPS_ROUTE);

    fireEvent.click(screen.getByTestId('perps-give-feedback'));

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ExternalLinkClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Feedback,
          url: FEEDBACK_CONFIG.Url,
          location: 'Perps Tab',
          text: 'perps_feedback_survey',
        }),
      }),
    );
    expect(globalThis.platform.openTab).toHaveBeenCalledWith({
      url: FEEDBACK_CONFIG.Url,
    });
  });
});
