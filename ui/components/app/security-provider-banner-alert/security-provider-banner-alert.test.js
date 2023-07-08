import React from 'react';
import { Severity } from '../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { SecurityProvider } from '../../../../shared/constants/security-provider';
import SecurityProviderBannerAlert from '.';

const mockTitle = 'Malicious third party detected';
const mockDescription =
  'This is a description to warn the user of malicious or suspicious transactions.';
const mockDetails = (
  <ul>
    <li>List item</li>
    <li>List item</li>
    <li>List item</li>
  </ul>
);

describe('Security Provider Banner Alert', () => {
  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <SecurityProviderBannerAlert
        description={mockDescription}
        details={mockDetails}
        provider={SecurityProvider.Blockaid}
        severity={Severity.Danger}
        title={mockTitle}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render', () => {
    const { container, getByText } = renderWithProvider(
      <SecurityProviderBannerAlert
        description={mockDescription}
        details={mockDetails}
        provider={SecurityProvider.Blockaid}
        severity={Severity.Danger}
        title={mockTitle}
      />,
    );

    expect(getByText(mockTitle)).toBeInTheDocument();
    expect(getByText(mockDescription)).toBeInTheDocument();
    expect(container.querySelector('.disclosure')).toBeInTheDocument();
  });

  it('should not render disclosure component if no details were provided', () => {
    const { container } = renderWithProvider(
      <SecurityProviderBannerAlert
        description={mockDescription}
        provider={SecurityProvider.Blockaid}
        severity={Severity.Danger}
        title={mockTitle}
      />,
    );

    expect(container.querySelector('.disclosure')).not.toBeInTheDocument();
  });
});
