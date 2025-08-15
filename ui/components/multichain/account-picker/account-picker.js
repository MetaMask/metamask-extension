import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { shortenAddress } from '../../../helpers/utils/util';
import { trace, TraceName } from '../../../../shared/lib/trace';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors';

const AccountMenuStyle = { height: 'auto' };

export const AccountPicker = ({
  address,
  name,
  onClick,
  disabled = false,
  showAddress = false,
  addressProps = {},
  labelProps = {},
  textProps = {},
  className = '',
  showAvatarAccount = true,
  ...props
}) => {
  AccountPicker.propTypes = {
    showAvatarAccount: PropTypes.bool,
  };
  const shortenedAddress = address
    ? shortenAddress(toChecksumHexAddress(address))
    : '';
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const accountNameStyling = useMemo(
    () => ({
      ...labelProps.style,
      fontWeight: isMultichainAccountsState2Enabled ? 600 : FontWeight.Medium,
    }),
    [isMultichainAccountsState2Enabled, labelProps.style],
  );

  const accountNameFontVariant = useMemo(
    () =>
      isMultichainAccountsState2Enabled
        ? TextVariant.bodyLgMedium
        : TextVariant.bodyMdMedium,
    [isMultichainAccountsState2Enabled],
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
    >
      <ButtonBase
        className={classnames('multichain-account-picker', className)}
        data-testid="account-menu-icon"
        onClick={() => {
          trace({ name: TraceName.AccountList });
          onClick();
        }}
        backgroundColor={BackgroundColor.transparent}
        borderRadius={BorderRadius.LG}
        ellipsis
        textProps={{
          display: Display.Flex,
          alignItems: AlignItems.center,
          gap: 2,
          ...textProps,
        }}
        size={showAddress ? ButtonBaseSize.Lg : ButtonBaseSize.Sm}
        disabled={disabled}
        endIconName={IconName.ArrowDown}
        endIconProps={{
          color: IconColor.iconDefault,
          size: Size.SM,
        }}
        {...props}
        gap={1}
        style={AccountMenuStyle}
      >
        <Box
          display={Display.Flex}
          flexDirection={
            showAvatarAccount ? FlexDirection.Row : FlexDirection.Column
          }
          alignItems={AlignItems.center}
          gap={showAvatarAccount ? 4 : 0}
        >
          {showAvatarAccount ? (
            <PreferredAvatar
              address={address}
              size={showAddress ? AvatarAccountSize.Md : AvatarAccountSize.Xs}
            />
          ) : null}
          <Text
            as="span"
            ellipsis
            variant={accountNameFontVariant}
            {...labelProps}
            className={classnames(
              'multichain-account-picker__label',
              labelProps.className ?? '',
            )}
            style={accountNameStyling}
          >
            {name}
            {showAddress ? (
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodySmMedium}
                ellipsis
                {...addressProps}
              >
                {shortenedAddress}
              </Text>
            ) : null}
          </Text>
        </Box>
      </ButtonBase>
    </Box>
  );
};

AccountPicker.propTypes = {
  /**
   * Account name
   */
  name: PropTypes.string.isRequired,
  /**
   * Account address, used for blockie or jazzicon
   */
  address: PropTypes.string.isRequired,
  /**
   * Represents if the account address should display
   */
  showAddress: PropTypes.bool,
  /**
   * Props to be added to the address element
   */
  addressProps: PropTypes.object,
  /**
   * Action to perform when the account picker is clicked
   */
  onClick: PropTypes.func.isRequired,
  /**
   * Represents if the AccountPicker should be actionable
   */
  disabled: PropTypes.bool,
  /**
   * Represents if the AccountPicker should take full width
   */
  block: PropTypes.bool,
  /**
   * Props to be added to the label element
   */
  labelProps: PropTypes.object,
  /**
   * Props to be added to the text element
   */
  textProps: PropTypes.object,
  /**
   * Additional className to be added to the AccountPicker
   */
  className: PropTypes.string,
};
