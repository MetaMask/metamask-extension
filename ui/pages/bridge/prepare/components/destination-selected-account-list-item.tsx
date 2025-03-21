import React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { shortenAddress } from '../../../../helpers/utils/util';

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

import { getUseBlockie } from '../../../../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { DestinationAccount } from '../types';

type DestinationSelectedAccountListItemProps = {
  account: DestinationAccount;
  selected: boolean;
  onClick?: () => void;
};

const DestinationSelectedAccountListItem: React.FC<
  DestinationSelectedAccountListItemProps
> = ({ account, selected, onClick }) => {
  const useBlockie = useSelector(getUseBlockie);
  const t = useI18nContext();
  const isExternalAccount = 'isExternal' in account && account.isExternal;

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
          {isExternalAccount ? t('externalAccount') : account.metadata.name}
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
