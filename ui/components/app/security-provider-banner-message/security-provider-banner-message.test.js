import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SecurityProviderBannerMessage from './security-provider-banner-message';

describe('Security Provider Banner Message', () => {
  const store = configureMockStore()({});

  const thisIsBasedOnText = 'This is based on information from';

  it('should render SecurityProviderBannerMessage component properly when flagAsDangerous is 1', () => {
    const securityProviderResponse = {
      flagAsDangerous: 1,
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

  it('should render SecurityProviderBannerMessage component properly when flagAsDangerous is 2', () => {
    const securityProviderResponse = {
      flagAsDangerous: 2,
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
      flagAsDangerous: undefined,
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
      flagAsDangerous: 2,
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
});
