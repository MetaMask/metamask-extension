import React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { getSnapName, shortenAddress } from '../../../../helpers/utils/util';

import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Text,
} from '../../../../components/component-library';

import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Display,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

import { KeyringType } from '../../../../../shared/constants/keyring';
import { getUseBlockie, getSnapsMetadata } from '../../../../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import { getAccountLabel } from '../../../../helpers/utils/accounts';

interface DestinationSelectedAccountListItemProps {
  account: {
    id: string;
    address: string;
    metadata: {
      name: string;
      snap?: {
        id: string;
        name?: string;
        enabled?: boolean;
      };
      keyring: {
        type: string;
      };
    };
  };
  selected: boolean;
  onClick?: () => void;
}

const DestinationSelectedAccountListItem: React.FC<
  DestinationSelectedAccountListItemProps
> = ({ account, selected, onClick }) => {
  const snapMetadata = useSelector(getSnapsMetadata);
  const accountLabel = getAccountLabel(
    account.metadata.keyring.type,
    account,
    account.metadata.keyring.type === KeyringType.snap
      ? getSnapName(snapMetadata)(account.metadata?.snap?.id)
      : null,
  );

  const useBlockie = useSelector(getUseBlockie);

  return (
    <Box
      display={Display.Flex}
      padding={4}
      backgroundColor={
        selected ? BackgroundColor.primaryMuted : BackgroundColor.transparent
      }
      className={classnames('multichain-account-list-item', {
        'multichain-account-list-item--selected': selected,
      })}
      onClick={onClick}
      alignItems={AlignItems.center}
      style={{ pointerEvents: 'none' }}
    >
      <AvatarAccount
        borderColor={BorderColor.transparent}
        size={AvatarAccountSize.Md}
        address={account.address}
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        marginInlineEnd={2}
      />

      <Box display={Display.Flex} style={{ flexDirection: 'column' }}>
        <Text variant={TextVariant.bodyMdMedium} marginBottom={1}>
          {account.metadata.name}
        </Text>

        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          data-testid="account-list-address"
        >
          {shortenAddress(normalizeSafeAddress(account.address))}
        </Text>
      </Box>
    </Box>
  );
};

export default React.memo(DestinationSelectedAccountListItem);
