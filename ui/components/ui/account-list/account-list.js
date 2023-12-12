import React, { memo, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { isEqual } from 'lodash';
import Fuse from 'fuse.js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import CheckBox, { CHECKED, INDETERMINATE, UNCHECKED } from '../check-box';
import Identicon from '../identicon';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display';
import { PRIMARY } from '../../../helpers/constants/common';
import Tooltip from '../tooltip';
import { Box, Text, Icon, IconName } from '../../component-library';
import { TextFieldSearch } from '../../component-library/text-field-search';
import {
  IconColor,
  Size,
  TextColor,
  BlockSize,
} from '../../../helpers/constants/design-system';

const AccountList = ({
  selectNewAccountViaModal,
  accounts,
  addressLastConnectedMap,
  selectedAccounts,
  nativeCurrency,
  allAreSelected,
  deselectAll,
  selectAll,
  handleAccountClick,
}) => {
  const t = useI18nContext();
  const selectedAccountScrollRef = useRef(null);
  useLayoutEffect(() => {
    selectedAccountScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedAccounts]);

  const [searchQuery, setSearchQuery] = useState('');

  let searchResults = accounts;
  if (searchQuery) {
    const fuse = new Fuse(accounts, {
      threshold: 0.2,
      location: 0,
      distance: 100,
      minMatchCharLength: 1,
      keys: ['label', 'balance', 'addressLabel', 'address'],
    });
    fuse.setCollection(accounts);
    searchResults = fuse.search(searchQuery);
  }

  const Header = () => {
    let checked;
    if (allAreSelected()) {
      checked = CHECKED;
    } else if (selectedAccounts.size === 0) {
      checked = UNCHECKED;
    } else {
      checked = INDETERMINATE;
    }

    return (
      <div
        className={classnames({
          'choose-account-list__header--one-item': accounts.length === 1,
          'choose-account-list__header--multiple-items': accounts.length > 1,
        })}
      >
        {accounts.length > 1 ? (
          <div className="choose-account-list__select-all">
            <CheckBox
              className="choose-account-list__header-check-box"
              checked={checked}
              onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
            />
            <div className="choose-account-list__text-grey">
              {t('selectAll')}
            </div>
            <Tooltip
              position="bottom"
              html={
                <div style={{ width: 200, padding: 4 }}>
                  {t('selectingAllWillAllow')}
                </div>
              }
            >
              <Icon
                name={IconName.Info}
                color={IconColor.iconMuted}
                className="info-circle"
                marginInlineStart={2}
              />
            </Tooltip>
          </div>
        ) : null}
        <div
          className="choose-account-list__text-blue"
          onClick={() => selectNewAccountViaModal(handleAccountClick)}
        >
          {t('newAccount')}
        </div>
      </div>
    );
  };

  const List = () => {
    return (
      <div className="choose-account-list__wrapper">
        <div className="choose-account-list__list">
          {searchResults.length === 0 && searchQuery !== '' ? (
            <Text
              paddingLeft={4}
              paddingRight={4}
              paddingTop={4}
              paddingBottom={4}
              color={TextColor.textMuted}
            >
              {t('noAccountsFound')}
            </Text>
          ) : null}

          {searchResults.map((account, index) => {
            const { address, addressLabel, balance } = account;
            const isSelectedAccount = selectedAccounts.has(address);
            return (
              <div
                key={`choose-account-list-${index}`}
                onClick={() => handleAccountClick(address)}
                className="choose-account-list__account"
                ref={isSelectedAccount ? selectedAccountScrollRef : null}
              >
                <div className="choose-account-list__account-info-wrapper">
                  <CheckBox
                    className="choose-account-list__list-check-box"
                    checked={isSelectedAccount}
                  />
                  <Identicon diameter={34} address={address} />
                  <div className="choose-account-list__account__info">
                    <div className="choose-account-list__account__label">
                      {addressLabel}
                    </div>
                    <UserPreferencedCurrencyDisplay
                      className="choose-account-list__account__balance"
                      type={PRIMARY}
                      value={balance}
                      style={{ color: 'var(--color-text-alternative)' }}
                      suffix={nativeCurrency}
                    />
                  </div>
                </div>
                {addressLastConnectedMap[address] ? (
                  <Tooltip
                    title={`${t('lastConnected')} ${
                      addressLastConnectedMap[address]
                    }`}
                  >
                    <Icon
                      name={IconName.Info}
                      color={IconColor.iconMuted}
                      className="info-circle"
                      marginInlineStart={2}
                    />
                  </Tooltip>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="choose-account-list">
      <Box paddingTop={6} width={BlockSize.Full}>
        <TextFieldSearch
          size={Size.SM}
          width={BlockSize.Full}
          placeholder={t('searchAccounts')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButtonOnClick={() => setSearchQuery('')}
          clearButtonProps={{
            size: Size.SM,
          }}
          inputProps={{ autoFocus: true }}
        />
      </Box>
      <Header />
      <List />
    </div>
  );
};

AccountList.propTypes = {
  /**
   * Array of user account objects
   */
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string,
      addressLabel: PropTypes.string,
      lastConnectedDate: PropTypes.string,
      balance: PropTypes.string,
    }),
  ).isRequired,
  /**
   * Function to select a new account via modal
   */
  selectNewAccountViaModal: PropTypes.func.isRequired,
  /**
   * A map of the last connected addresses
   */
  addressLastConnectedMap: PropTypes.object,
  /**
   * Native currency of current chain
   */
  nativeCurrency: PropTypes.string.isRequired,
  /**
   * Currently selected accounts
   */
  selectedAccounts: PropTypes.object.isRequired,
  /**
   * Function to check if all accounts are selected
   */
  allAreSelected: PropTypes.func.isRequired,
  /**
   * Function to deselect all accounts
   */
  deselectAll: PropTypes.func.isRequired,
  /**
   * Function to select all accounts
   */
  selectAll: PropTypes.func.isRequired,
  /**
   * Function to handle account click
   */
  handleAccountClick: PropTypes.func.isRequired,
};

export default memo(AccountList, (prevProps, nextProps) => {
  return isEqual(prevProps.selectedAccounts, nextProps.selectedAccounts);
});
