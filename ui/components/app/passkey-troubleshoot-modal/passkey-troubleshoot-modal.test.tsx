import React from 'react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import type { MetaMetricsContextValue } from '../../../contexts/metametrics';
import PasskeyTroubleshootModal from './passkey-troubleshoot-modal';

// The passkeys support article href is asserted as a hardcoded literal so this
// test fails if ZENDESK_URLS.PASSKEYS is reverted to the broken (404ing) value.
const EXPECTED_PASSKEYS_SUPPORT_URL =
  'https://support.metamask.io/configure/wallet/passkeys-and-metamask/?utm_source=extension';

function renderModal() {
  const trackEvent = jest.fn();
  const metaMetricsContextValue = {
    trackEvent,
    bufferedTrace: jest.fn(),
    bufferedEndTrace: jest.fn(),
    onboardingParentContext: { current: null },
  } as unknown as MetaMetricsContextValue;

  return renderWithLocalization(
    <MetaMetricsContext.Provider value={metaMetricsContextValue}>
      <PasskeyTroubleshootModal
        mode="unlock"
        location="unlock"
        onClose={jest.fn()}
        onOpenFullScreen={jest.fn()}
      />
    </MetaMetricsContext.Provider>,
  );
}

describe('PasskeyTroubleshootModal', () => {
  it('points the "Still having trouble" link to the passkeys support article', () => {
    const { getByTestId } = renderModal();

    const link = getByTestId('passkey-troubleshoot-still-having-trouble-link');

    expect(link).toHaveAttribute('href', EXPECTED_PASSKEYS_SUPPORT_URL);
  });

  it('opens the support link in a new tab safely', () => {
    const { getByTestId } = renderModal();

    const link = getByTestId('passkey-troubleshoot-still-having-trouble-link');

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
