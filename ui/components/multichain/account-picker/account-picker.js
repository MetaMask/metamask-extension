import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import {
  AvatarAccount,
  AvatarAccountVariant,
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
  IconColor,
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../selectors';
import { shortenAddress } from '../../../helpers/utils/util';
import { trace, TraceName } from '../../../../shared/lib/trace';

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
  ...props
}) => {
  const useBlockie = useSelector(getUseBlockie);
  const shortenedAddress = shortenAddress(toChecksumHexAddress(address));

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
      >
        <Box
          display={Display.Flex}
          flexDirection={
            process.env.REMOVE_GNS ? FlexDirection.Column : FlexDirection.Row
          }
          alignItems={AlignItems.center}
          gap={process.env.REMOVE_GNS ? 0 : 2}
        >
          {
            process.env.REMOVE_GNS ? null : (
              ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
              <AvatarAccount
                variant={
                  useBlockie
                    ? AvatarAccountVariant.Blockies
                    : AvatarAccountVariant.Jazzicon
                }
                address={address}
                size={showAddress ? Size.MD : Size.XS}
                borderColor={BackgroundColor.backgroundDefault} // we currently don't have white color for border hence using backgroundDefault as the border
              />
            )
            ///: END:ONLY_INCLUDE_IF
          }
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
            {showAddress ? (
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodySm}
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
