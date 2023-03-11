import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';

import { AccountListItemMenu } from '../account-list-item-menu/account-list-item-menu';
import Box from '../../ui/box/box';
import {
  AvatarAccount,
  ButtonIcon,
  Text,
  ICON_NAMES,
  ICON_SIZES,
  AvatarFavicon,
  Tag,
} from '../../component-library';
import {
  Color,
  TEXT_ALIGN,
  DISPLAY,
  TextVariant,
  FLEX_DIRECTION,
  BorderRadius,
  JustifyContent,
  Size,
} from '../../../helpers/constants/design-system';
import {
  HardwareKeyringTypes,
  HardwareKeyringNames,
} from '../../../../shared/constants/hardware-wallets';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { SECONDARY, PRIMARY } from '../../../helpers/constants/common';
import { findKeyringForAddress } from '../../../ducks/metamask/metamask';

import { shortenAddress } from '../../../helpers/utils/util';

const MAXIMUM_CURRENCY_DECIMALS = 3;

function getLabel(keyring = {}, t) {
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
  const ref = useRef(false);
  const keyring = useSelector((state) =>
    findKeyringForAddress(state, identity.address),
  );
  const label = getLabel(keyring, t);

  return (
    <Box
      display={DISPLAY.FLEX}
      padding={4}
      gap={2}
      backgroundColor={selected ? Color.primaryMuted : Color.transparent}
      className={classnames('multichain-account-list-item', {
        'multichain-account-list-item--selected': selected,
      })}
      as="button"
      onClick={(e) => {
        e.preventDefault();
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
      <AvatarAccount size={Size.SM} address={identity.address}></AvatarAccount>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        className="multichain-account-list-item__content"
      >
        <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN}>
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
            gap={2}
          >
            <Text ellipsis>{identity.name}</Text>
            <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
              {connectedAvatar ? (
                <AvatarFavicon
                  size={Size.SM}
                  src={connectedAvatar}
                  name={connectedAvatarName}
                  marginInlineEnd={2}
                />
              ) : null}
              <Text textAlign={TEXT_ALIGN.END} as="div">
                <UserPreferencedCurrencyDisplay
                  ethNumberOfDecimals={MAXIMUM_CURRENCY_DECIMALS}
                  value={identity.balance}
                  type={SECONDARY}
                />
              </Text>
            </Box>
          </Box>
        </Box>
        <Box
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Text variant={TextVariant.bodySm} color={Color.textAlternative}>
            {shortenAddress(identity.address)}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            color={Color.textAlternative}
            textAlign={TEXT_ALIGN.END}
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
      <div ref={ref}>
        <ButtonIcon
          ariaLabel={`${identity.name} ${t('options')}`}
          iconName={ICON_NAMES.MORE_VERTICAL}
          size={ICON_SIZES.SM}
          onClick={(e) => {
            e.stopPropagation();
            setAccountOptionsMenuOpen(true);
          }}
          as="div"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              setAccountOptionsMenuOpen(true);
            }
          }}
        />
        {accountOptionsMenuOpen ? (
          <AccountListItemMenu
            anchorElement={ref.current}
            identity={identity}
            onClose={() => setAccountOptionsMenuOpen(false)}
            isRemovable={keyring?.type !== HardwareKeyringTypes.hdKeyTree}
            closeMenu={closeMenu}
          />
        ) : null}
      </div>
    </Box>
  );
};

AccountListItem.propTypes = {
  identity: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  closeMenu: PropTypes.func,
  connectedAvatar: PropTypes.string,
  connectedAvatarName: PropTypes.string,
};

AccountListItem.displayName = 'AccountListItem';
