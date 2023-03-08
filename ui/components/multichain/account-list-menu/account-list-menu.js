import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useDispatch, useSelector } from 'react-redux';
import Box from '../../ui/box/box';
import {
  ButtonLink,
  AvatarIcon,
  ICON_NAMES,
  TextFieldSearch,
  Text,
} from '../../component-library';
import { AccountListItem } from '../account-list-item/account-list-item';
import {
  BLOCK_SIZES,
  Size,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import Popover from '../../ui/popover';
import {
  getSelectedAccount,
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
} from '../../../selectors';
import { toggleAccountMenu, setSelectedAccount } from '../../../store/actions';
import { EVENT_NAMES, EVENT } from '../../../../shared/constants/metametrics';
import {
  IMPORT_ACCOUNT_ROUTE,
  NEW_ACCOUNT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
} from '../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import {
  HardwareKeyringTypes,
  HardwareKeyringNames,
} from '../../../../shared/constants/hardware-wallets';

function getLabel(address = '', keyrings = [], t) {
  const simpleAddress = address.substring(2).toLowerCase();
  const keyring = keyrings.find(
    (kr) =>
      kr.accounts.includes(simpleAddress) || kr.accounts.includes(address),
  );

  // Keyring value might take a while to get a value
  if (!keyring) {
    return null;
  }
  const { type } = keyring;

  switch (type) {
    case HardwareKeyringTypes.qr:
      return HardwareKeyringNames.qr;
    case HardwareKeyringTypes.imported:
      return t('imported');
    case HardwareKeyringTypes.trezor:
      return HardwareKeyringNames.trezor;
    case HardwareKeyringTypes.ledger:
      return HardwareKeyringNames.ledger;
    case HardwareKeyringTypes.lattice:
      return HardwareKeyringNames.lattice;
    default:
      return null;
  }
}

export const AccountListMenu = ({
  onClose = () => console.log('Account list closed'),
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const selectedAccount = useSelector(getSelectedAccount);
  const keyrings = useSelector(getMetaMaskKeyrings);
  const history = useHistory();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = searchQuery
    ? new Fuse(accounts, {
        threshold: 0.2,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ['name', 'address'],
      }).search(searchQuery)
    : accounts;

  return (
    <Popover title={t('selectAnAccount')} centerTitle onClose={onClose}>
      <Box>
        {/* Search box */}
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4} paddingTop={0}>
          <TextFieldSearch
            size={Size.SM}
            width={BLOCK_SIZES.FULL}
            placeholder={t('searchAccounts')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
        {/* Account list block */}
        <Box style={{ maxHeight: '200px', overflow: 'auto' }}>
          {searchResults.length === 0 && searchQuery !== '' ? (
            <Text paddingLeft={4} paddingRight={4} color={TextColor.textMuted}>
              {t('noAccountsFound')}
            </Text>
          ) : null}
          {searchResults.map((account) => (
            <AccountListItem
              onClick={() => {
                dispatch(toggleAccountMenu());
                trackEvent({
                  category: EVENT.CATEGORIES.NAVIGATION,
                  event: EVENT_NAMES.NAV_ACCOUNT_SWITCHED,
                  properties: {
                    location: 'Main Menu',
                  },
                });
                dispatch(setSelectedAccount(account.address));
              }}
              identity={account}
              key={account.address}
              selected={selectedAccount.address === account.address}
              label={getLabel(account.address, keyrings, t)}
            />
          ))}
        </Box>
        {/* Add / Import / Hardware */}
        <Box padding={4}>
          <Box marginBottom={4}>
            <ButtonLink
              size={Size.SM}
              onClick={() => {
                dispatch(toggleAccountMenu());
                trackEvent({
                  category: EVENT.CATEGORIES.NAVIGATION,
                  event: EVENT_NAMES.ACCOUNT_ADD_SELECTED,
                  properties: {
                    account_type: EVENT.ACCOUNT_TYPES.DEFAULT,
                    location: 'Main Menu',
                  },
                });
                history.push(NEW_ACCOUNT_ROUTE);
              }}
            >
              <AvatarIcon iconName={ICON_NAMES.ADD} size={Size.SM} />{' '}
              {t('addAccount')}
            </ButtonLink>
          </Box>
          <Box marginBottom={4}>
            <ButtonLink
              size={Size.SM}
              onClick={() => {
                dispatch(toggleAccountMenu());
                trackEvent({
                  category: EVENT.CATEGORIES.NAVIGATION,
                  event: EVENT_NAMES.ACCOUNT_ADD_SELECTED,
                  properties: {
                    account_type: EVENT.ACCOUNT_TYPES.IMPORTED,
                    location: 'Main Menu',
                  },
                });
                history.push(IMPORT_ACCOUNT_ROUTE);
              }}
            >
              <AvatarIcon iconName={ICON_NAMES.IMPORT} size={Size.SM} />{' '}
              {t('importAccount')}
            </ButtonLink>
          </Box>
          <Box>
            <ButtonLink
              size={Size.SM}
              onClick={() => {
                dispatch(toggleAccountMenu());
                trackEvent({
                  category: EVENT.CATEGORIES.NAVIGATION,
                  event: EVENT_NAMES.ACCOUNT_ADD_SELECTED,
                  properties: {
                    account_type: EVENT.ACCOUNT_TYPES.HARDWARE,
                    location: 'Main Menu',
                  },
                });
                if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
                  global.platform.openExtensionInBrowser(
                    CONNECT_HARDWARE_ROUTE,
                  );
                } else {
                  history.push(CONNECT_HARDWARE_ROUTE);
                }
              }}
            >
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
  onClose: PropTypes.func,
};
