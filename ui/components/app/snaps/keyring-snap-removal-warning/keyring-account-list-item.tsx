import React from 'react';
import {
  Box,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { ButtonIcon, IconName, Text } from '../../../component-library';
import {
  IconColor,
  OverflowWrap,
  TextColor,
} from '../../../../helpers/constants/design-system';
// import { toChecksumHexAddress } from '../../../../../../../shared/lib/hexstring-utils';
import { toChecksumHexAddress } from '../../../../../shared/lib/hexstring-utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const KeyringAccountListItem = ({
  account,
  snapUrl,
}: {
  account: { name: string; address: string };
  snapUrl: string;
}) => {
  const t = useI18nContext();
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      borderColor={BoxBorderColor.BorderDefault}
      padding={3}
      className="w-full rounded-md"
      data-testid="keyring-account-list-item"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="w-10/12"
      >
        <Box flexDirection={BoxFlexDirection.Column} marginBottom={2}>
          <Text color={TextColor.textMuted}>{t('keyringAccountName')}</Text>
          <Text>{account.name}</Text>
        </Box>
        <Box flexDirection={BoxFlexDirection.Column}>
          <Text color={TextColor.textMuted}>
            {t('keyringAccountPublicAddress')}
          </Text>
          <Text overflowWrap={OverflowWrap.Anywhere}>
            {toChecksumHexAddress(account.address)}
          </Text>
        </Box>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Center}
      >
        <ButtonIcon
          ariaLabel="snap-url-export"
          data-testid="keyring-account-link"
          iconName={IconName.Export}
          color={IconColor.primaryDefault}
          onClick={() => {
            global.platform.openTab({
              url: snapUrl,
            });
          }}
        />
      </Box>
    </Box>
  );
};
