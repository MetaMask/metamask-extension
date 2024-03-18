import React, { memo, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { isEqual } from 'lodash';
import { useI18nContext } from '../../../hooks/useI18nContext';
// import CheckBox, { CHECKED, INDETERMINATE, UNCHECKED } from '../check-box';
import Identicon from '../identicon';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display';
import { PRIMARY } from '../../../helpers/constants/common';
import Tooltip from '../tooltip';
import { Box, Checkbox, Icon, IconName, Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
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

  const shortenAddress = (address, chars = 5) => {
    if (!address) {
      return '';
    }
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  };

  const Header = () => {
    let checked = false;
    let isIndeterminate = false;
    if (allAreSelected()) {
      checked = true;
    } else if (selectedAccounts.size === 0) {
      checked = false;
    } else {
      isIndeterminate = true;
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
            <Checkbox
              className="choose-account-list__header-check-box"
              dataTestId="choose-account-list-operate-all-check-box"
              isChecked={checked}
              isIndeterminate={isIndeterminate}
              onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
            />
            <Text
              as="div"
              className="choose-account-list__text-grey"
              color={TextColor.textAlternative}
            >
              {t('selectAll')}
            </Text>
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
        <Box
          className="choose-account-list__list"
          style={{ overflowX: 'clip' }}
        >
          {accounts.map((account, index) => {
            const { address, label, balance } = account;
            const isSelectedAccount = selectedAccounts.has(address);
            return (
              <Box
                display={Display.Flex}
                width={BlockSize.Full}
                key={`choose-account-list-${index}`}
                onClick={() => handleAccountClick(address)}
                className="choose-account-list__account"
                ref={isSelectedAccount ? selectedAccountScrollRef : null}
                backgroundColor={
                  isSelectedAccount
                    ? BackgroundColor.backgroundAlternative
                    : BackgroundColor.backgroundDefault
                }
              >
                <Box
                  display={Display.Flex}
                  width={BlockSize.Full}
                  alignItems={AlignItems.center}
                >
                  <Checkbox isChecked={isSelectedAccount} />
                  <Box marginLeft={2}>
                    <Identicon diameter={34} address={address} />
                  </Box>
                  <Box
                    display={Display.Flex}
                    justifyContent={JustifyContent.spaceBetween}
                    width={BlockSize.Full}
                    marginLeft={4}
                  >
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      width={BlockSize.Full}
                    >
                      <Text
                        as="span"
                        variant={TextVariant.bodyLgMedium}
                        style={{ maxWidth: '130px' }}
                        ellipsis
                      >
                        {label}
                      </Text>
                      <Text
                        as="span"
                        variant={TextVariant.bodyMd}
                        color={TextColor.textAlternative}
                      >
                        {shortenAddress(address)}
                      </Text>
                    </Box>
                    <Box display={Display.Flex}>
                      <UserPreferencedCurrencyDisplay
                        type={PRIMARY}
                        value={balance}
                        style={{
                          color: 'var(--color-text-alternative)',
                          flexWrap: 'nowrap',
                        }}
                        suffix={nativeCurrency}
                        numberOfDecimals={2}
                        ethNumberOfDecimals={5}
                      />
                    </Box>
                  </Box>
                </Box>
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
              </Box>
            );
          })}
        </Box>
      </div>
    );
  };

  return (
    <div className="choose-account-list">
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
