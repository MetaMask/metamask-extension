import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { SECURITY_PROVIDER_MESSAGE_SEVERITY } from '../../../../shared/constants/security-provider';
import SecurityProviderBannerMessage from './security-provider-banner-message';

describe('Security Provider Banner Message', () => {
  const store = configureMockStore()({});

  const thisIsBasedOnText = 'OpenSea';

  it('should render SecurityProviderBannerMessage component properly when flagAsDangerous is malicious', () => {
    const securityProviderResponse = {
      flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.MALICIOUS,
      reason:
        'Approval is to an unverified smart contract known for stealing NFTs in the past.',
      reason_header: 'This could be a scam',
    };

    const { getByText } = renderWithProvider(
      <SecurityProviderBannerMessage
        securityProviderResponse={securityProviderResponse}
      />,
      store,
    );

    expect(getByText(securityProviderResponse.reason)).toBeInTheDocument();
    expect(
      getByText(securityProviderResponse.reason_header),
    ).toBeInTheDocument();
    expect(getByText(thisIsBasedOnText)).toBeInTheDocument();
  });

  it('should render SecurityProviderBannerMessage component properly when flagAsDangerous is not safe', () => {
    const securityProviderResponse = {
      flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_SAFE,
      reason: 'Some reason...',
      reason_header: 'Some reason header...',
    };

    const requestMayNotBeSafe = 'Request may not be safe';
    const requestMayNotBeSafeError =
      "The security provider didn't detect any known malicious activity, but it still may not be safe to continue.";

    const { getByText } = renderWithProvider(
      <SecurityProviderBannerMessage
        securityProviderResponse={securityProviderResponse}
      />,
      store,
    );

    expect(getByText(requestMayNotBeSafe)).toBeInTheDocument();
    expect(getByText(requestMayNotBeSafeError)).toBeInTheDocument();
    expect(getByText(thisIsBasedOnText)).toBeInTheDocument();
  });

  it('should render SecurityProviderBannerMessage component properly when flagAsDangerous is undefined', () => {
    const securityProviderResponse = {
      flagAsDangerous: '?',
      reason: 'Some reason...',
      reason_header: 'Some reason header...',
    };

    const requestNotVerified = 'Request not verified';
    const requestNotVerifiedError =
      'Because of an error, this request was not verified by the security provider. Proceed with caution.';

    const { getByText } = renderWithProvider(
      <SecurityProviderBannerMessage
        securityProviderResponse={securityProviderResponse}
      />,
      store,
    );

    expect(getByText(requestNotVerified)).toBeInTheDocument();
    expect(getByText(requestNotVerifiedError)).toBeInTheDocument();
    expect(getByText(thisIsBasedOnText)).toBeInTheDocument();
  });

  it('should render SecurityProviderBannerMessage component properly when securityProviderResponse is empty', () => {
    const securityProviderResponse = {};

    const requestNotVerified = 'Request not verified';
    const requestNotVerifiedError =
      'Because of an error, this request was not verified by the security provider. Proceed with caution.';

    const { getByText } = renderWithProvider(
      <SecurityProviderBannerMessage
        securityProviderResponse={securityProviderResponse}
      />,
      store,
    );

    expect(getByText(requestNotVerified)).toBeInTheDocument();
    expect(getByText(requestNotVerifiedError)).toBeInTheDocument();
    expect(getByText(thisIsBasedOnText)).toBeInTheDocument();
  });

  it('should navigate to the OpenSea web page when clicked on the OpenSea button', () => {
    const securityProviderResponse = {
      flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_SAFE,
      reason: 'Some reason...',
      reason_header: 'Some reason header...',
    };

    const { getByText } = renderWithProvider(
      <SecurityProviderBannerMessage
        securityProviderResponse={securityProviderResponse}
      />,
      store,
    );

    const link = getByText('OpenSea');

    expect(link).toBeInTheDocument();

    fireEvent.click(link);

    expect(link.closest('a')).toHaveAttribute('href', 'https://opensea.io/');
  });

  it('should render SecurityProviderBannerMessage component properly, with predefined reason message, when a request is malicious and there is no reason given', () => {
    const securityProviderResponse = {
      flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.MALICIOUS,
      reason: '',
      reason_header: 'Some reason header...',
    };

    const reason = 'The security provider has not shared additional details';

    const { getByText } = renderWithProvider(
      <SecurityProviderBannerMessage
        securityProviderResponse={securityProviderResponse}
      />,
      store,
    );

    expect(
      getByText(securityProviderResponse.reason_header),
    ).toBeInTheDocument();
    expect(getByText(reason)).toBeInTheDocument();
    expect(getByText(thisIsBasedOnText)).toBeInTheDocument();
  });

  it('should render SecurityProviderBannerMessage component properly, with predefined reason_header message, when a request is malicious and there is no reason header given', () => {
    const securityProviderResponse = {
      flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.MALICIOUS,
      reason: 'Some reason...',
      reason_header: '',
    };

    const reasonHeader = 'Request flagged as malicious';

    const { getByText } = renderWithProvider(
      <SecurityProviderBannerMessage
        securityProviderResponse={securityProviderResponse}
      />,
      store,
    );

    expect(getByText(reasonHeader)).toBeInTheDocument();
    expect(getByText(securityProviderResponse.reason)).toBeInTheDocument();
    expect(getByText(thisIsBasedOnText)).toBeInTheDocument();
  });

  it('should render SecurityProviderBannerMessage component properly, with predefined reason and reason_header messages, when a request is malicious and there are no reason and reason header given', () => {
    const securityProviderResponse = {
      flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.MALICIOUS,
      reason: '',
      reason_header: '',
    };

    const reasonHeader = 'Request flagged as malicious';

    const reason = 'The security provider has not shared additional details';

    const { getByText } = renderWithProvider(
      <SecurityProviderBannerMessage
        securityProviderResponse={securityProviderResponse}
      />,
      store,
    );

    expect(getByText(reasonHeader)).toBeInTheDocument();
    expect(getByText(reason)).toBeInTheDocument();
    expect(getByText(thisIsBasedOnText)).toBeInTheDocument();
  });
});
