import React from 'react';
import { render, screen } from '@testing-library/react';
import { AccountName } from './account-name';

const mockGetDisplayName = jest.fn((_address: string): string => '');
const mockSelectOwnAccountName = jest.fn((): string | undefined => undefined);

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('#ui/hooks/useGetDisplayName', () => ({
  useGetDisplayName: () => mockGetDisplayName,
}));

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  selectAccountGroupNameByAddress: () => mockSelectOwnAccountName(),
}));

jest.mock('../preferred-avatar', () => ({
  PreferredAvatar: () => null,
}));

const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const shortAddress = '0xc42ed...d8813';

describe('AccountName', () => {
  beforeEach(() => {
    mockGetDisplayName.mockReturnValue('');
    mockSelectOwnAccountName.mockReturnValue(undefined);
  });

  it('shows the shortened address when no name resolves', () => {
    render(<AccountName address={address} />);

    expect(screen.getByTestId('transaction-details-address')).toHaveTextContent(
      shortAddress,
    );
    expect(
      screen.getByTestId('transaction-details-address'),
    ).not.toHaveTextContent('(');
  });

  it('shows the own account name with the shortened address', () => {
    mockSelectOwnAccountName.mockReturnValue('Account 1');

    render(<AccountName address={address} />);

    expect(screen.getByTestId('transaction-details-address')).toHaveTextContent(
      `Account 1(${shortAddress})`,
    );
  });

  it('shows a contact or petname resolved by the display name hook', () => {
    mockGetDisplayName.mockReturnValue('Alice');

    render(<AccountName address={address} />);

    expect(screen.getByTestId('transaction-details-address')).toHaveTextContent(
      `Alice(${shortAddress})`,
    );
  });

  it('renders nothing without an address', () => {
    const { container } = render(<AccountName address={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });
});
