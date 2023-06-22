import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getRpcPrefsForCurrentProvider } from '../../../selectors';
import { getURLHostName, shortenAddress } from '../../../helpers/utils/util';

import { AccountListItemMenu } from '..';
import {
  AvatarAccount,
  Box,
  Text,
  AvatarFavicon,
  Tag,
  ButtonLink,
  ButtonIcon,
  IconName,
  IconSize,
  AvatarAccountVariant,
} from '../../component-library';
import {
  Color,
  TextAlign,
  AlignItems,
  TextVariant,
  FlexDirection,
  BorderRadius,
  JustifyContent,
  Size,
  BorderColor,
  Display,
} from '../../../helpers/constants/design-system';
import { HardwareKeyringNames } from '../../../../shared/constants/hardware-wallets';
import { KeyringType } from '../../../../shared/constants/keyring';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { SECONDARY, PRIMARY } from '../../../helpers/constants/common';
import { findKeyringForAddress } from '../../../ducks/metamask/metamask';
import Tooltip from '../../ui/tooltip/tooltip';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

const MAXIMUM_CURRENCY_DECIMALS = 3;
const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 17;

function getLabel(keyring = {}, t) {
  const { type } = keyring;
  switch (type) {
    case KeyringType.qr:
      return HardwareKeyringNames.qr;
    case KeyringType.imported:
      return t('imported');
    case KeyringType.trezor:
      return HardwareKeyringNames.trezor;
    case KeyringType.ledger:
      return HardwareKeyringNames.ledger;
    case KeyringType.lattice:
      return HardwareKeyringNames.lattice;
    default:
      return null;
  }
}

export const AccountListItem = ({
  identity,
  selected = false,
  onClick,
  closeMenu,
  connectedAvatar,
  connectedAvatarName,
}) => {
  const t = useI18nContext();
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const [accountListItemMenuElement, setAccountListItemMenuElement] =
    useState();
  const useBlockie = useSelector((state) => state.metamask.useBlockie);

  const setAccountListItemMenuRef = (ref) => {
    setAccountListItemMenuElement(ref);
  };

  const keyring = useSelector((state) =>
    findKeyringForAddress(state, identity.address),
  );
  const label = getLabel(keyring, t);

  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const { blockExplorerUrl } = rpcPrefs;
  const blockExplorerUrlSubTitle = getURLHostName(blockExplorerUrl);

  const trackEvent = useContext(MetaMetricsContext);

  return (
    <Box
      display={Display.Flex}
      padding={4}
      backgroundColor={selected ? Color.primaryMuted : Color.transparent}
      className={classnames('multichain-account-list-item', {
        'multichain-account-list-item--selected': selected,
        'multichain-account-list-item--connected': Boolean(connectedAvatar),
      })}
      onClick={() => {
        // Without this check, the account will be selected after
        // the account options menu closes
        if (!accountOptionsMenuOpen) {
          onClick();
        }
      }}
    >
      {selected && (
        <Box
          className="multichain-account-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={Color.primaryDefault}
        />
      )}
      <AvatarAccount
        borderColor={BorderColor.transparent}
        size={Size.SM}
        address={identity.address}
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        marginInlineEnd={2}
      ></AvatarAccount>
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
            <Text
              ellipsis
              as="div"
              className="multichain-account-list-item__account-name"
              marginInlineEnd={2}
            >
              <ButtonLink
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="multichain-account-list-item__account-name__button"
                color={Color.textDefault}
                ellipsis
              >
                {identity.name.length > MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP ? (
                  <Tooltip
                    title={identity.name}
                    position="bottom"
                    wrapperClassName="multichain-account-list-item__tooltip"
                  >
                    {identity.name}
                  </Tooltip>
                ) : (
                  identity.name
                )}
              </ButtonLink>
            </Text>
            <Text
              as="div"
              className="multichain-account-list-item__asset"
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              ellipsis
              textAlign={TextAlign.End}
            >
              <UserPreferencedCurrencyDisplay
                ethNumberOfDecimals={MAXIMUM_CURRENCY_DECIMALS}
                value={identity.balance}
                type={SECONDARY}
              />
            </Text>
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            {connectedAvatar ? (
              <AvatarFavicon
                size={Size.XS}
                src={connectedAvatar}
                name={connectedAvatarName}
                className="multichain-account-list-item__avatar"
              />
            ) : null}
            <Text variant={TextVariant.bodySm} color={Color.textAlternative}>
              {shortenAddress(identity.address)}
            </Text>
          </Box>
          <Text
            variant={TextVariant.bodySm}
            color={Color.textAlternative}
            textAlign={TextAlign.End}
            as="div"
          >
            <UserPreferencedCurrencyDisplay
              ethNumberOfDecimals={MAXIMUM_CURRENCY_DECIMALS}
              value={identity.balance}
              type={PRIMARY}
            />
          </Text>
        </Box>
        {label ? (
          <Tag
            label={label}
            labelProps={{
              variant: TextVariant.bodyXs,
              color: Color.textAlternative,
            }}
          />
        ) : null}
      </Box>
      <ButtonIcon
        ariaLabel={`${identity.name} ${t('options')}`}
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
      <AccountListItemMenu
        anchorElement={accountListItemMenuElement}
        blockExplorerUrlSubTitle={blockExplorerUrlSubTitle}
        identity={identity}
        onClose={() => setAccountOptionsMenuOpen(false)}
        isOpen={accountOptionsMenuOpen}
        isRemovable={keyring?.type !== KeyringType.hdKeyTree}
        closeMenu={closeMenu}
      />
    </Box>
  );
};

AccountListItem.propTypes = {
  /**
   * Identity of the account
   */
  identity: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
  }).isRequired,
  /**
   * Represents if this account is currently selected
   */
  selected: PropTypes.bool,
  /**
   * Function to execute when the item is clicked
   */
  onClick: PropTypes.func.isRequired,
  /**
   * Function that closes the menu
   */
  closeMenu: PropTypes.func,
  /**
   * File location of the avatar icon
   */
  connectedAvatar: PropTypes.string,
  /**
   * Text used as the avatar alt text
   */
  connectedAvatarName: PropTypes.string,
};

AccountListItem.displayName = 'AccountListItem';
