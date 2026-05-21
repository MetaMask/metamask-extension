import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React from 'react';
import { useSelector } from 'react-redux';

import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row/row';
import { PreferredAvatar } from '../../../../../../../components/app/preferred-avatar';
import { FlexDirection } from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { selectAccountGroupNameByInternalAccount } from '../../../../../selectors/accounts';
import { useUniversalTransactionDataOptional } from '../../../../../hooks/transactions/useUniversalTransactionData';
import { truncateUniversalAddress } from './truncate-universal-address';

export function UniversalTransactionToRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();
  const accountGroupName = useSelector((state) =>
    selectAccountGroupNameByInternalAccount(
      state as Parameters<typeof selectAccountGroupNameByInternalAccount>[0],
      data?.to,
    ),
  );

  if (!data) {
    return null;
  }

  const display = accountGroupName ?? truncateUniversalAddress(data.to);

  return (
    <ConfirmInfoRow
      label={t('to')}
      style={{ flexDirection: FlexDirection.Column, width: '100%' }}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        style={{ width: '100%' }}
      >
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
            ellipsis
          >
            {display}
          </Text>
        </Box>
        <PreferredAvatar
          address={data.to}
          size={AvatarAccountSize.Md}
          style={{ flexShrink: 0 }}
        />
      </Box>
    </ConfirmInfoRow>
  );
}
