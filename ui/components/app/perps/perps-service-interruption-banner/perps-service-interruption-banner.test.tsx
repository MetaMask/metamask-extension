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

jest.mock('../../modals/visit-support-data-consent-modal', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    supportLink,
  }: {
    isOpen: boolean;
    onClose: () => void;
    supportLink?: string;
  }) =>
    isOpen ? (
      <button
        type="button"
        data-testid="visit-support-data-consent-modal"
        data-support-link={supportLink}
        onClick={onClose}
      />
    ) : null,
}));

const renderBanner = (
  enabled: boolean,
  onSupportConsentOpenChange?: (isOpen: boolean) => void,
) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        perpsPerpTradingServiceInterruptionBannerEnabled: enabled,
      },
    },
  });

  return renderWithProvider(
    <PerpsServiceInterruptionBanner
      onSupportConsentOpenChange={onSupportConsentOpenChange}
    />,
    store,
  );
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

  it('points the FAQ link at the Perps troubleshoot article', () => {
    renderBanner(true);

    const faqLink = screen.getByTestId(
      'perps-service-interruption-banner-faq-link',
    );

    expect(faqLink).toHaveAttribute(
      'href',
      'https://support.metamask.io/trade/perps/troubleshoot/?utm_source=extension',
    );
    expect(faqLink).toHaveAttribute('href', SERVICE_INTERRUPTION_CONFIG.FaqUrl);
    expect(faqLink).toHaveAttribute('target', '_blank');
    expect(faqLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('opens the support consent modal for the MetaMask help center', () => {
    renderBanner(true);

    expect(
      screen.queryByTestId('visit-support-data-consent-modal'),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('perps-service-interruption-banner-support-link'),
    );

    const modal = screen.getByTestId('visit-support-data-consent-modal');

    expect(modal).toHaveAttribute(
      'data-support-link',
      'https://support.metamask.io/?utm_source=extension',
    );
    expect(modal).toHaveAttribute(
      'data-support-link',
      SERVICE_INTERRUPTION_CONFIG.SupportUrl,
    );
    expect(SERVICE_INTERRUPTION_CONFIG.SupportUrl).toBe(SUPPORT_CONFIG.Url);

    fireEvent.click(modal);

    expect(
      screen.queryByTestId('visit-support-data-consent-modal'),
    ).not.toBeInTheDocument();
  });

  it('notifies the host when the support consent modal opens and closes', () => {
    const onSupportConsentOpenChange = jest.fn();
    renderBanner(true, onSupportConsentOpenChange);

    expect(onSupportConsentOpenChange).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByTestId('perps-service-interruption-banner-support-link'),
    );

    expect(onSupportConsentOpenChange).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByTestId('visit-support-data-consent-modal'));

    expect(onSupportConsentOpenChange).toHaveBeenLastCalledWith(false);
  });
});
