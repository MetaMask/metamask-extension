import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { SecurityTrustInfoModal } from './security-trust-info-modal';
import { getResultTypeConfig } from '../../utils/security-utils';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: () => 'popup',
}));

const t = (key: string, substitutions?: string[]) =>
  substitutions?.length ? `${key}:${substitutions.join(',')}` : key;

describe('SecurityTrustInfoModal', () => {
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
          displayIcon: config.badge?.icon ?? config.icon!,
          displayIconColor: config.badge?.iconColor ?? config.iconColor!,
          tokenSymbol: 'USDC',
          source: 'badge',
        }}
      />,
    );

    expect(getByTestId('security-trust-info-modal')).toBeInTheDocument();
    expect(getByTestId('security-trust-info-modal-got-it')).toBeInTheDocument();
  });

  it('renders malicious sheet with continue and cancel actions', () => {
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
          displayIcon: config.icon!,
          displayIconColor: config.iconColor!,
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
    expect(getByTestId('security-trust-info-modal-feature-tags')).toBeInTheDocument();

    fireEvent.click(getByTestId('security-trust-info-modal-continue'));
    expect(onProceed).toHaveBeenCalledTimes(1);

    fireEvent.click(getByTestId('security-trust-info-modal-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
