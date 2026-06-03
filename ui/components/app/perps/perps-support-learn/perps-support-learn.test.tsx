import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  FEEDBACK_CONFIG,
  SUPPORT_CONFIG,
} from '../../../../../shared/constants/perps';
import { PerpsSupportLearn } from './perps-support-learn';

const mockTrackEvent = jest.fn();
const mockMetaMetricsContext = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn(),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};

describe('PerpsSupportLearn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error test platform
    globalThis.platform = {
      openTab: jest.fn(),
      closeCurrentWindow: jest.fn(),
    };
  });

  it('opens the support URL and tracks MetaMetrics when Contact support is clicked', () => {
    const store = configureStore(mockState);
    renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <PerpsSupportLearn />
      </MetaMetricsContext.Provider>,
      store,
    );

    fireEvent.click(screen.getByTestId('perps-contact-support'));

    expect(mockTrackEvent).toHaveBeenCalledWith(
      {
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_CONFIG.Url,
          location: 'perps_support_learn',
        },
      },
      expect.objectContaining({
        contextPropsIntoEventProperties: expect.any(Array),
      }),
    );
    expect(globalThis.platform.openTab).toHaveBeenCalledWith({
      url: SUPPORT_CONFIG.Url,
    });
  });

  it('opens the feedback survey and tracks MetaMetrics when Give feedback is clicked', () => {
    const store = configureStore(mockState);
    renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <PerpsSupportLearn />
      </MetaMetricsContext.Provider>,
      store,
    );

    fireEvent.click(screen.getByTestId('perps-give-feedback'));

    expect(mockTrackEvent).toHaveBeenCalledWith(
      {
        category: MetaMetricsEventCategory.Feedback,
        event: MetaMetricsEventName.ExternalLinkClicked,
        properties: {
          url: FEEDBACK_CONFIG.Url,
          location: 'perps_support_learn',
          text: 'perps_feedback_survey',
        },
      },
      expect.objectContaining({
        contextPropsIntoEventProperties: expect.any(Array),
      }),
    );
    expect(globalThis.platform.openTab).toHaveBeenCalledWith({
      url: FEEDBACK_CONFIG.Url,
    });
  });
});
