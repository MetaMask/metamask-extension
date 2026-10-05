import React from 'react';
import { screen } from '@testing-library/react';
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

  it('points the FAQ link at the Perps help center', () => {
    renderBanner(true);

    const faqLink = screen.getByTestId(
      'perps-service-interruption-banner-faq-link',
    );

    expect(faqLink).toHaveAttribute('href', SERVICE_INTERRUPTION_CONFIG.FaqUrl);
    expect(faqLink).toHaveAttribute('target', '_blank');
    expect(faqLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('points the support link at MetaMask support', () => {
    renderBanner(true);

    const supportLink = screen.getByTestId(
      'perps-service-interruption-banner-support-link',
    );

    expect(supportLink).toHaveAttribute('href', SUPPORT_CONFIG.Url);
    expect(supportLink).toHaveAttribute('target', '_blank');
    expect(supportLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
