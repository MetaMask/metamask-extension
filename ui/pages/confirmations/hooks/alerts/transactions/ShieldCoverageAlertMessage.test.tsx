import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import {
  ShieldCtaActionClickedEnum,
  ShieldMetricsSourceEnum,
} from '../../../../../../shared/constants/subscriptions';
import { ShieldCoverageAlertMessage } from './ShieldCoverageAlertMessage';

const mockCaptureShieldCtaClickedEvent = jest.fn();

jest.mock('../../../../../hooks/shield/metrics/useSubscriptionMetrics', () => ({
  useSubscriptionMetrics: () => ({
    captureShieldCtaClickedEvent: mockCaptureShieldCtaClickedEvent,
  }),
}));

describe('ShieldCoverageAlertMessage', () => {
  beforeEach(() => {
    mockCaptureShieldCtaClickedEvent.mockClear();
  });

  it('tracks when the user clicks the coverage information link', () => {
    const { getByRole } = renderWithProvider(
      <ShieldCoverageAlertMessage modalBodyStr="shieldCoverageAlertMessageChainNotSupported" />,
      configureStore(mockState),
      '/',
    );

    fireEvent.click(getByRole('link', { name: "See what's covered" }));

    expect(mockCaptureShieldCtaClickedEvent).toHaveBeenCalledWith({
      source: ShieldMetricsSourceEnum.PostTransaction,
      ctaActionClicked: ShieldCtaActionClickedEnum.WhatsCovered,
      redirectToUrl: 'https://metamask.io/transaction-shield',
    });
  });
});
