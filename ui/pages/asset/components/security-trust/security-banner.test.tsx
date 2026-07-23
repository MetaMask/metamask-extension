import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { SecurityBanner } from './security-banner';
import { BannerAlertSeverity } from '@metamask/design-system-react';
import { getResultTypeConfig } from '../../utils/security-utils';

const t = (key: string) => key;

describe('SecurityBanner', () => {
  it('renders malicious banner', () => {
    const config = getResultTypeConfig('Malicious', t);
    const { getByTestId } = render(
      <SecurityBanner
        securityConfig={config}
        severity={BannerAlertSeverity.Danger}
        testId="security-banner-malicious"
        title="securityTrustMaliciousTokenTitle"
        description="Malicious token description"
      />,
    );

    expect(getByTestId('security-banner-malicious')).toBeInTheDocument();
  });

  it('calls onClick when banner is pressed', () => {
    const config = getResultTypeConfig('Malicious', t);
    const onClick = jest.fn();
    const { getByTestId } = render(
      <SecurityBanner
        securityConfig={config}
        severity={BannerAlertSeverity.Danger}
        testId="security-banner-malicious"
        title="securityTrustMaliciousTokenTitle"
        description="Malicious token description"
        onClick={onClick}
      />,
    );

    fireEvent.click(getByTestId('security-banner-malicious'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
