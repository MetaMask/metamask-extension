import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';

import { AccountListItemMenu, AvatarGroup } from '..';
import { ConnectedAccountsMenu } from '../connected-accounts-menu';
import {
  AvatarAccount,
  AvatarAccountVariant,
  AvatarToken,
  AvatarTokenSize,
  Box,
  ButtonIcon,
  Icon,
  IconName,
  IconSize,
  Tag,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Color,
  Display,
  FlexDirection,
  JustifyContent,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { KeyringType } from '../../../../shared/constants/keyring';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import Tooltip from '../../ui/tooltip/tooltip';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  isAccountConnectedToCurrentTab,
  getShowFiatInTestnets,
  getUseBlockie,
} from '../../../selectors';
import {
  getMultichainIsTestnet,
  getMultichainNativeCurrency,
  getMultichainNativeCurrencyImage,
  getMultichainNetwork,
  getMultichainShouldShowFiat,
} from '../../../selectors/multichain';
import { useMultichainAccountTotalFiatBalance } from '../../../hooks/useMultichainAccountTotalFiatBalance';
import { ConnectedStatus } from '../connected-status/connected-status';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { getCustodianIconForAddress } from '../../../selectors/institutional/selectors';
import { useTheme } from '../../../hooks/useTheme';
///: END:ONLY_INCLUDE_IF
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { AccountListItemMenuTypes } from './account-list-item.types';

const MAXIMUM_CURRENCY_DECIMALS = 3;
const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 17;

