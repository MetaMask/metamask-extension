import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountVariant,
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
  IconColor,
  Size,
} from '../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../selectors';

export const AccountPicker = ({
  address,
  name,
  onClick,
  disabled = false,
  labelProps = {},
  textProps = {},
  className = '',
  ...props
}) => {
  const useBlockie = useSelector(getUseBlockie);

  return (
    <ButtonBase
      className={classnames('multichain-account-picker', className)}
      data-testid="account-menu-icon"
      onClick={onClick}
      backgroundColor={BackgroundColor.transparent}
      borderRadius={BorderRadius.LG}
      ellipsis
      textProps={{
        display: Display.Flex,
        alignItems: AlignItems.center,
        gap: 2,
        ...textProps,
      }}
      size={ButtonBaseSize.Sm}
      disabled={disabled}
      endIconName={IconName.ArrowDown}
      endIconProps={{
        color: IconColor.iconDefault,
        size: Size.SM,
      }}
      {...props}
      gap={2}
    >
      <AvatarAccount
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        address={address}
        size={Size.XS}
        borderColor={BackgroundColor.backgroundDefault} // we currently don't have white color for border hence using backgroundDefault as the border
      />
      <Text
        as="span"
        ellipsis
        {...labelProps}
        className={classnames(
          'multichain-account-picker__label',
          labelProps.className ?? '',
        )}
      >
        {name}
      </Text>
    </ButtonBase>
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
