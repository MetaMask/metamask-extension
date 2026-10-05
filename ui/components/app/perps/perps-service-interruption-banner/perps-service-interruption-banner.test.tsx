import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import {
  SERVICE_INTERRUPTION_CONFIG,
  SUPPORT_CONFIG,
} from '../../../../../shared/constants/perps';
import { PerpsServiceInterruptionBanner } from './perps-service-interruption-banner';

const renderBanner = (enabled: boolean) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        perpsPerpTradingServiceInterruptionBannerEnabled: enabled,
      },
    },
  });

  return renderWithProvider(<PerpsServiceInterruptionBanner />, store);
};

describe('PerpsServiceInterruptionBanner', () => {
  beforeEach(() => {
    // @ts-expect-error test platform
    globalThis.platform = {
      openTab: jest.fn(),
      closeCurrentWindow: jest.fn(),
    };
  });

  it('renders nothing when the outage flag is off', () => {
    renderBanner(false);

    expect(
      screen.queryByTestId('perps-service-interruption-banner'),
    ).not.toBeInTheDocument();
  });

  it('renders the outage title and FAQ and support links when the flag is on', () => {
    renderBanner(true);

    expect(
      screen.getByText(messages.perpsServiceInterruptionTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-service-interruption-banner-faq-link'),
    ).toHaveTextContent(messages.perpsServiceInterruptionFaqLink.message);
    expect(
      screen.getByTestId('perps-service-interruption-banner-support-link'),
    ).toHaveTextContent(
      messages.perpsServiceInterruptionContactSupport.message,
    );
  });

  it('opens the Perps FAQ when the FAQ link is clicked', () => {
    renderBanner(true);

    fireEvent.click(
      screen.getByTestId('perps-service-interruption-banner-faq-link'),
    );

    expect(globalThis.platform.openTab).toHaveBeenCalledWith({
      url: SERVICE_INTERRUPTION_CONFIG.FaqUrl,
    });
  });

  it('opens support when the support link is clicked', () => {
    renderBanner(true);

    fireEvent.click(
      screen.getByTestId('perps-service-interruption-banner-support-link'),
    );

    expect(globalThis.platform.openTab).toHaveBeenCalledWith({
      url: SUPPORT_CONFIG.Url,
    });
  });
});
