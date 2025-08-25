import React from 'react';
import classnames from 'classnames';

import { Box, Text } from '../../../../components/component-library';

import {
  AlignItems,
  BackgroundColor,
  Display,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

import { PreferredAvatar } from '../../../../components/app/preferred-avatar';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { type DestinationAccount } from '../types';

type DestinationSelectedAccountListItemProps = {
  account: DestinationAccount;
  selected: boolean;
  onClick?: () => void;
};

const DestinationSelectedAccountListItem: React.FC<
  DestinationSelectedAccountListItemProps
> = ({ account, selected, onClick }) => {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      backgroundColor={
        selected ? BackgroundColor.primaryMuted : BackgroundColor.transparent
      }
      className={classnames('multichain-account-list-item px-4 gap-2', {
        'multichain-account-list-item--selected': selected,
      })}
      onClick={onClick}
      alignItems={AlignItems.center}
      style={{ pointerEvents: 'none' }}
    >
      <PreferredAvatar address={account.address} />
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
          {account.displayName}
        </Text>
      </Box>
    </Box>
  );
};

export default React.memo(DestinationSelectedAccountListItem);
