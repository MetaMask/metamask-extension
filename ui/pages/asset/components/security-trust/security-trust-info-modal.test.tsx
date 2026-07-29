import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { IconColor, IconName } from '@metamask/design-system-react';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { getResultTypeConfig } from '../../utils/security-utils';
import { SecurityTrustInfoModal } from './security-trust-info-modal';

const mockTrackEvent = jest.fn();

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: () => 'popup',
}));

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

const t = (key: string, substitutions?: string[]) =>
  substitutions?.length ? `${key}:${substitutions.join(',')}` : key;

describe('SecurityTrustInfoModal', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  it('renders verified sheet with Got it button', () => {
    const config = getResultTypeConfig('Verified', t);
    const { getByTestId } = render(
      <SecurityTrustInfoModal
        isOpen
        onClose={jest.fn()}
        sheetParams={{
          severity: 'Verified',
          securityConfig: config,
          title: config.sheetTitle ?? '',
          description: config.getSheetDescription?.('USDC') ?? '',
          displayIcon: config.badge?.icon ?? IconName.SecurityTick,
          displayIconColor: config.badge?.iconColor ?? IconColor.SuccessDefault,
          tokenSymbol: 'USDC',
          source: 'badge',
        }}
      />,
    );

    expect(getByTestId('security-trust-info-modal')).toBeInTheDocument();
    expect(getByTestId('security-trust-info-modal-got-it')).toBeInTheDocument();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SecurityTrustBottomSheetOpened,
      }),
    );
  });

  it('tracks action taken on proceed and cancel for gated sheet', () => {
    const config = getResultTypeConfig('Malicious', t);
    const onClose = jest.fn();
    const onProceed = jest.fn();
    const { getByTestId } = render(
      <SecurityTrustInfoModal
        isOpen
        onClose={onClose}
        onProceed={onProceed}
        sheetParams={{
          severity: 'Malicious',
          securityConfig: config,
          title: config.sheetTitle ?? '',
          description: config.getSheetDescription?.('SWOL') ?? '',
          displayIcon: config.icon ?? IconName.Danger,
          displayIconColor: config.iconColor ?? IconColor.ErrorDefault,
          tokenSymbol: 'SWOL',
          features: [
            {
              featureId: 'KNOWN_MALICIOUS',
              type: 'Malicious',
              description: 'Known malicious',
            },
          ],
          source: 'buy',
        }}
      />,
    );

    expect(
      getByTestId('security-trust-info-modal-malicious-banner'),
    ).toBeInTheDocument();
    expect(
      getByTestId('security-trust-info-modal-feature-tags'),
    ).toBeInTheDocument();

    fireEvent.click(getByTestId('security-trust-info-modal-continue'));
    expect(onProceed).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SecurityTrustBottomSheetActionTaken,
      }),
    );

    fireEvent.click(getByTestId('security-trust-info-modal-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tracks cancel when gated sheet is dismissed via modal close', () => {
    const config = getResultTypeConfig('Malicious', t);
    const onClose = jest.fn();
    const onProceed = jest.fn();
    const { getByRole } = render(
      <SecurityTrustInfoModal
        isOpen
        onClose={onClose}
        onProceed={onProceed}
        sheetParams={{
          severity: 'Malicious',
          securityConfig: config,
          title: config.sheetTitle ?? '',
          description: config.getSheetDescription?.('SWOL') ?? '',
          displayIcon: config.icon ?? IconName.Danger,
          displayIconColor: config.iconColor ?? IconColor.ErrorDefault,
          tokenSymbol: 'SWOL',
          source: 'swap',
        }}
      />,
    );

    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SecurityTrustBottomSheetActionTaken,
        properties: expect.objectContaining({
          action: 'cancel',
          source: 'Swap',
        }),
      }),
    );
  });
});