const AccountListItem = ({
  account,
  selected,
  onClick,
  closeMenu,
  accountsCount,
  connectedAvatar,
  isPinned = false,
  menuType = AccountListItemMenuTypes.None,
  isHidden = false,
  currentTabOrigin,
  isActive = false,
  startAccessory,
  onActionClick,
}) => {
  const t = useI18nContext();
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const [accountListItemMenuElement, setAccountListItemMenuElement] =
    useState();

  const useBlockie = useSelector(getUseBlockie);
  const { isEvmNetwork } = useMultichainSelector(getMultichainNetwork, account);
  const setAccountListItemMenuRef = (ref) => {
    setAccountListItemMenuElement(ref);
  };
  const isTestnet = useMultichainSelector(getMultichainIsTestnet, account);
  const isMainnet = !isTestnet;
  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    account,
  );
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));
  const accountTotalFiatBalances =
    useMultichainAccountTotalFiatBalance(account);
  const mappedOrderedTokenList = accountTotalFiatBalances.orderedTokenList.map(
    (item) => ({
      avatarValue: item.iconUrl,
    }),
  );
  const balanceToTranslate = isEvmNetwork
    ? account.balance
    : accountTotalFiatBalances.totalBalance;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const custodianIcon = useSelector((state) =>
    getCustodianIconForAddress(state, account.address),
  );
  const theme = useTheme();
  ///: END:ONLY_INCLUDE_IF

  // If this is the selected item in the Account menu,
  // scroll the item into view
  const itemRef = useRef(null);
  useEffect(() => {
    if (selected) {
      itemRef.current?.scrollIntoView?.();
    }
  }, [itemRef, selected]);

  const trackEvent = useContext(MetaMetricsContext);
  const primaryTokenImage = useMultichainSelector(
    getMultichainNativeCurrencyImage,
    account,
  );
  const nativeCurrency = useMultichainSelector(
    getMultichainNativeCurrency,
    account,
  );
  const currentTabIsConnectedToSelectedAddress = useSelector((state) =>
    isAccountConnectedToCurrentTab(state, account.address),
  );
  const isConnected =
    currentTabOrigin && currentTabIsConnectedToSelectedAddress;
  const isSingleAccount = accountsCount === 1;

  return (
    <Box
      display={Display.Flex}
      padding={4}
      backgroundColor={selected ? Color.primaryMuted : Color.transparent}
      className={classnames('multichain-account-list-item', {
        'multichain-account-list-item--selected': selected,
        'multichain-account-list-item--connected': Boolean(connectedAvatar),
        'multichain-account-list-item--clickable': Boolean(onClick),
      })}
      ref={itemRef}
      onClick={() => {
        // Without this check, the account will be selected after
        // the account options menu closes
        if (!accountOptionsMenuOpen) {
          onClick?.();
        }
      }}
    >
      {startAccessory ? (
        <Box marginInlineEnd={2} marginTop={1}>
          {startAccessory}
        </Box>
      ) : null}
      {selected && (
        <Box
          className="multichain-account-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={Color.primaryDefault}
        />
      )}

      <>
        <Box
          display={[Display.Flex, Display.None]}
          data-testid="account-list-item-badge"
        >
          <ConnectedStatus address={account.address} isActive={isActive} />
        </Box>
        <Box display={[Display.None, Display.Flex]}>
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <AvatarAccount
              borderColor={BorderColor.transparent}
              size={Size.MD}
              address={account.address}
              variant={
                useBlockie
                  ? AvatarAccountVariant.Blockies
                  : AvatarAccountVariant.Jazzicon
              }
              marginInlineEnd={2}
            />
            ///: END:ONLY_INCLUDE_IF
          }

          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            custodianIcon ? (
              <img
                src={custodianIcon}
                data-testid="custody-logo"
                className="custody-logo"
                alt="custody logo"
                style={{
                  backgroundColor: theme === 'light' ? 'transparent' : 'white',
                }}
              />
            ) : (
              <AvatarAccount
                borderColor={BorderColor.transparent}
                size={Size.MD}
                address={account.address}
                variant={
                  useBlockie
                    ? AvatarAccountVariant.Blockies
                    : AvatarAccountVariant.Jazzicon
                }
                marginInlineEnd={2}
              />
            )
            ///: END:ONLY_INCLUDE_IF
          }
        </Box>
      </>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        className="multichain-account-list-item__content"
      >
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Box
              className="multichain-account-list-item__account-name"
              marginInlineEnd={2}
              display={Display.Flex}
              alignItems={AlignItems.center}
              gap={2}
            >
              {isPinned ? (
                <Icon
                  name={IconName.Pin}
                  size={IconSize.Xs}
                  className="account-pinned-icon"
                />
              ) : null}
              {isHidden ? (
                <Icon
                  name={IconName.EyeSlash}
                  size={IconSize.Xs}
                  className="account-hidden-icon"
                />
              ) : null}
              <Text
                as="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                variant={TextVariant.bodyMdMedium}
                className="multichain-account-list-item__account-name__button"
                padding={0}
                backgroundColor={BackgroundColor.transparent}
                width={BlockSize.Full}
                textAlign={TextAlign.Left}
                ellipsis
              >
                {account.metadata.name.length >
                MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP ? (
                  <Tooltip
                    title={account.metadata.name}
                    position="bottom"
                    wrapperClassName="multichain-account-list-item__tooltip"
                  >
                    {account.metadata.name}
                  </Tooltip>
                ) : (
                  account.metadata.name
                )}
              </Text>
            </Box>
            <Text
              as="div"
              className="multichain-account-list-item__asset"
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.flexEnd}
              ellipsis
              textAlign={TextAlign.End}
            >
              <UserPreferencedCurrencyDisplay
                account={account}
                ethNumberOfDecimals={MAXIMUM_CURRENCY_DECIMALS}
                value={balanceToTranslate}
                type={PRIMARY}
                showFiat={showFiat}
                data-testid="first-currency-display"
              />
            </Text>
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <Text
              variant={TextVariant.bodySm}
              color={Color.textAlternative}
              data-testid="account-list-address"
            >
              {shortenAddress(normalizeSafeAddress(account.address))}
            </Text>
          </Box>
          {/* For non-EVM networks we always want to show tokens */}
          {mappedOrderedTokenList.length > 1 || !isEvmNetwork ? (
            <AvatarGroup members={mappedOrderedTokenList} limit={4} />
          ) : (
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              gap={1}
              className="multichain-account-list-item__avatar-currency"
            >
              <AvatarToken
                src={primaryTokenImage}
                name={nativeCurrency}
                size={AvatarTokenSize.Xs}
                borderColor={BorderColor.borderDefault}
              />
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
                textAlign={TextAlign.End}
                as="div"
              >
                <UserPreferencedCurrencyDisplay
                  account={account}
                  ethNumberOfDecimals={MAXIMUM_CURRENCY_DECIMALS}
                  value={account.balance}
                  type={SECONDARY}
                  showNative
                  data-testid="second-currency-display"
                />
              </Text>
            </Box>
          )}
        </Box>
        {account.label ? (
          <Tag
            label={account.label}
            labelProps={{
              variant: TextVariant.bodyXs,
              color: Color.textAlternative,
            }}
            startIconName={
              account.metadata.keyring.type === KeyringType.snap
                ? IconName.Snaps
                : null
            }
          />
        ) : null}
      </Box>

      {menuType === AccountListItemMenuTypes.None ? null : (
        <ButtonIcon
          ariaLabel={`${account.metadata.name} ${t('options')}`}
          iconName={IconName.MoreVertical}
          size={IconSize.Sm}
          ref={setAccountListItemMenuRef}
          onClick={(e) => {
            e.stopPropagation();
            if (!accountOptionsMenuOpen) {
              trackEvent({
                event: MetaMetricsEventName.AccountDetailMenuOpened,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  location: 'Account Options',
                },
              });
            }
            setAccountOptionsMenuOpen(!accountOptionsMenuOpen);
          }}
          data-testid="account-list-item-menu-button"
        />
      )}
      {menuType === AccountListItemMenuTypes.Account && (
        <AccountListItemMenu
          anchorElement={accountListItemMenuElement}
          account={account}
          onClose={() => setAccountOptionsMenuOpen(false)}
          isOpen={accountOptionsMenuOpen}
          isRemovable={account.keyring.type !== KeyringType.hdKeyTree}
          closeMenu={closeMenu}
          isPinned={isPinned}
          isHidden={isHidden}
          isConnected={isConnected}
        />
      )}
      {menuType === AccountListItemMenuTypes.Connection && (
        <ConnectedAccountsMenu
          anchorElement={accountListItemMenuElement}
          account={account}
          onClose={() => setAccountOptionsMenuOpen(false)}
          closeMenu={closeMenu}
          disableAccountSwitcher={isSingleAccount && selected}
          isOpen={accountOptionsMenuOpen}
          onActionClick={onActionClick}
          activeTabOrigin={currentTabOrigin}
        />
      )}
    </Box>
  );
};

