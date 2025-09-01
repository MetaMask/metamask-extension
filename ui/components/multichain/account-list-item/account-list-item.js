import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { BtcScope, EthScope, SolScope } from '@metamask/keyring-api';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSnapName, shortenAddress } from '../../../helpers/utils/util';

import { AccountListItemMenu } from '../account-list-item-menu';
import { ConnectedAccountsMenu } from '../connected-accounts-menu';
import {
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
  BorderRadius,
  Color,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { KeyringType } from '../../../../shared/constants/keyring';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { PRIMARY } from '../../../helpers/constants/common';
import Tooltip from '../../ui/tooltip/tooltip';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  isAccountConnectedToCurrentTab,
  getShouldHideZeroBalanceTokens,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getShowFiatInTestnets,
  getChainIdsToPoll,
  getSnapsMetadata,
  getMetaMaskKeyrings,
  isSolanaAccount,
} from '../../../selectors';
import {
  getMultichainBalances,
  getMultichainIsTestnet,
  getMultichainNetwork,
  getMultichainShouldShowFiat,
} from '../../../selectors/multichain';
import { ConnectedStatus } from '../connected-status';
import { getHDEntropyIndex } from '../../../selectors/selectors';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { useGetFormattedTokensPerChain } from '../../../hooks/useGetFormattedTokensPerChain';
import { useAccountTotalCrossChainFiatBalance } from '../../../hooks/useAccountTotalCrossChainFiatBalance';
import { getAccountLabels } from '../../../helpers/utils/accounts';

import { getMultichainAggregatedBalance } from '../../../selectors/assets';

