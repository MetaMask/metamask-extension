import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAddressLabel } from '#ui/hooks/useAddressLabel';
import { AccountName } from './account-name';

const mockGetDisplayName = jest.fn((_address: string): string => '');
const mockSelectOwnAccountName = jest.fn((): string | undefined => undefined);

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('#ui/hooks/useGetDisplayName', () => ({
  useGetDisplayName: () => mockGetDisplayName,
}));

jest.mock('#ui/hooks/useAddressLabel');

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  selectAccountGroupNameByAddress: () => mockSelectOwnAccountName(),
}));

jest.mock('../preferred-avatar', () => ({
  PreferredAvatar: () => null,
}));

const mockUseAddressLabel = jest.mocked(useAddressLabel);

const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const shortAddress = '0xc42ed...d8813';

describe('AccountName', () => {
  beforeEach(() => {
    mockUseAddressLabel.mockReturnValue('');
    mockGetDisplayName.mockReturnValue('');
    mockSelectOwnAccountName.mockReturnValue(undefined);
  });

  it('shows the shortened address when no name resolves', () => {
    render(<AccountName address={address} chainId="eip155:1" />);

    expect(screen.getByTestId('transaction-details-address')).toHaveTextContent(
      shortAddress,
    );
    expect(
      screen.getByTestId('transaction-details-address'),
    ).not.toHaveTextContent('(');
  });

  it('shows the own account name with the shortened address', () => {
    mockSelectOwnAccountName.mockReturnValue('Account 1');

    render(<AccountName address={address} chainId="eip155:1" />);

    expect(screen.getByTestId('transaction-details-address')).toHaveTextContent(
      `Account 1(${shortAddress})`,
    );
  });

  it('shows a contact or petname resolved by the display name hook', () => {
    mockGetDisplayName.mockReturnValue('Alice');

    render(<AccountName address={address} chainId="eip155:1" />);

    expect(screen.getByTestId('transaction-details-address')).toHaveTextContent(
      `Alice(${shortAddress})`,
    );
  });

  it('shows the resolved address label when no known name exists', () => {
    mockUseAddressLabel.mockReturnValue('MetaMask Swaps');

    render(<AccountName address={address} chainId="eip155:1" />);

    expect(screen.getByTestId('transaction-details-address')).toHaveTextContent(
      `MetaMask Swaps(${shortAddress})`,
    );
  });

  it('does not look up an address label when a known name exists', () => {
    mockGetDisplayName.mockReturnValue('Alice');

    render(<AccountName address={address} chainId="eip155:1" />);

    expect(mockUseAddressLabel).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it('renders nothing without an address', () => {
    const { container } = render(<AccountName address={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });
});
