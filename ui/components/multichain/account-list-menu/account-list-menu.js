import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import Box from '../../ui/box/box';
import {
  ButtonLink,
  AvatarIcon,
  ICON_NAMES,
  TextFieldSearch,
} from '../../component-library';
import { AccountListItem } from '../account-list-item/account-list-item';
import { BLOCK_SIZES, Size } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Popover from '../../ui/popover';

export const AccountListMenu = ({
  identities = [],
  onClose = () => console.log('Account list closed'),
}) => {
  const t = useI18nContext();
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = searchQuery
    ? new Fuse(identities, {
        threshold: 0.2,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ['name', 'address'],
      }).search(searchQuery)
    : identities;

  return (
    <Popover title={t('selectAnAccount')} centerTitle onClose={onClose}>
      <Box>
        {/* Search box */}
        <Box padding={4}>
          <TextFieldSearch
            size={Size.SM}
            width={BLOCK_SIZES.FULL}
            placeholder={t('searchAccounts')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
        {/* Account list block */}
        <Box style={{ height: '200px', overflow: 'auto' }}>
          {searchResults.map((identity) => (
            <AccountListItem identity={identity} key={identity.address} />
          ))}
        </Box>
        {/* Add / Import / Hardware */}
        <Box padding={4}>
          <Box marginBottom={4}>
            <ButtonLink size={Size.SM}>
              <AvatarIcon iconName={ICON_NAMES.ADD} size={Size.SM} />{' '}
              {t('addAccount')}
            </ButtonLink>
          </Box>
          <Box marginBottom={4}>
            <ButtonLink size={Size.SM}>
              <AvatarIcon iconName={ICON_NAMES.IMPORT} size={Size.SM} />{' '}
              {t('importAccount')}
            </ButtonLink>
          </Box>
          <Box>
            <ButtonLink size={Size.SM}>
              <AvatarIcon iconName={ICON_NAMES.HARDWARE} size={Size.SM} />{' '}
              {t('hardwareWallet')}
            </ButtonLink>
          </Box>
        </Box>
      </Box>
    </Popover>
  );
};

AccountListMenu.propTypes = {
  identities: PropTypes.array,
  onClose: PropTypes.func,
};