import { AccountNetworkIndicator } from '../account-network-indicator';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../../../shared/constants/multichain/assets';
import { enableSingleNetwork } from '../../../store/controller-actions/network-order-controller';
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
  shouldScrollToWhenSelected = true,
  showConnectedStatus = true,
  privacyMode = false,
  showAccountLabels = true,
  showSelectionIndicator = true,
}) => {
  const t = useI18nContext();

  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const dispatch = useDispatch();
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const [accountListItemMenuElement, setAccountListItemMenuElement] =
    useState();
  const snapMetadata = useSelector(getSnapsMetadata);
  const keyrings = useSelector(getMetaMaskKeyrings);

  const accountLabels = useMemo(
    () =>
      getAccountLabels(
        account.metadata.keyring.type,
        account,
        keyrings,
        account.metadata.keyring.type === KeyringType.snap
          ? getSnapName(snapMetadata)(account.metadata?.snap?.id)
          : null,
      ),
    [account, keyrings, snapMetadata],
  );

  const { isEvmNetwork, chainId: multichainChainId } = useMultichainSelector(
    getMultichainNetwork,
    account,
  );
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

  const multichainAggregatedBalance = useSelector((state) =>
    getMultichainAggregatedBalance(state, account),
  );

  const multichainBalances = useSelector(getMultichainBalances);
  const accountMultichainBalances = multichainBalances?.[account.id];
  const accountMultichainNativeBalance =
    accountMultichainBalances?.[
      `${MULTICHAIN_NETWORK_TO_ASSET_TYPES[multichainChainId]}`
    ]?.amount;
  // cross chain agg balance
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const allChainIDs = useSelector(getChainIdsToPoll);
  const { formattedTokensWithBalancesPerChain } = useGetFormattedTokensPerChain(
    account,
    shouldHideZeroBalanceTokens,
    isTokenNetworkFilterEqualCurrentNetwork,
    allChainIDs,
  );
  const { totalFiatBalance } = useAccountTotalCrossChainFiatBalance(
    account,
    formattedTokensWithBalancesPerChain,
  );
  let balanceToTranslate;
  if (isEvmNetwork) {
    balanceToTranslate =
      !shouldShowFiat || isTestnet || !process.env.PORTFOLIO_VIEW
        ? account.balance
        : totalFiatBalance;
  } else {
    balanceToTranslate =
      !shouldShowFiat || isTestnet
        ? accountMultichainNativeBalance
        : multichainAggregatedBalance;
  }

  // If this is the selected item in the Account menu,
  // scroll the item into view
  const itemRef = useRef(null);
  useEffect(() => {
    if (selected && shouldScrollToWhenSelected) {
      itemRef.current?.scrollIntoView?.();
    }
  }, [itemRef, selected, shouldScrollToWhenSelected]);

  const trackEvent = useContext(MetaMetricsContext);
  const currentTabIsConnectedToSelectedAddress = useSelector((state) =>
    isAccountConnectedToCurrentTab(state, account.address),
  );
  const isConnected =
    currentTabOrigin && currentTabIsConnectedToSelectedAddress;
  const isSingleAccount = accountsCount === 1;

  const getIsAggregatedFiatOverviewBalanceProp = () => {
    const isAggregatedFiatOverviewBalance =
      (!isTestnet && process.env.PORTFOLIO_VIEW && shouldShowFiat) ||
      (!isEvmNetwork && shouldShowFiat);

    return isAggregatedFiatOverviewBalance;
  };

  return (
    <Box
      display={Display.Flex}
      padding={4}
      backgroundColor={selected ? Color.primaryMuted : Color.transparent}
      className={classnames('multichain-account-list-item items-center', {
        'multichain-account-list-item--selected': selected,
        'multichain-account-list-item--connected': Boolean(connectedAvatar),
        'multichain-account-list-item--clickable': Boolean(onClick),
      })}
      data-testid="account-item"
      ref={itemRef}
      onClick={() => {
        // Without this check, the account will be selected after
        // the account options menu closes
        if (!accountOptionsMenuOpen) {
          onClick?.(account);

          if (account.scopes.includes(SolScope.Mainnet)) {
            dispatch(enableSingleNetwork(SolScope.Mainnet));
          }
          if (account.scopes.includes(BtcScope.Mainnet)) {
            dispatch(enableSingleNetwork(BtcScope.Mainnet));
          }
          if (account.scopes.includes(EthScope.Eoa)) {
            dispatch(enableSingleNetwork(EthScope.Mainnet));
          }
        }
      }}
    >
      {startAccessory ? (
        <Box marginInlineEnd={2} marginTop={1}>
          {startAccessory}
        </Box>
      ) : null}
      {selected && showSelectionIndicator && (
        <Box
          className="multichain-account-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={Color.primaryDefault}
          data-testid="account-list-item-selected-indicator"
        />
      )}

      <Box className="flex w-full gap-2 items-center">
        <Box
          display={[Display.Flex, Display.None]}
          data-testid="account-list-item-badge"
        >
          <ConnectedStatus
            address={account.address}
            isActive={isActive}
            showConnectedStatus={showConnectedStatus}
          />
        </Box>
        <Box display={[Display.None, Display.Flex]}>
          <PreferredAvatar address={account.address} />
        </Box>

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
                    data-testid="account-pinned-icon"
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
                    if (onClick) {
                      e.stopPropagation();
                      onClick(account);
                    }
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
                  isAggregatedFiatOverviewBalance={getIsAggregatedFiatOverviewBalanceProp()}
                  data-testid="first-currency-display"
                  privacyMode={privacyMode}
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
            <Box className="network-indicator">
              <AccountNetworkIndicator scopes={account.scopes} />
            </Box>
          </Box>
          {showAccountLabels && accountLabels.length > 0 ? (
            <Box flexDirection={FlexDirection.Row}>
              {accountLabels.map(({ label, icon }) => {
                return (
                  <Tag
                    data-testid={`account-list-item-tag-${account.id}-${label}`}
                    key={label}
                    label={label}
                    labelProps={{
                      variant: TextVariant.bodyXs,
                      color: Color.textAlternative,
                    }}
                    startIconName={icon}
                  />
                );
              })}
            </Box>
          ) : null}
        </Box>
      </Box>

      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
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
                    hd_entropy_index: hdEntropyIndex,
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
            isRemovable={
              account.metadata.keyring.type !== KeyringType.hdKeyTree &&
              !isSolanaAccount(account)
            }
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
            disableAccountSwitcher={isSingleAccount && selected}
            isOpen={accountOptionsMenuOpen}
            onActionClick={onActionClick}
            activeTabOrigin={currentTabOrigin}
          />
        )}
      </Box>
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
    scopes: PropTypes.arrayOf(PropTypes.string).isRequired,
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
  /**
   * Determines if list item should be scrolled to when selected
   */
  shouldScrollToWhenSelected: PropTypes.bool,
  /**
   * Determines if list balance should be obfuscated
   */
  privacyMode: PropTypes.bool,
  /**
   * Determines if the connected status should be shown
   */
  showConnectedStatus: PropTypes.bool,
  /**
   * Determines if account labels should be shown
   */
  showAccountLabels: PropTypes.bool,
  /**
   * Determines if left dark blue selection indicator is displayed or not
   */
  showSelectionIndicator: PropTypes.bool,
};

AccountListItem.displayName = 'AccountListItem';

export default React.memo(AccountListItem);
