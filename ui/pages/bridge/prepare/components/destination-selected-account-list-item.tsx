import React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';

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

      <Box
        display={Display.Flex}
        style={{ flexDirection: 'column', maxWidth: 'calc(100% - 60px)' }}
      >
        <Text
          variant={TextVariant.bodySmMedium}
          color={TextColor.textAlternative}
          data-testid="account-list-address"
          marginBottom={1}
        >
          {t('destinationAccountPickerReceiveAt')}
        </Text>

        <Text variant={TextVariant.bodyMdMedium} marginBottom={1} ellipsis>
          {(() => {
            if (isExternalAccount) {
              if (account.metadata.name.endsWith('.eth')) {
                return account.metadata.name; // TODO Swaps: This needs to be updated to the new account group name
              }
              return t('externalAccount');
            }
            return account.metadata.name; // TODO Swaps: This needs to be updated to the new account group name
          })()}
        </Text>
      </Box>
    </Box>
  );
};

export default React.memo(DestinationSelectedAccountListItem);
