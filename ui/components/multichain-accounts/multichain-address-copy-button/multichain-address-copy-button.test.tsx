import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as useDefaultAddressHook from '../hooks/useDefaultAddress';
import { MultichainAddressCopyButton } from './multichain-address-copy-button';

const mockUseCopyToClipboard = jest.fn();
const mockHandleDefaultAddressClick = jest.fn();

jest.mock('#ui/hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => [false, mockUseCopyToClipboard],
}));

describe('MultichainAddressCopyButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(useDefaultAddressHook, 'useDefaultAddress').mockReturnValue({
      defaultAddress: '0x1234567890123456789012345678901234567890', // pragma: allowlist secret
      defaultAddressScope: 'eip155',
      displayDefaultAddress: '0x1234567890123456789012345678901234567890', // pragma: allowlist secret
      addressCopied: false,
      handleDefaultAddressClick: mockHandleDefaultAddressClick,
    });
  });

  it('renders with accessible name including address and copy action when not copied', () => {
    renderWithProvider(<MultichainAddressCopyButton groupId="keyring:test/test" />);

    const button = screen.getByRole('button', {
      name: /0x12345\.\.\.67890, Copy address to clipboard/iu,
    });
    expect(button).toBeInTheDocument();
  });

  it('renders with accessible name matching visible text when copied', () => {
    jest.spyOn(useDefaultAddressHook, 'useDefaultAddress')      .mockReturnValue({
        defaultAddress: '0x1234567890123456789012345678901234567890', // pragma: allowlist secret
        defaultAddressScope: 'eip155',
        displayDefaultAddress: '0x1234567890123456789012345678901234567890', // pragma: allowlist secret
        addressCopied: true,
        handleDefaultAddressClick: mockHandleDefaultAddressClick,
      });

    renderWithProvider(<MultichainAddressCopyButton groupId="keyring:test/test" />);

    const button = screen.getByRole('button', {
      name: /Ethereum address copied/iu,
    });
    expect(button).toBeInTheDocument();
  });

  it('shows status message after copying', () => {
    jest.spyOn(useDefaultAddressHook, 'useDefaultAddress')      .mockReturnValue({
        defaultAddress: '0x1234567890123456789012345678901234567890', // pragma: allowlist secret
        defaultAddressScope: 'eip155',
        displayDefaultAddress: '0x1234567890123456789012345678901234567890', // pragma: allowlist secret
        addressCopied: true,
        handleDefaultAddressClick: mockHandleDefaultAddressClick,
      });

    renderWithProvider(<MultichainAddressCopyButton groupId="keyring:test/test" />);

    const statusMessage = screen.getByRole('status');
    expect(statusMessage).toHaveTextContent('Address copied');
  });

  it('does not show status message when not copied', () => {
    renderWithProvider(<MultichainAddressCopyButton groupId="keyring:test/test" />);

    const statusMessage = screen.getByRole('status');
    expect(statusMessage).toBeEmptyDOMElement();
  });

  it('returns null when displayDefaultAddress is false', () => {
    jest.spyOn(useDefaultAddressHook, 'useDefaultAddress')      .mockReturnValue({
        defaultAddress: '0x1234567890123456789012345678901234567890', // pragma: allowlist secret
        defaultAddressScope: 'eip155',
        displayDefaultAddress: false,
        addressCopied: false,
        handleDefaultAddressClick: mockHandleDefaultAddressClick,
      });

    const { container } = renderWithProvider(
      <MultichainAddressCopyButton groupId="keyring:test/test" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls handleDefaultAddressClick when button is clicked', () => {
    renderWithProvider(<MultichainAddressCopyButton groupId="keyring:test/test" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockHandleDefaultAddressClick).toHaveBeenCalledTimes(1);
  });
});
