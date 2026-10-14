import React from 'react';
import { render, screen } from '@testing-library/react';
import { it } from '@jest/globals';
import { BtcAccountType, EthAccountType } from '@metamask/keyring-api';

import { AccountTypeLabel } from './account-type-label';

describe('AccountTypeLabel', () => {
  it('renders nothing when the account type has no label', () => {
    const { container } = render(
      <AccountTypeLabel accountType={EthAccountType.Eoa} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it.each<[string, string]>([
    [BtcAccountType.P2pkh, 'Legacy'],
    [BtcAccountType.P2sh, 'Nested SegWit'],
    [BtcAccountType.P2wpkh, 'Native SegWit'],
    [BtcAccountType.P2tr, 'Taproot'],
  ])('renders the %s asset label', (accountType, label) => {
    render(<AccountTypeLabel accountType={accountType} />);

    expect(screen.getByTestId('account-type-label')).toHaveTextContent(label);
  });
});
