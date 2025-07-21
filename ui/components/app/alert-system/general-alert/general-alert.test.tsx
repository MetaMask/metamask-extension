import React from 'react';
import { Severity } from '../../../../helpers/constants/design-system';
import { SecurityProvider } from '../../../../../shared/constants/security-provider';
import { Text } from '../../../component-library';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import GeneralAlert, { GeneralAlertProps } from './general-alert';

describe('GeneralAlert', () => {
  const mockProps: GeneralAlertProps = {
    description: 'This is a security alert',
    severity: Severity.Danger,
    title: 'Security Alert',
  };

  it('renders general alert', () => {
    const { container } = renderWithProvider(<GeneralAlert {...mockProps} />);
    expect(container).toMatchSnapshot();
  });

  it('renders the details when provided', () => {
    const details = <Text>{'Additional details'}</Text>;
    const onClickSupportLink = jest.fn();
    const reportUrl = 'https://example.com/report';
    const { getByText } = renderWithProvider(
      <GeneralAlert
        {...mockProps}
        onClickSupportLink={onClickSupportLink}
        reportUrl={reportUrl}
        details={details}
      />,
    );
    expect(getByText('[seeDetails]')).toBeInTheDocument();
  });

  it('renders the security provider information when provided', () => {
    const reportUrl = 'https://example.com/report';
    const { getByText } = renderWithProvider(
      <GeneralAlert
        {...mockProps}
        provider={SecurityProvider.Blockaid}
        reportUrl={reportUrl}
      />,
    );

    expect(getByText('[securityProviderPoweredBy]')).toBeInTheDocument();
  });
});
