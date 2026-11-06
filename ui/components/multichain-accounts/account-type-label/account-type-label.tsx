import React from 'react';
import { BtcAccountType, KeyringAccountType } from '@metamask/keyring-api';
import { Tag } from '@metamask/design-system-react';

const ACCOUNT_TYPE_LABELS: Partial<Record<KeyringAccountType, string>> = {
  [BtcAccountType.P2pkh]: 'Legacy',
  [BtcAccountType.P2sh]: 'Nested SegWit',
  [BtcAccountType.P2wpkh]: 'Native SegWit',
  [BtcAccountType.P2tr]: 'Taproot',
};

type AccountTypeLabelProps = {
  accountType?: string;
};

export const AccountTypeLabel = ({ accountType }: AccountTypeLabelProps) => {
  const label = accountType
    ? ACCOUNT_TYPE_LABELS[accountType as KeyringAccountType]
    : undefined;

  if (!label) {
    return null;
  }

  return (
    <Tag className="shrink-0 self-center" data-testid="account-type-label">
      {label}
    </Tag>
  );
};
