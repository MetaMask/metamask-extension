import React from 'react';
import { render } from '@testing-library/react';
import { SafetyBadge } from './safety-badge';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('SafetyBadge', () => {
  it('renders nothing when resultType is missing', () => {
    const { queryByTestId } = render(<SafetyBadge />);

    expect(queryByTestId('safety-badge')).not.toBeInTheDocument();
  });

  it('renders the verified icon when resultType is Verified', () => {
    const { getByTestId, getByLabelText } = render(
      <SafetyBadge value="Verified" />,
    );

    expect(getByTestId('safety-badge')).toBeInTheDocument();
    expect(getByLabelText('securityTrustVerified')).toBeInTheDocument();
  });

  it('renders the risky label when resultType is Warning', () => {
    const { getByTestId, getByText } = render(<SafetyBadge value="Warning" />);

    expect(getByTestId('safety-badge')).toBeInTheDocument();
    expect(getByText('securityTrustRisky')).toBeInTheDocument();
  });

  it('renders the malicious label when resultType is Malicious', () => {
    const { getByTestId, getByText } = render(
      <SafetyBadge value="Malicious" />,
    );

    expect(getByTestId('safety-badge')).toBeInTheDocument();
    expect(getByText('securityTrustMalicious')).toBeInTheDocument();
  });
});
