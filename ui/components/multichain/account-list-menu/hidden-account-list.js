import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getConnectedSubjectsForAllAddresses,
  getHiddenAccountsList,
  getMetaMaskAccountsOrdered,
  getOriginOfCurrentTab,
  getSelectedAccount,
} from '../../../selectors';
import { setSelectedAccount } from '../../../store/actions';
import {
  AvatarIcon,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import { AccountListItem } from '../account-list-item';

export const HiddenAccountList = ({ onClose }) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const hiddenAddresses = useSelector(getHiddenAccountsList);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const selectedAccount = useSelector(getSelectedAccount);
  const connectedSites = useSelector(getConnectedSubjectsForAllAddresses);
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const filteredHiddenAccounts = accounts.filter((account) =>
    hiddenAddresses.includes(account.address),
  );
  const [showListItem, setShowListItem] = useState(false);
  return (
    <>
      <Box
        as="button"
        onClick={() => setShowListItem(!showListItem)}
        backgroundColor={BackgroundColor.backgroundDefault}
        display={Display.Flex}
        padding={4}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          width={BlockSize.TwoThirds}
          gap={2}
        >
          <AvatarIcon
            iconName={IconName.EyeSlash}
            color={IconColor.infoDefault}
            backgroundColor={BackgroundColor.infoMuted}
          />
          <Box display={Display.Flex}>
            <Text>{t('hiddenAccounts')}</Text>
          </Box>
        </Box>
        <Box
          gap={1}
          display={Display.Flex}
          alignItems={AlignItems.center}
          width={BlockSize.OneThird}
          justifyContent={JustifyContent.flexEnd}
        >
          <Text>{hiddenAddresses.length}</Text>
          <Icon
            name={showListItem ? IconName.ArrowUp : IconName.ArrowDown}
            size={IconSize.Sm}
            color={IconColor.iconDefault}
          />
        </Box>
      </Box>
      {showListItem ? (
        <Box>
          {filteredHiddenAccounts.map((account) => {
            const connectedSite = connectedSites[account.address]?.find(
              ({ origin }) => origin === currentTabOrigin,
            );
            return (
              <Box
                className="multichain-account-menu-popover__list--menu-item-hidden"
                key={account.address}
              >
                <AccountListItem
                  onClick={() => {
                    onClose();
                    trackEvent({
                      category: MetaMetricsEventCategory.Navigation,
                      event: MetaMetricsEventName.NavAccountSwitched,
                      properties: {
                        location: 'Main Menu',
                      },
                    });
                    dispatch(setSelectedAccount(account.address));
                  }}
                  identity={account}
                  key={account.address}
                  selected={selectedAccount.address === account.address}
                  closeMenu={onClose}
                  connectedAvatar={connectedSite?.iconUrl}
                  connectedAvatarName={connectedSite?.name}
                  showOptions
                  isPinned={
                    process.env.NETWORK_ACCOUNT_DND
                      ? Boolean(account.pinned)
                      : null
                  }
                  isHidden={
                    process.env.NETWORK_ACCOUNT_DND
                      ? Boolean(account.hidden)
                      : null
                  }
                />
              </Box>
            );
          })}
        </Box>
      ) : null}
    </>
  );
};

HiddenAccountList.propTypes = {
  /**
   * Function that executes when the menu closes
   */
  onClose: PropTypes.func.isRequired,
};
