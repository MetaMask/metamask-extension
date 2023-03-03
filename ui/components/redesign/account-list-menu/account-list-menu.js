import React from 'react';
import Box from '../../ui/box/box';
import {
  ButtonIcon,
  ButtonLink,
  ICON_NAMES,
  Icon,
  TextFieldSearch,
} from '../../component-library';
import { AccountListItem } from '../account-list-item/account-list-item';
import { BLOCK_SIZES, Size } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

const noop = () => {};

export const AccountListMenu = ({ identities = [] }) => {
  const t = useI18nContext();

  return (
    <Box>
      {/* Search box */}
      <Box padding={4}>
        <TextFieldSearch
          size={Size.SM}
          width={BLOCK_SIZES.FULL}
          placeholder={t('searchAccounts')}
        />
      </Box>
      {/* Account list block */}
      <Box style={{ maxHeight: '200px', overflow: 'auto' }}>
        {identities.map((identity) => (
          <AccountListItem identity={identity} />
        ))}
      </Box>
      {/* Add / Import / Hardware */}
      <Box padding={4}>
        <Box marginBottom={4}>
          <ButtonLink size={Size.SM}>
            <Icon name={ICON_NAMES.ADD} size={Size.SM} /> Add account
          </ButtonLink>
        </Box>
        <Box marginBottom={4}>
          <ButtonLink size={Size.SM}>
            <Icon name={ICON_NAMES.IMPORT} size={Size.SM} /> Import account
          </ButtonLink>
        </Box>
        <Box>
          <ButtonLink size={Size.SM}>
            <Icon name={ICON_NAMES.HARDWARE} size={Size.SM} /> Hardware wallet
          </ButtonLink>
        </Box>
      </Box>
    </Box>
  );
};
