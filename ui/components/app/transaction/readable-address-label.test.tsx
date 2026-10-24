import React from 'react';
import { render } from '@testing-library/react';
import { AddressScanResultType } from '@metamask/phishing-controller';
import type { AddressScanResult } from '@metamask/phishing-controller';
import { useAddressLabel } from '#ui/hooks/useAddressLabel';
import { ReadableAddressLabel } from './readable-address-label';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: string[]) =>
    substitutions ? `${key}|${substitutions.join(',')}` : key,
}));

const mockGetDisplayName = jest.fn((_address: string): string => '');

jest.mock('#ui/hooks/useGetDisplayName', () => ({
  useGetDisplayName: () => mockGetDisplayName,
  shortenDisplayAddress: (address: string) =>
    address ? '0xc42ed...d8813' : '',
}));

jest.mock('#ui/hooks/useAddressLabel');

const mockUseAddressLabel = jest.mocked(useAddressLabel);

const mockScan = (scan: AddressScanResult | undefined) =>
  mockUseAddressLabel.mockReturnValue({
    data: scan,
  } as ReturnType<typeof useAddressLabel>);

const contractAddress = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';

describe('ReadableAddressLabel', () => {
  beforeEach(() => {
    mockScan(undefined);
    mockGetDisplayName.mockReturnValue('');
  });

  it('prefers a name the user already has over the resolved label', () => {
    mockScan({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Benign,
      label: 'MetaMask Swaps',
    });
    mockGetDisplayName.mockReturnValue('My Contract');

    const { container } = render(
      <ReadableAddressLabel
        labelKey="activity_contractInteraction_success_description"
        address={contractAddress}
        chainId="eip155:42161"
        fallback="Contract"
      />,
    );

    expect(container).toHaveTextContent(
      'activity_contractInteraction_success_description|My Contract',
    );
  });

  it('shows the resolved label', () => {
    mockScan({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Benign,
      label: 'MetaMask Swaps',
    });

    const { container } = render(
      <ReadableAddressLabel
        labelKey="activity_contractInteraction_success_description"
        address={contractAddress}
        chainId="eip155:42161"
        fallback="Contract"
      />,
    );

    expect(container).toHaveTextContent(
      'activity_contractInteraction_success_description|MetaMask Swaps',
    );
  });

  it('falls back to the shortened address when nothing resolves', () => {
    const { container } = render(
      <ReadableAddressLabel
        labelKey="activity_send_success_description"
        address={contractAddress}
        chainId="eip155:1"
        fallback="Unknown"
      />,
    );

    expect(container).toHaveTextContent(
      'activity_send_success_description|0xc42ed...d8813',
    );
  });

  it('falls back to the fallback text when the address is empty', () => {
    const { container } = render(
      <ReadableAddressLabel
        labelKey="activity_contractInteraction_success_description"
        address=""
        chainId="eip155:1"
        fallback="Contract"
      />,
    );

    expect(container).toHaveTextContent(
      'activity_contractInteraction_success_description|Contract',
    );
  });

  it('uses the shortened address when a malicious scan label is suppressed', () => {
    mockScan({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Malicious,
      label: 'Relay',
    });

    const { container } = render(
      <ReadableAddressLabel
        labelKey="activity_contractInteraction_success_description"
        address={contractAddress}
        chainId="eip155:1"
        fallback="Contract"
      />,
    );

    expect(container).toHaveTextContent(
      'activity_contractInteraction_success_description|0xc42ed...d8813',
    );
  });
});