AccountListItem.propTypes = {
  /**
   * An account object that has name, address, and balance data
   */
  account: PropTypes.shape({
    id: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      name: PropTypes.string.isRequired,
      snap: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        enabled: PropTypes.bool,
      }),
      keyring: PropTypes.shape({
        type: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    keyring: PropTypes.shape({
      type: PropTypes.string.isRequired,
    }).isRequired,
    label: PropTypes.string,
  }).isRequired,
  /**
   * Represents if this account is currently selected
   */
  selected: PropTypes.bool.isRequired,
  /**
   * Function to execute when the item is clicked
   */
  onClick: PropTypes.func,
  /**
   * Represents how many accounts are being listed
   */
  accountsCount: PropTypes.number,
  /**
   * Function that closes the menu
   */
  closeMenu: PropTypes.func,
  /**
   * Function to set account name to show disconnect toast when an account is disconnected
   */
  onActionClick: PropTypes.func,
  /**
   * File location of the avatar icon
   */
  connectedAvatar: PropTypes.string,
  /**
   * Represents the type of menu to be rendered
   */
  menuType: PropTypes.string,
  /**
   * Represents pinned accounts
   */
  isPinned: PropTypes.bool,
  /**
   * Represents hidden accounts
   */
  isHidden: PropTypes.bool,
  /**
   * Represents current tab origin
   */
  currentTabOrigin: PropTypes.string,
  /**
   * Represents active accounts
   */
  isActive: PropTypes.bool,
  /**
   * Represents start accessory
   */
  startAccessory: PropTypes.node,
};

AccountListItem.displayName = 'AccountListItem';

export default React.memo(AccountListItem);
